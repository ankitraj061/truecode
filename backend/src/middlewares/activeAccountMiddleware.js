export const activeAccountMiddleware = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        if (!req.user.isActive) {
            return res.status(403).json({ 
                error: 'Your account has been suspended. Please contact support.',
                action: 'account_suspended'
            });
        }
        next();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
