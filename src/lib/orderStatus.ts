import type { Order } from '@/types';

export type OrderStatus = Order['status'];

type OrderStatusMeta = {
  label: string;
  badgeClassName: string;
};

const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  pending_docs: {
    label: 'Documentos em analise',
    badgeClassName: 'bg-amber-500/15 text-amber-200 border-amber-400/30',
  },
  pending_payment: {
    label: 'Aguardando pagamento',
    badgeClassName: 'bg-[#dbe7f6] text-[#173a63] border-[#9bb6d6]',
  },
  processing: {
    label: 'Em processamento',
    badgeClassName: 'bg-sky-500/15 text-sky-200 border-sky-400/30',
  },
  paid: {
    label: 'Pagamento aprovado',
    badgeClassName: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/30',
  },
  completed: {
    label: 'Pedido concluido',
    badgeClassName: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30',
  },
  rejected: {
    label: 'Com pendencia',
    badgeClassName: 'bg-rose-500/15 text-rose-200 border-rose-400/30',
  },
  failed: {
    label: 'Falha no pedido',
    badgeClassName: 'bg-slate-500/15 text-slate-200 border-slate-400/30',
  },
};

const FALLBACK_STATUS_META: OrderStatusMeta = {
  label: 'Status indefinido',
  badgeClassName: 'bg-slate-500/15 text-slate-200 border-slate-400/30',
};

export const CLIENT_ORDER_FLOW: OrderStatus[] = ['pending_payment', 'pending_docs', 'processing', 'paid', 'completed'];

export function getOrderStatusMeta(status: string): OrderStatusMeta {
  return ORDER_STATUS_META[status as OrderStatus] ?? FALLBACK_STATUS_META;
}

export function getOrderStatusLabel(status: string): string {
  return getOrderStatusMeta(status).label;
}

export function getOrderStatusBadgeClasses(status: string): string {
  return getOrderStatusMeta(status).badgeClassName;
}
