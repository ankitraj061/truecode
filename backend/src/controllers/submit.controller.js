import Problem from "../models/problem.js";
import Submission from "../models/submission.js";
import User from "../models/user.js";
import Contest from "../models/contest.js";
import { getLanguageId } from "../utils/validator.js";
import { submitBatch,submitToken } from "../utils/problemUtility.js";
import mongoose from "mongoose";
import { compileCode } from "../services/compiler.service.js";
import { updateUserAfterProblemSolve } from "../services/user.service.js";
import { sendError } from '../contracts/apiResponse.js';


export const submitProblem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { problemId } = req.params;
        
        if (!problemId) throw new Error('Problem id not found');
        if (!userId) throw new Error('User id not found');
        
        const { code, language, notes } = req.body;
        if (!code) throw new Error('Code not found');
        if (!language) throw new Error('Language not found');
        
        const problem = await Problem.findById(problemId);
        if (!problem) throw new Error('Problem not found');

        // Check premium access
        if (problem.isPremium && req.user.subscriptionType !== 'premium') {
            return sendError(res, 403, 'Premium subscription required', { isPremium: true });
        }

        // Local compilation check before sending to Judge0
        const compilationResult = await compileCode({ code, language });
        if (!compilationResult.success) {
            return sendError(res, 400, 'Compilation Error', {
                compilationError: compilationResult.error,
                status: 'compilation error'
            });
        }

        const totalTestCases = problem.hiddenTestCases.length + problem.visibleTestCases.length;

        const lang = language.toLowerCase();
        const language_id = getLanguageId(lang);
        
        // Test both visible and hidden test cases
        const submissions = problem.visibleTestCases.map(({ input, output }) => ({
            language_id,
            source_code: code,
            stdin: input,
            expected_output: output
        }));
        submissions.push(...problem.hiddenTestCases.map(({ input, output }) => ({
            language_id,
            source_code: code,
            stdin: input,
            expected_output: output
        })));

        const submitResponse = await submitBatch(submissions);
        const resultToken = submitResponse.map(value => value.token);
        const testResult = await submitToken(resultToken);

        // ✅ COMPETITIVE PROGRAMMING APPROACH
        let testCasesPassed = 0;
        let totalRuntime = 0;     // SUM of all test case times
        let maxMemory = 0;        // MAX memory across all test cases
        let status = 'accepted';
        let errorMessage = '';
        
        const detailedResults = [];
        const visibleTestCount = problem.visibleTestCases.length;
        
        for (let i = 0; i < testResult.length; i++) {
            const test = testResult[i];
            const isVisible = i < visibleTestCount;
            
            // Parse time and memory with robust error handling
            const testTime = parseFloat(test.time) || 0;
            const testMemory = parseInt(test.memory) || 0;
            
            const testDetail = {
                index: i,
                passed: test.status_id === 3,
                statusId: test.status_id,
                status: getStatusName(test.status_id),
                executionTime: testTime * 1000, // Convert to milliseconds
                memoryUsage: testMemory,
                isVisible: isVisible,
                isHidden: !isVisible
            };
            
            if (isVisible || test.status_id !== 3) {
                testDetail.input = isVisible ? problem.visibleTestCases[i].input : '[Hidden]';
                testDetail.expectedOutput = isVisible ? problem.visibleTestCases[i].output : '[Hidden]';
                testDetail.actualOutput = test.stdout || '';
                testDetail.errorMessage = test.stderr || test.compile_output || '';
            }
            
            detailedResults.push(testDetail);

            // ✅ COMPETITIVE PROGRAMMING STYLE CALCULATION
            if (test.status_id === 3) {
                // Accepted test case
                testCasesPassed++;
                
                // SUM approach for runtime (total execution time)
                totalRuntime += testTime * 1000; // Convert seconds to milliseconds
                
                // MAX approach for memory (peak memory usage)
                maxMemory = Math.max(maxMemory, testMemory);
                
            } else {
                // Failed test case - stop execution (competitive programming behavior)
                if (test.status_id === 4) {
                    status = 'wrong answer';
                } else if (test.status_id === 5) {
                    status = 'time limit exceeded';
                } else if (test.status_id === 6) {
                    status = 'compilation error';
                } else if (test.status_id === 13) {
                    status = 'internal error';
                } else if (test.status_id === 14) {
                    status = 'other error';
                } else {
                    status = 'runtime error';
                }
                
                // Only set errorMessage when there is actual error content.
                // Wrong-answer cases have stdout but no stderr — avoid the
                // misleading 'Unknown error' fallback for those.
                const rawError = test.stderr || test.compile_output || '';
                errorMessage = rawError;
                break; // Stop on first failure (competitive programming style)
            }
        }
        
        // ✅ FINAL CALCULATIONS (Competitive Programming Style)
        const runtime = Math.round(totalRuntime); // Total time in milliseconds
        const memory = maxMemory; // Peak memory in KB
        
        const submission = await Submission.create({
            problemId,
            userId,
            code,
            language,
            status,
            errorMessage,
            testCasesTotal: totalTestCases,
            testCasesPassed,
            runtime,
            memory,
            notes: {
                timeTaken: notes?.timeTaken || 0,
                text: notes?.text || ''
            }
        });

        // Call user service only on accepted submission
        if (status === 'accepted') {
            try {
                await updateUserAfterProblemSolve(userId, problemId, problem.difficulty);
            } catch (userUpdateError) {
                // User stats update failed; submission still saved
            }
        } else {
            // Deduct 1 point for any wrong/failed submission
            try {
                await User.findByIdAndUpdate(userId, { $inc: { points: -1 } });
            } catch (pointsError) {
                // Points deduction failed; submission still saved
            }
        }

        // Response
        res.status(200).json({
            success: true,
            message: 'Code submitted successfully',
            submission: {
                id: submission._id,
                status: status,
                testCasesPassed: testCasesPassed,
                totalTestCases: submission.testCasesTotal,
                executionTime: runtime,
                memoryUsage: memory,
                language: language,
                submittedAt: submission.createdAt,
                notes: submission.notes
            },
            results: {
                overall: {
                    status: status,
                    passed: status === 'accepted',
                    passedTests: testCasesPassed,
                    totalTests: submission.testCasesTotal,
                    visibleTests: problem.visibleTestCases.length,
                    hiddenTests: problem.hiddenTestCases.length,
                    executionTime: runtime,
                    memoryUsage: memory
                },
                testDetails: detailedResults.filter(r => 
                    r.isVisible || !r.passed || r.statusId === 6
                ),
                errorMessage: errorMessage
            },
            problem: {
                id: problem._id,
                title: problem.title,
                difficulty: problem.difficulty
            }
        });

    } catch (error) {
        sendError(res, 400, error.message);
    }
};






