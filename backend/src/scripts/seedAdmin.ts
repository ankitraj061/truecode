import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import main from "../config/db.js";
import User from "../models/user.js";
import { generateUsername } from "../utils/validator.js";

dotenv.config();

async function seedAdmin() {
    try {
        await main();

        const emailId = "admin@gmail.com";
        const plainPassword = "admin@12";

        let user = await User.findOne({ emailId: emailId.toLowerCase() });

        if (user) {
            user.role = "admin";
            await user.save();
        } else {
            const hashedPassword = await bcrypt.hash(plainPassword, 10);
            const username = generateUsername("Admin");

            user = await User.create({
                firstName: "Admin",
                lastName: "User",
                emailId: emailId.toLowerCase(),
                username,
                password: hashedPassword,
                role: "admin",
            });
        }
    } catch (error) {
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

seedAdmin();

