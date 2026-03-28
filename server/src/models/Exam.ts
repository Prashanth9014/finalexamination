import mongoose, { Schema, Document, Model } from 'mongoose';

export type QuestionType = 'mcq' | 'coding';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface ITestCase {
  input: string;
  expectedOutput: string;
}

export interface IQuestion {
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer?: string;
  starterCode?: string;
  testCases?: ITestCase[];
  marks: number;
  difficulty?: DifficultyLevel;
  title?: string;
  description?: string;
}

export interface ISection {
  title: string;
  questions: IQuestion[];
}

export interface IExam extends Document {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  createdBy: mongoose.Types.ObjectId;
  department?: string; // For filtering: CSE, ECE, EEE, MECH, CIVIL, MBA (kept for backward compatibility)
  language?: string; // For language-based filtering: Python, Java, C, C++
  sections: ISection[];
  status: 'draft' | 'created';
  createdAt: Date;
  updatedAt: Date;
}

const TestCaseSchema = new Schema<ITestCase>(
  {
    input: { type: String, required: false },
    expectedOutput: { type: String, required: false },
  },
  { _id: false },
);

const QuestionSchema = new Schema<IQuestion>(
  {
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
  },
  { _id: false },
);

const SectionSchema = new Schema<ISection>(
  {
    title: { type: String, required: true, trim: true },
    questions: [QuestionSchema],
  },
  { _id: false },
);

const ExamSchema: Schema<IExam> = new Schema<IExam>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    duration: { type: Number, required: true, min: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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
  },
  { timestamps: true },
);

export const Exam: Model<IExam> =
  mongoose.models.Exam || mongoose.model<IExam>('Exam', ExamSchema);
