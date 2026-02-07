'use client';

const statusStyles: Record<string, string> = {
  DRAFT: 'badge-draft',
  QUOTATION: 'badge-quotation',
  CONFIRMED: 'badge-confirmed',
  ACTIVE: 'badge-active',
  PAID: 'badge-paid',
  CLOSED: 'badge-closed',
  CANCELLED: 'badge-cancelled',
};

export default function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] || 'badge-draft';
  return <span className={style}>{status.replace('_', ' ')}</span>;
}
