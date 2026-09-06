// Types for the method+path router (server/core/router.ts).
import {
  AppRequest,
  AppResponse,
  CreateHandlersOptions,
  Handler,
} from "./handlers.types";

export interface Route {
  method: string;
  path: string;
  handler: Handler;
}

export interface App {
  handle(request: AppRequest): Promise<AppResponse>;
}

export type CreateAppOptions = CreateHandlersOptions;
