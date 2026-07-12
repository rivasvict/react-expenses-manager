// Auth endpoint handlers (RFC §3, endpoints 1–3). Framework-free: each
// handler takes a plain request description and returns { status, body }.
const {
  sha256Hex,
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  randomId,
} = require("./crypto");

// Error codes duplicated from src/services/syncApi/contract.ts deliberately —
// the server stays dependency-free; RFC §3 is the source of truth.
const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  EMAIL_TAKEN: "EMAIL_TAKEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
};

const error = (status, code, message) => ({
  status,
  body: { error: { code, message } },
});

// AC-1.5: identical body whether the email exists or not.
const invalidCredentials = () =>
  error(401, ERROR_CODES.INVALID_CREDENTIALS, "Email or password is incorrect.");

const unauthorized = () =>
  error(401, ERROR_CODES.UNAUTHORIZED, "You need to sign in again.");

const publicUser = ({ id, email, firstName, lastName }) => ({
  id,
  email,
  firstName,
  lastName,
});

const userKey = (email) => `users/${sha256Hex(email.trim().toLowerCase())}`;
// Secondary pointer so /api/me can resolve the token's `sub` (user id) back
// to the email-keyed user record without scanning.
const userIdKey = (id) => `user-ids/${id}`;

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim() !== "";

const isEmail = (value) => isNonEmptyString(value) && /^\S+@\S+\.\S+$/.test(value);

const createHandlers = ({ storage, tokenSecret, now = Date.now }) => {
  const issueSession = (user) => ({
    token: signToken({ sub: user.id, secret: tokenSecret, now: now() }),
    user: publicUser(user),
  });

  const signup = async ({ body }) => {
    const { email, password, firstName, lastName } = body || {};
    if (!isEmail(email))
      return error(400, ERROR_CODES.VALIDATION_ERROR, "A valid email is required.");
    if (!isNonEmptyString(password))
      return error(400, ERROR_CODES.VALIDATION_ERROR, "A password is required.");
    if (!isNonEmptyString(firstName) || !isNonEmptyString(lastName))
      return error(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        "First and last name are required."
      );

    const key = userKey(email);
    if (await storage.readJson(key))
      return error(
        409,
        ERROR_CODES.EMAIL_TAKEN,
        "An account with this email already exists."
      );

    const user = {
      id: randomId(),
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      password: hashPassword(password),
      partyId: null,
      createdAt: now(),
    };
    await storage.writeJson(key, user);
    await storage.writeJson(userIdKey(user.id), { userKey: key });
    return { status: 201, body: issueSession(user) };
  };

  const login = async ({ body }) => {
    const { email, password } = body || {};
    if (!isNonEmptyString(email) || !isNonEmptyString(password))
      return invalidCredentials();
    const user = await storage.readJson(userKey(email));
    if (!user) return invalidCredentials();
    if (!verifyPassword(password, user.password)) return invalidCredentials();
    return { status: 200, body: issueSession(user) };
  };

  // Resolves the bearer token to the stored user, or null.
  const authenticate = async ({ headers }) => {
    const header = (headers && headers.authorization) || "";
    const match = /^Bearer (.+)$/.exec(header);
    if (!match) return null;
    const payload = verifyToken({
      token: match[1],
      secret: tokenSecret,
      now: now(),
    });
    if (!payload) return null;
    const pointer = await storage.readJson(userIdKey(payload.sub));
    if (!pointer) return null;
    return storage.readJson(pointer.userKey);
  };

  const me = async (request) => {
    const user = await authenticate(request);
    if (!user) return unauthorized();
    // Parties land in PR 2; until then the contract returns party: null.
    return { status: 200, body: { user: publicUser(user), party: null } };
  };

  return { signup, login, me };
};

module.exports = { createHandlers, ERROR_CODES };
