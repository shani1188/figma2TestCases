import { randomBytes } from 'crypto';

export function generateRunId(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const random = randomBytes(4).toString('hex');
  return `${timestamp}-${random}`;
}
