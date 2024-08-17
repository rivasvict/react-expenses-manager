import { AxiosInstance, AxiosResponse } from "axios";
import { HttpClientAdapter } from "../types.ts";

const SUCCESS_HTTP_STATUS = 200;

export class AxiosAdapter implements HttpClientAdapter {
  constructor(private client: AxiosInstance) {
    this.client = client;
  }
  async get (url: string, requestOptions: Record<any, any>) {
    const response: AxiosResponse = await this.client.get(url, requestOptions);
    return ({
      json: async () => response.data,
      ok: response.status === SUCCESS_HTTP_STATUS
    });
  };

  post(url: string, requestOptions: { credentials: string; }): unknown {
    throw new Error("Method not implemented.");
  }
};
