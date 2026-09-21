// Typed HTTP client for the sync backend (docs/multi-user-sync/RFC.md §3).
// All requests are JSON; failures are surfaced as SyncApiError with the
// server's error code, or NETWORK_ERROR when the server is unreachable.
//
// TODO:
// The colocated index.test.ts covers signup/login/getMe, blockMember,
// cancelParty and the generic failure handling, but not every party call
// this file gained along the way: createParty, createInvitation and
// joinParty have no direct tests, and the setOnUnauthorized 401 hook
// (clearing the session on an UNAUTHORIZED response) is only exercised
// end-to-end. They are currently asserted through
// src/integrationTests/party.test.tsx and partyJoin.test.tsx. Direct coverage
// is tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/160
import { config } from "../../config";
import { clearSession } from "../session";
import {
  AuthResponse,
  BackupDownloadResponse,
  BackupEnvelope,
  BackupUploadResponse,
  InvitationResponse,
  MeResponse,
  PartyResponse,
  SYNC_ERROR_CODES,
  createSyncApiError,
} from "./contract";

// Central 401 handling: an UNAUTHORIZED response (expired/invalid token —
// distinct from INVALID_CREDENTIALS on login) means the session is dead.
// The client clears it and notifies the store (registered at setupStore)
// so the UI degrades to logged-out instead of looping on failed requests.
let onUnauthorized: (() => void) | null = null;

// How long a health probe waits before it counts as unreachable. Short on
// purpose: the answer is only ever "can we reach the server right now", and
// a slow answer is not a useful one.
const HEALTH_TIMEOUT_MS = 5000;

export const setOnUnauthorized = (handler: (() => void) | null): void => {
  onUnauthorized = handler;
};

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

const request = async <T>(
  path: string,
  { method = "GET", body, token }: RequestOptions = {}
): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${config.REACT_APP_SYNC_API_HOST}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    throw createSyncApiError({
      code: SYNC_ERROR_CODES.NETWORK_ERROR,
      message: "Couldn't reach the sync server. Please try again.",
    });
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const code = payload?.error?.code || SYNC_ERROR_CODES.NETWORK_ERROR;
    if (response.status === 401 && code === SYNC_ERROR_CODES.UNAUTHORIZED) {
      clearSession();
      if (onUnauthorized) onUnauthorized();
    }
    throw createSyncApiError({
      code,
      message: payload?.error?.message || "Something went wrong.",
      status: response.status,
    });
  }
  return payload as T;
};

export const signup = (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<AuthResponse> =>
  request<AuthResponse>("/api/auth/signup", { method: "POST", body: data });

export const login = (data: {
  email: string;
  password: string;
}): Promise<AuthResponse> =>
  request<AuthResponse>("/api/auth/login", { method: "POST", body: data });

export const getMe = ({ token }: { token: string }): Promise<MeResponse> =>
  request<MeResponse>("/api/me", { token });

export const createParty = ({
  token,
}: {
  token: string;
}): Promise<PartyResponse> =>
  request<PartyResponse>("/api/party", { method: "POST", body: {}, token });

export const createInvitation = ({
  token,
  password,
}: {
  token: string;
  password: string;
}): Promise<InvitationResponse> =>
  request<InvitationResponse>("/api/party/invitations", {
    method: "POST",
    body: { password },
    token,
  });

export const joinParty = ({
  token,
  code,
  password,
}: {
  token: string;
  code: string;
  password: string;
}): Promise<PartyResponse> =>
  request<PartyResponse>("/api/party/join", {
    method: "POST",
    body: { code, password },
    token,
  });

// RFC §3 endpoint 7. The member id travels in the path, so it is encoded:
// ids are opaque server-issued strings and must not be able to alter the
// route.
export const blockMember = ({
  token,
  userId,
}: {
  token: string;
  userId: string;
}): Promise<PartyResponse> =>
  request<PartyResponse>(
    `/api/party/members/${encodeURIComponent(userId)}/block`,
    { method: "POST", body: {}, token }
  );

// RFC §3 endpoint 8.
export const cancelParty = ({
  token,
}: {
  token: string;
}): Promise<PartyResponse> =>
  request<PartyResponse>("/api/party/cancel", {
    method: "POST",
    body: {},
    token,
  });

// RFC §3 endpoint 9. A 404 NO_BACKUP here is the EC-1 signal, not a
// failure — the caller decides what to do with it.
export const getBackup = ({
  token,
}: {
  token: string;
}): Promise<BackupDownloadResponse> =>
  request<BackupDownloadResponse>("/api/party/backup", { token });

// RFC §3 endpoint 10. `baseVersion: null` is the create-only first sync;
// otherwise it is the version the caller downloaded, and the server answers
// 409 VERSION_CONFLICT when that is no longer current.
export const putBackup = ({
  token,
  baseVersion,
  envelope,
}: {
  token: string;
  baseVersion: string | null;
  envelope: BackupEnvelope;
}): Promise<BackupUploadResponse> =>
  request<BackupUploadResponse>("/api/party/backup", {
    method: "PUT",
    body: { baseVersion, envelope },
    token,
  });

// GET /api/health — the liveness probe behind the app bar's status ring.
// Deliberately outside `request`: it answers a boolean rather than throwing,
// because "the server is down" is this call's ordinary result, not an error
// anyone should have to catch. It sends no token and reads no body, so it
// stays cheap enough to poll.
//
// `timeoutMs` bounds a hung connection — without it a request that never
// settles would leave the ring stuck on its last answer indefinitely. The
// caller may also pass its own `signal` (e.g. to drop an in-flight check when
// the component unmounts).
export const checkHealth = async ({
  timeoutMs = HEALTH_TIMEOUT_MS,
  signal,
}: { timeoutMs?: number; signal?: AbortSignal } = {}): Promise<boolean> => {
  // jsdom and older browsers can leave `fetch` undefined; an environment
  // with no fetch is simply one where the server cannot be reached.
  if (typeof fetch !== "function") return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const abortOnCallerSignal = () => controller.abort();
  signal?.addEventListener("abort", abortOnCallerSignal);

  try {
    const response = await fetch(
      `${config.REACT_APP_SYNC_API_HOST}/api/health`,
      { method: "GET", signal: controller.signal }
    );
    return response.ok;
  } catch (error) {
    return false;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortOnCallerSignal);
  }
};
