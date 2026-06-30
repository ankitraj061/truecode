import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
const app = express();
import main from './config/db.js'
import cookieParser from 'cookie-parser';
import userAuth from './modules/auth/routes/userAuth.route.js';
import {redisClient, connectRedis} from './config/redis.js';
import problemCreatorRouter from './modules/problem/routes/problemCreator.route.js';
import submitRouter from './modules/problem/routes/submit.route.js';
import userDiscussionRouter from './modules/discussion/routes/userDiscussion.route.js';
import adminDiscussionRouter from './modules/discussion/routes/adminDiscussion.route.js';
import userProblemRouter from './modules/problem/routes/userProblem.route.js';
import themeRouter from './modules/user/routes/theme.route.js';
import codeRouter from './modules/problem/routes/code.route.js';
import paymentRouter from './modules/payment/routes/payment.route.js';
import SubmissionRrouter from './modules/problem/routes/submission.route.js';
import draftRouter from './modules/problem/routes/draft.route.js';
import feedbackRouter from './modules/feedback/routes/feedback.route.js';
import chatRouter from './modules/chat/routes/chat.route.js';
import profileRouter from './modules/user/routes/profile.route.js';
import adminUserRouter from './modules/admin/routes/adminUser.route.js';
import adminProblemRouter from './modules/problem/routes/adminProblem.route.js';
import adminContestRouter from './modules/contest/routes/adminContest.route.js';
import userContestRouter from './modules/contest/routes/userContest.route.js';
import userPointsRouter from './modules/user/routes/userPoints.route.js';
import userRedemptionRouter from './modules/redeem/routes/userRedemption.route.js';
import adminRedemptionRouter from './modules/redeem/routes/adminRedemption.route.js';
import adminFeedbackRouter from './modules/feedback/routes/adminFeedback.route.js';
import { sendErrorFromException, AppError } from './contracts/apiResponse.js';


app.use(cors({
    origin: [
        'http://localhost:3000',  // Your Next.js frontend
        'https://localhost:3000',  // If you use HTTPS locally
        'https://www.truecode.shop',
        'https://truecode.shop'
    ],
    credentials: true, // Allow cookies and credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Cookie',
        'Set-Cookie',
        'Access-Control-Allow-Credentials'
    ]
}));

app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  (req, res) => (paymentRouter as any).handle(req, res) // or call controller directly
);



app.use(express.json());
app.use(cookieParser());

app.use('/api/auth',userAuth);
app.use('/api/problem',problemCreatorRouter);
app.use('/api/user/problem',userProblemRouter);
app.use('/api/user/discussion',userDiscussionRouter);
app.use('/api/admin/discussion',adminDiscussionRouter);
app.use('/api',submitRouter);
app.use('/api',themeRouter);
app.use('/api',codeRouter);
app.use('/api/payments', paymentRouter);
app.use('/api',SubmissionRrouter);
app.use('/api',draftRouter);
app.use('/api/feedback',feedbackRouter);
app.use('/api/chat',chatRouter);
app.use('/api',profileRouter);
app.use('/api/admin/users', adminUserRouter);
app.use('/api/admin/problems', adminProblemRouter);
app.use('/api/admin/contest', adminContestRouter);
app.use('/api/user/contest', userContestRouter);
app.use('/api/user', userPointsRouter);
app.use('/api/redeem', userRedemptionRouter);
app.use('/api/admin/redemptions', adminRedemptionRouter);
app.use('/api/admin/feedback', adminFeedbackRouter);
app.use('/health', (_req, res) => res.send('OK'));
app.use('/', (_req, res) => res.send('Welcome to the API'));

// Global error handler — must be after all routes.
// Every error reaching here should be an AppError (thrown with an explicit
// statusCode) so the response shape/status is decided at the throw site,
// not guessed here by matching message text.
app.use((err, req, res, _next) => {
    if (!(err instanceof AppError)) {
        console.error('Unhandled error:', err);
    }
    sendErrorFromException(res, err);
});

const PORT = process.env.PORT || 8000;


const InitializeConnection = async()=>{
    try{
        await main();
        connectRedis().catch(err => console.warn('Redis unavailable, continuing without cache:', err.message));
        app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
    }
    catch(err){
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

InitializeConnection();
