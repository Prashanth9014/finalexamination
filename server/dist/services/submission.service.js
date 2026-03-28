"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startExam = startExam;
exports.submitExam = submitExam;
exports.saveCodingAnswer = saveCodingAnswer;
exports.getMySubmissions = getMySubmissions;
exports.getSubmissionById = getSubmissionById;
exports.getAllSubmissions = getAllSubmissions;
exports.resetCandidateAttempt = resetCandidateAttempt;
const Submission_1 = require("../models/Submission");
const Exam_1 = require("../models/Exam");
const User_1 = require("../models/User");
const mongoose_1 = require("mongoose");
async function startExam(examId, userId) {
    console.log('=== START EXAM SERVICE ===');
    console.log('Received examId:', examId);
    console.log('Received userId:', userId);
    if (!mongoose_1.Types.ObjectId.isValid(examId)) {
        throw new Error('Invalid exam ID');
    }
    const exam = await Exam_1.Exam.findById(examId).exec();
    console.log('Found exam:', exam ? exam._id : 'NOT FOUND');
    console.log('Exam title:', exam?.title);
    if (!exam) {
        throw new Error('Exam not found');
    }
    // Duration-based exam: Available anytime for candidates
    // No time window restrictions
    // Check if user already has a submission for this exam
    const examObjectId = new mongoose_1.Types.ObjectId(examId);
    console.log('Converted examId to ObjectId:', examObjectId);
    // Retrieve user to check permissions
    const user = await User_1.User.findById(userId).exec();
    // Search globally for ANY prior exams
    const globalSubmissions = await Submission_1.Submission.find({ userId }).populate({
        path: 'examId',
        select: 'title'
    }).exec();
    const hasGlobalSubmission = globalSubmissions.some(sub => sub.status === 'submitted');
    // Strict cross-language enforcement
    if (hasGlobalSubmission && user?.canReattempt !== true) {
        const submittedSubmission = globalSubmissions.find(sub => sub.status === 'submitted');
        // SAFETY CHECK: Ensure submittedSubmission exists
        if (!submittedSubmission) {
            console.log('❌ ERROR: hasGlobalSubmission is true but no submitted submission found');
            throw new Error('System error: Unable to verify previous submission. Please contact admin.');
        }
        console.log('❌ BLOCKING: Exam already submitted globally');
        console.log('=== END START EXAM SERVICE ===');
        throw new Error(`Attempt Limit Reached

You have already attempted an exam with this account.

Each candidate is allowed to take only one exam.

If you wish to reattempt, please contact the admin.`);
    }
    const existingSubmission = globalSubmissions.find(sub => sub.examId && sub.examId._id.toString() === examObjectId.toString());
    console.log('Existing submission:', existingSubmission ? existingSubmission._id : 'NONE');
    if (existingSubmission) {
        console.log('Existing submission status:', existingSubmission.status);
        console.log('Existing submission submittedAt:', existingSubmission.submittedAt);
        if (existingSubmission.status === 'submitted') {
            console.log('❌ BLOCKING: Exam already submitted');
            console.log('=== END START EXAM SERVICE ===');
            throw new Error(`Attempt Limit Reached

You have already attempted an exam with this account.

Each candidate is allowed to take only one exam.

If you wish to reattempt, please contact the admin.`);
        }
        // If submission is in-progress, return it (allow resume)
        console.log('✅ ALLOWING RESUME: Returning existing in-progress submission');
        console.log('=== END START EXAM SERVICE ===');
        return { submission: existingSubmission, exam };
    }
    // Create new submission
    console.log('Creating new submission...');
    const now = new Date();
    const submissionData = {
        userId,
        examId: examObjectId,
        examTitle: exam.title,
        answers: [],
        score: 0,
        totalMarks: 0,
        percentage: 0,
        sectionScores: {
            aptitude: 0,
            reasoning: 0,
            technical: 0,
            coding: 0,
        },
        correctAnswers: {
            aptitude: 0,
            reasoning: 0,
            technical: 0,
        },
        questionCounts: {
            aptitude: 0,
            reasoning: 0,
            technical: 0,
            coding: 0,
        },
        codingSubmitted: 0,
        result: 'PENDING',
        startedAt: now,
        status: 'in-progress',
    };
    console.log('Submission data to create:', JSON.stringify({
        userId: submissionData.userId.toString(),
        examId: submissionData.examId.toString(),
        status: submissionData.status
    }));
    const submission = await Submission_1.Submission.create(submissionData);
    console.log('Submission created successfully!');
    console.log('Submission _id:', submission._id);
    console.log('Submission examId:', submission.examId);
    console.log('Submission userId:', submission.userId);
    console.log('=== END START EXAM SERVICE ===');
    return { submission, exam };
}
async function submitExam(submissionId, userId, input) {
    if (!mongoose_1.Types.ObjectId.isValid(submissionId)) {
        throw new Error('Invalid submission ID');
    }
    const submission = await Submission_1.Submission.findById(submissionId).exec();
    if (!submission) {
        throw new Error('Submission not found');
    }
    // Verify ownership
    if (submission.userId.toString() !== userId.toString()) {
        throw new Error('Unauthorized: This is not your submission');
    }
    // Check if already submitted
    if (submission.status === 'submitted') {
        throw new Error('Submission already completed');
    }
    // Get exam details for scoring
    const exam = await Exam_1.Exam.findById(submission.examId).exec();
    if (!exam) {
        throw new Error('Associated exam not found');
    }
    // Calculate comprehensive score (now async with test case execution)
    const scoreResult = await calculateScore(exam, input.answers);
    // Determine pass/fail (cutoff: 60%)
    const cutoffPercentage = 60;
    const result = scoreResult.percentage >= cutoffPercentage ? 'PASS' : 'FAIL';
    // Update submission
    submission.answers = input.answers;
    submission.score = scoreResult.totalScore;
    submission.totalMarks = scoreResult.totalMarks;
    submission.percentage = scoreResult.percentage;
    submission.sectionScores = scoreResult.sectionScores;
    submission.correctAnswers = scoreResult.correctAnswers; // NEW
    submission.questionCounts = scoreResult.questionCounts; // NEW
    submission.codingSubmitted = scoreResult.codingSubmitted; // NEW
    submission.result = result;
    submission.submittedAt = new Date();
    submission.status = 'submitted';
    await submission.save();
    return submission;
}
async function saveCodingAnswer(submissionId, userId, input) {
    console.log('=== SAVE CODING ANSWER SERVICE ===');
    console.log('Input:', {
        submissionId,
        userId: userId.toString(),
        questionId: input.questionId,
        language: input.language,
        codeLength: input.code.length,
        codePreview: input.code.substring(0, 100)
    });
    if (!mongoose_1.Types.ObjectId.isValid(submissionId)) {
        throw new Error('Invalid submission ID');
    }
    const submission = await Submission_1.Submission.findById(submissionId).exec();
    if (!submission) {
        throw new Error('Submission not found');
    }
    console.log('Found submission:', submission._id);
    console.log('Current answers count:', submission.answers.length);
    // Verify ownership
    if (submission.userId.toString() !== userId.toString()) {
        throw new Error('Unauthorized: This is not your submission');
    }
    // Check if already submitted
    if (submission.status === 'submitted') {
        throw new Error('Cannot save code after submission is completed');
    }
    // Find existing answer for this question
    const existingAnswerIndex = submission.answers.findIndex((answer) => answer.questionId === input.questionId);
    console.log('Existing answer index:', existingAnswerIndex);
    const codingAnswer = {
        questionId: input.questionId,
        selectedOption: input.code, // Store code in selectedOption for consistency
        language: input.language,
    };
    console.log('Creating answer object:', {
        questionId: codingAnswer.questionId,
        hasSelectedOption: !!codingAnswer.selectedOption,
        selectedOptionLength: codingAnswer.selectedOption?.length,
        language: codingAnswer.language
    });
    if (existingAnswerIndex >= 0) {
        // Update existing answer
        console.log('Updating existing answer at index:', existingAnswerIndex);
        submission.answers[existingAnswerIndex] = codingAnswer;
    }
    else {
        // Add new answer
        console.log('Adding new answer');
        submission.answers.push(codingAnswer);
    }
    console.log('Saving submission...');
    await submission.save();
    console.log('✅ Submission saved successfully!');
    console.log('Total answers now:', submission.answers.length);
    console.log('Saved answer:', submission.answers.find(a => a.questionId === input.questionId));
    console.log('=== END SAVE CODING ANSWER SERVICE ===');
    return submission;
}
async function calculateScore(exam, answers) {
    // Create a map of answers for quick lookup
    const answerMap = new Map();
    answers.forEach((answer) => {
        answerMap.set(answer.questionId, answer);
    });
    // Initialize section scores and marks (kept for backward compatibility)
    const sectionScores = {
        aptitude: 0,
        reasoning: 0,
        technical: 0,
        coding: 0,
    };
    const sectionMarks = {
        aptitude: 0,
        reasoning: 0,
        technical: 0,
        coding: 0,
    };
    // NEW: Initialize correct answer counts
    const correctAnswers = {
        aptitude: 0,
        reasoning: 0,
        technical: 0,
    };
    // NEW: Initialize question counts
    const questionCounts = {
        aptitude: 0,
        reasoning: 0,
        technical: 0,
        coding: 0,
    };
    // NEW: Initialize coding submitted count
    let codingSubmitted = 0;
    // Iterate through exam sections and questions
    for (let sectionIndex = 0; sectionIndex < exam.sections.length; sectionIndex++) {
        const section = exam.sections[sectionIndex];
        const sectionName = section.title.toLowerCase();
        let sectionKey;
        // Map section title to section key
        if (sectionName.includes('aptitude')) {
            sectionKey = 'aptitude';
        }
        else if (sectionName.includes('reasoning')) {
            sectionKey = 'reasoning';
        }
        else if (sectionName.includes('technical')) {
            sectionKey = 'technical';
        }
        else if (sectionName.includes('coding')) {
            sectionKey = 'coding';
        }
        else {
            // Default to technical for unknown sections
            sectionKey = 'technical';
        }
        for (let questionIndex = 0; questionIndex < section.questions.length; questionIndex++) {
            const question = section.questions[questionIndex];
            const questionId = `${sectionIndex}-${questionIndex}`;
            const userAnswer = answerMap.get(questionId);
            const questionMarks = question.marks || 0;
            // Count total questions per section
            questionCounts[sectionKey]++;
            // Add to total marks for this section (kept for backward compatibility)
            sectionMarks[sectionKey] += questionMarks;
            if (!userAnswer) {
                continue; // No answer provided
            }
            // Evaluate MCQ questions
            if (question.type === 'mcq' && question.correctAnswer) {
                if (userAnswer.selectedOption === question.correctAnswer) {
                    sectionScores[sectionKey] += questionMarks; // Keep for backward compatibility
                    // NEW: Count correct answer
                    if (sectionKey !== 'coding') {
                        correctAnswers[sectionKey]++;
                    }
                }
            }
            // Handle coding questions - NO AUTOMATIC EVALUATION
            if (question.type === 'coding') {
                // Check if candidate submitted code (stored in selectedOption)
                const submittedCode = userAnswer.selectedOption || userAnswer.codingAnswer;
                if (submittedCode && submittedCode.trim()) {
                    // Check if it's not just the default template
                    const defaultTemplates = [
                        'def solution(input):',
                        'function solution(input)',
                        'char* solution(const char* input)',
                        'string solution(string input)',
                        'public static String solution(String input)',
                    ];
                    const hasActualCode = !defaultTemplates.some(template => submittedCode === template ||
                        submittedCode?.trim().startsWith(template) && submittedCode.trim().length < template.length + 50);
                    if (hasActualCode) {
                        // NEW: Count as submitted (no score calculation)
                        codingSubmitted++;
                    }
                }
            }
        }
    }
    // Calculate totals (kept for backward compatibility)
    const totalScore = Object.values(sectionScores).reduce((sum, score) => sum + score, 0);
    const totalMarks = Object.values(sectionMarks).reduce((sum, marks) => sum + marks, 0);
    // Calculate percentage (avoid division by zero)
    const percentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
    return {
        totalScore,
        totalMarks,
        percentage: Math.round(percentage * 100) / 100,
        sectionScores,
        correctAnswers,
        questionCounts,
        codingSubmitted,
    };
}
async function getMySubmissions(userId) {
    const allSubmissions = await Submission_1.Submission.find({ userId })
        .populate('examId', 'title description startTime endTime duration')
        .sort({ createdAt: -1 })
        .exec();
    // Filter out duplicate submissions for the same exam
    // Prioritize 'submitted' status over 'in-progress'
    const submissionMap = new Map();
    allSubmissions.forEach(submission => {
        const examIdStr = submission.examId?._id?.toString();
        if (!examIdStr)
            return; // Skip if examId is not populated
        const existing = submissionMap.get(examIdStr);
        // If no existing submission or existing is 'in-progress' and current is 'submitted'
        // then update the map (prioritize 'submitted' status)
        if (!existing || (existing.status === 'in-progress' && submission.status === 'submitted')) {
            submissionMap.set(examIdStr, submission);
        }
    });
    // Convert map values back to array and sort by creation date (most recent first)
    const uniqueSubmissions = Array.from(submissionMap.values()).sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return uniqueSubmissions;
}
async function getSubmissionById(submissionId, userId, userRole) {
    console.log('=== GET SUBMISSION BY ID SERVICE ===');
    console.log('Submission ID:', submissionId);
    console.log('User ID:', userId);
    console.log('User Role:', userRole);
    if (!mongoose_1.Types.ObjectId.isValid(submissionId)) {
        console.log('❌ Invalid submission ID');
        return null;
    }
    const submission = await Submission_1.Submission.findById(submissionId)
        .populate('userId', 'name email')
        .populate('examId') // Populate full exam including sections
        .exec();
    if (!submission) {
        console.log('❌ Submission not found');
        return null;
    }
    console.log('✅ Submission found');
    console.log('Submission status:', submission.status);
    console.log('Number of answers:', submission.answers?.length || 0);
    // Log each answer with details
    if (submission.answers && submission.answers.length > 0) {
        console.log('\n--- ANSWERS DETAILS ---');
        submission.answers.forEach((answer, index) => {
            console.log(`\nAnswer ${index + 1}:`);
            console.log('  Question ID:', answer.questionId);
            if (answer.codingAnswer) {
                console.log('  Type: coding');
                console.log('  Language:', answer.language);
                console.log('  Code length:', answer.codingAnswer?.length || 0);
                console.log('  Code preview:', answer.codingAnswer?.substring(0, 100) || 'No code');
                console.log('  Test results:', answer.testResults);
            }
            else if (answer.selectedOption) {
                console.log('  Type: mcq');
                console.log('  Selected option:', answer.selectedOption);
            }
        });
        console.log('--- END ANSWERS DETAILS ---\n');
    }
    else {
        console.log('⚠️ No answers found in submission');
    }
    // Admin can view any submission, candidate can only view their own
    if (userRole !== 'admin' && submission.userId._id.toString() !== userId.toString()) {
        console.log('❌ Unauthorized access attempt');
        throw new Error('Unauthorized: You can only view your own submissions');
    }
    console.log('=== END GET SUBMISSION BY ID SERVICE ===\n');
    return submission;
}
async function getAllSubmissions() {
    console.log('=== GET ALL SUBMISSIONS SERVICE ===');
    const allSubmissions = await Submission_1.Submission.find()
        .populate('userId', 'name email role')
        .populate('examId', 'title description startTime endTime duration')
        .sort({ createdAt: -1 })
        .exec();
    console.log(`✅ Found ${allSubmissions.length} total submissions`);
    // Filter out duplicate submissions for the same user+exam combination
    // Prioritize 'submitted' status over 'in-progress'
    const submissionMap = new Map();
    allSubmissions.forEach(submission => {
        const userIdStr = submission.userId?._id?.toString();
        const examIdStr = submission.examId?._id?.toString();
        if (!userIdStr || !examIdStr)
            return; // Skip if userId or examId is not populated
        // Create unique key: userId + examId
        const key = `${userIdStr}-${examIdStr}`;
        const existing = submissionMap.get(key);
        // If no existing submission or existing is 'in-progress' and current is 'submitted'
        // then update the map (prioritize 'submitted' status)
        if (!existing || (existing.status === 'in-progress' && submission.status === 'submitted')) {
            submissionMap.set(key, submission);
        }
    });
    // Convert map values back to array and sort by creation date (most recent first)
    const uniqueSubmissions = Array.from(submissionMap.values()).sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    console.log(`✅ After deduplication: ${uniqueSubmissions.length} unique submissions`);
    // Log summary of each unique submission
    uniqueSubmissions.forEach((sub, index) => {
        console.log(`\nSubmission ${index + 1}:`);
        console.log('  ID:', sub._id);
        console.log('  User:', sub.userId?.name || 'N/A');
        console.log('  Exam:', sub.examId?.title || 'N/A');
        console.log('  Status:', sub.status);
        console.log('  Answers count:', sub.answers?.length || 0);
        if (sub.answers && sub.answers.length > 0) {
            const codingAnswers = sub.answers.filter(a => a.codingAnswer);
            const mcqAnswers = sub.answers.filter(a => a.selectedOption && !a.codingAnswer);
            console.log('  Coding answers:', codingAnswers.length);
            console.log('  MCQ answers:', mcqAnswers.length);
            // Log coding answer details
            codingAnswers.forEach((answer, idx) => {
                console.log(`    Coding ${idx + 1}: Language=${answer.language}, Code length=${answer.codingAnswer?.length || 0}`);
            });
        }
    });
    console.log('=== END GET ALL SUBMISSIONS SERVICE ===\n');
    return uniqueSubmissions;
}
async function resetCandidateAttempt(submissionId, adminUserId) {
    console.log('=== RESET CANDIDATE ATTEMPT SERVICE ===');
    console.log('Submission ID:', submissionId);
    console.log('Admin User ID:', adminUserId);
    if (!mongoose_1.Types.ObjectId.isValid(submissionId)) {
        throw new Error('Invalid submission ID');
    }
    const submission = await Submission_1.Submission.findById(submissionId).exec();
    if (!submission) {
        throw new Error('Submission not found');
    }
    console.log('Found submission:', submission._id);
    console.log('Current status:', submission.status);
    console.log('User ID:', submission.userId);
    // GLOBAL RESET: Delete ALL submissions for this user
    // This ensures login restriction is completely removed
    const userId = submission.userId;
    console.log('Performing global reset for user:', userId);
    // Find all submissions for this user before deletion (for logging)
    const userSubmissions = await Submission_1.Submission.find({ userId }).exec();
    console.log(`Found ${userSubmissions.length} submissions for user ${userId}`);
    userSubmissions.forEach((sub, index) => {
        console.log(`  Submission ${index + 1}: ID=${sub._id}, Status=${sub.status}, ExamId=${sub.examId}`);
    });
    // Delete ALL submissions for this user
    const deleteResult = await Submission_1.Submission.deleteMany({ userId }).exec();
    console.log('✅ Global reset completed successfully');
    console.log(`Deleted ${deleteResult.deletedCount} submissions for user ${userId}`);
    console.log('User can now login and attempt any exam');
    console.log('=== END RESET CANDIDATE ATTEMPT SERVICE ===');
    return true;
}
