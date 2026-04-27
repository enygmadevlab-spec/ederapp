"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import {
  CalendarDays,
  CheckCircle2,
  Clipboard,
  Copy,
  Edit3,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  NotebookPen,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRoundPlus,
  X,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { AgendaClient, AgendaClientStatus } from '@/types';
import { getSegmentLabel, normalizeBusinessSegment } from '@/lib/businessSegments';

type AgendaFormData = Omit<AgendaClient, 'id' | 'createdAt' | 'updatedAt'>;

const STATUS_META: Array<{
  value: AgendaClientStatus;
  label: string;
  shortLabel: string;
  badgeClassName: string;
}> = [
  {
    value: 'novo',
    label: 'Novo lead',
    shortLabel: 'Novo',
    badgeClassName: 'bg-sky-600/15 text-sky-300 border-sky-500/30',
  },
  {
    value: 'em_contato',
    label: 'Em contato',
    shortLabel: 'Contato',
    badgeClassName: 'bg-cyan-600/15 text-cyan-300 border-cyan-500/30',
  },
  {
    value: 'aguardando',
    label: 'Aguardando',
    shortLabel: 'Aguard.',
    badgeClassName: 'bg-amber-600/15 text-amber-300 border-amber-500/30',
  },
  {
    value: 'convertido',
    label: 'Convertido',
    shortLabel: 'Fechado',
    badgeClassName: 'bg-emerald-600/15 text-emerald-300 border-emerald-500/30',
  },
  {
    value: 'pausado',
    label: 'Pausado',
    shortLabel: 'Pausado',
    badgeClassName: 'bg-slate-600/15 text-slate-300 border-slate-500/30',
  },
];

const EMPTY_FORM: AgendaFormData = {
  name: '',
  phone: '',
  email: '',
  document: '',
  city: '',
  source: '',
  serviceInterest: '',
  segmentInterest: 'nautica',
  status: 'novo',
  scheduledFor: '',
  notes: '',
};

function getStatusMeta(status: AgendaClientStatus) {
  return STATUS_META.find((item) => item.value === status) || STATUS_META[0];
}

function normalizeAgendaRecord(payload: Partial<AgendaClient> & { id: string }): AgendaClient {
  return {
    id: payload.id,
    name: payload.name || '',
    phone: payload.phone || '',
    email: payload.email || '',
    document: payload.document || '',
    city: payload.city || '',
    source: payload.source || '',
    serviceInterest: payload.serviceInterest || '',
    segmentInterest:
      payload.segmentInterest === 'ambos'
        ? 'ambos'
        : normalizeBusinessSegment(payload.segmentInterest),
    status:
      typeof payload.status === 'string' &&
      STATUS_META.some((item) => item.value === payload.status)
        ? payload.status
        : 'novo',
    scheduledFor: payload.scheduledFor || '',
    notes: payload.notes || '',
    createdAt: payload.createdAt || new Date(0).toISOString(),
    updatedAt: payload.updatedAt || payload.createdAt || new Date(0).toISOString(),
  };
}

function toDateValue(value?: string) {
  return value ? new Date(value) : null;
}

