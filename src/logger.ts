import path from 'path';
import fs from 'fs';
import moment from 'moment';
import betterLogging from 'better-logging';

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logToFile = process.env.LOG_TO_FILE === 'true';

betterLogging(console, {
  format: ctx => `[${moment().format('HH:mm:ss')}] [${moment().format('L')}] ${ctx.type} >> ${ctx.msg}`,
  saveToFile: logToFile ? path.join(logDir, 'log.txt') : null,
});

export {};
