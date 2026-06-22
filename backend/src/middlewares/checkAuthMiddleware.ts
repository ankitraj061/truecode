import type { Request, Response, NextFunction } from "express";
import { redisClient } from "../config/redis.js";
import User from "../models/user.js";
import jwt from "jsonwebtoken";

export const checkAuth = async (req: Request, res: Response, next: NextFunction) => {

    try{

        const {token} = req.cookies;
        if(!token)
            throw new Error('Token not found');

        const payload = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as any;
        const {_id} = payload;
        if(!_id)
            throw new Error('Invalid token');

        const user = await User.findById(_id);
        if(!user)
            throw new Error('User not found');



        const isBlocked = await redisClient.exists(`token:${token}`);
        if(isBlocked)
            throw new Error('User is blocked');

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
