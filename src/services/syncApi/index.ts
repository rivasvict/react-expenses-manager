// Typed HTTP client for the sync backend (RFC §3). All requests are JSON;
// failures are surfaced as SyncApiError with the server's error code, or
// NETWORK_ERROR when the server is unreachable.
import { config } from "../../config";
import { clearSession } from "../session";
import {
  AuthResponse,
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
