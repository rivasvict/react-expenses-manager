export type ServerResponse = Promise<{
  json: () => Promise<any>,
  ok: boolean,
}>;

export type Get = (url: string, requestOptions: Record<any, any>) => ServerResponse;

export interface HttpClientAdapter {
  post(url: string, requestOptions: { credentials: string; }): unknown;
  get: Get,
};
