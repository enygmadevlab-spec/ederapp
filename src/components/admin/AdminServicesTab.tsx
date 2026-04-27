"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import {
  Camera,
  CheckCircle2,
  FileText,
  Loader2,
  NotebookPen,
  Package,
  Search,
  Upload,
  UserRoundPlus,
  X,
} from 'lucide-react';
import { DocsAttachmentPreview } from '@/components/admin/DocsAttachmentPreview';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/lib/firebase';
import { DocumentOcrStatus, extractDocumentInsight, MarineDocumentFields } from '@/lib/docsOcr';
import {
  AgendaClient,
  AgendaClientStatus,
  BusinessSegment,
  Order,
  OrderItem,
  OrderServiceAnswer,
  Product,
} from '@/types';
import {
  getCategoryBadgeText,
  getSegmentLabel,
  normalizeBusinessSegment,
} from '@/lib/businessSegments';
import { getOrderStatusLabel } from '@/lib/orderStatus';

type ServiceStartStatus = Extract<Order['status'], 'pending_payment' | 'pending_docs' | 'processing' | 'completed'>;

type AdminServicesTabProps = {
  products: Product[];
  docsProducts: Product[];
  draftClient?: AgendaClient | null;
  onDraftClientConsumed?: () => void;
};

type AdminServiceClientForm = {
  name: string;
  phone: string;
  email: string;
  document: string;
  city: string;
  birthDate: string;
  address: string;
  source: string;
  govAccount: string;
  govPassword: string;
  notes: string;
};

type DocumentAttachmentPreview = {
  fileName: string;
  sourceUrl: string;
  previewUrl: string;
  kind: 'image' | 'pdf' | 'other';
  ocrStatus: DocumentOcrStatus;
  ocrProgress?: number;
  ocrConfidence?: number;
  ocrText?: string;
  parsedFields?: MarineDocumentFields;
  qrText?: string;
  warning?: string;
};

const ORDER_STATUS_OPTIONS: Array<{ value: ServiceStartStatus; label: string }> = [
  { value: 'pending_docs', label: 'Docs' },
  { value: 'pending_payment', label: 'Pagamento' },
  { value: 'processing', label: 'Processo' },
  { value: 'completed', label: 'Concluido' },
];

const EMPTY_CLIENT_FORM: AdminServiceClientForm = {
  name: '',
  phone: '',
  email: '',
  document: '',
  city: '',
  birthDate: '',
  address: '',
  source: '',
  govAccount: '',
  govPassword: '',
  notes: '',
};

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
    segmentInterest: payload.segmentInterest === 'docs' || payload.segmentInterest === 'ambos' ? payload.segmentInterest : 'nautica',
    status:
      payload.status === 'novo' ||
      payload.status === 'em_contato' ||
      payload.status === 'aguardando' ||
      payload.status === 'convertido' ||
      payload.status === 'pausado'
        ? payload.status
        : 'novo',
    scheduledFor: payload.scheduledFor || '',
    notes: payload.notes || '',
    createdAt: payload.createdAt || new Date(0).toISOString(),
    updatedAt: payload.updatedAt || payload.createdAt || new Date(0).toISOString(),
  };
}

function getAgendaStatusFromOrderStatus(status: ServiceStartStatus): AgendaClientStatus {
  if (status === 'pending_payment') return 'aguardando';
  return 'convertido';
}

function appendOrderToNotes(currentNotes: string, productTitle: string, orderId: string) {
  const trimmedNotes = currentNotes.trim();
  const serviceNote = `Serviço criado no admin: ${productTitle} | Pedido ${orderId.slice(0, 8)}`;

  if (!trimmedNotes) return serviceNote;
  if (trimmedNotes.includes(serviceNote)) return trimmedNotes;

  return `${trimmedNotes}\n${serviceNote}`;
}

function createInitialResponses(product: Product, previous: Record<string, string>) {
  return Object.fromEntries(
    product.requiredDocuments.map((label) => [label, previous[label] || ''])
  );
}

function buildSeedFromClient(client: AgendaClient): AdminServiceClientForm {
  return {
    name: client.name || '',
    phone: client.phone || '',
    email: client.email || '',
    document: client.document || '',
    city: client.city || '',
    birthDate: '',
    address: '',
    source: client.source || '',
    govAccount: '',
    govPassword: '',
    notes: client.notes || '',
  };
}

function getAgendaSegmentLabel(segment?: AgendaClient['segmentInterest']) {
  if (segment === 'ambos') return 'Nautica + Docs PVC';
  return getSegmentLabel(segment);
}

function getAnswerPlaceholder(documentLabel: string) {
  const normalized = documentLabel.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  if (
    normalized.includes('foto') ||
    normalized.includes('arquivo') ||
    normalized.includes('pdf') ||
    normalized.includes('print') ||
    normalized.includes('comprovante')
  ) {
    return 'Ex: recebido por WhatsApp, link do Drive, numero ou observacao';
  }

  if (normalized.includes('senha')) {
    return 'Informe a senha necessaria para operar';
  }

  if (normalized.includes('nome')) {
    return 'Nome completo exatamente como o cliente informou';
  }

  return 'Preencha o dado necessario para gerar o servico';
}

function needsLargeInput(documentLabel: string) {
  const normalized = documentLabel.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  return (
    normalized.includes('foto') ||
    normalized.includes('arquivo') ||
    normalized.includes('pdf') ||
    normalized.includes('print') ||
    normalized.includes('documento')
  );
}

