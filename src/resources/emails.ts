import type { AADDYY } from '../client.js';

export class Emails {
  constructor(private client: AADDYY) {}

  async write(params: {
    purpose: string;
    tone?: string;
    recipientType?: string;
    length?: string;
  }) {
    return this.client._request('POST', '/ai/email-writer', params);
  }

  async jobEmail(params: {
    jobTitle: string;
    companyName: string;
    emailType?: string;
    tone?: string;
    skills?: string[];
  }) {
    return this.client._request('POST', '/ai/job-email-creator', params);
  }
}
