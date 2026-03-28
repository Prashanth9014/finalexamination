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
exports.Exam = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TestCaseSchema = new mongoose_1.Schema({
    input: { type: String, required: false },
    expectedOutput: { type: String, required: false },
}, { _id: false });
const QuestionSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['mcq', 'coding'],
        required: true,
    },
    question: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: String },
    starterCode: { type: String },
    testCases: [TestCaseSchema],
    marks: { type: Number, required: true, min: 0 },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    title: { type: String },
    description: { type: String },
}, { _id: false });
const SectionSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    questions: [QuestionSchema],
}, { _id: false });
const ExamSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    duration: { type: Number, required: true, min: 1 },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    department: {
        type: String,
        enum: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA'],
        default: undefined,
    },
    language: {
        type: String,
        enum: ['Python', 'Java', 'C', 'C++'],
        default: undefined,
    },
    sections: [SectionSchema],
    status: {
        type: String,
        enum: ['draft', 'created'],
        default: 'created',
        required: true,
    },
}, { timestamps: true });
exports.Exam = mongoose_1.default.models.Exam || mongoose_1.default.model('Exam', ExamSchema);
