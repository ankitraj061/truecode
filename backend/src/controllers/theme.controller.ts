// routes/user.js or similar
import User from '../models/user.js';
import { sendError } from '../contracts/apiResponse.js';
export const updateTheme = async (req, res) => {
    
    try {
        const { theme } = req.body;
        const userId = req.user._id;

        const user = await User.findByIdAndUpdate(
            userId,
            { 'preferences.theme': theme },
            { new: true }
        );

        res.status(200).json({
            message: 'Theme updated successfully',
            theme: user.preferences.theme
        });
    } catch (error) {
        sendError(res, 400, error.message);
    }
};
