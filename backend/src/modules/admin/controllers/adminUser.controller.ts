import bcrypt from "bcrypt";
import User from "../../user/models/user.js";
import { generateUsername } from "../../../utils/validator.js";
import { sendError } from '../../../contracts/apiResponse.js';

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
                .select("firstName lastName emailId username role isActive createdAt"),
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

// GET /api/admin/users
export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, role, isActive } = req.query;

        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const skip = (pageNumber - 1) * limitNumber;

        const filter: Record<string, any> = {};
        if (role) filter.role = role;
        if (isActive !== undefined) filter.isActive = isActive === "true";
        if (search) {
            const regex = new RegExp(String(search), "i");
            filter.$or = [
                { firstName: regex },
                { lastName: regex },
                { emailId: regex },
                { username: regex },
            ];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber)
                .select(
                    "firstName lastName emailId username role isActive subscriptionType createdAt"
                ),
            User.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            users,
            total,
            page: pageNumber,
            limit: limitNumber,
        });
    } catch (error) {
        sendError(res, 400, error.message);
    }
};

// PATCH /api/admin/users/:id/toggle-active
export const toggleUserActive = async (req, res) => {
    try {
        const { id } = req.params;

        if (String(req.user._id) === String(id)) {
            return sendError(res, 400, "You cannot deactivate your own account");
        }

        const user = await User.findById(id);
        if (!user) {
            return sendError(res, 404, "User not found");
        }

        user.isActive = !user.isActive;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
            user: {
                _id: user._id,
                isActive: user.isActive,
            },
        });
    } catch (error) {
        sendError(res, 400, error.message);
    }
};

// PATCH /api/admin/users/:id/role
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!["user", "admin"].includes(role)) {
            return sendError(res, 400, "role must be 'user' or 'admin'");
        }

        if (String(req.user._id) === String(id)) {
            return sendError(res, 400, "You cannot change your own role");
        }

        const user = await User.findById(id);
        if (!user) {
            return sendError(res, 404, "User not found");
        }

        user.role = role;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User role updated to ${role}`,
            user: {
                _id: user._id,
                role: user.role,
            },
        });
    } catch (error) {
        sendError(res, 400, error.message);
    }
};

// PATCH /api/admin/users/:id
export const updateUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, password } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return sendError(res, 404, "User not found");
        }

        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (password) {
            if (user.authProvider !== "local") {
                return sendError(res, 400, "Cannot set a password for a non-local account");
            }
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "User updated successfully",
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

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (String(req.user._id) === String(id)) {
            return sendError(res, 400, "You cannot delete your own account");
        }

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return sendError(res, 404, "User not found");
        }

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
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

