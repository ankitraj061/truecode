import mongoose from "mongoose";
const { Schema } = mongoose;
const contestSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    duration: { type: Number, required: true },
    problems: [{ type: Schema.Types.ObjectId, ref: 'Problem', required: true }],
    // Optional per-problem scores; if missing, derive from Problem.difficulty (easy=1, medium=2, hard=3)
    problemScores: [{ problemId: { type: Schema.Types.ObjectId, ref: 'Problem' }, score: { type: Number } }],
    participants: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        registeredAt: { type: Date, default: Date.now },
        rank: { type: Number },
        score: { type: Number, default: 0 },
        penalty: { type: Number, default: 0 }
    }],
    type: { type: String, enum: ['public', 'private', 'educational'], default: 'public' },
    maxParticipants: { type: Number },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['upcoming', 'running', 'ended'], default: 'upcoming' },
    // When true, all problems in this contest have been set to isActive for the normal problems list
    problemsActivated: { type: Boolean, default: false },
    prizes: [{ position: Number, reward: String }]
}, { timestamps: true });

const Contest = mongoose.model('Contest', contestSchema) as any;
export default Contest