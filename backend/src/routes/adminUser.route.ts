import express from "express";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import {
    getAdmins,
    promoteToAdmin,
    createAdminUser,
    getAllUsers,
    toggleUserActive,
    updateUserRole,
    updateUserDetails,
    deleteUser,
} from "../controllers/adminUser.controller.js";

const adminUserRouter = express.Router();

// All routes here require admin access
adminUserRouter.use(adminMiddleware);

// List all users (manage users page)
adminUserRouter.get("/", getAllUsers);

// List admins
adminUserRouter.get("/admins", getAdmins);

// Promote existing user to admin
adminUserRouter.post("/promote", promoteToAdmin);

// Create a brand new admin user
adminUserRouter.post("/create-admin", createAdminUser);

// Activate / deactivate a user
adminUserRouter.patch("/:id/toggle-active", toggleUserActive);

// Change a user's role
adminUserRouter.patch("/:id/role", updateUserRole);

// Edit a user's name / reset their password
adminUserRouter.patch("/:id", updateUserDetails);

// Permanently delete a user
adminUserRouter.delete("/:id", deleteUser);

export default adminUserRouter;

