import bcrypt from "bcrypt";
import User from "../models/user.js";
import { generateUsername } from "../utils/validator.js";
import { sendError } from '../contracts/apiResponse.js';

// GET /api/admin/users/admins
export const getAdmins = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const skip = (pageNumber - 1) * limitNumber;

        const [admins, total] = await Promise.all([
            User.find({ role: "admin" })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber)
                .select("firstName lastName emailId username role createdAt"),
            User.countDocuments({ role: "admin" }),
        ]);

        res.status(200).json({
            admins,
            total,
            page: pageNumber,
            limit: limitNumber,
        });
    } catch (error) {
        sendError(res, 400, error.message);
    }
};

// POST /api/admin/users/promote
export const promoteToAdmin = async (req, res) => {
    try {
        const { emailId } = req.body;

        if (!emailId) {
            return sendError(res, 400, "emailId is required");
        }

        const user = await User.findOne({ emailId: emailId.toLowerCase() });

        if (!user) {
            return sendError(res, 404, "User not found");
        }

        if (user.role === "admin") {
            return res.status(200).json({
                message: "User is already an admin",
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    emailId: user.emailId,
                    username: user.username,
                    role: user.role,
                },
            });
        }

        user.role = "admin";
        await user.save();

        res.status(200).json({
            message: "User promoted to admin successfully",
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                emailId: user.emailId,
                username: user.username,
                role: user.role,
            },
        });
    } catch (error) {
        sendError(res, 400, error.message);
    }
};

// POST /api/admin/users/create-admin
export const createAdminUser = async (req, res) => {
    try {
        const { firstName, lastName, emailId, password } = req.body;

        if (!firstName || !emailId || !password) {
            return sendError(res, 400, "firstName, emailId and password are required");
        }

        const existingUser = await User.findOne({ emailId: emailId.toLowerCase() });
        if (existingUser) {
            return sendError(res, 400, "A user with this email already exists");
        }

        const username = generateUsername(firstName);
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            firstName,
            lastName,
            emailId: emailId.toLowerCase(),
            username,
            password: hashedPassword,
            role: "admin",
        });

        res.status(201).json({
            message: "Admin user created successfully",
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                emailId: user.emailId,
                username: user.username,
                role: user.role,
            },
        });
    } catch (error) {
        sendError(res, 400, error.message);
    }
};

