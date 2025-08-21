export interface BaseError {
    code: number;
}

export interface ValidationError extends BaseError {
    field: string;
    message: string;
}

export interface BasicAPIError extends BaseError {
    message: string;
}
export interface APIError extends BaseError {
    message: string;
    details?: string;
}

export interface NetworkError extends BaseError {
    message: string;
    status?: number;
}

export interface MarshMellowError extends BaseError {
    errors: {
        json: {
            [key: string]: string[]; // key is the field name, value is an array of error messages... hopefully
        }
    },
    status: string
}