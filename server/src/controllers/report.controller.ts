import type { Response, NextFunction } from 'express';
import { getDepartmentReport, getProgrammingLanguageReport } from '../services/report.service';
import type { AuthRequest } from '../middlewares/auth.middleware';

export async function getProgrammingLanguageReportHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { language } = req.query;

    if (!language || typeof language !== 'string') {
      res.status(400).json({ message: 'Programming language parameter is required' });
      return;
    }

    console.log('[REPORT-CONTROLLER] Fetching report for programming language:', language);

    const report = await getProgrammingLanguageReport(language);

    console.log('[REPORT-CONTROLLER] Programming language report generated successfully');
    res.json(report);
  } catch (error) {
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
export async function getDepartmentReportHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { department } = req.query;

    if (!department || typeof department !== 'string') {
      res.status(400).json({ message: 'Department parameter is required' });
      return;
    }

    console.log('[REPORT-CONTROLLER] Fetching report for department:', department);

    const report = await getDepartmentReport(department);

    console.log('[REPORT-CONTROLLER] Report generated successfully');
    res.json(report);
  } catch (error) {
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
