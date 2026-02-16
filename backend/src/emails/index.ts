import { welcomeEmail } from './welcomeEmail';
import { consultationBookedEmail } from './consultationBookedEmail';
import { ideaSubmissionEmail } from './ideaSubmissionEmail';
import { proposalReadyEmail } from './proposalReadyEmail';
import { agreementPendingEmail } from './agreementPendingEmail';
import { agreementSignedEmail } from './agreementSignedEmail';
import { paymentReminderEmail } from './paymentReminderEmail';
import { milestoneCompletedEmail } from './milestoneCompletedEmail';
import { projectLaunchedEmail } from './projectLaunchedEmail';
import { investorInterestEmail } from './investorInterestEmail';
import { teamInviteEmail } from './teamInviteEmail';
import { paymentConfirmationEmail } from './paymentConfirmationEmail';
import { birthdayWishEmail } from './birthdayWishEmail';
import { talentApprovalEmail } from './talentApprovalEmail';
import { interviewInviteEmail } from './interviewInviteEmail';
import { passwordResetEmail } from './passwordResetEmail';
import { securityAlertEmail } from './securityAlertEmail';
import { platformMessageForwardEmail } from './platformMessageForwardEmail';
import { paymentReceiptEmail } from './paymentReceiptEmail';

export type EmailType =
  | 'account_created'
  | 'consultation_booked'
  | 'idea_submitted'
  | 'proposal_ready'
  | 'agreement_pending'
  | 'agreement_signed'
  | 'payment_required'
  | 'milestone_completed'
  | 'project_launched'
  | 'investor_interest_received'
  | 'team_invite'
  | 'payment_confirmation'
  | 'payment_receipt'
  | 'talent_approval'
  | 'interview_invite'
  | 'password_reset'
  | 'birthday_wish'
  | 'security_alert'
  | 'platform_message_forward';

export interface EmailPayload {
  type: EmailType;
  userEmail: string;
  dynamicData?: Record<string, unknown>;
}

const TEMPLATES: Record<EmailType, (data: Record<string, unknown>) => { subject: string; html: string }> = {
  account_created: welcomeEmail,
  consultation_booked: consultationBookedEmail,
  idea_submitted: ideaSubmissionEmail,
  proposal_ready: proposalReadyEmail,
  agreement_pending: agreementPendingEmail,
  agreement_signed: agreementSignedEmail,
  payment_required: paymentReminderEmail,
  milestone_completed: milestoneCompletedEmail,
  project_launched: projectLaunchedEmail,
  investor_interest_received: investorInterestEmail,
  team_invite: teamInviteEmail,
  payment_confirmation: paymentConfirmationEmail,
  payment_receipt: paymentReceiptEmail,
  talent_approval: talentApprovalEmail,
  interview_invite: interviewInviteEmail,
  password_reset: passwordResetEmail,
  birthday_wish: birthdayWishEmail,
  security_alert: securityAlertEmail,
  platform_message_forward: platformMessageForwardEmail,
};

export function getEmailContent(type: EmailType, dynamicData: Record<string, unknown> = {}): { subject: string; html: string } {
  const fn = TEMPLATES[type];
  if (!fn) throw new Error(`Unknown email type: ${type}`);
  return fn(dynamicData);
}

export { welcomeEmail, consultationBookedEmail, ideaSubmissionEmail, proposalReadyEmail, agreementPendingEmail, agreementSignedEmail, paymentReminderEmail, milestoneCompletedEmail, projectLaunchedEmail, investorInterestEmail, teamInviteEmail, paymentConfirmationEmail, paymentReceiptEmail, talentApprovalEmail, interviewInviteEmail, passwordResetEmail, birthdayWishEmail, securityAlertEmail, platformMessageForwardEmail };
