"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProgrammingLanguageReportHandler = getProgrammingLanguageReportHandler;
exports.getDepartmentReportHandler = getDepartmentReportHandler;
const report_service_1 = require("../services/report.service");
async function getProgrammingLanguageReportHandler(req, res, next) {
    try {
        const { language } = req.query;
        if (!language || typeof language !== 'string') {
            res.status(400).json({ message: 'Programming language parameter is required' });
            return;
        }
        console.log('[REPORT-CONTROLLER] Fetching report for programming language:', language);
        const report = await (0, report_service_1.getProgrammingLanguageReport)(language);
        console.log('[REPORT-CONTROLLER] Programming language report generated successfully');
        res.json(report);
    }
    catch (error) {
        if (error instanceof Error) {
            const knownErrors = ['Invalid programming language'];
            if (knownErrors.some((msg) => error.message.includes(msg))) {
                res.status(400).json({ message: error.message });
                return;
            }
        }
        next(error);
    }
}
// Keep the old function for backward compatibility
async function getDepartmentReportHandler(req, res, next) {
    try {
        const { department } = req.query;
        if (!department || typeof department !== 'string') {
            res.status(400).json({ message: 'Department parameter is required' });
            return;
        }
        console.log('[REPORT-CONTROLLER] Fetching report for department:', department);
        const report = await (0, report_service_1.getDepartmentReport)(department);
        console.log('[REPORT-CONTROLLER] Report generated successfully');
        res.json(report);
    }
    catch (error) {
        if (error instanceof Error) {
            const knownErrors = ['Invalid department'];
            if (knownErrors.some((msg) => error.message.includes(msg))) {
                res.status(400).json({ message: error.message });
                return;
            }
        }
        next(error);
    }
}
