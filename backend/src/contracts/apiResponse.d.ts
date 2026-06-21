export interface ApiSuccessResponse<T = unknown> {
    success: true;
    data?: T;
    message?: string;
}
export interface ApiErrorResponse {
    success: false;
    error: string;
    code?: string;
    [extra: string]: unknown;
}
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
export declare class AppError extends Error {
    statusCode: number;
    code?: string;
    extra?: Record<string, unknown>;
    constructor(message: string, statusCode?: number, code?: string, extra?: Record<string, unknown>);
}
export declare class BadRequestError extends AppError {
    constructor(message?: string, code?: string, extra?: Record<string, unknown>);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string, code?: string, extra?: Record<string, unknown>);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string, code?: string, extra?: Record<string, unknown>);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string, code?: string, extra?: Record<string, unknown>);
}
export declare class TooManyRequestsError extends AppError {
    constructor(message?: string, code?: string, extra?: Record<string, unknown>);
}
export declare class InternalServerError extends AppError {
    constructor(message?: string, code?: string, extra?: Record<string, unknown>);
}
interface ResLike {
    status(code: number): ResLike;
    json(body: unknown): void;
}
/**
 * Send a successful API response. Always includes `success: true`.
 * Does not force a particular data shape — pass whatever payload the
 * endpoint already returns; existing success payloads are left as-is.
 */
export declare function sendSuccess<T>(res: ResLike, data?: T, message?: string, statusCode?: number): void;
/**
 * Send an error API response. This is the ONE place that decides the
 * error response shape — every controller should funnel error responses
 * through this function instead of hand-writing res.status().json({...}).
 *
 * `extra` lets call sites attach additional flat fields the frontend
 * already expects for specific flows (e.g. isPremium, requiresSubscription,
 * compilationError, action, remainingTime) without breaking the core
 * {success: false, error: string} contract.
 */
export declare function sendError(res: ResLike, statusCode: number, error: string, extra?: Record<string, unknown>): void;
/**
 * Send an error response from a caught exception. If the exception is an
 * AppError (or subclass), uses its statusCode/code/extra; otherwise falls
 * back to 500 with the exception's message (or a generic fallback).
 */
export declare function sendErrorFromException(res: ResLike, err: unknown): void;
export {};
