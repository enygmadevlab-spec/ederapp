"use client";
import React, { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Order } from '@/types';
import { Eye, Check, X, Loader2 } from 'lucide-react';

export default function EmployeeDashboard() {
  const { updateOrderStatus } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      orderBy("date", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders: Order[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));

      const tasks = allOrders.filter(o => o.status === 'pending_docs' || o.status === 'processing');
      setOrders(tasks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="h-10 w-10 text-sky-400 animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-fade-in">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-2">Fila de Análise</h1>
        <p className="text-slate-300 text-lg">Gerencie e aprove as documentações pendentes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {orders.length === 0 ? (
          <div className="col-span-full glass-panel rounded-2xl p-16 text-center border border-sky-500/20">
            <div className="text-6xl mb-4">✨</div>
            <p className="text-slate-300 text-lg font-semibold">Nenhuma tarefa pendente na fila.</p>
            <p className="text-slate-400 text-sm mt-2">Ótimo trabalho! Todas as documentações foram processadas.</p>
          </div>
        ) : (
          orders.map(order => (
            <div
              key={order.id}
              className="glass-panel rounded-2xl flex flex-col hover:border-sky-500/50 transition-all border-t-4 border-t-sky-500 border border-sky-500/20"
            >
              {/* Header */}
              <div className="p-6 border-b border-sky-500/20 bg-white/5 backdrop-blur flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-lg">Pedido <span className="text-sky-300">#{order.id.slice(0, 8)}</span></h3>
                  <p className="text-sm text-slate-300 font-semibold mt-1">{order.userName}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(order.date).toLocaleDateString('pt-BR')} às {new Date(order.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide ${
                    order.status === 'pending_docs'
                      ? 'bg-yellow-600/30 text-yellow-300 border border-yellow-500/50'
                      : 'bg-sky-600/30 text-sky-300 border border-sky-500/50'
                  }`}
                >
                  {order.status === 'pending_docs' ? '📝 Análise Docs' : '⚙️ Processamento'}
                </span>
              </div>

              {/* Content */}
              <div className="p-6 flex-grow bg-white/5">
                <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider mb-4">Documentos na Nuvem:</h4>
                <div className="space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="bg-white/5 p-4 rounded-xl border border-sky-500/20">
                      <p className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                        {item.title}
                      </p>
                      <ul className="space-y-2">
                        {Object.entries(item.uploadedDocs || {}).length > 0 ? (
                          Object.entries(item.uploadedDocs).map(([docName, url]) => (
                            <li key={docName} className="flex items-center justify-between bg-white/5 p-2.5 rounded-lg border border-sky-500/10">
                              <span className="text-slate-300 text-xs font-medium truncate max-w-[150px]">{docName}</span>
                              <div className="flex items-center gap-2 ml-2">
                                <a
                                  href={typeof url === 'string' ? url : '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-sky-400 hover:text-white hover:bg-sky-600 bg-sky-600/20 px-3 py-1.5 rounded-md transition-all text-xs font-bold"
                                >
                                  <Eye className="h-3 w-3" /> Ver
                                </a>
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-slate-400 italic p-2">Nenhum documento enviado</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-white/5 border-t border-sky-500/20 flex justify-end gap-3 rounded-b-2xl">
                <button
                  onClick={() => updateOrderStatus(order.id, 'rejected')}
                  className="px-5 py-2.5 bg-white/5 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-600/20 text-sm font-bold flex items-center gap-2 transition-all"
                >
                  <X className="h-4 w-4" /> Rejeitar
                </button>
                {order.status === 'pending_docs' ? (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'processing')}
                    className="px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-500 text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-sky-500/30"
                  >
                    <Loader2 className="h-4 w-4" /> Iniciar Proc.
                  </button>
                ) : (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-500 text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-500/30"
                  >
                    <Check className="h-4 w-4" /> Concluir
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}