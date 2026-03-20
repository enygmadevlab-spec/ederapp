"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Order } from '@/types';
import { Clock, CheckCircle, XCircle, FileText, Loader2, Package, ArrowRight, X, AlertCircle, Camera, Upload, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ClientDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { orders } = useCart();
  const [localOrders, setLocalOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilterLocal, setStatusFilterLocal] = useState<'all' | Order['status']>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'value_desc' | 'value_asc'>('newest');
  const [page, setPage] = useState(1);
  const perPage = 6;
  const router = useRouter();
  const [tab, setTab] = useState<'orders' | 'settings'>('orders');
  const [selectedItemModal, setSelectedItemModal] = useState<{ orderId: string; itemIndex: number } | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({});
  const [documentData, setDocumentData] = useState<{ [key: string]: { fullName: string; file: File | null } }>({});

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      setLocalOrders([]);
      return;
    }

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.id),
      orderBy("date", "desc")
    );

    setLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders: Order[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      setLocalOrders(fetchedOrders);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_docs':
        return <span className="bg-yellow-600/30 text-yellow-300 border border-yellow-500/50 text-xs px-3 py-1 rounded-full flex items-center gap-1.5 font-bold"><Clock className="h-3.5 w-3.5" /> Analisando Docs</span>;
      case 'processing':
        return <span className="bg-sky-600/30 text-sky-300 border border-sky-500/50 text-xs px-3 py-1 rounded-full flex items-center gap-1.5 font-bold"><Clock className="h-3.5 w-3.5" /> Em Andamento</span>;
      case 'paid':
        return <span className="bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 text-xs px-3 py-1 rounded-full flex items-center gap-1.5 font-bold"><CheckCircle className="h-3.5 w-3.5" /> Pago</span>;
      case 'completed':
        return <span className="bg-green-600/30 text-green-300 border border-green-500/50 text-xs px-3 py-1 rounded-full flex items-center gap-1.5 font-bold"><CheckCircle className="h-3.5 w-3.5" /> Concluído</span>;
      case 'rejected':
        return <span className="bg-red-600/30 text-red-300 border border-red-500/50 text-xs px-3 py-1 rounded-full flex items-center gap-1.5 font-bold"><XCircle className="h-3.5 w-3.5" /> Pendência</span>;
      default:
        return null;
    }
  };

  const handleDocumentUpload = async (file: File | null, docName: string, fullName: string) => {
    if (!file || !user || !selectedItemModal || !fullName.trim()) {
      alert('Por favor, preencha o nome completo e selecione um arquivo.');
      return;
    }

    const uploadKey = `${selectedItemModal.orderId}-${docName}`;
    
    try {
      setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }));
      
      const order = localOrders.find(o => o.id === selectedItemModal.orderId);
      if (!order) return;

      // Upload single file
      const safeFileName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
      const timestamp = new Date().getTime();
      const storagePath = `users/${user.id}/documents/${selectedItemModal.orderId}/${selectedItemModal.itemIndex}/${docName}/${timestamp}-${safeFileName}`;
      
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      // Atualizar o documento no Firestore com metadata
      const orderRef = doc(db, 'orders', selectedItemModal.orderId);
      const updatedItems = order.items.map((item, idx) => {
        if (idx === selectedItemModal.itemIndex) {
          return {
            ...item,
            uploadedDocs: {
              ...item.uploadedDocs,
              [docName]: {
                url: downloadUrl,
                fullName: fullName,
                uploadedAt: new Date().toISOString(),
                fileName: file.name
              }
            }
          };
        }
        return item;
      });

      await updateDoc(orderRef, {
        items: updatedItems
      });

      // Atualizar localOrders
      setLocalOrders(prev => prev.map(o => {
        if (o.id === selectedItemModal.orderId) {
          return {
            ...o,
            items: o.items.map((item, idx) => {
              if (idx === selectedItemModal.itemIndex) {
                return {
                  ...item,
                  uploadedDocs: {
                    ...item.uploadedDocs,
                    [docName]: {
                      url: downloadUrl,
                      fullName: fullName,
                      uploadedAt: new Date().toISOString(),
                      fileName: file.name
                    }
                  }
                };
              }
              return item;
            })
          };
        }
        return o;
      }));

      // Limpar dados do documento
      setDocumentData(prev => ({
        ...prev,
        [`${selectedItemModal.orderId}-${docName}`]: { fullName: '', file: null }
      }));

      alert('✅ Documento enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar documento:', error);
      alert('❌ Erro ao enviar documento. Tente novamente.');
    } finally {
      setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const filteredOrders = useMemo(() => {
    let out = localOrders.slice();
    if (statusFilterLocal !== 'all') out = out.filter(o => o.status === statusFilterLocal);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(o =>
        (o.userName || '').toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.items.some(i => i.title.toLowerCase().includes(q))
      );
    }
    switch (sortBy) {
      case 'newest':
        out.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'oldest':
        out.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'value_asc':
        out.sort((a, b) => a.total - b.total);
        break;
      case 'value_desc':
        out.sort((a, b) => b.total - a.total);
        break;
    }
    return out;
  }, [localOrders, search, statusFilterLocal, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / perPage));
  const pageOrders = filteredOrders.slice((page - 1) * perPage, page * perPage);

  const OrderTimeline: React.FC<{ status: Order['status'] }> = ({ status }) => {
    const steps: Order['status'][] = ['pending_docs', 'processing', 'paid', 'completed'];
    return (
      <div className="flex items-center gap-2 text-xs">
        {steps.map(s => (
          <div
            key={s}
            className={`px-2 py-1 rounded-full border ${s === status
              ? 'bg-sky-600 text-white border-sky-700'
              : 'bg-white/10 text-slate-400 border-white/20'
              }`}
          >
            {s.replace('_', ' ')}
          </div>
        ))}
      </div>
    );
  };

  const getRank = (total: number) => {
    if (total > 1000) return { label: 'Ouro', color: 'bg-yellow-500' };
    if (total > 500) return { label: 'Prata', color: 'bg-slate-400' };
    return { label: 'Bronze', color: 'bg-amber-700' };
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-12 w-12 text-sky-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Você não está logado</h2>
        <p className="text-slate-400 mb-6">Faça login para ver seus pedidos ou comece um novo no catálogo de serviços.</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/login" className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors">Entrar</Link>
          <Link href="/services" className="px-4 py-2 border border-sky-600 text-sky-300 rounded-lg hover:bg-white/5 transition-colors">Ver Serviços</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">Painel do Cliente</h1>
          <p className="text-lg text-slate-300">Bem-vindo, <span className="font-bold text-sky-300">{user?.name.split(' ')[0]}</span> — aqui estão seus pedidos.</p>
        </div>
        <div className="glass-panel px-6 py-3 rounded-xl border border-sky-500/20">
          <span className="text-sm text-slate-300">Status: <span className="text-sky-300 font-bold">Logado</span></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex items-center gap-3 border-b border-slate-700/50">
        {[
          ['orders', '📋 Meus Pedidos'],
          ['settings', '⚙️ Configurações']
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 ${tab === id
              ? 'border-sky-500 text-sky-300'
              : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'orders' && (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-panel p-6 rounded-2xl border border-sky-500/20">
              <h4 className="font-bold text-sky-300 mb-4 text-sm uppercase tracking-wider">Status de Pedidos</h4>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pendente</span>
                  <span className="font-bold text-white">{localOrders.filter(o => o.status === 'pending_docs').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Em Andamento</span>
                  <span className="font-bold text-white">{localOrders.filter(o => o.status === 'processing').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pago</span>
                  <span className="font-bold text-white">{localOrders.filter(o => o.status === 'paid').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Concluídos</span>
                  <span className="font-bold text-white">{localOrders.filter(o => o.status === 'completed').length}</span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-sky-500/20">
              <h4 className="font-bold text-sky-300 mb-4 text-sm uppercase tracking-wider">Seu Rank</h4>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ${getRank(localOrders.reduce((s, o) => s + o.total, 0)).color}`}>
                  {getRank(localOrders.reduce((s, o) => s + o.total, 0)).label[0]}
                </div>
                <div>
                  <div className="font-bold text-white">{getRank(localOrders.reduce((s, o) => s + o.total, 0)).label}</div>
                  <div className="text-sm text-slate-400">Total gasto: <span className="text-sky-300 font-semibold">R$ {localOrders.reduce((s, o) => s + o.total, 0).toFixed(2)}</span></div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-sky-500/20">
              <h4 className="font-bold text-sky-300 mb-4 text-sm uppercase tracking-wider">Resumo</h4>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total de Pedidos</span>
                  <span className="font-bold text-white">{localOrders.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Itens Adquiridos</span>
                  <span className="font-bold text-white">{localOrders.reduce((sum, o) => sum + o.items.length, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gasto Total</span>
                  <span className="font-bold text-sky-300">R$ {localOrders.reduce((s, o) => s + o.total, 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="glass-panel p-4 rounded-2xl mb-8 border border-sky-500/20">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar por pedido, item..."
                  className="w-full md:w-64 p-2.5 rounded-lg bg-white/5 border border-sky-500/20 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
                <select
                  value={statusFilterLocal}
                  onChange={(e) => {
                    setStatusFilterLocal(e.target.value as any);
                    setPage(1);
                  }}
                  className="p-2.5 rounded-lg bg-white/5 border border-sky-500/20 text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="all">Todos os status</option>
                  <option value="pending_docs">Pendente Docs</option>
                  <option value="processing">Em Andamento</option>
                  <option value="paid">Pago</option>
                  <option value="completed">Concluído</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="p-2.5 rounded-lg bg-white/5 border border-sky-500/20 text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="newest">Mais recentes</option>
                  <option value="oldest">Mais antigos</option>
                  <option value="value_desc">Valor (maior)</option>
                  <option value="value_asc">Valor (menor)</option>
                </select>
              </div>
              <div className="text-sm text-slate-400">Total pedidos: <span className="font-bold text-sky-300">{filteredOrders.length}</span></div>
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="glass-panel rounded-2xl p-16 text-center border border-sky-500/20">
              <div className="bg-slate-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Sem pedidos ainda</h3>
              <p className="text-slate-400 mb-6">Você ainda não realizou nenhuma solicitação de serviço.</p>
              <Link href="/services" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-600 to-cyan-600 text-white rounded-xl hover:from-sky-500 hover:to-cyan-500 transition-all">
                Ir ao Catálogo
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {pageOrders.map(order => (
                <div key={order.id} className="glass-panel rounded-2xl overflow-hidden hover:border-sky-500/50 transition-all border border-sky-500/20">
                  <div className="bg-white/5 backdrop-blur px-6 py-4 border-b border-sky-500/20 flex justify-between items-start md:items-center flex-wrap gap-4">
                    <div>
                      <span className="text-sm text-slate-400 font-medium block">Pedido <span className="font-mono text-xs uppercase bg-sky-600/30 px-2 py-1 rounded text-sky-300 ml-2"># {order.id.slice(0, 8)}</span></span>
                      <span className="text-xs text-slate-500 font-medium mt-1 block">
                        {new Date(order.date).toLocaleDateString('pt-BR')} às {new Date(order.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="mt-3"><OrderTimeline status={order.status as any} /></div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      {getStatusBadge(order.status)}
                      <p className="text-2xl font-black text-sky-300 mt-1">R$ {order.total.toFixed(2)}</p>
                      <div className="mt-2 flex gap-2">
                        {order.status === 'pending_docs' && (
                          <Link href={`/checkout/${order.id}`} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors text-sm font-semibold">
                            Continuar
                          </Link>
                        )}
                        <button className="px-3 py-2 border border-sky-500 text-sky-300 rounded-lg hover:bg-white/5 transition-colors text-sm font-semibold">
                          Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-4">Itens do Pedido:</h4>
                    <ul className="space-y-3">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-sky-500/20">
                          <div className="bg-sky-600/30 p-2 rounded-lg text-sky-300">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="flex-grow">
                            <span className="text-slate-300 font-medium block">{item.title}</span>
                            <span className="text-xs text-slate-500 mt-1">R$ {item.price.toFixed(2)}</span>
                          </div>
                          <button
                            onClick={() => setSelectedItemModal({ orderId: order.id, itemIndex: idx })}
                            className="px-3 py-1.5 text-xs font-bold bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors whitespace-nowrap"
                          >
                            Detalhes
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-between mt-8">
                <div className="text-sm text-slate-400">Página {page} de {totalPages}</div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 border border-sky-500/50 text-sky-300 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Anterior
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 border border-sky-500/50 text-sky-300 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Próxima →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-6">
          {/* Seção de Dados Pessoais */}
          <div className="glass-panel p-8 rounded-2xl border border-sky-500/20">
            <h3 className="font-bold text-sky-300 mb-1 text-lg uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-5 w-5" /> Dados Pessoais
            </h3>
            <p className="text-slate-400 mb-6 text-sm">Atualize suas informações pessoais</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Nome Completo */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Nome Completo *</label>
                <input
                  type="text"
                  defaultValue={user?.name || ''}
                  placeholder="Digite seu nome completo"
                  className="w-full px-4 py-2 bg-white/10 border border-sky-500/40 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Email *</label>
                <input
                  type="email"
                  defaultValue={user?.email || ''}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-2 bg-white/10 border border-sky-500/40 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>

              {/* CPF */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">CPF</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  className="w-full px-4 py-2 bg-white/10 border border-sky-500/40 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>

              {/* RG */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">RG</label>
                <input
                  type="text"
                  placeholder="00.000.000-0"
                  className="w-full px-4 py-2 bg-white/10 border border-sky-500/40 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Telefone</label>
                <input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  className="w-full px-4 py-2 bg-white/10 border border-sky-500/40 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>

              {/* Data de Nascimento */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Data de Nascimento</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 bg-white/10 border border-sky-500/40 rounded-lg text-white focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>
            </div>

            <button className="px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-500 hover:to-blue-500 transition-colors font-semibold">
              Salvar Dados Pessoais
            </button>
          </div>

          {/* Seção de Endereço */}
          <div className="glass-panel p-8 rounded-2xl border border-sky-500/20">
            <h3 className="font-bold text-sky-300 mb-1 text-lg uppercase tracking-wider flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Endereço
            </h3>
            <p className="text-slate-400 mb-6 text-sm">Atualize seu endereço de correspondência</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* CEP */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-300 mb-2">CEP *</label>
                <input
                  type="text"
                  placeholder="00000-000"
                  className="w-full px-4 py-2 bg-white/10 border border-sky-500/40 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>

              {/* Rua */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-300 mb-2">Rua *</label>
                <input
                  type="text"
                  placeholder="Nome da rua"
                  className="w-full px-4 py-2 bg-white/10 border border-sky-500/40 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>

              {/* Número */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Número *</label>
                <input
                  type="text"
                  placeholder="000"
                  className="w-full px-4 py-2 bg-white/10 border border-sky-500/40 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>

              {/* Complemento */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Complemento</label>
                <input
                  type="text"
                  placeholder="Apto, sala, etc."
                  className="w-full px-4 py-2 bg-white/10 border border-sky-500/40 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>

              {/* Bairro */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Bairro *</label>
                <input
                  type="text"
                  placeholder="Nome do bairro"
                  className="w-full px-4 py-2 bg-white/10 border border-sky-500/40 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>

              {/* Cidade */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Cidade *</label>
                <input
                  type="text"
                  placeholder="Nome da cidade"
                  className="w-full px-4 py-2 bg-white/10 border border-sky-500/40 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Estado *</label>
                <select className="w-full px-4 py-2 bg-white/10 border border-sky-500/40 rounded-lg text-white focus:outline-none focus:border-sky-400 transition-colors">
                  <option value="">Selecione o estado</option>
                  <option value="AC">Acre</option>
                  <option value="AL">Alagoas</option>
                  <option value="AP">Amapá</option>
                  <option value="AM">Amazonas</option>
                  <option value="BA">Bahia</option>
                  <option value="CE">Ceará</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="GO">Goiás</option>
                  <option value="MA">Maranhão</option>
                  <option value="MT">Mato Grosso</option>
                  <option value="MS">Mato Grosso do Sul</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="PA">Pará</option>
                  <option value="PB">Paraíba</option>
                  <option value="PR">Paraná</option>
                  <option value="PE">Pernambuco</option>
                  <option value="PI">Piauí</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="RN">Rio Grande do Norte</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="RO">Rondônia</option>
                  <option value="RR">Roraima</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="SP">São Paulo</option>
                  <option value="SE">Sergipe</option>
                  <option value="TO">Tocantins</option>
                </select>
              </div>
            </div>

            <button className="px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-500 hover:to-blue-500 transition-colors font-semibold">
              Salvar Endereço
            </button>
          </div>

          {/* Seção de Preferências */}
          <div className="glass-panel p-8 rounded-2xl border border-sky-500/20">
            <h3 className="font-bold text-sky-300 mb-4 text-lg uppercase tracking-wider">Preferências e Notificações</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-sky-500 accent-sky-500" />
                <span className="text-sm text-slate-300">Receber notificações por e-mail</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-sky-500 accent-sky-500" />
                <span className="text-sm text-slate-300">Receber atualizações de pedidos por WhatsApp</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-sky-500 accent-sky-500" />
                <span className="text-sm text-slate-300">Receber promoções e ofertas especiais</span>
              </label>
            </div>
            <div className="mt-8">
              <button className="px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-500 hover:to-blue-500 transition-colors font-semibold">
                Salvar Preferências
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Item */}
      {selectedItemModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl border border-sky-500/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {(() => {
              const order = localOrders.find(o => o.id === selectedItemModal.orderId);
              const item = order?.items[selectedItemModal.itemIndex];
              if (!order || !item) return null;

              const uploadedCount = Object.keys(item.uploadedDocs || {}).length;
              const totalRequired = item.requiredDocuments.length;
              const missingDocs = item.requiredDocuments.filter(doc => !item.uploadedDocs?.[doc]);

              return (
                <>
                  <div className="flex items-center justify-between p-6 border-b border-sky-500/20 bg-white/5">
                    <h3 className="text-xl font-bold text-white">{item.title}</h3>
                    <button
                      onClick={() => setSelectedItemModal(null)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5 text-slate-300" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Resumo */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white/5 p-4 rounded-xl border border-sky-500/20">
                        <div className="text-sm text-slate-400 mb-1">Preço</div>
                        <div className="text-2xl font-bold text-sky-300">R$ {item.price.toFixed(2)}</div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-sky-500/20">
                        <div className="text-sm text-slate-400 mb-1">Documentos</div>
                        <div className="text-2xl font-bold text-white">{uploadedCount}/{totalRequired}</div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-sky-500/20">
                        <div className="text-sm text-slate-400 mb-1">Status</div>
                        <div className="text-lg font-bold text-sky-300">
                          {uploadedCount === totalRequired ? '✓ Completo' : '⚠️ Falta'}
                        </div>
                      </div>
                    </div>

                    {/* Documentos Enviados */}
                    <div>
                      <h4 className="text-sm font-bold text-sky-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" /> Documentos Enviados ({uploadedCount})
                      </h4>
                      {uploadedCount > 0 ? (
                        <ul className="space-y-2">
                          {item.requiredDocuments.map(doc => {
                            const docData = item.uploadedDocs?.[doc];
                            if (docData) {
                              const uploadDate = typeof docData === 'object' && docData.uploadedAt 
                                ? new Date(docData.uploadedAt).toLocaleDateString('pt-BR')
                                : 'Data não disponível';
                              const fullName = typeof docData === 'object' ? docData.fullName : 'Nome não informado';
                              
                              return (
                                <li key={doc} className="p-3 bg-green-600/20 border border-green-500/30 rounded-lg space-y-1">
                                  <div className="flex items-center gap-3">
                                    <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm text-slate-300 font-medium">{doc}</p>
                                      <p className="text-xs text-green-300">✓ Enviado em {uploadDate}</p>
                                      {typeof docData === 'object' && docData.fullName && (
                                        <p className="text-xs text-green-300 mt-0.5">👤 {fullName}</p>
                                      )}
                                    </div>
                                  </div>
                                </li>
                              );
                            }
                            return null;
                          })}
                        </ul>
                      ) : (
                        <div className="text-sm text-slate-400 p-4 bg-white/5 rounded-lg">Nenhum documento enviado ainda</div>
                      )}
                    </div>

                    {/* Documentos Faltantes */}
                    {missingDocs.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" /> Documentos Faltantes ({missingDocs.length})
                        </h4>
                        <ul className="space-y-2 mb-4">
                          {missingDocs.map(doc => (
                            <li key={doc} className="flex items-center gap-3 p-3 bg-amber-600/20 border border-amber-500/30 rounded-lg">
                              <AlertCircle className="h-4 w-4 text-amber-400" />
                              <span className="text-sm text-slate-300 font-medium">{doc}</span>
                              <span className="ml-auto text-xs text-amber-400">⚠️ Pendente</span>
                            </li>
                          ))}
                        </ul>

                        {/* Seção de Upload */}
                        <div className="bg-gradient-to-br from-sky-600/20 to-blue-600/20 border border-sky-500/40 rounded-xl p-4">
                          <h5 className="text-sm font-bold text-sky-300 mb-4 flex items-center gap-2">
                            <Upload className="h-4 w-4" /> Enviar Documentos Faltantes
                          </h5>
                          <div className="space-y-4">
                            {missingDocs.map(doc => {
                              const uploadKey = `${selectedItemModal.orderId}-${doc}`;
                              const docDataKey = `${selectedItemModal.orderId}-${doc}`;
                              const isUploading = uploadingFiles[uploadKey];
                              const currentData = documentData[docDataKey] || { fullName: '', file: null };
                              const fileName = currentData.file?.name || 'Nenhum arquivo selecionado';

                              return (
                                <div key={doc} className="p-4 bg-white/5 border border-sky-500/30 rounded-lg space-y-3">
                                  {/* Título do Documento */}
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-sky-400" />
                                    <p className="text-sm font-bold text-slate-300">{doc}</p>
                                  </div>

                                  {/* Nome Completo */}
                                  <div>
                                    <label className="text-xs text-slate-400 font-semibold block mb-1">Nome Completo</label>
                                    <input
                                      type="text"
                                      placeholder="Digite seu nome completo"
                                      disabled={isUploading}
                                      value={currentData.fullName}
                                      onChange={(e) => setDocumentData(prev => ({
                                        ...prev,
                                        [docDataKey]: { ...currentData, fullName: e.target.value }
                                      }))}
                                      className="w-full px-3 py-2 bg-white/10 border border-sky-500/40 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                  </div>

                                  {/* Seleção de Arquivo */}
                                  <div>
                                    <label className="text-xs text-slate-400 font-semibold block mb-1">Arquivo Selecionado</label>
                                    <div className="flex gap-2">
                                      {/* Upload Arquivo */}
                                      <label className="flex-1 relative cursor-pointer">
                                        <div className="flex items-center gap-2 px-3 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 text-white rounded-lg transition-colors text-xs font-semibold border border-sky-500/50">
                                          <Upload className="h-3 w-3" />
                                          Escolher Arquivo
                                        </div>
                                        <input
                                          type="file"
                                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.gif,.webp"
                                          disabled={isUploading}
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0] || null;
                                            setDocumentData(prev => ({
                                              ...prev,
                                              [docDataKey]: { ...currentData, file }
                                            }));
                                          }}
                                        />
                                      </label>

                                      {/* Câmera */}
                                      <label className="relative cursor-pointer">
                                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white rounded-lg transition-colors text-xs font-semibold border border-blue-500/50">
                                          <Camera className="h-3 w-3" />
                                        </div>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          capture="environment"
                                          disabled={isUploading}
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0] || null;
                                            setDocumentData(prev => ({
                                              ...prev,
                                              [docDataKey]: { ...currentData, file }
                                            }));
                                          }}
                                        />
                                      </label>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                      📄 {fileName}
                                    </p>
                                  </div>

                                  {/* Botão Enviar */}
                                  <button
                                    disabled={isUploading || !currentData.fullName.trim() || !currentData.file}
                                    onClick={() => handleDocumentUpload(currentData.file, doc, currentData.fullName)}
                                    className="w-full px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2"
                                  >
                                    {isUploading ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Enviando...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="h-4 w-4" />
                                        Enviar Documento
                                      </>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-xs text-slate-400 mt-4 p-3 bg-white/5 rounded-lg">
                            💡 Preencha o nome completo, selecione um arquivo ou tire uma foto e clique em "Enviar Documento".
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}