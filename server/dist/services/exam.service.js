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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExam = createExam;
exports.createDraftExam = createDraftExam;
exports.updateDraftExam = updateDraftExam;
exports.publishDraftExam = publishDraftExam;
exports.getDraftExam = getDraftExam;
exports.getAllExams = getAllExams;
exports.getExamsForCandidate = getExamsForCandidate;
exports.getExamById = getExamById;
exports.updateExam = updateExam;
exports.deleteExam = deleteExam;
exports.getExamForAttempt = getExamForAttempt;
const Exam_1 = require("../models/Exam");
const User_1 = require("../models/User");
const mongoose_1 = require("mongoose");
async function createExam(input, adminId) {
    console.log('=== EXAM SERVICE: createExam ===');
    console.log('Input:', JSON.stringify(input, null, 2));
    console.log('Admin ID:', adminId);
    try {
        console.log('About to call Exam.create()...');
        console.log('Exam model:', Exam_1.Exam.modelName);
        console.log('Exam collection:', Exam_1.Exam.collection.name);
        const examData = {
            ...input,
            createdBy: adminId,
        };
        console.log('Exam data to create:', JSON.stringify(examData, null, 2));
        const exam = await Exam_1.Exam.create(examData);
        console.log('Exam.create() returned successfully');
        console.log('Exam _id:', exam._id);
        console.log('Exam title:', exam.title);
        console.log('Exam isNew:', exam.isNew);
        // Verify the exam was actually saved
        const savedExam = await Exam_1.Exam.findById(exam._id).exec();
        console.log('Verification - Exam found in DB:', !!savedExam);
        if (savedExam) {
            console.log('Verification - Exam title from DB:', savedExam.title);
        }
        else {
            console.error('WARNING: Exam was created but not found in database!');
        }
        const populatedExam = await exam.populate('createdBy', 'name email');
        console.log('Exam populated successfully');
        console.log('=== END EXAM SERVICE ===');
        return populatedExam;
    }
    catch (error) {
        console.error('=== EXAM SERVICE ERROR ===');
        console.error('Error creating exam:', error);
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        console.error('=== END SERVICE ERROR ===');
        throw error;
    }
}
// Draft Exam Functions
async function createDraftExam(title, description, duration, adminId) {
    console.log('=== CREATE DRAFT EXAM ===');
    console.log('Title:', title);
    console.log('Duration:', duration);
    const now = new Date();
    const exam = await Exam_1.Exam.create({
        title,
        description,
        duration,
        startTime: now,
        endTime: new Date(now.getTime() + duration * 60000),
        createdBy: adminId,
        sections: [
            { title: 'Aptitude', questions: [] },
            { title: 'Reasoning', questions: [] },
            { title: 'Technical', questions: [] },
            { title: 'Coding', questions: [] },
        ],
        status: 'draft',
    });
    console.log('Draft exam created:', exam._id);
    return exam;
}
async function updateDraftExam(examId, adminId, updates) {
    console.log('=== UPDATE DRAFT EXAM ===');
    console.log('Exam ID:', examId);
    if (!mongoose_1.Types.ObjectId.isValid(examId)) {
        throw new Error('Invalid exam ID');
    }
    const exam = await Exam_1.Exam.findById(examId).exec();
    if (!exam) {
        throw new Error('Exam not found');
    }
    if (exam.createdBy.toString() !== adminId.toString()) {
        throw new Error('Unauthorized: You can only update your own exams');
    }
    if (exam.status !== 'draft') {
        throw new Error('Cannot update published exam');
    }
    // Update fields
    Object.assign(exam, updates);
    await exam.save();
    console.log('Draft exam updated');
    return exam;
}
async function publishDraftExam(examId, adminId) {
    console.log('=== PUBLISH DRAFT EXAM ===');
    console.log('Exam ID:', examId);
    if (!mongoose_1.Types.ObjectId.isValid(examId)) {
        throw new Error('Invalid exam ID');
    }
    const exam = await Exam_1.Exam.findById(examId).exec();
    if (!exam) {
        throw new Error('Exam not found');
    }
    if (exam.createdBy.toString() !== adminId.toString()) {
        throw new Error('Unauthorized: You can only publish your own exams');
    }
    if (exam.status !== 'draft') {
        throw new Error('Exam already published');
    }
    // Validate exam has at least one question
    const hasQuestions = exam.sections.some(s => s.questions.length > 0);
    if (!hasQuestions) {
        throw new Error('Exam must have at least one question before publishing');
    }
    exam.status = 'created';
    await exam.save();
    console.log('Draft exam published');
    return exam;
}
async function getDraftExam(examId, adminId) {
    console.log('=== GET DRAFT EXAM ===');
    console.log('Exam ID:', examId);
    if (!mongoose_1.Types.ObjectId.isValid(examId)) {
        throw new Error('Invalid exam ID');
    }
    const exam = await Exam_1.Exam.findById(examId).exec();
    if (!exam) {
        throw new Error('Exam not found');
    }
    if (exam.createdBy.toString() !== adminId.toString()) {
        throw new Error('Unauthorized: You can only view your own draft exams');
    }
    return exam;
}
async function getAllExams() {
    return Exam_1.Exam.find().populate('createdBy', 'name email').sort({ createdAt: -1 }).exec();
}
async function getExamsForCandidate(userId, language) {
    // Import Submission model here to avoid circular dependency
    const { Submission } = await Promise.resolve().then(() => __importStar(require('../models/Submission')));
    // Get candidate's department and preferred language
    const candidate = await User_1.User.findById(userId).select('department preferredLanguage').exec();
    let exams;
    // Priority 1: Language-based filtering (if language parameter provided or user has preferred language)
    const filterLanguage = language || candidate?.preferredLanguage;
    if (filterLanguage) {
        console.log(`[EXAM-SERVICE] Filtering exams by language: ${filterLanguage}`);
        exams = await Exam_1.Exam.find({
            status: 'created',
            language: filterLanguage
        }).populate('createdBy', 'name email').sort({ createdAt: -1 }).exec();
    }
    // Priority 2: Department-based filtering (backward compatibility)
    else if (candidate?.department) {
        console.log(`[EXAM-SERVICE] Filtering exams by department: ${candidate.department}`);
        exams = await Exam_1.Exam.find({
            status: 'created',
            department: candidate.department
        }).populate('createdBy', 'name email').sort({ createdAt: -1 }).exec();
    }
    // Priority 3: Show all exams (backward compatibility)
    else {
        console.log(`[EXAM-SERVICE] Candidate ${userId} has no language/department - showing all exams`);
        exams = await Exam_1.Exam.find({ status: 'created' })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .exec();
    }
    // Get all submissions for this user
    const submissions = await Submission.find({ userId }).select('examId status').exec();
    // Create a map of examId -> submission status
    // IMPORTANT: Prioritize 'submitted' status over 'in-progress'
    const submissionMap = new Map();
    submissions.forEach(sub => {
        const examIdStr = sub.examId.toString();
        const existing = submissionMap.get(examIdStr);
        // If no existing submission or existing is 'in-progress' and current is 'submitted'
        // then update the map (prioritize 'submitted' status)
        if (!existing || (existing.status === 'in-progress' && sub.status === 'submitted')) {
            submissionMap.set(examIdStr, {
                status: sub.status,
                id: sub._id.toString()
            });
        }
    });
    // Add attempt status to each exam
    const examsWithStatus = exams.map(exam => {
        const examObj = exam.toObject();
        const submission = submissionMap.get(exam._id.toString());
        if (submission) {
            examObj.attemptStatus = submission.status;
            examObj.submissionId = submission.id;
        }
        else {
            examObj.attemptStatus = 'not-attempted';
        }
        return examObj;
    });
    return examsWithStatus;
}
async function getExamById(examId) {
    if (!mongoose_1.Types.ObjectId.isValid(examId)) {
        return null;
    }
    return Exam_1.Exam.findById(examId).populate('createdBy', 'name email').exec();
}
async function updateExam(examId, input) {
    if (!mongoose_1.Types.ObjectId.isValid(examId)) {
        return null;
    }
    const exam = await Exam_1.Exam.findByIdAndUpdate(examId, { $set: input }, { new: true, runValidators: true }).populate('createdBy', 'name email').exec();
    return exam;
}
async function deleteExam(examId) {
    if (!mongoose_1.Types.ObjectId.isValid(examId)) {
        return false;
    }
    const result = await Exam_1.Exam.findByIdAndDelete(examId).exec();
    return result !== null;
}
async function getExamForAttempt(examId) {
    if (!mongoose_1.Types.ObjectId.isValid(examId)) {
        throw new Error('Invalid exam ID');
    }
    const exam = await Exam_1.Exam.findById(examId).exec();
    if (!exam) {
        throw new Error('Exam not found');
    }
    // Duration-based exam: Available anytime for candidates
    // Timer starts when candidate begins the exam
    // Use full exam duration for remaining time
    const remainingTime = exam.duration;
    // Sanitize exam data - remove sensitive information
    const sanitizedSections = exam.sections.map((section) => ({
        title: section.title,
        questions: section.questions.map((question) => ({
            type: question.type,
            question: question.question,
            ...(question.options && { options: question.options }),
            ...(question.starterCode && { starterCode: question.starterCode }),
            marks: question.marks,
            // Explicitly exclude: correctAnswer, testCases
        })),
    }));
    return {
        exam: {
            _id: exam._id.toString(),
            title: exam.title,
            description: exam.description,
            startTime: exam.startTime,
            endTime: exam.endTime,
            duration: exam.duration,
            sections: sanitizedSections,
        },
        remainingTime,
    };
}
