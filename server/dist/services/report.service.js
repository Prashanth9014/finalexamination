"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProgrammingLanguageReport = getProgrammingLanguageReport;
exports.getDepartmentReport = getDepartmentReport;
const User_1 = require("../models/User");
const Submission_1 = require("../models/Submission");
const Exam_1 = require("../models/Exam");
async function getProgrammingLanguageReport(language) {
    console.log('[REPORT-SERVICE] Fetching report for programming language:', language);
    // Validate programming language
    const validLanguages = ['Python', 'Java', 'C', 'C++'];
    if (!validLanguages.includes(language)) {
        throw new Error(`Invalid programming language. Must be one of: ${validLanguages.join(', ')}`);
    }
    // Get all exams with the specified programming language
    const exams = await Exam_1.Exam.find({
        language: language,
    })
        .select('_id')
        .exec();
    console.log(`[REPORT-SERVICE] Found ${exams.length} exams for ${language}`);
    if (exams.length === 0) {
        console.log(`[REPORT-SERVICE] No exams found for ${language}, returning empty report`);
        return [];
    }
    const examIds = exams.map(exam => exam._id);
    // Get all submissions for these exams
    const submissions = await Submission_1.Submission.find({
        examId: { $in: examIds },
        status: 'submitted',
    })
        .select('userId submittedAt')
        .populate('userId', 'name email')
        .exec();
    console.log(`[REPORT-SERVICE] Found ${submissions.length} submissions for ${language} exams`);
    // Create a map of userId -> submission data
    const submissionMap = new Map();
    submissions.forEach((sub) => {
        const userIdStr = sub.userId._id.toString();
        // Keep the latest submission for each user
        if (!submissionMap.has(userIdStr) || sub.submittedAt > submissionMap.get(userIdStr).submittedAt) {
            submissionMap.set(userIdStr, {
                submittedAt: sub.submittedAt,
                user: sub.userId,
            });
        }
    });
    // Build report from users who attempted exams in this language
    const report = Array.from(submissionMap.values()).map((data) => {
        return {
            name: data.user.name,
            email: data.user.email,
            registered: 'YES',
            attempted: 'YES',
            submittedStatus: 'Submitted',
            submittedAt: formatDate(data.submittedAt),
        };
    });
    console.log(`[REPORT-SERVICE] Generated report with ${report.length} entries for ${language}`);
    return report;
}
// Keep the old function for backward compatibility
async function getDepartmentReport(department) {
    console.log('[REPORT-SERVICE] Fetching report for department:', department);
    // Validate department
    const validDepartments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA'];
    if (!validDepartments.includes(department)) {
        throw new Error(`Invalid department. Must be one of: ${validDepartments.join(', ')}`);
    }
    // Get all candidates in the department
    const candidates = await User_1.User.find({
        role: 'candidate',
        department: department,
    })
        .select('name email createdAt')
        .sort({ createdAt: -1 })
        .exec();
    console.log(`[REPORT-SERVICE] Found ${candidates.length} candidates in ${department}`);
    // Get all submissions
    const submissions = await Submission_1.Submission.find({
        status: 'submitted',
    })
        .select('userId submittedAt')
        .exec();
    console.log(`[REPORT-SERVICE] Found ${submissions.length} total submissions`);
    // Create a map of userId -> submission data
    const submissionMap = new Map();
    submissions.forEach((sub) => {
        const userIdStr = sub.userId.toString();
        // Keep the latest submission for each user
        if (!submissionMap.has(userIdStr) || sub.submittedAt > submissionMap.get(userIdStr).submittedAt) {
            submissionMap.set(userIdStr, {
                submittedAt: sub.submittedAt,
            });
        }
    });
    // Build report
    const report = candidates.map((candidate) => {
        const userIdStr = candidate._id.toString();
        const submission = submissionMap.get(userIdStr);
        return {
            name: candidate.name,
            email: candidate.email,
            registered: 'YES',
            attempted: submission ? 'YES' : 'NO',
            submittedStatus: submission ? 'Submitted' : 'Not Submitted',
            submittedAt: submission ? formatDate(submission.submittedAt) : '-',
        };
    });
    console.log(`[REPORT-SERVICE] Generated report with ${report.length} entries`);
    return report;
}
function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
}
