import express from "express";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import {
    getAdmins,
    promoteToAdmin,
    createAdminUser,
} from "../controllers/adminUser.controller.js";

const adminUserRouter = express.Router();

// All routes here require admin access
adminUserRouter.use(adminMiddleware);

// List admins
adminUserRouter.get("/admins", getAdmins);

// Promote existing user to admin
adminUserRouter.post("/promote", promoteToAdmin);

// Create a brand new admin user
adminUserRouter.post("/create-admin", createAdminUser);

export default adminUserRouter;

