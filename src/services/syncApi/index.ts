// Typed HTTP client for the sync backend (RFC §3). All requests are JSON;
// failures are surfaced as SyncApiError with the server's error code, or
// NETWORK_ERROR when the server is unreachable.
import { config } from "../../config";
import {
  AuthResponse,
  MeResponse,
  SYNC_ERROR_CODES,
  createSyncApiError,
} from "./contract";

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
    throw createSyncApiError({
      code: payload?.error?.code || SYNC_ERROR_CODES.NETWORK_ERROR,
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
