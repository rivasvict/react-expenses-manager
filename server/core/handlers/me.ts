// GET /api/me (RFC §3, endpoint 3): the current user behind a bearer token.
import { Authenticate, Handler } from "../handlers.types";
import { HTTP_STATUS } from "../httpConstants";
import { publicUser, unauthorized } from "./responses";

interface CreateMeHandlerOptions {
  authenticate: Authenticate;
}

export const createMeHandler =
  ({ authenticate }: CreateMeHandlerOptions): Handler =>
  async (request) => {
    const user = await authenticate(request);
    if (!user) return unauthorized();
    return {
      status: HTTP_STATUS.OK,
      // Parties land in PR 2; until then the contract returns party: null.
      body: { user: publicUser(user), party: null },
    };
  };
