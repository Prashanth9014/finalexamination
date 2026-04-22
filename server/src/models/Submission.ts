import mongoose, { Schema, Document, Model } from 'mongoose';

export type SubmissionStatus = 'in-progress' | 'submitted';

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

export interface ICorrectAnswers {
  [sectionName: string]: number; // Dynamic section names with correct answer counts
}

export interface IQuestionCounts {
  [sectionName: string]: number; // Dynamic section names with question counts
}

export interface ISubmission extends Document {
  userId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  examTitle?: string;
  answers: IAnswer[];
  correctAnswers: ICorrectAnswers;  // Section-wise correct MCQ answers count
  questionCounts: IQuestionCounts;  // Section-wise total questions count
  codingSubmitted: number;  // Count of submitted coding questions
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
    correctAnswers: {
      type: Schema.Types.Mixed, // Dynamic object for section names
      default: {},
    },
    questionCounts: {
      type: Schema.Types.Mixed, // Dynamic object for section names
      default: {},
    },
    codingSubmitted: { type: Number, default: 0 },
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
