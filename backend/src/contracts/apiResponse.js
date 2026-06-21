// Shared API response contract for the whole backend.
//
// Every controller MUST send error responses through `sendError` (or by
// throwing an AppError subclass and letting the global error handler in
// index.js catch it). This is the single source of truth for what an API
// response looks like — do not hand-write res.status().json({...}) for
// errors anywhere else.
//
// This file is TypeScript for editor type-checking / safety, but the rest
// of the backend is plain JS. Run `npm run build:contracts` after editing
// this file to regenerate apiResponse.js / apiResponse.d.ts, and commit
// both — the runtime imports the compiled .js, there is no build step in
// the Docker image.
// Base application error — every thrown error that should map to a
// specific HTTP status should extend this instead of a plain Error.
export class AppError extends Error {
    statusCode;
    code;
    extra;
    constructor(message, statusCode = 500, code, extra) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;
        this.extra = extra;
    }
}
export class BadRequestError extends AppError {
    constructor(message = "Bad request", code, extra) {
        super(message, 400, code, extra);
        this.name = "BadRequestError";
    }
}
export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized", code, extra) {
        super(message, 401, code, extra);
        this.name = "UnauthorizedError";
    }
}
export class ForbiddenError extends AppError {
    constructor(message = "Forbidden", code, extra) {
        super(message, 403, code, extra);
        this.name = "ForbiddenError";
    }
}
export class NotFoundError extends AppError {
    constructor(message = "Not found", code, extra) {
        super(message, 404, code, extra);
        this.name = "NotFoundError";
    }
}
export class TooManyRequestsError extends AppError {
    constructor(message = "Too many requests", code, extra) {
        super(message, 429, code, extra);
        this.name = "TooManyRequestsError";
    }
}
export class InternalServerError extends AppError {
    constructor(message = "Internal server error", code, extra) {
        super(message, 500, code, extra);
        this.name = "InternalServerError";
    }
}
/**
 * Send a successful API response. Always includes `success: true`.
 * Does not force a particular data shape — pass whatever payload the
 * endpoint already returns; existing success payloads are left as-is.
 */
export function sendSuccess(res, data, message, statusCode = 200) {
    const body = { success: true };
    if (data !== undefined)
        body.data = data;
    if (message !== undefined)
        body.message = message;
    res.status(statusCode).json(body);
}
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
export function sendError(res, statusCode, error, extra) {
    const body = { success: false, error, ...extra };
    res.status(statusCode).json(body);
}
/**
 * Send an error response from a caught exception. If the exception is an
 * AppError (or subclass), uses its statusCode/code/extra; otherwise falls
 * back to 500 with the exception's message (or a generic fallback).
 */
export function sendErrorFromException(res, err) {
    if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message, {
            ...(err.code ? { code: err.code } : {}),
            ...(err.extra ?? {}),
        });
        return;
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    sendError(res, 500, message);
}