function formatDateTime(value?: string) {
  const date = toDateValue(value);
  if (!date || Number.isNaN(date.getTime())) return 'Sem data definida';

  return date.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function getWhatsAppHref(phone: string, message: string) {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function getSegmentInterestLabel(segment?: AgendaClient['segmentInterest']) {
  if (segment === 'ambos') return 'Náutica + Docs PVC';
  return getSegmentLabel(segment);
}

function buildClientSummary(client: AgendaClient) {
  return [
    `Cliente: ${client.name || 'Não informado'}`,
    `Telefone: ${client.phone || 'Não informado'}`,
    `Email: ${client.email || 'Não informado'}`,
    `Documento: ${client.document || 'Não informado'}`,
    `Cidade: ${client.city || 'Não informado'}`,
    `Origem: ${client.source || 'Não informada'}`,
    `Interesse: ${client.serviceInterest || 'Não informado'}`,
    `Área: ${getSegmentInterestLabel(client.segmentInterest)}`,
    `Status: ${getStatusMeta(client.status).label}`,
    `Próxima ação: ${formatDateTime(client.scheduledFor)}`,
    `Observações: ${client.notes || 'Sem observações'}`,
  ].join('\n');
}

function buildFollowUpMessage(client: AgendaClient) {
  const firstName = client.name.trim().split(' ')[0] || 'tudo bem';
  const segmentLabel =
    client.segmentInterest === 'ambos'
      ? 'documentação náutica e docs PVC'
      : getSegmentLabel(client.segmentInterest);

  return [
    `Olá, ${firstName}! Aqui é da equipe Eder Martins.`,
    `Estou retomando seu atendimento sobre ${client.serviceInterest || segmentLabel}.`,
    client.scheduledFor
      ? `Deixamos um retorno previsto para ${formatDateTime(client.scheduledFor)}.`
      : 'Podemos avançar com os próximos passos quando for melhor para você.',
    'Se preferir, já posso te orientar sobre os documentos e o andamento.',
  ].join(' ');
}

function SmallStatusBadge({ status }: { status: AgendaClientStatus }) {
  const statusMeta = getStatusMeta(status);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold leading-none ${statusMeta.badgeClassName}`}
      title={statusMeta.label}
    >
      {statusMeta.shortLabel}
    </span>
  );
}

function ActionIconButton({
  children,
  title,
  className,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${className || 'border-slate-600 bg-white/5 text-slate-300 hover:border-slate-500 hover:text-white'}`}
    >
      {children}
    </button>
  );
}

