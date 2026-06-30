import Feedback from '../models/feedback.js';
import { sendSuccess, sendError } from '../../../contracts/apiResponse.js';


// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Private
const submitFeedback = async (req, res) => {
  try {
    const { type, message, problemSlug } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!type || !message) {
      return sendError(res, 400, 'Type and message are required');
    }

    // Validate feedback type
    const validTypes = ['bug', 'suggestion', 'question', 'other'];
    if (!validTypes.includes(type)) {
      return sendError(res, 400, 'Invalid feedback type');
    }

    // Create feedback
    const feedback = await Feedback.create({
      userId,
      type,
      message,
      problemSlug: problemSlug || undefined
    });

    sendSuccess(res, feedback, 'Feedback submitted successfully', 201);

  } catch (error) {
    sendError(res, 500, 'Server error while submitting feedback');
  }
};

// @desc    Get user's feedback history
// @route   GET /api/feedback
// @access  Private
const getUserFeedback = async (req, res) => {
  try {
    const userId = req.user._id;

    const feedback = await Feedback.find({ userId })
      .sort({ createdAt: -1 })
      .select('type message problemSlug createdAt');

    sendSuccess(res, feedback);

  } catch (error) {
    sendError(res, 500, 'Server error while fetching feedback');
  }
};

export { submitFeedback, getUserFeedback };
