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
exports.Submission = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AnswerSchema = new mongoose_1.Schema({
    questionId: { type: String, required: true },
    selectedOption: { type: String },
    codingAnswer: { type: String },
    language: { type: String },
    testResults: {
        type: {
            passed: { type: Number },
            total: { type: Number },
            score: { type: Number },
        },
        required: false,
    },
}, { _id: false });
const SubmissionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Exam', required: true },
    examTitle: { type: String, required: false },
    answers: [AnswerSchema],
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    sectionScores: {
        type: {
            aptitude: { type: Number, default: 0 },
            reasoning: { type: Number, default: 0 },
            technical: { type: Number, default: 0 },
            coding: { type: Number, default: 0 },
        },
        default: { aptitude: 0, reasoning: 0, technical: 0, coding: 0 },
    },
    correctAnswers: {
        type: {
            aptitude: { type: Number, default: 0 },
            reasoning: { type: Number, default: 0 },
            technical: { type: Number, default: 0 },
        },
        default: { aptitude: 0, reasoning: 0, technical: 0 },
    },
    questionCounts: {
        type: {
            aptitude: { type: Number, default: 0 },
            reasoning: { type: Number, default: 0 },
            technical: { type: Number, default: 0 },
            coding: { type: Number, default: 0 },
        },
        default: { aptitude: 0, reasoning: 0, technical: 0, coding: 0 },
    },
    codingSubmitted: { type: Number, default: 0 },
    result: {
        type: String,
        enum: ['PASS', 'FAIL', 'PENDING'],
        default: 'PENDING',
    },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },
    status: {
        type: String,
        enum: ['in-progress', 'submitted'],
        default: 'in-progress',
        required: true,
    },
}, { timestamps: true });
// Index for faster queries and prevent duplicate submissions
SubmissionSchema.index({ userId: 1, examId: 1 }, { unique: true });
SubmissionSchema.index({ status: 1 });
exports.Submission = mongoose_1.default.models.Submission || mongoose_1.default.model('Submission', SubmissionSchema);
