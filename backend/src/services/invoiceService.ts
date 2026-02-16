/**
 * Auto PDF invoice generation for approved payments.
 * Generates a buffer for email attachment; optionally can be saved to disk for download.
 */

import PDFDocument from 'pdfkit';
import type { PrismaClient } from '@prisma/client';

const PLATFORM_NAME = 'RiseFlow Hub';

export interface ManualPaymentWithUser {
  id: string;
  amount: number | { toString(): string };
  currency: string;
  paymentType: string;
  status: string;
  submittedAt: Date;
  confirmedAt: Date | null;
  user: { name: string; email: string };
}

/** Generate PDF invoice for a manual payment (confirmed). Returns buffer and suggested filename. */
export async function generateInvoicePDF(
  payment: ManualPaymentWithUser
): Promise<{ buffer: Buffer; fileName: string }> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve({ buffer: Buffer.concat(chunks), fileName: `invoice_${payment.id}.pdf` }));
    doc.on('error', reject);

    const dateStr = payment.confirmedAt
      ? new Date(payment.confirmedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    doc.fontSize(20).text(PLATFORM_NAME, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text('Payment Invoice', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(14).text(`Invoice #${payment.id.slice(0, 8).toUpperCase()}`, { continued: false });
    doc.fontSize(10).text(`Date: ${dateStr}`);
    doc.moveDown(1);

    doc.text(`Bill to: ${payment.user.name}`);
    doc.text(`Email: ${payment.user.email}`);
    doc.moveDown(1);

  const amountNum = typeof payment.amount === 'number' ? payment.amount : Number(String(payment.amount));
  doc.fontSize(12).text('Amount paid', { underline: true });
  doc.fontSize(10).text(`${amountNum.toLocaleString()} ${payment.currency}`);
    doc.text(`Payment type: ${payment.paymentType === 'platform_fee' ? 'Platform setup fee' : payment.paymentType}`);
    doc.text(`Status: ${payment.status}`);
    doc.moveDown(1.5);

    doc.fontSize(10).text('Thank you for supporting RiseFlow Hub. This document serves as your payment receipt.', {
      align: 'center',
    });
    doc.end();
  });
}

/** Load manual payment with user and generate invoice. Used after approval. */
export async function generateInvoiceForPayment(
  prisma: PrismaClient,
  paymentId: string
): Promise<{ buffer: Buffer; fileName: string } | null> {
  const payment = await prisma.manualPayment.findUnique({
    where: { id: paymentId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!payment || payment.status !== 'Confirmed') return null;
  return generateInvoicePDF(payment as ManualPaymentWithUser);
}
