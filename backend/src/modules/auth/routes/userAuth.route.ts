import express from "express";
import { register, login, logout, adminRegister, deleteUserAccount, checkAuthFunction,googleAuth,googleCallback,githubAuth,githubCallback } from "../controllers/userAuth.controller.js";
const authRouter = express.Router();
import { userMiddleware } from "../../../middlewares/userMiddleware.js";
import { adminMiddleware } from "../../../middlewares/adminMiddleware.js";
import  { checkAuth } from "../../../middlewares/checkAuthMiddleware.js";
import { rateLimit } from "../../../middlewares/ipRateLimitMiddleware.js";

authRouter.post('/register', rateLimit, register);
authRouter.post('/login', rateLimit, login);
authRouter.get('/check',checkAuth,checkAuthFunction);
authRouter.post('/logout',checkAuth,logout);
authRouter.post('/admin/register', adminMiddleware,adminRegister);
authRouter.delete('/user/profile',userMiddleware,deleteUserAccount);

// authRouter.get('/getProfile',getProfile);



authRouter.get('/google',googleAuth);
authRouter.get('/google/callback',googleCallback);

authRouter.get('/github',githubAuth);
authRouter.get('/github/callback',githubCallback);


export default authRouter;