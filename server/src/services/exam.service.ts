import { Exam, type IExam, type ISection } from '../models/Exam';
import { User } from '../models/User';
import { Types } from 'mongoose';

export interface CreateExamInput {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  sections: ISection[];
  department?: string; // Kept for backward compatibility
  language?: string; // New language-based filtering
}

export interface UpdateExamInput {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  sections?: ISection[];
}

export async function createExam(
  input: CreateExamInput,
  adminId: Types.ObjectId,
): Promise<IExam> {
  console.log('=== EXAM SERVICE: createExam ===');
  console.log('Input:', JSON.stringify(input, null, 2));
  console.log('Admin ID:', adminId);
  
  try {
    console.log('About to call Exam.create()...');
    console.log('Exam model:', Exam.modelName);
    console.log('Exam collection:', Exam.collection.name);
    
    const examData = {
      ...input,
      createdBy: adminId,
    };
    
    console.log('Exam data to create:', JSON.stringify(examData, null, 2));
    
    const exam = await Exam.create(examData);
    
    console.log('Exam.create() returned successfully');
    console.log('Exam _id:', exam._id);
    console.log('Exam title:', exam.title);
    console.log('Exam isNew:', exam.isNew);
    
    // Verify the exam was actually saved
    const savedExam = await Exam.findById(exam._id).exec();
    console.log('Verification - Exam found in DB:', !!savedExam);
    if (savedExam) {
      console.log('Verification - Exam title from DB:', savedExam.title);
    } else {
      console.error('WARNING: Exam was created but not found in database!');
    }
    
    const populatedExam = await exam.populate('createdBy', 'name email');
    console.log('Exam populated successfully');
    console.log('=== END EXAM SERVICE ===');
    
    return populatedExam;
  } catch (error) {
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
export async function createDraftExam(
  title: string,
  description: string,
  duration: number,
  adminId: Types.ObjectId,
): Promise<IExam> {
  console.log('=== CREATE DRAFT EXAM ===');
  console.log('Title:', title);
  console.log('Duration:', duration);
  
  const now = new Date();
  const exam = await Exam.create({
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

export async function updateDraftExam(
  examId: string,
  adminId: Types.ObjectId,
  updates: Partial<IExam>,
): Promise<IExam> {
  console.log('=== UPDATE DRAFT EXAM ===');
  console.log('Exam ID:', examId);
  
  if (!Types.ObjectId.isValid(examId)) {
    throw new Error('Invalid exam ID');
  }
  
  const exam = await Exam.findById(examId).exec();
  
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

export async function publishDraftExam(
  examId: string,
  adminId: Types.ObjectId,
): Promise<IExam> {
  console.log('=== PUBLISH DRAFT EXAM ===');
  console.log('Exam ID:', examId);
  
  if (!Types.ObjectId.isValid(examId)) {
    throw new Error('Invalid exam ID');
  }
  
  const exam = await Exam.findById(examId).exec();
  
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

export async function getDraftExam(
  examId: string,
  adminId: Types.ObjectId,
): Promise<IExam> {
  console.log('=== GET DRAFT EXAM ===');
  console.log('Exam ID:', examId);
  
  if (!Types.ObjectId.isValid(examId)) {
    throw new Error('Invalid exam ID');
  }
  
  const exam = await Exam.findById(examId).exec();
  
  if (!exam) {
    throw new Error('Exam not found');
  }
  
  if (exam.createdBy.toString() !== adminId.toString()) {
    throw new Error('Unauthorized: You can only view your own draft exams');
  }
  
  return exam;
}

export async function getAllExams(): Promise<IExam[]> {
  return Exam.find().populate('createdBy', 'name email').sort({ createdAt: -1 }).exec();
}

export interface ExamWithAttemptStatus extends IExam {
  attemptStatus?: 'not-attempted' | 'in-progress' | 'submitted';
  submissionId?: string;
}

export async function getExamsForCandidate(userId: Types.ObjectId, language?: string): Promise<ExamWithAttemptStatus[]> {
  // Import Submission model here to avoid circular dependency
  const { Submission } = await import('../models/Submission');
  
  // Get candidate's department and preferred language
  const candidate = await User.findById(userId).select('department preferredLanguage').exec();
  
  let exams;
  
  // Priority 1: Language-based filtering (if language parameter provided or user has preferred language)
  const filterLanguage = language || candidate?.preferredLanguage;
  
  if (filterLanguage) {
    console.log(`[EXAM-SERVICE] Filtering exams by language: ${filterLanguage}`);
    exams = await Exam.find({ 
      status: 'created',
      language: filterLanguage 
    }).populate('createdBy', 'name email').sort({ createdAt: -1 }).exec();
  }
  // Priority 2: Department-based filtering (backward compatibility)
  else if (candidate?.department) {
    console.log(`[EXAM-SERVICE] Filtering exams by department: ${candidate.department}`);
    exams = await Exam.find({ 
      status: 'created',
      department: candidate.department 
    }).populate('createdBy', 'name email').sort({ createdAt: -1 }).exec();
  }
  // Priority 3: Show all exams (backward compatibility)
  else {
    console.log(`[EXAM-SERVICE] Candidate ${userId} has no language/department - showing all exams`);
    exams = await Exam.find({ status: 'created' })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }
  
  // Get all submissions for this user
  const submissions = await Submission.find({ userId }).select('examId status').exec();
  
  // Create a map of examId -> submission status
  // IMPORTANT: Prioritize 'submitted' status over 'in-progress'
  const submissionMap = new Map<string, { status: string; id: string }>();
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
  const examsWithStatus: ExamWithAttemptStatus[] = exams.map(exam => {
    const examObj = exam.toObject() as ExamWithAttemptStatus;
    const submission = submissionMap.get(exam._id.toString());
    
    if (submission) {
      examObj.attemptStatus = submission.status as 'in-progress' | 'submitted';
      examObj.submissionId = submission.id;
    } else {
      examObj.attemptStatus = 'not-attempted';
    }
    
    return examObj;
  });
  
  return examsWithStatus;
}

export async function getExamById(examId: string): Promise<IExam | null> {
  if (!Types.ObjectId.isValid(examId)) {
    return null;
  }
  return Exam.findById(examId).populate('createdBy', 'name email').exec();
}

export async function updateExam(
  examId: string,
  input: UpdateExamInput,
): Promise<IExam | null> {
  if (!Types.ObjectId.isValid(examId)) {
    return null;
  }
  
  const exam = await Exam.findByIdAndUpdate(
    examId,
    { $set: input },
    { new: true, runValidators: true },
  ).populate('createdBy', 'name email').exec();
  
  return exam;
}

export async function deleteExam(examId: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(examId)) {
    return false;
  }
  
  const result = await Exam.findByIdAndDelete(examId).exec();
  return result !== null;
}

export interface SecureExamResponse {
  exam: {
    _id: string;
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    sections: Array<{
      title: string;
      questions: Array<{
        type: string;
        question: string;
        options?: string[];
        starterCode?: string;
        marks: number;
      }>;
    }>;
  };
  remainingTime: number;
}

export async function getExamForAttempt(examId: string): Promise<SecureExamResponse> {
  if (!Types.ObjectId.isValid(examId)) {
    throw new Error('Invalid exam ID');
  }

  const exam = await Exam.findById(examId).exec();
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
