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
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  NotebookPen,
  Phone,
  Search,
  Trash2,
  UserRoundPlus,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { AgendaClient, AgendaClientStatus } from '@/types';
import { getSegmentLabel, normalizeBusinessSegment } from '@/lib/businessSegments';

type AgendaFormData = Omit<AgendaClient, 'id' | 'createdAt' | 'updatedAt'>;

const STATUS_META: Array<{
  value: AgendaClientStatus;
  label: string;
  badgeClassName: string;
}> = [
  {
    value: 'novo',
    label: 'Novo lead',
    badgeClassName: 'bg-sky-600/20 text-sky-300 border-sky-500/30',
  },
  {
    value: 'em_contato',
    label: 'Em contato',
    badgeClassName: 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30',
  },
  {
    value: 'aguardando',
    label: 'Aguardando',
    badgeClassName: 'bg-amber-600/20 text-amber-300 border-amber-500/30',
  },
  {
    value: 'convertido',
    label: 'Convertido',
    badgeClassName: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30',
  },
  {
    value: 'pausado',
    label: 'Pausado',
    badgeClassName: 'bg-slate-600/20 text-slate-300 border-slate-500/30',
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

function buildClientSummary(client: AgendaClient) {
  return [
    `Cliente: ${client.name || 'Não informado'}`,
    `Telefone: ${client.phone || 'Não informado'}`,
    `Email: ${client.email || 'Não informado'}`,
    `Documento: ${client.document || 'Não informado'}`,
    `Cidade: ${client.city || 'Não informado'}`,
    `Origem: ${client.source || 'Não informada'}`,
    `Interesse: ${client.serviceInterest || 'Não informado'}`,
    `Área: ${
      client.segmentInterest === 'ambos'
        ? 'Náutica + Docs PVC'
        : getSegmentLabel(client.segmentInterest)
    }`,
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

export function AdminAgendaTab() {
  const [clients, setClients] = useState<AgendaClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AgendaClientStatus>('all');
  const [formData, setFormData] = useState<AgendaFormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
    () =>
      filteredClients
        .filter((client) => client.scheduledFor)
        .slice(0, 4),
    [filteredClients]
  );

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
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

      resetForm();
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
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    if (!confirm('Deseja remover este cadastro da agenda?')) return;

    try {
      setDeletingId(id);
      await deleteDoc(doc(db, 'adminAgenda', id));
      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      console.error('Erro ao remover cadastro da agenda:', error);
      alert('Não foi possível remover o cadastro.');
    } finally {
      setDeletingId(null);
    }
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.4fr)]">
        <section className="glass-panel rounded-2xl border border-sky-500/20 p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-xl font-bold text-white">
                <UserRoundPlus className="h-5 w-5 text-sky-300" />
                {editingId ? 'Editar cadastro' : 'Novo cadastro de cliente'}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Registre o contato, a área de interesse, a próxima ação e observações internas do atendimento.
              </p>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
              >
                Cancelar edição
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Nome do cliente</label>
              <input
                type="text"
                value={formData.name}
                onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ex: Marina Oliveira"
                className="w-full rounded-xl border border-sky-500/20 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Telefone / WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))}
                placeholder="Ex: 48999999999"
                className="w-full rounded-xl border border-sky-500/20 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                placeholder="cliente@email.com"
                className="w-full rounded-xl border border-sky-500/20 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">CPF / CNPJ / Documento</label>
              <input
                type="text"
                value={formData.document}
                onChange={(event) => setFormData((current) => ({ ...current, document: event.target.value }))}
                placeholder="Documento para referência"
                className="w-full rounded-xl border border-sky-500/20 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Cidade / UF</label>
              <input
                type="text"
                value={formData.city}
                onChange={(event) => setFormData((current) => ({ ...current, city: event.target.value }))}
                placeholder="Ex: Florianópolis - SC"
                className="w-full rounded-xl border border-sky-500/20 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Origem do lead</label>
              <input
                type="text"
                value={formData.source}
                onChange={(event) => setFormData((current) => ({ ...current, source: event.target.value }))}
                placeholder="Ex: Instagram, indicação, site"
                className="w-full rounded-xl border border-sky-500/20 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
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
                className="w-full rounded-xl border border-sky-500/20 bg-white/5 px-4 py-3 text-white focus:border-sky-400 focus:outline-none"
              >
                <option value="nautica">Assessoria Náutica</option>
                <option value="docs">Docs PVC</option>
                <option value="ambos">Ambos</option>
              </select>
            </div>

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
                className="w-full rounded-xl border border-sky-500/20 bg-white/5 px-4 py-3 text-white focus:border-sky-400 focus:outline-none"
              >
                {STATUS_META.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
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
                className="w-full rounded-xl border border-sky-500/20 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Próximo retorno</label>
              <input
                type="datetime-local"
                value={formData.scheduledFor}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, scheduledFor: event.target.value }))
                }
                className="w-full rounded-xl border border-sky-500/20 bg-white/5 px-4 py-3 text-white focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-slate-300">Observações</label>
            <textarea
              value={formData.notes}
              onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Anote o contexto, documentos pendentes, objeções e próximos passos."
              className="min-h-[140px] w-full rounded-2xl border border-sky-500/20 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-sky-500/20 pt-5 sm:flex-row">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-5 py-3 font-bold text-white transition-all hover:from-sky-500 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <NotebookPen className="h-4 w-4" />}
              {editingId ? 'Salvar alterações' : 'Cadastrar cliente'}
            </button>
            <button
              type="button"
              onClick={() => handleCopy(buildClientSummary(normalizeAgendaRecord({ id: 'preview', ...formData })), 'preview')}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-600 px-5 py-3 font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
            >
              <Clipboard className="h-4 w-4" />
              {copiedKey === 'preview' ? 'Ficha copiada' : 'Copiar ficha do cadastro'}
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="glass-panel rounded-2xl border border-sky-500/20 p-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Fila de atendimento</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Consulte rapidamente cada cliente, filtre por status e copie mensagens prontas.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-[220px]">
                  <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar cliente, contato, nota..."
                    className="w-full rounded-xl border border-sky-500/20 bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as 'all' | AgendaClientStatus)
                  }
                  className="rounded-xl border border-sky-500/20 bg-white/5 px-4 py-3 text-white focus:border-sky-400 focus:outline-none"
                >
                  <option value="all">Todos os status</option>
                  {STATUS_META.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {upcomingClients.length > 0 && (
              <div className="mb-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-cyan-300">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-sm font-semibold uppercase tracking-[0.2em]">Próximos retornos</span>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {upcomingClients.map((client) => (
                    <div
                      key={`upcoming-${client.id}`}
                      className="rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <p className="font-semibold text-white">{client.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{formatDateTime(client.scheduledFor)}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-cyan-300">
                        {client.serviceInterest || 'Atendimento geral'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-sky-500/20 p-10 text-center">
                <p className="text-lg font-semibold text-white">Nenhum cadastro encontrado</p>
                <p className="mt-2 text-sm text-slate-400">
                  Crie o primeiro cliente da agenda ou ajuste o filtro atual.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClients.map((client) => {
                  const summaryText = buildClientSummary(client);
                  const followUpMessage = buildFollowUpMessage(client);
                  const statusMeta = getStatusMeta(client.status);
                  const whatsappHref = getWhatsAppHref(client.phone, followUpMessage);

                  return (
                    <article
                      key={client.id}
                      className="rounded-2xl border border-sky-500/20 bg-white/5 p-5 transition-colors hover:border-sky-400/40"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <h4 className="truncate text-xl font-bold text-white">{client.name}</h4>
                              <p className="mt-1 text-sm text-slate-400">
                                {client.serviceInterest || 'Sem serviço definido'} •{' '}
                                {client.segmentInterest === 'ambos'
                                  ? 'Náutica + Docs PVC'
                                  : getSegmentLabel(client.segmentInterest)}
                              </p>
                            </div>
                            <span
                              className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.badgeClassName}`}
                            >
                              {statusMeta.label}
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-300 sm:grid-cols-2">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-sky-300" />
                              <span>{client.phone || 'Telefone não informado'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-sky-300" />
                              <span className="truncate">{client.email || 'Email não informado'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-sky-300" />
                              <span>{client.city || 'Cidade não informada'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-sky-300" />
                              <span>{formatDateTime(client.scheduledFor)}</span>
                            </div>
                          </div>

                          <div className="mt-4 rounded-2xl border border-white/10 bg-[#020c1b]/45 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Observações
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                              {client.notes || 'Sem observações registradas.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex w-full flex-col gap-2 xl:w-[240px]">
                          <button
                            type="button"
                            onClick={() => handleCopy(summaryText, `${client.id}-summary`)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
                          >
                            <Copy className="h-4 w-4" />
                            {copiedKey === `${client.id}-summary` ? 'Ficha copiada' : 'Copiar ficha'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                [client.name, client.phone, client.email].filter(Boolean).join(' | '),
                                `${client.id}-contact`
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
                          >
                            <Clipboard className="h-4 w-4" />
                            {copiedKey === `${client.id}-contact` ? 'Contato copiado' : 'Copiar contato'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(followUpMessage, `${client.id}-message`)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/15"
                          >
                            <MessageCircle className="h-4 w-4" />
                            {copiedKey === `${client.id}-message` ? 'Mensagem copiada' : 'Copiar mensagem'}
                          </button>
                          {whatsappHref && (
                            <a
                              href={whatsappHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Abrir WhatsApp
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleEdit(client)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
                          >
                            <Edit3 className="h-4 w-4" />
                            Editar cadastro
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(client.id)}
                            disabled={deletingId === client.id}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === client.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Remover
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="glass-panel rounded-2xl border border-emerald-500/20 p-6">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              <h3 className="text-lg font-bold text-white">Bloco rápido para copiar</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Use esta área para gerar um texto-padrão de atendimento com base no cadastro em edição.
            </p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-[#020c1b]/45 p-4">
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
                {buildFollowUpMessage(normalizeAgendaRecord({ id: 'preview', ...formData }))}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                handleCopy(
                  buildFollowUpMessage(normalizeAgendaRecord({ id: 'preview', ...formData })),
                  'preview-message'
                )
              }
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              <MessageCircle className="h-4 w-4" />
              {copiedKey === 'preview-message' ? 'Mensagem copiada' : 'Copiar mensagem pronta'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
