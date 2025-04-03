export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type ApiRequestMessage = {
    type: 'API_REQUEST';
    endpoint: string;
    method: RequestMethod;
    body?: any;
}