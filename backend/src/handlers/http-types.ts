// Tipos mínimos compatibles con API Gateway (REST proxy) sin dependencia externa.
export interface ProxyEvent {
  body: string | null;
  headers?: Record<string, string | undefined>;
  pathParameters?: Record<string, string | undefined> | null;
  queryStringParameters?: Record<string, string | undefined> | null;
  requestContext?: { requestId?: string };
}
export interface ProxyResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}
export function json(statusCode: number, payload: unknown): ProxyResult {
  return { statusCode, headers: { "content-type": "application/json" }, body: JSON.stringify(payload) };
}