function canAttachSourcePreview(documentLabel: string) {
  const normalized = documentLabel.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  return (
    normalized.includes('foto') ||
    normalized.includes('imagem') ||
    normalized.includes('arquivo') ||
    normalized.includes('pdf') ||
    normalized.includes('print') ||
    normalized.includes('cnh') ||
    normalized.includes('crlv') ||
    normalized.includes('tie') ||
    normalized.includes('cha') ||
    normalized.includes('titulo') ||
    normalized.includes('certificado') ||
    normalized.includes('licenca') ||
    normalized.includes('registro')
  );
}

function resolveAttachmentKind(file: File): DocumentAttachmentPreview['kind'] {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return 'pdf';
  return 'other';
}

function revokeAttachmentResources(attachment: DocumentAttachmentPreview) {
  const uniqueUrls = Array.from(new Set([attachment.sourceUrl, attachment.previewUrl]));

  uniqueUrls.forEach((url) => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
}

function getResponseLabelFromMarineKey(fieldKey: keyof MarineDocumentFields) {
  const labelMap: Record<keyof MarineDocumentFields, string> = {
    registrationNumber: 'Número de inscrição',
    vesselName: 'Nome da embarcação',
    vesselType: 'Tipo da embarcação',
    expirationDate: 'Data de validade',
    ownerName: 'Nome do proprietário',
    ownerDocument: 'CPF/CNPJ do proprietário',
    propulsionType: 'Tipo de propulsão',
    engineCount: 'Quantidade de motores',
    navigationArea: 'Área de navegação',
    length: 'Comprimento',
    hullNumber: 'Nº do casco',
    issueDate: 'Data de emissão',
  };

  return labelMap[fieldKey];
}

function mergeMarineOcrIntoResponses(
  current: Record<string, string>,
  parsedFields: MarineDocumentFields
) {
  const next = { ...current };

  (Object.entries(parsedFields) as Array<[keyof MarineDocumentFields, string | undefined]>).forEach(([fieldKey, value]) => {
    if (!value?.trim()) return;

    const targetLabel = getResponseLabelFromMarineKey(fieldKey);
    const matchingKey = Object.keys(next).find(
      (label) =>
        label.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase() ===
        targetLabel.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
    );

    if (matchingKey && !next[matchingKey]?.trim()) {
      next[matchingKey] = value;
    }
  });

  return next;
}

function ProductMiniCard({
  product,
  onOpen,
}: {
  product: Product;
  onOpen: (product: Product) => void;
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <article
      className="glass-panel overflow-hidden rounded-2xl border border-sky-500/20 transition-colors hover:border-sky-400/40"
      style={{
        backgroundColor: isLight ? 'rgba(255, 255, 255, 0.94)' : undefined,
        boxShadow: isLight ? '0 16px 34px rgba(15, 47, 72, 0.08)' : undefined,
      }}
    >
      {product.image ? (
        <img src={product.image} alt={product.title} className="h-24 w-full object-cover" />
      ) : (
        <div
          className="flex h-24 w-full items-center justify-center text-sky-300"
          style={{
            background: isLight
              ? 'linear-gradient(180deg, rgba(219,231,240,0.95), rgba(205,217,227,0.95))'
              : 'rgba(8, 47, 73, 0.4)',
          }}
        >
          <Package className="h-7 w-7" />
        </div>
      )}

      <div className="space-y-2.5 p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-[13px] font-bold text-white">{product.title}</h3>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-cyan-300">
              {getSegmentLabel(product.businessSegment)}
            </p>
          </div>
          <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[9px] font-semibold text-sky-200">
            {getCategoryBadgeText(product.category, normalizeBusinessSegment(product.businessSegment))}
          </span>
        </div>

        <p className="line-clamp-2 text-[11px] leading-4.5 text-slate-400">{product.description}</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Valor</p>
            <p className="text-base font-bold text-white">R$ {product.price.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Docs</p>
            <p className="text-[13px] font-semibold text-sky-300">{product.requiredDocuments.length}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpen(product)}
          className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:from-sky-500 hover:to-cyan-500"
        >
          Abrir ficha do servico
        </button>
      </div>
    </article>
  );
}

export function AdminServicesTab({
  products,
  docsProducts,
  draftClient,
  onDraftClientConsumed,
}: AdminServicesTabProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [agendaClients, setAgendaClients] = useState<AgendaClient[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(true);
  const [segmentFilter, setSegmentFilter] = useState<BusinessSegment>('nautica');
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedAgendaId, setSelectedAgendaId] = useState('');
  const [clientForm, setClientForm] = useState<AdminServiceClientForm>(EMPTY_CLIENT_FORM);
  const [documentResponses, setDocumentResponses] = useState<Record<string, string>>({});
  const [documentAttachments, setDocumentAttachments] = useState<Record<string, DocumentAttachmentPreview>>({});
  const [activePreviewLabel, setActivePreviewLabel] = useState('');
  const [serviceStatus, setServiceStatus] = useState<ServiceStartStatus>('pending_docs');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const documentAttachmentsRef = React.useRef<Record<string, DocumentAttachmentPreview>>({});

  useEffect(() => {
    if (!db) {
      setAgendaLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'adminAgenda'),
      (snapshot) => {
        const records = snapshot.docs
          .map((item) =>
            normalizeAgendaRecord({
              id: item.id,
              ...(item.data() as Partial<AgendaClient>),
            })
          )
          .sort((left, right) => left.name.localeCompare(right.name));

        setAgendaClients(records);
        setAgendaLoading(false);
      },
      (error) => {
        console.error('Erro ao carregar agenda para servicos:', error);
        setAgendaLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const previousOverflow = document.body.style.overflow;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (!draftClient) return;

    setSelectedAgendaId(draftClient.id);
    setClientForm(buildSeedFromClient(draftClient));

    if (draftClient.segmentInterest === 'docs') {
      setSegmentFilter('docs');
    } else {
      setSegmentFilter('nautica');
    }

    onDraftClientConsumed?.();
  }, [draftClient, onDraftClientConsumed]);

  useEffect(() => {
    documentAttachmentsRef.current = documentAttachments;
  }, [documentAttachments]);

  useEffect(() => {
    return () => {
      Object.values(documentAttachmentsRef.current).forEach((attachment) => {
        revokeAttachmentResources(attachment);
      });
    };
  }, []);

  const selectedAgendaClient = useMemo(
    () => agendaClients.find((client) => client.id === selectedAgendaId) || null,
    [agendaClients, selectedAgendaId]
  );

  const catalogStats = useMemo(
    () => ({
      nautica: products.length,
      docs: docsProducts.length,
      agenda: agendaClients.length,
    }),
    [agendaClients.length, docsProducts.length, products.length]
  );

  const visibleProducts = useMemo(() => {
    const activeCatalog = segmentFilter === 'docs' ? docsProducts : products;
    const normalizedQuery = search.trim().toLowerCase();

    return activeCatalog
      .filter((product) => {
        if (!normalizedQuery) return true;

        return [
          product.title,
          product.description,
          getCategoryBadgeText(product.category, segmentFilter),
          product.requiredDocuments.join(' '),
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((left, right) => left.title.localeCompare(right.title));
  }, [docsProducts, products, search, segmentFilter]);

  const previewRows = useMemo(
    () => [
      { label: 'Cliente', value: clientForm.name || 'Nao informado' },
      { label: 'Contato', value: clientForm.phone || clientForm.email || 'Nao informado' },
      { label: 'Documento', value: clientForm.document || 'Nao informado' },
      { label: 'Cidade', value: clientForm.city || 'Nao informada' },
      { label: 'Nascimento', value: clientForm.birthDate || 'Nao informado' },
      { label: 'Conta GOV', value: clientForm.govAccount || 'Nao informada' },
      { label: 'Status inicial', value: getOrderStatusLabel(serviceStatus) },
    ],
    [clientForm, serviceStatus]
  );

  const activeAttachment = useMemo(() => {
    if (activePreviewLabel && documentAttachments[activePreviewLabel]) {
      return {
        label: activePreviewLabel,
        attachment: documentAttachments[activePreviewLabel],
      };
    }

    const firstAttachmentEntry = Object.entries(documentAttachments)[0];
    if (!firstAttachmentEntry) return null;

    return {
      label: firstAttachmentEntry[0],
      attachment: firstAttachmentEntry[1],
    };
  }, [activePreviewLabel, documentAttachments]);

  const inputClassName =
    'theme-input w-full rounded-xl px-3 py-2.5 text-sm placeholder:text-slate-500 focus:border-sky-400 focus:outline-none';
  const nestedSurfaceStyle = isLight
    ? { backgroundColor: '#f7f9fb', borderColor: 'rgba(15, 47, 72, 0.10)' }
    : { backgroundColor: 'rgba(2, 12, 27, 0.45)' };
  const nestedSurfaceStrongStyle = isLight
    ? { backgroundColor: '#f3f7fa', borderColor: 'rgba(15, 47, 72, 0.10)' }
    : { backgroundColor: 'rgba(2, 12, 27, 0.55)' };
  const highlightPanelStyle = isLight
    ? { backgroundColor: 'rgba(12, 95, 165, 0.05)', borderColor: 'rgba(12, 95, 165, 0.14)' }
    : { backgroundColor: 'rgba(14, 165, 233, 0.10)' };
  const cyanPanelStyle = isLight
    ? { backgroundColor: 'rgba(8, 145, 178, 0.08)', borderColor: 'rgba(8, 145, 178, 0.16)' }
    : { backgroundColor: 'rgba(6, 182, 212, 0.10)' };
  const activeSkyButtonClass = isLight
    ? 'border-sky-300 bg-sky-50 text-sky-800'
    : 'border-sky-400/40 bg-sky-500/10 text-sky-200';
  const activeEmeraldButtonClass = isLight
    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
    : 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200';
  const inactiveFilterClass = isLight
    ? 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-700'
    : 'border-slate-600 bg-white/5 text-slate-300 hover:border-slate-500 hover:text-white';
  const inactiveGhostButtonClass = isLight
    ? 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-700'
    : 'border-slate-600 bg-white/5 text-slate-300 hover:border-slate-500 hover:text-white';

  const resetDocumentAttachments = () => {
    Object.values(documentAttachmentsRef.current).forEach((attachment) => {
      revokeAttachmentResources(attachment);
    });
    documentAttachmentsRef.current = {};
    setDocumentAttachments({});
    setActivePreviewLabel('');
  };

  const handleAgendaSelection = (agendaId: string) => {
    setSelectedAgendaId(agendaId);

    if (!agendaId) {
      return;
    }

    const client = agendaClients.find((item) => item.id === agendaId);
    if (!client) return;

    setClientForm((current) => ({
      ...current,
      ...buildSeedFromClient(client),
    }));

    if (client.segmentInterest === 'docs') {
      setSegmentFilter('docs');
    } else if (client.segmentInterest === 'nautica') {
      setSegmentFilter('nautica');
    }
  };

  const openProductModal = (product: Product) => {
    resetDocumentAttachments();
    setSelectedProduct(product);
    setDocumentResponses((current) => createInitialResponses(product, current));
    setServiceStatus('pending_docs');
    setIsModalOpen(true);
  };

  const closeProductModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setDocumentResponses({});
    resetDocumentAttachments();
    setServiceStatus('pending_docs');
  };

  const handleAttachmentSelection = async (documentLabel: string, file: File | null) => {
    if (!file) return;

    const kind = resolveAttachmentKind(file);
    const temporarySourceUrl = URL.createObjectURL(file);

    setDocumentAttachments((current) => {
      if (current[documentLabel]) {
        revokeAttachmentResources(current[documentLabel]);
      }

      return {
        ...current,
        [documentLabel]: {
          fileName: file.name,
          sourceUrl: temporarySourceUrl,
          previewUrl: temporarySourceUrl,
          kind,
          ocrStatus: 'processing',
          ocrProgress: 0,
          qrText: '',
          warning: '',
        },
      };
    });

    setDocumentResponses((current) => ({
      ...current,
      [documentLabel]: current[documentLabel]?.trim() || `Arquivo anexado: ${file.name}`,
    }));
    setActivePreviewLabel(documentLabel);

    try {
      if (!selectedProduct) return;

      const { sourceUrl, insight } = await extractDocumentInsight(file, selectedProduct.title, (progress) => {
        setDocumentAttachments((current) => {
          const attachment = current[documentLabel];
          if (!attachment) return current;

          return {
            ...current,
            [documentLabel]: {
              ...attachment,
              ocrStatus: 'processing',
              ocrProgress: progress,
            },
          };
        });
      });

      setDocumentAttachments((current) => {
        const previousAttachment = current[documentLabel];
        if (!previousAttachment) {
          revokeAttachmentResources({
            fileName: file.name,
            sourceUrl,
            previewUrl: insight.previewUrl,
            kind,
            ocrStatus: 'done',
          });
          return current;
        }

        revokeAttachmentResources(previousAttachment);

        return {
          ...current,
          [documentLabel]: {
            fileName: file.name,
            sourceUrl,
            previewUrl: insight.previewUrl,
            kind,
            ocrStatus: 'done',
            ocrProgress: 100,
            ocrConfidence: insight.confidence,
            ocrText: insight.rawText,
            parsedFields: insight.parsedFields,
            qrText: insight.qrText,
            warning: insight.warning,
          },
        };
      });

      if (Object.keys(insight.parsedFields).length > 0) {
        setDocumentResponses((current) => mergeMarineOcrIntoResponses(current, insight.parsedFields));

        setClientForm((current) => ({
          ...current,
          name: current.name.trim() || insight.parsedFields.ownerName || current.name,
          document: current.document.trim() || insight.parsedFields.ownerDocument || current.document,
        }));
      }
    } catch (error) {
      console.error('Erro ao processar OCR do documento:', error);

      setDocumentAttachments((current) => {
        const attachment = current[documentLabel];
        if (!attachment) return current;

        return {
          ...current,
          [documentLabel]: {
            ...attachment,
            ocrStatus: 'error',
            ocrProgress: 0,
          },
        };
      });
    }
  };

  const handleRemoveAttachment = (documentLabel: string) => {
    setDocumentAttachments((current) => {
      const attachment = current[documentLabel];
      if (!attachment) return current;

      revokeAttachmentResources(attachment);
      const next = { ...current };
      delete next[documentLabel];

      return next;
    });

    setActivePreviewLabel((current) => (current === documentLabel ? '' : current));
  };

  const handleCreateService = async () => {
    if (!db || !selectedProduct) return;

    try {
      setSaving(true);

      const now = new Date().toISOString();
      const normalizedSegment = normalizeBusinessSegment(selectedProduct.businessSegment);
      const resolvedClientName = clientForm.name.trim() || 'Cliente em preenchimento';
      const answers: OrderServiceAnswer[] = [
        { label: 'Nome completo do cliente', value: resolvedClientName },
        ...(clientForm.phone.trim() ? [{ label: 'Telefone / WhatsApp', value: clientForm.phone.trim() }] : []),
        ...(clientForm.email.trim() ? [{ label: 'Email', value: clientForm.email.trim() }] : []),
        ...(clientForm.document.trim() ? [{ label: 'CPF / CNPJ / Documento', value: clientForm.document.trim() }] : []),
        ...(clientForm.city.trim() ? [{ label: 'Cidade / UF', value: clientForm.city.trim() }] : []),
        ...(clientForm.birthDate.trim() ? [{ label: 'Data de nascimento', value: clientForm.birthDate.trim() }] : []),
        ...(clientForm.address.trim() ? [{ label: 'Endereco', value: clientForm.address.trim() }] : []),
        ...(clientForm.source.trim() ? [{ label: 'Origem do lead', value: clientForm.source.trim() }] : []),
        ...(clientForm.govAccount.trim() ? [{ label: 'Conta gov.br', value: clientForm.govAccount.trim() }] : []),
        ...(clientForm.govPassword.trim() ? [{ label: 'Senha gov.br', value: clientForm.govPassword.trim() }] : []),
        ...(clientForm.notes.trim() ? [{ label: 'Observacoes internas', value: clientForm.notes.trim() }] : []),
        ...selectedProduct.requiredDocuments
          .map((documentLabel) => ({
            label: documentLabel,
            value: documentResponses[documentLabel]?.trim() || '',
          }))
          .filter((answer) => answer.value),
      ];

      const manualItem: OrderItem = {
        id: selectedProduct.id,
        title: selectedProduct.title,
        description: selectedProduct.description,
        price: selectedProduct.price,
        category: selectedProduct.category,
        requiredDocuments: selectedProduct.requiredDocuments,
        requiredFiles: selectedProduct.requiredFiles || [],
        image: selectedProduct.image || '',
        businessSegment: normalizedSegment,
        cartId: `admin-${Date.now()}`,
        uploadedDocs: Object.fromEntries(
          Object.entries(documentAttachments).map(([label, attachment]) => [label, attachment.fileName])
        ),
        serviceAnswers: answers,
      };

      const orderPayload: Omit<Order, 'id'> = {
        userId: selectedAgendaId ? `agenda:${selectedAgendaId}` : `manual:${Date.now()}`,
        userName: resolvedClientName,
        items: [manualItem],
        total: selectedProduct.price,
        status: serviceStatus,
        date: now,
        agendaClientId: selectedAgendaId || undefined,
        businessSegment: normalizedSegment,
        source: 'admin_services',
        internalNotes: clientForm.notes.trim() || undefined,
        clientSnapshot: {
          name: resolvedClientName,
          phone: clientForm.phone.trim() || undefined,
          email: clientForm.email.trim() || undefined,
          document: clientForm.document.trim() || undefined,
          city: clientForm.city.trim() || undefined,
          birthDate: clientForm.birthDate.trim() || undefined,
          address: clientForm.address.trim() || undefined,
          govAccount: clientForm.govAccount.trim() || undefined,
          govPassword: clientForm.govPassword.trim() || undefined,
          source: clientForm.source.trim() || undefined,
        },
        payment: {
          method: 'manual',
          status: serviceStatus === 'pending_payment' ? 'pending_payment' : 'paid',
          createdAt: now,
          paidAt: serviceStatus === 'pending_payment' ? undefined : now,
        },
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderPayload);

      const agendaPayload = {
        name: resolvedClientName,
        phone: clientForm.phone.trim(),
        email: clientForm.email.trim(),
        document: clientForm.document.trim(),
        city: clientForm.city.trim(),
        source: clientForm.source.trim(),
        serviceInterest: selectedProduct.title,
        segmentInterest: normalizedSegment,
        status: getAgendaStatusFromOrderStatus(serviceStatus),
        notes: appendOrderToNotes(clientForm.notes, selectedProduct.title, orderRef.id),
        updatedAt: now,
      };

      if (selectedAgendaId) {
        await setDoc(doc(db, 'adminAgenda', selectedAgendaId), agendaPayload, { merge: true });
      } else {
        const newAgendaRecord = await addDoc(collection(db, 'adminAgenda'), {
          ...agendaPayload,
          createdAt: now,
        });
        setSelectedAgendaId(newAgendaRecord.id);
      }

      alert(`Servico criado com sucesso. Pedido ${orderRef.id.slice(0, 8)} registrado no admin.`);
      closeProductModal();
    } catch (error) {
      console.error('Erro ao criar servico direto no admin:', error);
      alert('Nao foi possivel criar o servico direto no admin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <div className="glass-panel rounded-2xl border border-sky-500/20 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Catalogo nautico</p>
          <p className="mt-2 text-2xl font-black text-white">{catalogStats.nautica}</p>
          <p className="mt-1.5 text-[11px] text-slate-400">Produtos prontos para venda interna.</p>
        </div>
        <div className="glass-panel rounded-2xl border border-cyan-500/20 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Catalogo docs</p>
          <p className="mt-2 text-2xl font-black text-cyan-300">{catalogStats.docs}</p>
          <p className="mt-1.5 text-[11px] text-slate-400">Fluxo direto para documentos em PVC.</p>
        </div>
        <div className="glass-panel rounded-2xl border border-emerald-500/20 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Agenda ativa</p>
          <p className="mt-2 text-2xl font-black text-emerald-300">{catalogStats.agenda}</p>
          <p className="mt-1.5 text-[11px] text-slate-400">Clientes que podem virar pedido agora.</p>
        </div>
        <div className="glass-panel rounded-2xl border border-amber-500/20 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Fluxo</p>
          <p className="mt-2 text-lg font-black text-white">Sem checkout</p>
          <p className="mt-1.5 text-[11px] text-slate-400">Venda interna com registro direto no painel.</p>
        </div>
      </div>

      <section className="glass-panel rounded-2xl border border-sky-500/20 p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <h3 className="text-xl font-bold text-white">Central de Servicos</h3>
            <p className="mt-1.5 text-[12px] leading-5 text-slate-400">
              O atendente escolhe o produto, abre a ficha do servico e gera o pedido sem carrinho e sem checkout.
              Os dados do cliente, conta gov, senha e observacoes operacionais ficam gravados no pedido.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 xl:min-w-[320px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar servico, categoria ou documento..."
                className={`${inputClassName} pl-10 pr-4`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSegmentFilter('nautica')}
                className={`rounded-xl border px-3 py-2 text-[13px] font-semibold transition-colors ${
                  segmentFilter === 'nautica'
                    ? activeSkyButtonClass
                    : inactiveFilterClass
                }`}
              >
                Assessoria Nautica
              </button>
              <button
                type="button"
                onClick={() => setSegmentFilter('docs')}
                className={`rounded-xl border px-3 py-2 text-[13px] font-semibold transition-colors ${
                  segmentFilter === 'docs'
                    ? activeEmeraldButtonClass
                    : inactiveFilterClass
                }`}
              >
                Docs PVC
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.4fr)_320px]">
          <div className="rounded-2xl border border-sky-500/20 p-3.5" style={nestedSurfaceStyle}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Catalogo ativo</p>
                <p className="mt-1 text-sm font-bold text-white">
                  {segmentFilter === 'docs' ? 'Docs PVC' : 'Assessoria Nautica'}
                </p>
              </div>
              <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-sky-200">
                {visibleProducts.length} itens
              </span>
            </div>

            {visibleProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-sky-500/20 p-6 text-center">
                <p className="text-base font-semibold text-white">Nenhum servico encontrado</p>
                <p className="mt-1.5 text-[12px] text-slate-400">Ajuste a busca ou troque o catalogo ativo.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {visibleProducts.map((product) => (
                  <ProductMiniCard key={product.id} product={product} onOpen={openProductModal} />
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-3">
            <div className="rounded-2xl border border-cyan-500/20 p-4" style={isLight ? { backgroundColor: 'rgba(255, 255, 255, 0.92)' } : undefined}>
              <div className="flex items-center gap-2 text-cyan-300">
                <UserRoundPlus className="h-4 w-4" />
                <h4 className="text-base font-bold text-white">Cliente base</h4>
              </div>

              <p className="mt-2 text-[12px] leading-5 text-slate-400">
                Escolha um cliente da agenda para preencher a ficha automaticamente ou crie o pedido com dados manuais.
              </p>

              <div className="mt-3">
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Cliente da agenda</label>
                <select
                  value={selectedAgendaId}
                  onChange={(event) => handleAgendaSelection(event.target.value)}
                  className={inputClassName}
                >
                  <option value="">Sem vincular agora</option>
                  {agendaClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.serviceInterest ? `- ${client.serviceInterest}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {agendaLoading ? (
                <div className="mt-3 flex items-center gap-2 text-[12px] text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando agenda...
                </div>
              ) : selectedAgendaClient ? (
                <div className="mt-3 rounded-2xl border border-cyan-500/20 p-3.5" style={cyanPanelStyle}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{selectedAgendaClient.name}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-cyan-200">
                        {getAgendaSegmentLabel(selectedAgendaClient.segmentInterest)}
                      </p>
                    </div>
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-semibold text-cyan-200">
                      {selectedAgendaClient.status}
                    </span>
                  </div>
                  <p className="mt-2 text-[12px] text-slate-300">
                    {selectedAgendaClient.serviceInterest || 'Sem servico principal definido'}
                  </p>
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-dashed border-slate-300/70 p-3.5 text-[12px] text-slate-400">
                  Sem cliente preselecionado. Ao criar o pedido, a agenda recebe ou atualiza esse cadastro automaticamente.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-emerald-500/20 p-4" style={isLight ? { backgroundColor: 'rgba(255, 255, 255, 0.92)' } : undefined}>
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <h4 className="text-base font-bold text-white">Fluxo automatico</h4>
              </div>
              <div className="mt-3 space-y-2.5 text-[12px] leading-5 text-slate-300">
                <p>1. Escolha o produto no card compacto.</p>
                <p>2. Abra a ficha e preencha dados do cliente e documentos.</p>
                <p>3. O pedido nasce direto em `orders`, sem checkout e sem carrinho.</p>
                <p>4. A agenda recebe ou atualiza o cliente com o servico vinculado.</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {isModalOpen && selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={closeProductModal}
        >
          <div
            className="glass-panel max-h-[92vh] w-full max-w-7xl overflow-y-auto rounded-[24px] border border-sky-500/20"
            style={{
              backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : undefined,
              boxShadow: isLight ? '0 28px 70px rgba(15, 47, 72, 0.18)' : undefined,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="sticky top-0 z-10 flex items-center justify-between border-b border-sky-500/20 px-5 py-4 backdrop-blur"
              style={{
                backgroundColor: isLight ? 'rgba(255, 255, 255, 0.97)' : 'rgba(2, 12, 27, 0.95)',
              }}
            >
              <div>
                <h3 className="text-xl font-bold text-white">{selectedProduct.title}</h3>
              </div>
              <button
                type="button"
                onClick={closeProductModal}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${inactiveGhostButtonClass}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.95fr)]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-sky-500/20 p-4" style={isLight ? { backgroundColor: 'rgba(255, 255, 255, 0.92)' } : undefined}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Produto</p>
                      <h4 className="mt-1.5 text-lg font-bold text-white">{selectedProduct.title}</h4>
                      <p className="mt-1.5 text-[12px] leading-5 text-slate-400">{selectedProduct.description}</p>
                    </div>
                    <div className="rounded-2xl border border-sky-500/20 p-3.5 text-right" style={nestedSurfaceStrongStyle}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Valor</p>
                      <p className="mt-1.5 text-xl font-black text-white">R$ {selectedProduct.price.toFixed(2)}</p>
                      <p className="mt-1 text-[11px] text-sky-300">
                        {getCategoryBadgeText(selectedProduct.category, normalizeBusinessSegment(selectedProduct.businessSegment))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-sky-500/20 p-4" style={isLight ? { backgroundColor: 'rgba(255, 255, 255, 0.92)' } : undefined}>
                  <h4 className="text-base font-bold text-white">1. Cliente e acesso</h4>
                  <p className="mt-1.5 text-[12px] text-slate-400">
                    Voce pode criar agora e continuar alimentando os dados depois.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-300">Cliente da agenda</label>
                      <select
                        value={selectedAgendaId}
                        onChange={(event) => handleAgendaSelection(event.target.value)}
                        className={inputClassName}
                      >
                        <option value="">Sem vincular agora</option>
                        {agendaClients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-300">Status inicial</label>
                      <div className="flex flex-wrap gap-1.5 rounded-xl border border-sky-500/20 p-1.5" style={nestedSurfaceStrongStyle}>
                        {ORDER_STATUS_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setServiceStatus(option.value)}
                            className={`rounded-full border px-2 py-1 text-[10px] font-semibold leading-none transition-colors ${
                              serviceStatus === option.value
                                ? activeSkyButtonClass
                                : inactiveGhostButtonClass
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-300">Nome completo</label>
                      <input
                        type="text"
                        value={clientForm.name}
                        onChange={(event) => setClientForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Nome do cliente"
                        className={inputClassName}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-300">Telefone / WhatsApp</label>
                      <input
                        type="text"
                        value={clientForm.phone}
                        onChange={(event) => setClientForm((current) => ({ ...current, phone: event.target.value }))}
                        placeholder="48999999999"
                        className={inputClassName}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
                      <input
                        type="email"
                        value={clientForm.email}
                        onChange={(event) => setClientForm((current) => ({ ...current, email: event.target.value }))}
                        placeholder="cliente@email.com"
                        className={inputClassName}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-300">CPF / CNPJ / Documento</label>
                      <input
                        type="text"
                        value={clientForm.document}
                        onChange={(event) => setClientForm((current) => ({ ...current, document: event.target.value }))}
                        placeholder="Documento de referencia"
                        className={inputClassName}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-300">Cidade / UF</label>
                      <input
                        type="text"
                        value={clientForm.city}
                        onChange={(event) => setClientForm((current) => ({ ...current, city: event.target.value }))}
                        placeholder="Ex: Florianopolis - SC"
                        className={inputClassName}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-300">Data de nascimento</label>
                      <input
                        type="text"
                        value={clientForm.birthDate}
                        onChange={(event) => setClientForm((current) => ({ ...current, birthDate: event.target.value }))}
                        placeholder="Ex: 12/04/1990"
                        className={inputClassName}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-slate-300">Endereco</label>
                      <input
                        type="text"
                        value={clientForm.address}
                        onChange={(event) => setClientForm((current) => ({ ...current, address: event.target.value }))}
                        placeholder="Rua, numero, bairro, cidade"
                        className={inputClassName}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-300">Origem do lead</label>
                      <input
                        type="text"
                        value={clientForm.source}
                        onChange={(event) => setClientForm((current) => ({ ...current, source: event.target.value }))}
                        placeholder="Instagram, site, indicacao..."
                        className={inputClassName}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-300">Conta gov.br</label>
                      <input
                        type="text"
                        value={clientForm.govAccount}
                        onChange={(event) => setClientForm((current) => ({ ...current, govAccount: event.target.value }))}
                        placeholder="Login ou CPF usado no gov.br"
                        className={inputClassName}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-slate-300">Senha gov.br</label>
                      <input
                        type="password"
                        value={clientForm.govPassword}
                        onChange={(event) => setClientForm((current) => ({ ...current, govPassword: event.target.value }))}
                        placeholder="Senha operacional informada pelo cliente"
                        className={inputClassName}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-500/20 p-4" style={isLight ? { backgroundColor: 'rgba(255, 255, 255, 0.92)' } : undefined}>
                  <h4 className="text-base font-bold text-white">2. Documentos e dados</h4>
                  <p className="mt-1.5 text-[12px] text-slate-400">
                    Preencha o que o atendente ja recebeu do cliente para esse servico.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {selectedProduct.requiredDocuments.map((documentLabel) => (
                      <div key={documentLabel} className={`${needsLargeInput(documentLabel) ? 'md:col-span-2' : ''} space-y-2`}>
                        <label className="mb-1.5 block text-sm font-medium text-slate-300">{documentLabel}</label>
                        {normalizeBusinessSegment(selectedProduct.businessSegment) === 'docs' && canAttachSourcePreview(documentLabel) ? (
                          <div
                            className="rounded-2xl border border-dashed border-sky-500/25 p-3"
                            style={{ backgroundColor: isLight ? '#f8fbfd' : 'rgba(2, 12, 27, 0.35)' }}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="cursor-pointer">
                                <span className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-500">
                                  <Upload className="h-3.5 w-3.5" />
                                  PDF ou imagem
                                </span>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                                  className="hidden"
                                  onChange={(event) => {
                                    handleAttachmentSelection(documentLabel, event.target.files?.[0] || null);
                                    event.target.value = '';
                                  }}
                                />
                              </label>

                              <label className="cursor-pointer">
                                <span className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-cyan-500">
                                  <Camera className="h-3.5 w-3.5" />
                                  Câmera
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={(event) => {
                                    handleAttachmentSelection(documentLabel, event.target.files?.[0] || null);
                                    event.target.value = '';
                                  }}
                                />
                              </label>

                              {documentAttachments[documentLabel] ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAttachment(documentLabel)}
                                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${inactiveGhostButtonClass}`}
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Remover
                                </button>
                              ) : null}
                            </div>

                            <p className="mt-2 text-[11px] text-slate-400">
                              Anexe o PDF/imagem original para visualizar o documento base e a prévia do cartão PVC.
                            </p>

                            {documentAttachments[documentLabel] ? (
                              <div className="mt-2 rounded-xl border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-[11px] text-slate-300">
                                Arquivo base: <span className="font-semibold text-white">{documentAttachments[documentLabel].fileName}</span>
                                {documentAttachments[documentLabel].ocrStatus === 'processing' ? (
                                  <span className="ml-2 text-cyan-300">OCR {documentAttachments[documentLabel].ocrProgress || 0}%</span>
                                ) : null}
                                {documentAttachments[documentLabel].ocrStatus === 'done' ? (
                                  <span className="ml-2 text-emerald-300">OCR concluído</span>
                                ) : null}
                                {documentAttachments[documentLabel].warning ? (
                                  <span className="ml-2 text-amber-300">Revisar dados</span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        {needsLargeInput(documentLabel) ? (
                          <textarea
                            value={documentResponses[documentLabel] || ''}
                            onChange={(event) =>
                              setDocumentResponses((current) => ({
                                ...current,
                                [documentLabel]: event.target.value,
                              }))
                            }
                            placeholder={getAnswerPlaceholder(documentLabel)}
                            className={`${inputClassName} min-h-[96px] rounded-2xl`}
                          />
                        ) : (
                          <input
                            type="text"
                            value={documentResponses[documentLabel] || ''}
                            onChange={(event) =>
                              setDocumentResponses((current) => ({
                                ...current,
                                [documentLabel]: event.target.value,
                              }))
                            }
                            placeholder={getAnswerPlaceholder(documentLabel)}
                            className={inputClassName}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {normalizeBusinessSegment(selectedProduct.businessSegment) === 'docs' && activeAttachment ? (
                    <div className="mt-4">
                      <DocsAttachmentPreview
                        documentLabel={activeAttachment.label}
                        productTitle={selectedProduct.title}
                        productImage={selectedProduct.image}
                        clientName={clientForm.name}
                        clientDocument={clientForm.document}
                        clientBirthDate={clientForm.birthDate}
                        clientCity={clientForm.city}
                        sourceFileName={activeAttachment.attachment.fileName}
                        sourcePreviewUrl={activeAttachment.attachment.previewUrl}
                        sourceKind={activeAttachment.attachment.kind}
                        ocrStatus={activeAttachment.attachment.ocrStatus}
                        ocrProgress={activeAttachment.attachment.ocrProgress}
                        ocrConfidence={activeAttachment.attachment.ocrConfidence}
                        parsedFields={activeAttachment.attachment.parsedFields}
                        ocrText={activeAttachment.attachment.ocrText}
                        qrText={activeAttachment.attachment.qrText}
                        warning={activeAttachment.attachment.warning}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-amber-500/20 p-4" style={isLight ? { backgroundColor: 'rgba(255, 255, 255, 0.92)' } : undefined}>
                  <h4 className="text-base font-bold text-white">3. Observacoes</h4>
                  <p className="mt-1.5 text-[12px] text-slate-400">
                    Anote combinados, pendencias, links e qualquer contexto necessario para gerar o pedido.
                  </p>

                  <div className="mt-3">
                    <textarea
                      value={clientForm.notes}
                      onChange={(event) => setClientForm((current) => ({ ...current, notes: event.target.value }))}
                      placeholder="Ex: cliente enviou os arquivos por WhatsApp, falta confirmar numero, gov.br autorizado, etc."
                      className={`${inputClassName} min-h-[120px] rounded-2xl`}
                    />
                  </div>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-2xl border border-emerald-500/20 p-4" style={isLight ? { backgroundColor: 'rgba(255, 255, 255, 0.92)' } : undefined}>
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <h4 className="text-base font-bold text-white">Resumo do pedido</h4>
                  </div>

                  <div className="mt-3 overflow-hidden rounded-2xl border border-white/10" style={nestedSurfaceStrongStyle}>
                    {previewRows.map((row) => (
                      <div
                        key={row.label}
                        className="grid grid-cols-[92px_minmax(0,1fr)] gap-2.5 border-b border-white/5 px-3 py-2.5 text-[12px] last:border-b-0"
                      >
                        <span className="font-semibold uppercase tracking-[0.14em] text-slate-500">{row.label}</span>
                        <span className="min-w-0 break-words text-slate-200">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 rounded-2xl border border-sky-500/20 p-3" style={highlightPanelStyle}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Pedido vai nascer com</p>
                    <div className="mt-2 space-y-1.5 text-[12px] text-slate-300">
                      <p>Segmento: <span className="font-semibold text-white">{getSegmentLabel(selectedProduct.businessSegment)}</span></p>
                      <p>Status: <span className="font-semibold text-white">{getOrderStatusLabel(serviceStatus)}</span></p>
                      <p>Pagamento: <span className="font-semibold text-white">{serviceStatus === 'pending_payment' ? 'Manual pendente' : 'Manual confirmado'}</span></p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-sky-500/20 p-4" style={isLight ? { backgroundColor: 'rgba(255, 255, 255, 0.92)' } : undefined}>
                  <div className="flex items-center gap-2 text-sky-300">
                    <NotebookPen className="h-4 w-4" />
                    <h4 className="text-base font-bold text-white">Dados capturados</h4>
                  </div>
                  <div className="mt-3 space-y-2 text-[12px] leading-5 text-slate-300">
                    <p>Nome, contato, documento, cidade e origem.</p>
                    <p>Conta gov.br e senha quando o processo exigir acesso.</p>
                    <p>Campos especificos de cada produto e lista de documentos necessarios.</p>
                    <p>Atualizacao automatica da agenda junto com a criacao do pedido.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-sky-500/20 p-4" style={isLight ? { backgroundColor: 'rgba(255, 255, 255, 0.92)' } : undefined}>
                  <button
                    type="button"
                    onClick={handleCreateService}
                    disabled={saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:from-sky-500 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                    Criar servico direto
                  </button>

                  <button
                    type="button"
                    onClick={closeProductModal}
                    className={`mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${inactiveGhostButtonClass}`}
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
