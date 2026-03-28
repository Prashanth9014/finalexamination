const isProd = process.env.NODE_ENV === 'production';

export const logger = {
  info: (msg: string, meta?: object) => {
    if (isProd) {
      console.log(JSON.stringify({ level: 'info', msg, ...meta }));
    } else {
      console.log(msg, meta ?? '');
    }
  },
  warn: (msg: string, meta?: object) => {
    if (isProd) {
      console.warn(JSON.stringify({ level: 'warn', msg, ...meta }));
    } else {
      console.warn(msg, meta ?? '');
    }
  },
  error: (msg: string, err?: unknown, meta?: object) => {
    const payload: Record<string, unknown> = { level: 'error', msg, ...meta };
    if (err instanceof Error) {
      payload.error = err.message;
      if (!isProd) payload.stack = err.stack;
    } else if (err != null) {
      payload.error = String(err);
    }
    if (isProd) {
      console.error(JSON.stringify(payload));
    } else {
      console.error(msg, err, meta ?? '');
    }
  },
};
