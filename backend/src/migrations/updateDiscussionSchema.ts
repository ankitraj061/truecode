// src/migrations/updateDiscussionSchema.js
import Discussion from "../modules/discussion/models/discussion.js";
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const updateDiscussionSchema = async () => {
    try {
        // Use your MongoDB URI from environment variables
        const mongoUri = process.env.DB_CONNECT_STRING;
        
        if (!mongoUri) {
            throw new Error('MongoDB URI not found. Please check your .env file for MONGODB_URI or MONGO_URI');
        }
        
        await mongoose.connect(mongoUri);
        
        // Count existing discussions
        const totalDiscussions = await Discussion.countDocuments();
        
        if (totalDiscussions === 0) {
            await mongoose.disconnect();
            process.exit(0);
        }
        
        // Check how many already have the new fields
        const discussionsWithNewFields = await Discussion.countDocuments({ 
            isPinned: { $exists: true } 
        });
        
        if (discussionsWithNewFields === totalDiscussions) {
            await mongoose.disconnect();
            process.exit(0);
        }
        
        // Update discussions that don't have the new fields
        await Discussion.updateMany(
            { isPinned: { $exists: false } }, // Only update documents without isPinned field
            {
                $set: {
                    isPinned: false,
                    pinnedBy: null,
                    pinnedAt: null,
                    editedBy: null,
                    editedAt: null,
                    acceptedBy: null,
                    acceptedAt: null
                }
            }
        );
        
        await mongoose.disconnect();
        process.exit(0);
        
    } catch (error) {
        try {
            await mongoose.disconnect();
        } catch (disconnectError) {
        }
        process.exit(1);
    }
};

// Run migration
updateDiscussionSchema();
