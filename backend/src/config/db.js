import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function main(){
    const uri = process.env.DB_CONNECT_STRING;

    if (!uri) {
        throw new Error("DB_CONNECT_STRING is not configured");
    }

    await mongoose.connect(uri);
}

export default main