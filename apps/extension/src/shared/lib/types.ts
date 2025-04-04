export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Disabling this rule because we need to be able to pass any type to the body and params
/* eslint-disable @typescript-eslint/no-explicit-any */
export type ApiRequestMessage = {
    type: 'API_REQUEST';
    endpoint: string;
    method: RequestMethod;
    body?: any;
    params?: any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */