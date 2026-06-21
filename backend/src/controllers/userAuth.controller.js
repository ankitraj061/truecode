import User from "../models/user.js";
import { validate } from "../utils/validator.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { redisClient } from "../config/redis.js";
import Submission from "../models/submission.js";
import { generateUsername } from "../utils/validator.js";
import dotenv from "dotenv";
import { sendError } from "../contracts/apiResponse.js";
dotenv.config();

let passportInstance;
let registerGoogleStrategyFn;

const loadPassportModule = async () => {
    if (!passportInstance || !registerGoogleStrategyFn) {
        const passportModule = await import("../config/passport.js");
        passportInstance = passportModule.default;
        registerGoogleStrategyFn = passportModule.registerGoogleStrategy;
    }

    return {
        passport: passportInstance,
        registerGoogleStrategy: registerGoogleStrategyFn
    };
};

const AUTH_COOKIE_OPTIONS = {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
};




export const googleAuth = async (req, res, next) => {
    const { passport, registerGoogleStrategy } = await loadPassportModule();
    const initialized = await registerGoogleStrategy();

    if (!initialized) {
        return sendError(res, 503, 'Google OAuth is currently unavailable.');
    }

    passport.authenticate('google', {
        scope: ['profile', 'email']
    })(req, res, next);
};

export const googleCallback = async (req, res, next) => {
    const { passport, registerGoogleStrategy } = await loadPassportModule();
    const initialized = await registerGoogleStrategy();

    if (!initialized) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_unavailable`);
    }

    passport.authenticate('google', {
        failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/`
    }, async (err, user) => {
        if (err) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/`);
        }
        
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/`);
        }

        try {
            // Create the same user reply format as your existing auth
            const reply = {
                firstName: user.firstName,
                lastName: user.lastName,
                emailId: user.emailId,
                role: user.role,
                theme: user.preferences.theme,
                username: user.username,
                profilePicture: user.profilePicture,
                subscriptionType: user.subscriptionType,
                _id: user._id
            };

            // Create JWT token (same as your existing auth)
            const token = jwt.sign(
                { 
                    _id: user._id, 
                    emailId: user.emailId,
                    role: user.role,
                    username: user.username 
                }, 
                process.env.JWT_SECRET_KEY, 
                { expiresIn: '7d' }
            );

            // Set cookie (same as your existing auth)
            res.cookie('token', token, AUTH_COOKIE_OPTIONS);

            // Redirect to frontend dashboard
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/`);
            
        } catch (error) {
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=server_error`);
        }
    })(req, res, next);
};



export const register = async (req, res) => {
    try {
        validate(req.body);
        const { firstName,lastName, emailId, password } = req.body;
        const username = generateUsername(firstName);
        const hashedPassword = await bcrypt.hash(password, 10);
        const role ='user';


        const user = await User.create({ firstName,lastName, emailId, password: hashedPassword, role,username });
        const reply = {
            firstName:user.firstName,
            lastName:user.lastName,
            emailId:user.emailId,
            role:user.role,
            theme:user.preferences.theme,
            username:user.username,
            profilePicture:user.profilePicture,
            subscriptionType: user.subscriptionType,
            _id:user._id
        }

        const token = jwt.sign({ _id: user._id, emailId:emailId,role,username }, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });
        res.cookie('token', token, AUTH_COOKIE_OPTIONS);
        res.status(201).json( {
            message: 'User registered successfully',
            user:reply
        } );
    } catch (error) {
        sendError(res, 400, error.message);
    }
};

export const adminRegister = async (req, res) => {
    try {
        validate(req.body);

        const { firstName,lastName, emailId, password} = req.body;
        const username = generateUsername(firstName);
        const hashedPassword = await bcrypt.hash(password, 10);
        const role ='admin';

        const user = await User.create({ firstName,lastName, emailId, password: hashedPassword, role ,username});

        const reply = {
            firstName:user.firstName,
            lastName:user.lastName,
            emailId:user.emailId,
            role:user.role,
            theme:user.preferences.theme,
            username:user.username,
            profilePicture:user.profilePicture,
            subscriptionType: user.subscriptionType,
            _id:user._id
        }

        const token = jwt.sign({ _id: user._id, emailId:emailId,role,username }, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });
        res.cookie('token', token, AUTH_COOKIE_OPTIONS);
        res.status(201).json(  {
            message: 'User registered successfully',
            user:reply
        } );
    } catch (error) {
        sendError(res, 400, error.message);
    }
};

export const login = async (req, res) => {
    try {
        const { emailId, password } = req.body;
        if (!emailId || !password) {
            throw new Error('Missing mandatory fields');
        }

        const user = await User.findOne({ emailId });
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password,user.password);
        if(!isPasswordValid){
            throw new Error('Invalid credentials');
        }

        const reply ={
            firstName:user.firstName,
            lastName:user.lastName,
            emailId:user.emailId,
            role:user.role,
            theme:user.preferences.theme,
            username:user.username,
            profilePicture:user.profilePicture,
            subscriptionType: user.subscriptionType,
            _id:user._id
        }

        const token = jwt.sign({ _id: user._id, emailId:emailId ,role:user.role,username:user.username}, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });
        res.cookie('token', token, AUTH_COOKIE_OPTIONS);
        res.status(200).json({ 
            user: reply,
            message: 'User logged in successfully' 
        });
    }
    catch (error) {
        sendError(res, 400, error.message);
    }
}

export const logout = async (req, res) => {
    try {
        const { token } = req.cookies;
        
        // Handle JWT token blacklisting (for both regular and Google users)
        if (token) {
            try {
                const payload = jwt.decode(token);
                if (payload && payload.exp) {
                    // Add token to Redis blacklist (your existing logic)
                    await redisClient.set(`token:${token}`, 'Blocked');
                    await redisClient.expireAt(`token:${token}`, payload.exp);
                }
            } catch (jwtError) {
                // Continue with logout even if JWT processing fails
            }
        }
        
        // Handle Passport session logout (for Google OAuth users)
        if (req.logout) {
            req.logout((err) => {
            });
        }

        // Clear the token cookie (your existing logic)
        res.cookie('token', '', { ...AUTH_COOKIE_OPTIONS, maxAge: 0, expires: new Date(0) });
        
        res.status(200).json({ message: 'User logged out successfully' });

    } catch (err) {
        sendError(res, 400, err.message);
    }
};


export const deleteUserAccount = async (req, res) => {
    try {
       const userId = req.user._id;

       await User.findByIdAndDelete(userId);
       await Submission.deleteMany({ userId });
        res.status(200).json({ message: 'User account deleted successfully' });
    } catch (error) {
        sendError(res, 400, error.message);
    }
};

export const checkAuthFunction = async (req, res) => {
    try {
        const user = req.user;

        if (user.subscriptionType === 'premium') {
            const now = new Date();
            const expiryDate = new Date(user.subscriptionExpiry);
            if (now > expiryDate) {
                user.subscriptionType = 'free';
                await user.save(); // persist change
            }
        }

        const reply = {
            firstName: user.firstName,
            lastName: user.lastName,
            emailId: user.emailId,
            role: user.role,
            username: user.username,
            theme: user.preferences.theme,
            profilePicture: user.profilePicture,
            subscriptionType: user.subscriptionType,
            subscriptionExpiry: user.subscriptionExpiry,
            _id: user._id
        };

        res.status(200).json({
            user: reply,
            message: `${user.username} logged in successfully`
        });
    } catch (error) {
        sendError(res, 400, error.message);
    }
};