/**
 * Run a problem with the given code and language.
 * 
 * @param {Object} req.body - Contains code, language, and customTestCases.
 * @param {Object} req.params - Contains problemId.
 * @param {Object} req.user - Contains userId.
 * 
 * @returns {Object} - Response with success, summary, testResults, and rawResults.
 * @throws {Error} - Error message if something goes wrong.
 */

// const customTestCase = {
//     input: "string",           // The input to pass to your function
//     expectedOutput: "string"   // What you expect the output to be
// };
export const runProblem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { problemId } = req.params;
        
        if (!problemId) throw new Error('Problem id not found');
        if (!userId) throw new Error('User id not found');
        
        const { 
            code, 
            language,
            customTestCases = []
        } = req.body;
        
        if (!code) throw new Error('Code not found');
        if (!language) throw new Error('Language not found');
        
        const problem = await Problem.findById(problemId);
        if (!problem) throw new Error('Problem not found');

        // Check premium access
        if (problem.isPremium && req.user.subscriptionType !== 'premium') {
            return sendError(res, 403, 'Premium subscription required');
        }

        // Local compilation check
        const compilationResult = await compileCode({ code, language });
        if (!compilationResult.success) {
            return sendError(res, 400, 'Compilation Error', {
                compilationError: compilationResult.error
            });
        }

        const lang = language.toLowerCase();
        const language_id = getLanguageId(lang);

        // Combine visible test cases with custom test cases
        let testCasesToRun = [];
        
        // Include visible test cases
        const visibleTests = problem.visibleTestCases.map(({ input, output }) => ({
            language_id,
            source_code: code,
            stdin: input,
            expected_output: output,
            isDefault: true,
            originalInput: input,
            originalOutput: output
        }));
        
        testCasesToRun.push(...visibleTests);
        
        // Add custom test cases if provided
        if (customTestCases.length > 0) {
            const customTests = customTestCases.map(({ input, expectedOutput }) => ({
                language_id,
                source_code: code,
                stdin: input,
                expected_output: expectedOutput,
                isCustom: true,
                originalInput: input,
                originalOutput: expectedOutput
            }));
            
            testCasesToRun.push(...customTests);
        }

        // Submit to Judge0
        const submissions = testCasesToRun.map(({ language_id, source_code, stdin, expected_output }) => ({
            language_id,
            source_code,
            stdin,
            expected_output
        }));

        const submitResponse = await submitBatch(submissions);
        const resultToken = submitResponse.map(value => value.token);
        const testResult = await submitToken(resultToken);

        // Process results
        const processedResults = testResult.map((result, index) => {
            const testCase = testCasesToRun[index];
            
            return {
                testCaseIndex: index,
                input: testCase.originalInput,
                expectedOutput: testCase.originalOutput,
                actualOutput: result.stdout || '',
                passed: result.status_id === 3,
                status: getStatusName(result.status_id),
                statusId: result.status_id,
                executionTime: parseFloat(result.time) || 0,
                memoryUsage: parseInt(result.memory) || 0,
                errorMessage: result.stderr || result.compile_output || '',
                isDefault: testCase.isDefault || false,
                isCustom: testCase.isCustom || false
            };
        });

        // Calculate summary
        const passedTests = processedResults.filter(r => r.passed).length;
        const totalTests = processedResults.length;
        const allPassed = passedTests === totalTests;
        const maxTime = processedResults.length > 0 ? Math.max(...processedResults.map(r => r.executionTime)) : 0;
        const maxMemory = processedResults.length > 0 ? Math.max(...processedResults.map(r => r.memoryUsage)) : 0;

        // SIMPLIFIED RESPONSE
        res.status(200).json({
            success: true,
            summary: {
                allPassed,
                passedTests,
                totalTests,
                executionTime: maxTime,
                memoryUsage: maxMemory
            },
            testResults: processedResults.map(result => ({
                input: result.input,
                expectedOutput: result.expectedOutput,
                actualOutput: result.actualOutput,
                passed: result.passed,
                status: result.status,
                executionTime: result.executionTime,
                errorMessage: result.errorMessage
            }))
        });

    } catch (error) {
        sendError(res, 400, error.message);
    }
};

