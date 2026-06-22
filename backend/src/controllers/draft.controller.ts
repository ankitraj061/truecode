import mongoose from 'mongoose';
import Problem from '../models/problem.js';
import SolutionDraft from '../models/solutionDraft.js';
import { sendError } from '../contracts/apiResponse.js';

// POST /api/problems/:problemId/draft - Save solution draft
export const saveSolutionDraft = async (req, res) => {
    try {
        const { problemId } = req.params;
        const userId = req.user._id;
        const { code, language } = req.body;

        // Validation
        if (!problemId || !userId || !code || !language) {
            return sendError(res, 400, 'Missing required fields: code and language are required');
        }

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(problemId)) {
            return sendError(res, 400, 'Invalid problem ID format');
        }

        // Get problem to check starter code
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return sendError(res, 404, 'Problem not found');
        }

        // Get starter code for the language
        const starterCodeObj = problem.startCode.find(sc => sc.language === language);
        const starterCode = starterCodeObj ? starterCodeObj.initialCode.trim() : '';

        // ✅ DON'T SAVE if code is same as starter code
        if (code.trim() === starterCode) {
            return res.status(200).json({
                success: true,
                message: 'No changes from starter code, draft not saved',
                saved: false,
                reason: 'identical_to_starter'
            });
        }

        // ✅ DON'T SAVE if code is too short (likely just template/comments)
        const meaningfulCode = code
            .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '') // Remove comments
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

        if (meaningfulCode.length < 30) {
            return res.status(200).json({
                success: true,
                message: 'Code too short or only comments, draft not saved',
                saved: false,
                reason: 'insufficient_content'
            });
        }

        // ✅ SAVE OR UPDATE draft
        const draft = await SolutionDraft.findOneAndUpdate(
            { userId, problemId },
            { 
                code, 
                language,
                updatedAt: new Date()
            },
            { 
                upsert: true, 
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            message: 'Draft saved successfully',
            saved: true,
            draft: {
                id: draft._id,
                language: draft.language,
                updatedAt: draft.updatedAt,
                codeLength: code.length
            }
        });

    } catch (error) {
        
        // Handle duplicate key error (shouldn't happen with upsert, but just in case)
        if (error.code === 11000) {
            return sendError(res, 409, 'Draft already exists for this problem');
        }

        sendError(res, 500, 'Failed to save draft');
    }
};

// GET /api/problems/:problemId/draft - Get solution draft
export const getSolutionDraft = async (req, res) => {
    try {
        const { problemId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(problemId)) {
            return sendError(res, 400, 'Invalid problem ID format');
        }

        const draft = await SolutionDraft.findOne({
            userId,
            problemId
        }).select('code language updatedAt');

        if (!draft) {
            return res.status(200).json({
                success: true,
                message: 'No draft found for this problem',
                draft: null
            });
        }

        res.status(200).json({
            success: true,
            message: 'Draft retrieved successfully',
            draft: {
                id: draft._id,
                code: draft.code,
                language: draft.language,
                updatedAt: draft.updatedAt,
                codeLength: draft.code.length
            }
        });

    } catch (error) {
        sendError(res, 500, 'Failed to retrieve draft');
    }
};

// DELETE /api/problems/:problemId/draft - Delete solution draft
export const deleteSolutionDraft = async (req, res) => {
    try {
        const { problemId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(problemId)) {
            return sendError(res, 400, 'Invalid problem ID format');
        }

        const deletedDraft = await SolutionDraft.findOneAndDelete({ 
            userId, 
            problemId 
        });

        if (!deletedDraft) {
            return sendError(res, 404, 'No draft found to delete');
        }

        res.status(200).json({
            success: true,
            message: 'Draft deleted successfully',
            deletedDraft: {
                id: deletedDraft._id,
                language: deletedDraft.language,
                deletedAt: new Date()
            }
        });

    } catch (error) {
        sendError(res, 500, 'Failed to delete draft');
    }
};

// GET /api/drafts - Get all drafts for user
export const getUserDrafts = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 20 } = req.query;

        const drafts = await SolutionDraft.find({ userId })
            .populate('problemId', 'title slug difficulty')
            .select('code language updatedAt')
            .sort({ updatedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const totalDrafts = await SolutionDraft.countDocuments({ userId });

        const formattedDrafts = drafts.map(draft => ({
            id: draft._id,
            language: draft.language,
            codeLength: draft.code.length,
            updatedAt: draft.updatedAt,
            problem: {
                id: draft.problemId._id,
                title: draft.problemId.title,
                slug: draft.problemId.slug,
                difficulty: draft.problemId.difficulty
            }
        }));

        res.status(200).json({
            success: true,
            message: 'Drafts retrieved successfully',
            drafts: formattedDrafts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalDrafts / limit),
                totalDrafts: totalDrafts,
                hasNextPage: page < Math.ceil(totalDrafts / limit),
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        sendError(res, 500, 'Failed to retrieve drafts');
    }
};
