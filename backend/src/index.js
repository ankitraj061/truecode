import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
import main from './config/db.js'
import cookieParser from 'cookie-parser';
import userAuth from './routes/userAuth.route.js';
import {redisClient} from './config/redis.js';
import problemCreatorRouter from './routes/problemCreator.route.js';
import submitRouter from './routes/submit.route.js';
import userDiscussionRouter from './routes/userDiscussion.route.js';
import adminDiscussionRouter from './routes/adminDiscussion.route.js';
import userProblemRouter from './routes/userProblem.route.js';
import themeRouter from './routes/theme.route.js';
import paymentRouter from './routes/payment.route.js';
import SubmissionRrouter from './routes/submission.route.js';
import draftRouter from './routes/draft.route.js';
import feedbackRouter from './routes/feedback.route.js';
import chatRouter from './routes/chat.route.js';
import profileRouter from './routes/profile.route.js';
import adminUserRouter from './routes/adminUser.route.js';
import adminProblemRouter from './routes/adminProblem.route.js';
import adminContestRouter from './routes/adminContest.route.js';
import userContestRouter from './routes/userContest.route.js';
import userPointsRouter from './routes/userPoints.route.js';
import userRedemptionRouter from './routes/userRedemption.route.js';
import adminRedemptionRouter from './routes/adminRedemption.route.js';


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
  (req, res) => paymentRouter.handle(req, res) // or call controller directly
);



app.use(express.json());
app.use(cookieParser());

app.use('/api/auth',userAuth);
app.use('/api/problem',problemCreatorRouter);
app.use('/api',submitRouter);
app.use('/api/user/discussion',userDiscussionRouter);
app.use('/api/admin/discussion',adminDiscussionRouter);
app.use('/api/user/problem',userProblemRouter);
app.use('/api',themeRouter);
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
app.use('/health', (_req, res) => res.send('OK'));

const InitializeConnection = async()=>{
    try{
        await main();
        redisClient.connect().catch(err => console.warn('Redis unavailable, continuing without cache:', err.message));
        app.listen(process.env.PORT , () => {
            console.log(`Server running on port ${process.env.PORT}`);
        });
    }
    catch(err){
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

InitializeConnection();

