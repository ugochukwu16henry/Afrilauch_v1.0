export interface TeamInviteData {
  inviteLink: string;
  role?: string;
  inviterName?: string;
}

export function teamInviteEmail(data: TeamInviteData & Record<string, unknown>): { subject: string; html: string } {
  const { inviteLink, role = 'team member', inviterName = 'The team' } = data as TeamInviteData;
  const subject = 'You\'re invited to join RiseFlow Hub';
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #0f172a;">You're invited to the team</h2>
      <p style="color: #475569; line-height: 1.6;">${inviterName} has invited you to join RiseFlow Hub as <strong>${role}</strong>.</p>
      <p style="color: #475569; line-height: 1.6;">Click the button below to set your password and complete your profile. This link will expire in 7 days.</p>
      <p style="margin: 24px 0;">
        <a href="${inviteLink}" style="display: inline-block; background: #0FA958; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Accept invitation</a>
      </p>
      <p style="color: #94a3b8; font-size: 14px;">If you didn't expect this invite, you can ignore this email.</p>
    </div>
  `;
  return { subject, html };
}
