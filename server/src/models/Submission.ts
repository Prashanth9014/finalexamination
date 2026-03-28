import mongoose, { Schema, Document, Model } from 'mongoose';

export type SubmissionStatus = 'in-progress' | 'submitted';
export type SubmissionResult = 'PASS' | 'FAIL' | 'PENDING';

export interface IAnswer {
  questionId: string;
  selectedOption?: string;
  codingAnswer?: string;
  language?: string;
  testResults?: {
    passed: number;
    total: number;
    score: number;
  };
}

export interface ISectionScore {
  aptitude: number;
  reasoning: number;
  technical: number;
  coding: number;
}

export interface ICorrectAnswers {
  aptitude: number;
  reasoning: number;
  technical: number;
}

export interface IQuestionCounts {
  aptitude: number;
  reasoning: number;
  technical: number;
  coding: number;
}

export interface ISubmission extends Document {
  userId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  examTitle?: string;
  answers: IAnswer[];
  score: number;
  totalMarks: number;
  percentage: number;
  sectionScores: ISectionScore;
  correctAnswers: ICorrectAnswers;  // NEW: Count of correct MCQ answers
  questionCounts: IQuestionCounts;  // NEW: Total questions per section
  codingSubmitted: number;  // NEW: Count of submitted coding questions
  result: SubmissionResult;
  startedAt: Date;
  submittedAt?: Date;
  status: SubmissionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const AnswerSchema = new Schema<IAnswer>(
  {
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
  },
  { _id: false },
);

const SubmissionSchema: Schema<ISubmission> = new Schema<ISubmission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
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
  },
  { timestamps: true },
);

// Index for faster queries and prevent duplicate submissions
SubmissionSchema.index({ userId: 1, examId: 1 }, { unique: true });
SubmissionSchema.index({ status: 1 });

export const Submission: Model<ISubmission> =
  mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);
