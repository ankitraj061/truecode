import Joi from 'joi';

export const validateInput = (schema) => {
    return (req, res, next) => {
        try {
            const { error, value } = schema.validate(req.body);
            
            if (error) {
                return res.status(400).json({ 
                    error: 'Invalid input data',
                    details: error.details.map(detail => detail.message)
                });
            }
            
            req.validatedData = value;
            next();
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };
};

export const problemCreationSchema = Joi.object({
    title: Joi.string().min(5).max(100).required(),
    description: Joi.string().min(20).required(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
    tags: Joi.array().items(Joi.string()).min(1).required(),
    constraints: Joi.array().items(Joi.string().min(1)).min(1).required(),
    companies: Joi.array().items(Joi.string()).optional(),

    visibleTestCases: Joi.array().items(
        Joi.object({
            input: Joi.string().required(),
            output: Joi.string().required(),
            explanation: Joi.string().allow('').optional(),
            imageUrl: Joi.string().allow('').optional()
        })
    ).min(1).required(),

    hiddenTestCases: Joi.array().items(
        Joi.object({
            input: Joi.string().required(),
            output: Joi.string().required()
        })
    ).optional().default([]),

    startCode: Joi.array().items(
        Joi.object({
            language: Joi.string().required(),
            initialCode: Joi.string().required()
        })
    ).min(1).required(),

    referenceSolution: Joi.array().items(
        Joi.object({
            language: Joi.string().required(),
            completeCode: Joi.string().required(),
            timeComplexity: Joi.string().allow('').optional(),
            spaceComplexity: Joi.string().allow('').optional()
        })
    ).optional().default([]),

    hints: Joi.array().items(Joi.string()).optional(),
    editorialContent: Joi.object({
        textContent: Joi.string().allow('').optional(),
        videoUrl: Joi.string().allow('').optional(),
        thumbnailUrl: Joi.string().allow('').optional(),
        videoDuration: Joi.number().optional()
    }).optional(),
    videoSolution: Joi.string().uri().allow('').optional(),
    isPremium: Joi.boolean().optional(),
    isActive: Joi.boolean().optional()
});


export const problemUpdateSchema = Joi.object({
    title: Joi.string().min(5).max(100),
    description: Joi.string().min(20),
    difficulty: Joi.string().valid('easy', 'medium', 'hard'),
    tags: Joi.array().items(Joi.string()).min(1),
    constraints: Joi.array().items(Joi.string().min(1)).min(1),
    companies: Joi.array().items(Joi.string()),
    visibleTestCases: Joi.array().items(
        Joi.object({
            input: Joi.string().required(),
            output: Joi.string().required(),
            explanation: Joi.string().allow('').optional(),
            imageUrl: Joi.string().allow('').optional()
        })
    ).min(1),
    hiddenTestCases: Joi.array().items(
        Joi.object({
            input: Joi.string().required(),
            output: Joi.string().required()
        })
    ),
    startCode: Joi.array().items(
        Joi.object({
            language: Joi.string().required(),
            initialCode: Joi.string().required()
        })
    ),
    referenceSolution: Joi.array().items(
        Joi.object({
            language: Joi.string().required(),
            completeCode: Joi.string().required(),
            timeComplexity: Joi.string().allow('').optional(),
            spaceComplexity: Joi.string().allow('').optional()
        })
    ),
    hints: Joi.array().items(Joi.string()),
    editorialContent: Joi.object({
        textContent: Joi.string().allow('').optional(),
        videoUrl: Joi.string().allow('').optional(),
        thumbnailUrl: Joi.string().allow('').optional(),
        videoDuration: Joi.number().optional()
    }),
    videoSolution: Joi.string().uri().allow('').optional(),
    isActive: Joi.boolean(),
    isPremium: Joi.boolean()
}).min(1);






// // Without validation middleware - DANGEROUS
// app.post('/create-problem', (req, res) => {
//     // req.body.title could be empty, too long, or contain malicious code
//     const problem = new Problem(req.body); // Direct database save - risky!
// });

// // With validation middleware - SAFE
// app.post('/create-problem', validateInput(problemSchema), (req, res) => {
//     // req.validatedData is guaranteed to be clean and properly formatted
//     const problem = new Problem(req.validatedData);
// });



// Benefits
// Prevents invalid data from entering your database

// Stops SQL injection and XSS attacks

// Ensures data consistency across your application

// Provides clear error messages to users

// Reduces debugging time by catching bad data early