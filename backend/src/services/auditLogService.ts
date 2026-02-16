/**
 * Platform-wide audit log for Super Admin visibility.
 * Call from controllers for key actions: login, idea_submitted, setup_skipped, agreement_signed, consultation_booked, investor_interest.
 */

import { PrismaClient } from '@prisma/client';

export type AuditActionType =
  | 'login'
  | 'idea_submitted'
  | 'setup_skipped'
  | 'setup_paid'
  | 'agreement_signed'
  | 'agreement_viewed'
  | 'consultation_booked'
  | 'investor_interest'
  | 'payment_completed'
  | 'payment_reported'
  | 'payment_approved'
  | 'payment_rejected'
  | 'invoice_generated'
  | 'tax_export_downloaded'
  | 'invoice_generated'
  | 'tax_export_downloaded'
  | 'project_created'
  | 'startup_published'
  | 'talent_applied'
  | 'talent_approval'
  | 'hirer_registered'
  | 'fair_treatment_signed'
  | 'hire_requested'
  | 'hire_agreement_created'
  | 'marketplace_fee_paid';

export type AuditEntityType =
  | 'user'
  | 'payment'
  | 'agreement'
  | 'project'
  | 'idea'
  | 'consultation'
  | 'investment'
  | 'startup'
  | 'talent'
  | 'hirer'
  | 'hire'
  | 'settings';

export interface CreateAuditLogParams {
  adminId?: string | null;
  actionType: string;
  entityType: AuditEntityType;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
}

/** Create an audit log entry. Fire-and-forget; does not throw. */
export async function createAuditLog(
  prisma: PrismaClient,
  params: CreateAuditLogParams
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: params.adminId ?? null,
        actionType: params.actionType,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        details: (params.details ?? undefined) as import('@prisma/client').Prisma.InputJsonValue | undefined,
      },
    });
  } catch (e) {
    console.error('[AuditLog] create failed:', e);
  }
}
