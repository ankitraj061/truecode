import type { Request, Response, NextFunction } from "express";
import { redisClient } from "../config/redis.js";
import User from "../models/user.js";
import jwt from "jsonwebtoken";

export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {

    try{
        const {token} = req.cookies;
        if(!token)
            throw new Error('Token not found');

        const payload = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as any;
        const {_id} = payload;
        if(!_id)
            throw new Error('Invalid token');

        const isBlocked = await redisClient.exists(`token:${token}`);
        if(isBlocked)
            throw new Error('User is blocked');

        const user = await User.findById(_id);
        if(!user)
            throw new Error('User not found');
        if(user.role !== 'admin')
            throw new Error('Access denied. Admins only');

        req.user = user;
        next();

    }
    catch(error: any){
        if (error.message === 'Access denied. Admins only') {
            return res.status(403).json({ error: error.message });
        }
        res.status(401).json({ error: error.message });
    }
}
