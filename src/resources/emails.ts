import type { AADDYY } from '../client.js';
import { omit, rename, toBody } from '../params.js';

export type EmailType =
  | 'business' | 'sales_outreach' | 'marketing' | 'newsletter' | 'customer_support' | 'follow_up'
  | 'networking' | 'job_application' | 'personal' | 'announcement' | 'apology';
export type EmailRecipientRole = 'client' | 'manager' | 'hr' | 'colleague' | 'friend' | 'prospect' | 'customer';
export type EmailRecipientRelationship = 'new_contact' | 'existing_client' | 'internal' | 'personal';
export type EmailGoal =
  | 'get_reply' | 'schedule_meeting' | 'share_information' | 'persuade_sell' | 'apologize' | 'announce';
export type EmailTone =
  | 'formal' | 'semi_formal' | 'friendly' | 'persuasive' | 'polite'
  | 'enthusiastic' | 'confident' | 'empathetic' | 'direct';
export type EmailWritingStyle = 'standard' | 'professional' | 'conversational' | 'marketing' | 'storytelling';
export type EmailLanguage = 'english' | 'spanish' | 'french' | 'german' | 'hindi' | 'portuguese' | 'italian';

export type JobEmailType =
  | 'job_application' | 'follow_up' | 'interview_scheduling' | 'interview_thank_you'
  | 'job_inquiry' | 'offer_negotiation' | 'rejection_response' | 'generic_professional';
export type JobEmailTone = 'formal' | 'neutral' | 'friendly' | 'enthusiastic' | 'confident' | 'humble';
export type JobEmailLanguage = 'English' | 'Spanish' | 'French' | 'German' | 'Hindi' | 'Arabic' | 'Chinese';

/** POST /api/ai/email-writer */
export interface EmailParams {
  emailType: EmailType;
  /** What the email is about (10-500 characters). */
  topic: string;
  /** Up to 100 characters. */
  recipientName?: string;
  recipientRole?: EmailRecipientRole;
  recipientRelationship?: EmailRecipientRelationship;
  goal?: EmailGoal;
  tone?: EmailTone;
  length?: 'short' | 'medium' | 'detailed';
  writingStyle?: EmailWritingStyle;
  /** The call to action (up to 200 characters). */
  cta?: string;
  /** Up to 10 keywords. */
  keywords?: string[];
  personalizationTags?: Record<string, string>;
  language?: EmailLanguage;
  signature?: { name?: string; title?: string; company?: string; contact?: string };
  generateSubjectLine?: boolean;
  previewFormat?: 'plain_text' | 'html';
  /** How many versions to write (1-5). Each extra version is billed. */
  versionCount?: number;
  /** @deprecated Use `recipientRole`. */
  recipientType?: string;
}

/** The 1.0.2 parameter names for `emails.write()`. */
export interface LegacyEmailParams extends Omit<EmailParams, 'topic'> {
  /** @deprecated Use `topic`. */
  purpose: string;
}

/** POST /api/ai/job-email-creator */
export interface JobEmailParams {
  emailType: JobEmailType;
  /** The job title (2-200 characters). */
  jobTitle: string;
  /** 2-200 characters. */
  companyName: string;
  /** Your full name (2-100 characters). */
  userName: string;
  /** Up to 100 characters. */
  recipientName?: string;
  /** Your current role (up to 200 characters). */
  userRole?: string;
  /** Up to 500 characters. */
  portfolioUrl?: string;
  /** Anything else the email should say, such as your key skills (up to 1000 characters). */
  customContext?: string;
  tone?: JobEmailTone;
  /** 1 (casual) to 5 (very formal). */
  formalityLevel?: number;
  emailLength?: 'short' | 'medium' | 'long';
  language?: JobEmailLanguage;
  outputFormat?: 'text_only' | 'text_with_subject' | 'html_template';
  includeSignature?: boolean;
  /** How many variations to write (1-5). Each extra variation is billed. */
  variations?: number;
  /**
   * @deprecated The API does not read it, so the SDK does not send it.
   * Put your skills in `customContext`.
   */
  skills?: string[];
}

export class Emails {
  constructor(private client: AADDYY) {}

  /** Write an email. V1: resolves to the response's `data`. */
  async write(params: EmailParams | LegacyEmailParams) {
    const body = toBody(params);
    rename(body, 'purpose', 'topic');
    rename(body, 'recipientType', 'recipientRole');
    return this.client._request('POST', '/ai/email-writer', body);
  }

  /** Write a job-search email (application, follow-up, thank-you, ...). V1. */
  async jobEmail(params: JobEmailParams) {
    const body = toBody(params);
    omit(body, 'skills');
    return this.client._request('POST', '/ai/job-email-creator', body);
  }
}