const PENALTY_MINUTES_PER_WA = 5;

/**
 * POST /api/user/contest/:contestId/submit/:problemId
 * Contest submit: same Judge0 flow, save Submission with contestId; on AC update participant score + penalty.
 */
export const submitContestProblem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { contestId, problemId } = req.params;

        if (!contestId || !problemId) throw new Error('Contest id or problem id not found');
        if (!userId) throw new Error('User id not found');

        const { code, language, notes } = req.body;
        if (!code) throw new Error('Code not found');
        if (!language) throw new Error('Language not found');

        const contest = await Contest.findById(contestId).lean();
        if (!contest) return sendError(res, 404, 'Contest not found');

        const now = new Date();
        if (now < contest.startTime) return sendError(res, 400, 'Contest has not started');
        if (now > contest.endTime) return sendError(res, 400, 'Contest has ended');

        const problemIds = (contest.problems || []).map((p) => p.toString());
        if (!problemIds.includes(problemId)) return sendError(res, 404, 'Problem not in this contest');

        const participant = (contest.participants || []).find((p) => p.userId?.toString() === userId.toString());
        if (!participant) return sendError(res, 403, 'You must register for this contest first');

        const problem = await Problem.findById(problemId);
        if (!problem) return sendError(res, 404, 'Problem not found');

        const compilationResult = await compileCode({ code, language });
        if (!compilationResult.success) {
            return sendError(res, 400, 'Compilation Error', {
                compilationError: compilationResult.error,
                status: 'compilation error'
            });
        }

        const totalTestCases = problem.hiddenTestCases.length + problem.visibleTestCases.length;

        const lang = language.toLowerCase();
        const language_id = getLanguageId(lang);
        const submissions = problem.visibleTestCases.map(({ input, output }) => ({
            language_id, source_code: code, stdin: input, expected_output: output
        }));
        submissions.push(...problem.hiddenTestCases.map(({ input, output }) => ({
            language_id, source_code: code, stdin: input, expected_output: output
        })));

        const submitResponse = await submitBatch(submissions);
        const resultToken = submitResponse.map((v) => v.token);
        const testResult = await submitToken(resultToken);

        let testCasesPassed = 0;
        let totalRuntime = 0;
        let maxMemory = 0;
        let status = 'accepted';
        let errorMessage = '';
        const detailedResults = [];
        const visibleTestCount = problem.visibleTestCases.length;

        for (let i = 0; i < testResult.length; i++) {
            const test = testResult[i];
            const isVisible = i < visibleTestCount;
            const testTime = parseFloat(test.time) || 0;
            const testMemory = parseInt(test.memory) || 0;
            const testDetail = {
                index: i,
                passed: test.status_id === 3,
                statusId: test.status_id,
                status: getStatusName(test.status_id),
                executionTime: testTime * 1000,
                memoryUsage: testMemory,
                isVisible,
                isHidden: !isVisible
            };
            if (isVisible || test.status_id !== 3) {
                testDetail.input = isVisible ? problem.visibleTestCases[i].input : '[Hidden]';
                testDetail.expectedOutput = isVisible ? problem.visibleTestCases[i].output : '[Hidden]';
                testDetail.actualOutput = test.stdout || '';
                testDetail.errorMessage = test.stderr || test.compile_output || '';
            }
            detailedResults.push(testDetail);

            if (test.status_id === 3) {
                testCasesPassed++;
                totalRuntime += testTime * 1000;
                maxMemory = Math.max(maxMemory, testMemory);
            } else {
                if (test.status_id === 4) status = 'wrong answer';
                else if (test.status_id === 5) status = 'time limit exceeded';
                else if (test.status_id === 6) status = 'compilation error';
                else if (test.status_id === 13) status = 'internal error';
                else if (test.status_id === 14) status = 'other error';
                else status = 'runtime error';
                const rawError = test.stderr || test.compile_output || '';
                errorMessage = rawError;
                break;
            }
        }

        const runtime = Math.round(totalRuntime);
        const memory = maxMemory;

        const submission = await Submission.create({
            problemId,
            userId,
            contestId,
            code,
            language,
            status,
            errorMessage,
            testCasesTotal: totalTestCases,
            testCasesPassed,
            runtime,
            memory,
            notes: { timeTaken: notes?.timeTaken || 0, text: notes?.text || '' }
        });

        let contestScore = participant.score || 0;
        let contestPenalty = participant.penalty || 0;
        let rank = null;

        if (status === 'accepted') {
            const alreadyAccepted = await Submission.exists({
                contestId,
                userId,
                problemId,
                status: 'accepted',
                _id: { $ne: submission._id }
            });

            if (alreadyAccepted) {
                return res.status(200).json({
                    success: true,
                    message: 'Code submitted successfully',
                    submission: {
                        id: submission._id,
                        status,
                        testCasesPassed,
                        totalTestCases: submission.testCasesTotal,
                        executionTime: runtime,
                        memoryUsage: memory,
                        language,
                        submittedAt: submission.createdAt,
                        notes: submission.notes
                    },
                    results: {
                        overall: {
                            status,
                            passed: status === 'accepted',
                            passedTests: testCasesPassed,
                            totalTests: submission.testCasesTotal,
                            visibleTests: problem.visibleTestCases.length,
                            hiddenTests: problem.hiddenTestCases.length,
                            executionTime: runtime,
                            memoryUsage: memory
                        },
                        testDetails: detailedResults.filter((r) => r.isVisible || !r.passed || r.statusId === 6),
                        errorMessage
                    },
                    problem: { id: problem._id, title: problem.title, difficulty: problem.difficulty },
                    contest: { score: contestScore, penalty: contestPenalty, rank }
                });
            }

            const wrongBefore = await Submission.countDocuments({
                contestId,
                userId,
                problemId,
                status: { $ne: 'accepted' },
                createdAt: { $lt: submission.createdAt }
            });
            const scoreMap = {};
            (contest.problemScores || []).forEach(({ problemId: pid, score }) => {
                const id = pid?.toString?.() || pid;
                if (id) scoreMap[id] = score;
            });
            const problemScore = scoreMap[problemId] ?? (problem.difficulty === 'easy' ? 1 : problem.difficulty === 'medium' ? 2 : 3);
            contestScore += problemScore;
            contestPenalty += wrongBefore * PENALTY_MINUTES_PER_WA;

            await Contest.updateOne(
                { _id: contestId, 'participants.userId': userId },
                { $set: { 'participants.$.score': contestScore, 'participants.$.penalty': contestPenalty } }
            );
        }

        res.status(200).json({
            success: true,
            message: 'Code submitted successfully',
            submission: {
                id: submission._id,
                status,
                testCasesPassed,
                totalTestCases: submission.testCasesTotal,
                executionTime: runtime,
                memoryUsage: memory,
                language,
                submittedAt: submission.createdAt,
                notes: submission.notes
            },
            results: {
                overall: {
                    status,
                    passed: status === 'accepted',
                    passedTests: testCasesPassed,
                    totalTests: submission.testCasesTotal,
                    visibleTests: problem.visibleTestCases.length,
                    hiddenTests: problem.hiddenTestCases.length,
                    executionTime: runtime,
                    memoryUsage: memory
                },
                testDetails: detailedResults.filter((r) => r.isVisible || !r.passed || r.statusId === 6),
                errorMessage
            },
            problem: { id: problem._id, title: problem.title, difficulty: problem.difficulty },
            contest: status === 'accepted' ? { score: contestScore, penalty: contestPenalty, rank } : undefined
        });
    } catch (error) {
        sendError(res, 400, error.message);
    }
};

// Helper function to get readable status names
const getStatusName = (statusId) => {
    const statusMap = {
        1: 'In Queue',
        2: 'Processing',
        3: 'Accepted',
        4: 'Wrong Answer',
        5: 'Time Limit Exceeded',
        6: 'Compilation Error',
        7: 'Runtime Error (SIGSEGV)',
        8: 'Runtime Error (SIGXFSZ)',
        9: 'Runtime Error (SIGFPE)',
        10: 'Runtime Error (SIGABRT)',
        11: 'Runtime Error (NZEC)',
        12: 'Runtime Error (Other)',
        13: 'Internal Error',
        14: 'Exec Format Error'
    };
    return statusMap[statusId] || 'Unknown Error';
};
