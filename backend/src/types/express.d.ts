// Augments Express's Request type with properties our middlewares attach.
// Kept loose (mostly `any`) deliberately — this is a pragmatic incremental
// migration, not an attempt to fully model every Mongoose document shape.
import "express";

declare global {
  namespace Express {
    // Passport's own types declare `Express.User` as an empty interface and
    // type `req.user` against it. Widening it here (rather than overriding
    // `user` directly on Request, which would conflict with Passport's own
    // declaration) lets the rest of the app keep treating req.user as `any`.
    interface User {
      [key: string]: any;
    }
    interface Request {
      deletionResults?: any;
      validatedData?: any;
      problem?: any;
    }
  }
}