export function AdminAgendaTab({
  onCreateService,
}: {
  onCreateService?: (client: AgendaClient) => void;
}) {
  const [clients, setClients] = useState<AgendaClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AgendaClientStatus>('all');
  const [formData, setFormData] = useState<AgendaFormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'adminAgenda'),
      (snapshot) => {
        const records = snapshot.docs.map((item) =>
          normalizeAgendaRecord({
            id: item.id,
            ...(item.data() as Partial<AgendaClient>),
          })
        );
        setClients(records);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao carregar agenda do admin:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const previousOverflow = document.body.style.overflow;

    if (isFormOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFormOpen]);

  const filteredClients = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();

    return clients
      .filter((client) => statusFilter === 'all' || client.status === statusFilter)
      .filter((client) => {
        if (!normalizedQuery) return true;

        return [
          client.name,
          client.phone,
          client.email,
          client.document,
          client.city,
          client.source,
          client.serviceInterest,
          client.notes,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((left, right) => {
        const leftScheduled = toDateValue(left.scheduledFor)?.getTime() || Number.MAX_SAFE_INTEGER;
        const rightScheduled = toDateValue(right.scheduledFor)?.getTime() || Number.MAX_SAFE_INTEGER;

        if (leftScheduled !== rightScheduled) {
          return leftScheduled - rightScheduled;
        }

        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      });
  }, [clients, search, statusFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);

    return {
      total: clients.length,
      open: clients.filter((client) => client.status !== 'convertido').length,
      converted: clients.filter((client) => client.status === 'convertido').length,
      dueToday: clients.filter((client) => client.scheduledFor?.slice(0, 10) === todayIso).length,
    };
  }, [clients]);

  const upcomingClients = useMemo(
    () => filteredClients.filter((client) => client.scheduledFor).slice(0, 4),
    [filteredClients]
  );

  const previewClient = useMemo(
    () =>
      normalizeAgendaRecord({
        id: editingId || 'preview',
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    [editingId, formData]
  );

  const summaryRows = useMemo(
    () => [
      { label: 'Cliente', value: previewClient.name || 'Não informado' },
      { label: 'Contato', value: previewClient.phone || previewClient.email || 'Não informado' },
      { label: 'Documento', value: previewClient.document || 'Não informado' },
      { label: 'Cidade', value: previewClient.city || 'Não informada' },
      { label: 'Área', value: getSegmentInterestLabel(previewClient.segmentInterest) },
      { label: 'Serviço', value: previewClient.serviceInterest || 'Não informado' },
      { label: 'Status', value: getStatusMeta(previewClient.status).label },
      { label: 'Retorno', value: formatDateTime(previewClient.scheduledFor) },
    ],
    [previewClient]
  );

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    resetForm();
  };

  const openCreateModal = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleCopy = async (text: string, key: string) => {
    if (!text || !navigator?.clipboard) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((currentKey) => (currentKey === key ? null : currentKey));
      }, 1800);
    } catch (error) {
      console.error('Erro ao copiar texto:', error);
    }
  };

  const handleSave = async () => {
    if (!db) return;

    if (!formData.name.trim()) {
      alert('Informe o nome do cliente.');
      return;
    }

    if (!formData.phone.trim() && !formData.email.trim()) {
      alert('Preencha ao menos telefone ou email para contato.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...formData,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        document: formData.document?.trim() || '',
        city: formData.city?.trim() || '',
        source: formData.source?.trim() || '',
        serviceInterest: formData.serviceInterest?.trim() || '',
        notes: formData.notes?.trim() || '',
        scheduledFor: formData.scheduledFor || '',
        updatedAt: new Date().toISOString(),
      };

      if (editingId) {
        await setDoc(doc(db, 'adminAgenda', editingId), payload, { merge: true });
      } else {
        await addDoc(collection(db, 'adminAgenda'), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
      }

      closeFormModal();
    } catch (error) {
      console.error('Erro ao salvar cadastro da agenda:', error);
      alert('Não foi possível salvar o cadastro da agenda.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (client: AgendaClient) => {
    setEditingId(client.id);
    setFormData({
      name: client.name,
      phone: client.phone,
      email: client.email,
      document: client.document || '',
      city: client.city || '',
      source: client.source || '',
      serviceInterest: client.serviceInterest || '',
      segmentInterest: client.segmentInterest || 'nautica',
      status: client.status,
      scheduledFor: client.scheduledFor || '',
      notes: client.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    if (!confirm('Deseja remover este cadastro da agenda?')) return;

    try {
      setDeletingId(id);
      await deleteDoc(doc(db, 'adminAgenda', id));

      if (editingId === id) {
        closeFormModal();
      }
    } catch (error) {
      console.error('Erro ao remover cadastro da agenda:', error);
      alert('Não foi possível remover o cadastro.');
    } finally {
      setDeletingId(null);
    }
  };

  const renderActions = (client: AgendaClient) => {
    const summaryText = buildClientSummary(client);
    const followUpMessage = buildFollowUpMessage(client);
    const whatsappHref = getWhatsAppHref(client.phone, followUpMessage);

    return (
      <div className="flex flex-wrap items-center gap-2">
        <ActionIconButton
          title={copiedKey === `${client.id}-summary` ? 'Ficha copiada' : 'Copiar ficha'}
          onClick={() => handleCopy(summaryText, `${client.id}-summary`)}
        >
          <Copy className="h-4 w-4" />
        </ActionIconButton>

        <ActionIconButton
          title={copiedKey === `${client.id}-contact` ? 'Contato copiado' : 'Copiar contato'}
          onClick={() =>
            handleCopy(
              [client.name, client.phone, client.email].filter(Boolean).join(' | '),
              `${client.id}-contact`
            )
          }
        >
          <Clipboard className="h-4 w-4" />
        </ActionIconButton>

        <ActionIconButton
          title={copiedKey === `${client.id}-message` ? 'Mensagem copiada' : 'Copiar mensagem'}
          className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:border-cyan-400/40 hover:bg-cyan-500/15"
          onClick={() => handleCopy(followUpMessage, `${client.id}-message`)}
        >
          <MessageCircle className="h-4 w-4" />
        </ActionIconButton>

        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir WhatsApp"
            aria-label="Abrir WhatsApp"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white transition-colors hover:bg-emerald-500"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}

        {onCreateService && (
          <ActionIconButton
            title="Criar servico"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400/40 hover:bg-emerald-500/15"
            onClick={() => onCreateService(client)}
          >
            <FileText className="h-4 w-4" />
          </ActionIconButton>
        )}

        <ActionIconButton
          title="Editar cadastro"
          className="border-sky-500/30 bg-sky-500/10 text-sky-200 hover:border-sky-400/40 hover:bg-sky-500/15"
          onClick={() => handleEdit(client)}
        >
          <Edit3 className="h-4 w-4" />
        </ActionIconButton>

        <ActionIconButton
          title="Remover cadastro"
          disabled={deletingId === client.id}
          className="border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
          onClick={() => handleDelete(client.id)}
        >
          {deletingId === client.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </ActionIconButton>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="glass-panel rounded-2xl border border-sky-500/20 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Cadastros</p>
          <p className="mt-3 text-3xl font-black text-white">{stats.total}</p>
          <p className="mt-2 text-sm text-slate-400">Base total de clientes e leads.</p>
        </div>
        <div className="glass-panel rounded-2xl border border-cyan-500/20 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Em aberto</p>
          <p className="mt-3 text-3xl font-black text-cyan-300">{stats.open}</p>
          <p className="mt-2 text-sm text-slate-400">Atendimentos ainda em andamento.</p>
        </div>
        <div className="glass-panel rounded-2xl border border-emerald-500/20 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Convertidos</p>
          <p className="mt-3 text-3xl font-black text-emerald-300">{stats.converted}</p>
          <p className="mt-2 text-sm text-slate-400">Clientes já fechados no fluxo.</p>
        </div>
        <div className="glass-panel rounded-2xl border border-amber-500/20 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Retornos Hoje</p>
          <p className="mt-3 text-3xl font-black text-amber-300">{stats.dueToday}</p>
          <p className="mt-2 text-sm text-slate-400">Compromissos previstos para hoje.</p>
        </div>
      </div>

      <section className="glass-panel rounded-2xl border border-sky-500/20 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">Agenda de Clientes</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Organize leads e clientes em uma fila simples de operação. Os cadastros ficam em linhas
              e colunas no desktop, com atalhos rápidos para copiar ficha, contato e mensagem.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente, contato ou nota..."
                className="w-full rounded-xl border border-sky-500/20 bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              title="Novo cliente"
              aria-label="Novo cliente"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-[0_12px_30px_rgba(14,165,233,0.30)] transition-transform hover:scale-105"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'border-sky-400/40 bg-sky-500/10 text-sky-200'
                : 'border-slate-600 bg-white/5 text-slate-300 hover:border-slate-500 hover:text-white'
            }`}
          >
            Todos
          </button>
          {STATUS_META.map((status) => (
            <button
              key={status.value}
              type="button"
              onClick={() => setStatusFilter(status.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === status.value
                  ? status.badgeClassName
                  : 'border-slate-600 bg-white/5 text-slate-300 hover:border-slate-500 hover:text-white'
              }`}
            >
              {status.shortLabel}
            </button>
          ))}
        </div>

        {upcomingClients.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {upcomingClients.map((client) => (
              <div
                key={`upcoming-${client.id}`}
                className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-semibold text-white">{client.name}</p>
                  <SmallStatusBadge status={client.status} />
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  {client.serviceInterest || 'Atendimento geral'}
                </p>
                <p className="mt-1 flex items-center gap-2 text-xs text-cyan-200">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDateTime(client.scheduledFor)}
                </p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-sky-500/20 p-10 text-center">
            <p className="text-lg font-semibold text-white">Nenhum cadastro encontrado</p>
            <p className="mt-2 text-sm text-slate-400">
              Clique no botão `+` para criar o primeiro cliente da agenda.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mx-auto mt-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-sky-600 to-cyan-500 text-white"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <>
            <div className="mt-6 hidden xl:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1160px] border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-[0.24em] text-slate-500">
                      <th className="px-4 py-2">Cliente</th>
                      <th className="px-4 py-2">Contato</th>
                      <th className="px-4 py-2">Área / Serviço</th>
                      <th className="px-4 py-2">Origem / Cidade</th>
                      <th className="px-4 py-2">Retorno</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => (
                      <tr key={client.id}>
                        <td className="rounded-l-2xl border-y border-l border-sky-500/20 bg-white/5 px-4 py-4 align-top">
                          <p className="font-semibold text-white">{client.name}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {client.document || 'Sem documento'}
                          </p>
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                            {client.notes || 'Sem observações registradas.'}
                          </p>
                        </td>
                        <td className="border-y border-sky-500/20 bg-white/5 px-4 py-4 align-top">
                          <div className="space-y-2 text-sm text-slate-300">
                            <p className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-sky-300" />
                              <span>{client.phone || 'Não informado'}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-sky-300" />
                              <span className="truncate">{client.email || 'Não informado'}</span>
                            </p>
                          </div>
                        </td>
                        <td className="border-y border-sky-500/20 bg-white/5 px-4 py-4 align-top">
                          <p className="text-sm font-semibold text-white">
                            {client.serviceInterest || 'Sem serviço definido'}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-cyan-300">
                            {getSegmentInterestLabel(client.segmentInterest)}
                          </p>
                        </td>
                        <td className="border-y border-sky-500/20 bg-white/5 px-4 py-4 align-top">
                          <p className="text-sm text-white">{client.source || 'Origem não informada'}</p>
                          <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                            <MapPin className="h-4 w-4 text-sky-300" />
                            <span>{client.city || 'Cidade não informada'}</span>
                          </p>
                        </td>
                        <td className="border-y border-sky-500/20 bg-white/5 px-4 py-4 align-top text-sm text-slate-300">
                          {formatDateTime(client.scheduledFor)}
                        </td>
                        <td className="border-y border-sky-500/20 bg-white/5 px-4 py-4 align-top">
                          <SmallStatusBadge status={client.status} />
                        </td>
                        <td className="rounded-r-2xl border-y border-r border-sky-500/20 bg-white/5 px-4 py-4 align-top">
                          {renderActions(client)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 space-y-3 xl:hidden">
              {filteredClients.map((client) => (
                <article
                  key={client.id}
                  className="rounded-2xl border border-sky-500/20 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="truncate text-lg font-bold text-white">{client.name}</h4>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-cyan-300">
                        {getSegmentInterestLabel(client.segmentInterest)}
                      </p>
                    </div>
                    <SmallStatusBadge status={client.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-300 sm:grid-cols-2">
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-sky-300" />
                      <span>{client.phone || 'Não informado'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-sky-300" />
                      <span className="truncate">{client.email || 'Não informado'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-sky-300" />
                      <span>{client.city || 'Cidade não informada'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-sky-300" />
                      <span>{formatDateTime(client.scheduledFor)}</span>
                    </p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-[#020c1b]/45 p-3">
                    <p className="text-sm font-semibold text-white">
                      {client.serviceInterest || 'Sem serviço definido'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {client.source || 'Origem não informada'} • {client.document || 'Sem documento'}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {client.notes || 'Sem observações registradas.'}
                    </p>
                  </div>

                  <div className="mt-4">{renderActions(client)}</div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          onClick={closeFormModal}
        >
          <div
            className="glass-panel max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[28px] border border-sky-500/20"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-sky-500/20 bg-[#020c1b]/95 px-6 py-5 backdrop-blur">
              <div>
                <h3 className="flex items-center gap-2 text-2xl font-bold text-white">
                  <UserRoundPlus className="h-5 w-5 text-sky-300" />
                  {editingId ? 'Editar cliente' : 'Novo cliente'}
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  Cadastro em janela flutuante para preencher, revisar e salvar sem sair da agenda.
                </p>
              </div>
              <button
                type="button"
                onClick={closeFormModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-600 bg-white/5 text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
              <div className="space-y-6">
                <div className="rounded-2xl border border-sky-500/20 bg-white/5 p-5">
                  <h4 className="text-lg font-bold text-white">1. Contato principal</h4>
                  <p className="mt-2 text-sm text-slate-400">
                    Primeiro identifique o cliente e o melhor canal de retorno.
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Nome do cliente</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Ex: Marina Oliveira"
                        className="w-full rounded-xl border border-sky-500/20 bg-[#020c1b]/55 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Telefone / WhatsApp</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))}
                        placeholder="Ex: 48999999999"
                        className="w-full rounded-xl border border-sky-500/20 bg-[#020c1b]/55 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                        placeholder="cliente@email.com"
                        className="w-full rounded-xl border border-sky-500/20 bg-[#020c1b]/55 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">CPF / CNPJ / Documento</label>
                      <input
                        type="text"
                        value={formData.document}
                        onChange={(event) => setFormData((current) => ({ ...current, document: event.target.value }))}
                        placeholder="Documento para referência"
                        className="w-full rounded-xl border border-sky-500/20 bg-[#020c1b]/55 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-500/20 bg-white/5 p-5">
                  <h4 className="text-lg font-bold text-white">2. Interesse e origem</h4>
                  <p className="mt-2 text-sm text-slate-400">
                    Defina de onde veio o lead, qual frente do app ele quer e o serviço principal.
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Cidade / UF</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(event) => setFormData((current) => ({ ...current, city: event.target.value }))}
                        placeholder="Ex: Florianópolis - SC"
                        className="w-full rounded-xl border border-sky-500/20 bg-[#020c1b]/55 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Origem do lead</label>
                      <input
                        type="text"
                        value={formData.source}
                        onChange={(event) => setFormData((current) => ({ ...current, source: event.target.value }))}
                        placeholder="Ex: Instagram, indicação, site"
                        className="w-full rounded-xl border border-sky-500/20 bg-[#020c1b]/55 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Área de interesse</label>
                      <select
                        value={formData.segmentInterest}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            segmentInterest: event.target.value as AgendaFormData['segmentInterest'],
                          }))
                        }
                        className="w-full rounded-xl border border-sky-500/20 bg-[#020c1b]/55 px-4 py-3 text-white focus:border-sky-400 focus:outline-none"
                      >
                        <option value="nautica">Assessoria Náutica</option>
                        <option value="docs">Docs PVC</option>
                        <option value="ambos">Ambos</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Serviço de interesse</label>
                      <input
                        type="text"
                        value={formData.serviceInterest}
                        onChange={(event) =>
                          setFormData((current) => ({ ...current, serviceInterest: event.target.value }))
                        }
                        placeholder="Ex: Transferência, CRLV PVC, habilitação"
                        className="w-full rounded-xl border border-sky-500/20 bg-[#020c1b]/55 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-500/20 bg-white/5 p-5">
                  <h4 className="text-lg font-bold text-white">3. Situação e próxima ação</h4>
                  <p className="mt-2 text-sm text-slate-400">
                    Marque o status interno, programe o retorno e anote o contexto do atendimento.
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Status</label>
                      <select
                        value={formData.status}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            status: event.target.value as AgendaClientStatus,
                          }))
                        }
                        className="w-full rounded-xl border border-sky-500/20 bg-[#020c1b]/55 px-4 py-3 text-white focus:border-sky-400 focus:outline-none"
                      >
                        {STATUS_META.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Próximo retorno</label>
                      <input
                        type="datetime-local"
                        value={formData.scheduledFor}
                        onChange={(event) =>
                          setFormData((current) => ({ ...current, scheduledFor: event.target.value }))
                        }
                        className="w-full rounded-xl border border-sky-500/20 bg-[#020c1b]/55 px-4 py-3 text-white focus:border-sky-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-slate-300">Observações</label>
                    <textarea
                      value={formData.notes}
                      onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
                      placeholder="Anote documentos pendentes, objeções, combinado com o cliente e próximos passos."
                      className="min-h-[150px] w-full rounded-2xl border border-sky-500/20 bg-[#020c1b]/55 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <aside className="space-y-5">
                <div className="rounded-2xl border border-emerald-500/20 bg-white/5 p-5">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <h4 className="text-lg font-bold text-white">Prévia em colunas</h4>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Esta prévia mostra como o cliente vai aparecer na agenda após salvar.
                  </p>

                  <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#020c1b]/50">
                    {summaryRows.map((row) => (
                      <div
                        key={row.label}
                        className="grid grid-cols-[104px_minmax(0,1fr)] gap-3 border-b border-white/5 px-4 py-3 text-sm last:border-b-0"
                      >
                        <span className="font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {row.label}
                        </span>
                        <span className="min-w-0 break-words text-slate-200">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => handleCopy(buildClientSummary(previewClient), 'preview')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
                    >
                      <Clipboard className="h-4 w-4" />
                      {copiedKey === 'preview' ? 'Ficha copiada' : 'Copiar ficha do cadastro'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(buildFollowUpMessage(previewClient), 'preview-message')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {copiedKey === 'preview-message' ? 'Mensagem copiada' : 'Copiar mensagem pronta'}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-sky-500/20 bg-white/5 p-5">
                  <div className="flex items-center gap-2 text-sky-300">
                    <NotebookPen className="h-4 w-4" />
                    <h4 className="text-lg font-bold text-white">Fluxo sugerido</h4>
                  </div>
                  <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                    <p>1. Cadastre nome e contato principal.</p>
                    <p>2. Marque a frente do app e o serviço que o cliente quer.</p>
                    <p>3. Defina status e próximo retorno antes de salvar.</p>
                    <p>4. Use a mensagem pronta para continuar o atendimento sem reescrever.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-sky-500/20 bg-white/5 p-5">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-5 py-3 font-bold text-white transition-all hover:from-sky-500 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRoundPlus className="h-4 w-4" />}
                    {editingId ? 'Salvar alterações' : 'Cadastrar cliente'}
                  </button>

                  <button
                    type="button"
                    onClick={closeFormModal}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 px-5 py-3 font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
