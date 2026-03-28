"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExamHandler = createExamHandler;
exports.getAllExamsHandler = getAllExamsHandler;
exports.getExamByIdHandler = getExamByIdHandler;
exports.updateExamHandler = updateExamHandler;
exports.deleteExamHandler = deleteExamHandler;
exports.getExamForAttemptHandler = getExamForAttemptHandler;
exports.createDraftExamHandler = createDraftExamHandler;
exports.updateDraftExamHandler = updateDraftExamHandler;
exports.publishDraftExamHandler = publishDraftExamHandler;
exports.getDraftExamHandler = getDraftExamHandler;
const mongoose_1 = __importDefault(require("mongoose"));
const exam_service_1 = require("../services/exam.service");
function validateCreateExamInput(body) {
    const { title, description, duration, sections, department, language } = body;
    if (!title || typeof title !== 'string') {
        throw new Error('Title is required');
    }
    if (!description || typeof description !== 'string') {
        throw new Error('Description is required');
    }
    if (duration == null || typeof duration !== 'number' || duration < 1) {
        throw new Error('Duration must be a positive number');
    }
    if (!Array.isArray(sections) || sections.length === 0) {
        throw new Error('At least one section is required');
    }
    // Validate language (new requirement) - must be provided and valid
    const validLanguages = ['Python', 'Java', 'C', 'C++'];
    if (!language || typeof language !== 'string' || !validLanguages.includes(language)) {
        throw new Error(`Programming language is required. Must be one of: ${validLanguages.join(', ')}`);
    }
    // Department is now optional (kept for backward compatibility)
    const validDepartments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA'];
    if (department && (typeof department !== 'string' || !validDepartments.includes(department))) {
        throw new Error(`Department must be one of: ${validDepartments.join(', ')}`);
    }
    // Generate default startTime and endTime for duration-based exams
    // These are kept for backward compatibility but not enforced
    const now = new Date();
    const startTime = now;
    const endTime = new Date(now.getTime() + duration * 60 * 1000);
    return {
        title,
        description,
        startTime,
        endTime,
        duration,
        sections,
        department,
        language,
    };
}
async function createExamHandler(req, res, next) {
    try {
        console.log('=== CREATE EXAM REQUEST ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('User:', req.user);
        const input = validateCreateExamInput(req.body);
        console.log('Validated input:', JSON.stringify(input, null, 2));
        const adminId = new mongoose_1.default.Types.ObjectId(req.user.userId);
        console.log('Admin ID:', adminId);
        const exam = await (0, exam_service_1.createExam)(input, adminId);
        console.log('Exam created successfully:', exam._id);
        console.log('=== END CREATE EXAM ===');
        res.status(201).json(exam);
    }
    catch (error) {
        console.error('=== CREATE EXAM ERROR ===');
        console.error('Error:', error);
        console.error('=== END ERROR ===');
        if (error instanceof Error && error.message.includes('required')) {
            res.status(400).json({ message: error.message });
            return;
        }
        next(error);
    }
}
async function getAllExamsHandler(req, res, next) {
    try {
        // If user is a candidate, return exams with attempt status
        if (req.user.role === 'candidate') {
            const userId = new mongoose_1.default.Types.ObjectId(req.user.userId);
            const language = req.query.language;
            const exams = await (0, exam_service_1.getExamsForCandidate)(userId, language);
            res.json(exams);
        }
        else {
            // For admin, return all exams without attempt status
            const exams = await (0, exam_service_1.getAllExams)();
            res.json(exams);
        }
    }
    catch (error) {
        next(error);
    }
}
async function getExamByIdHandler(req, res, next) {
    try {
        const { id } = req.params;
        const exam = await (0, exam_service_1.getExamById)(id);
        if (!exam) {
            res.status(404).json({ message: 'Exam not found' });
            return;
        }
        res.json(exam);
    }
    catch (error) {
        next(error);
    }
}
async function updateExamHandler(req, res, next) {
    try {
        const { id } = req.params;
        const updateData = {};
        if (req.body.title)
            updateData.title = req.body.title;
        if (req.body.description)
            updateData.description = req.body.description;
        if (req.body.startTime)
            updateData.startTime = new Date(req.body.startTime);
        if (req.body.endTime)
            updateData.endTime = new Date(req.body.endTime);
        if (req.body.duration != null)
            updateData.duration = req.body.duration;
        if (req.body.sections)
            updateData.sections = req.body.sections;
        const exam = await (0, exam_service_1.updateExam)(id, updateData);
        if (!exam) {
            res.status(404).json({ message: 'Exam not found' });
            return;
        }
        res.json(exam);
    }
    catch (error) {
        next(error);
    }
}
async function deleteExamHandler(req, res, next) {
    try {
        const { id } = req.params;
        const deleted = await (0, exam_service_1.deleteExam)(id);
        if (!deleted) {
            res.status(404).json({ message: 'Exam not found' });
            return;
        }
        res.json({ message: 'Exam deleted successfully' });
    }
    catch (error) {
        next(error);
    }
}
async function getExamForAttemptHandler(req, res, next) {
    try {
        const { id } = req.params;
        const result = await (0, exam_service_1.getExamForAttempt)(id);
        res.json(result);
    }
    catch (error) {
        if (error instanceof Error) {
            const knownErrors = [
                'Invalid exam ID',
                'Exam not found',
                'Exam has not started yet',
                'Exam has already ended',
            ];
            if (knownErrors.includes(error.message)) {
                res.status(400).json({ message: error.message });
                return;
            }
        }
        next(error);
    }
}
// Draft Exam Handlers
async function createDraftExamHandler(req, res, next) {
    try {
        console.log('=== CREATE DRAFT EXAM REQUEST ===');
        const { title, description, duration } = req.body;
        if (!title || !description || !duration) {
            res.status(400).json({ message: 'Title, description, and duration are required' });
            return;
        }
        const adminId = new mongoose_1.default.Types.ObjectId(req.user.userId);
        const { createDraftExam } = await Promise.resolve().then(() => __importStar(require('../services/exam.service')));
        const exam = await createDraftExam(title, description, Number(duration), adminId);
        console.log('Draft exam created:', exam._id);
        res.status(201).json(exam);
    }
    catch (error) {
        console.error('Create draft exam error:', error);
        next(error);
    }
}
async function updateDraftExamHandler(req, res, next) {
    try {
        console.log('=== UPDATE DRAFT EXAM REQUEST ===');
        const { id } = req.params;
        const adminId = new mongoose_1.default.Types.ObjectId(req.user.userId);
        const { updateDraftExam } = await Promise.resolve().then(() => __importStar(require('../services/exam.service')));
        const exam = await updateDraftExam(id, adminId, req.body);
        res.json(exam);
    }
    catch (error) {
        if (error instanceof Error) {
            const knownErrors = [
                'Invalid exam ID',
                'Exam not found',
                'Unauthorized',
                'Cannot update published exam',
            ];
            if (knownErrors.some(msg => error.message.includes(msg))) {
                res.status(error.message.includes('Unauthorized') ? 403 : 400).json({ message: error.message });
                return;
            }
        }
        next(error);
    }
}
async function publishDraftExamHandler(req, res, next) {
    try {
        console.log('=== PUBLISH DRAFT EXAM REQUEST ===');
        const { id } = req.params;
        const adminId = new mongoose_1.default.Types.ObjectId(req.user.userId);
        const { publishDraftExam } = await Promise.resolve().then(() => __importStar(require('../services/exam.service')));
        const exam = await publishDraftExam(id, adminId);
        res.json(exam);
    }
    catch (error) {
        if (error instanceof Error) {
            const knownErrors = [
                'Invalid exam ID',
                'Exam not found',
                'Unauthorized',
                'Exam already published',
                'Exam must have at least one question',
            ];
            if (knownErrors.some(msg => error.message.includes(msg))) {
                res.status(error.message.includes('Unauthorized') ? 403 : 400).json({ message: error.message });
                return;
            }
        }
        next(error);
    }
}
async function getDraftExamHandler(req, res, next) {
    try {
        console.log('=== GET DRAFT EXAM REQUEST ===');
        const { id } = req.params;
        const adminId = new mongoose_1.default.Types.ObjectId(req.user.userId);
        const { getDraftExam } = await Promise.resolve().then(() => __importStar(require('../services/exam.service')));
        const exam = await getDraftExam(id, adminId);
        res.json(exam);
    }
    catch (error) {
        if (error instanceof Error) {
            const knownErrors = [
                'Invalid exam ID',
                'Exam not found',
                'Unauthorized',
            ];
            if (knownErrors.some(msg => error.message.includes(msg))) {
                res.status(error.message.includes('Unauthorized') ? 403 : 404).json({ message: error.message });
                return;
            }
        }
        next(error);
    }
}
