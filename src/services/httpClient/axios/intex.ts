import { req } from "../../mock-api.ts";
import { AxiosAdapter } from "./AxiosAdapter.ts";

export const httpClient = new AxiosAdapter(req);
