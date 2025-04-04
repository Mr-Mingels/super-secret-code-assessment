export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type ApiRequestMessage = {
    type: 'API_REQUEST';
    endpoint: string;
    method: RequestMethod;
    body?: Record<string, unknown> | null;
    params?: Record<string, string | number | boolean | null | undefined> | null;
}