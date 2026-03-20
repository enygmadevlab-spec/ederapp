"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Order } from '@/types';
import buildBRCode from '@/lib/pix';
import { Loader2, CheckCircle, Clock } from 'lucide-react';

export default function PaymentPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const orderRef = doc(db, 'orders', orderId);
    const unsub = onSnapshot(orderRef, (snap) => {
      if (!snap.exists()) {
        setOrder(null);
      } else {
        setOrder({ id: snap.id, ...(snap.data() as any) } as Order);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-10 w-10 text-sky-400 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Pedido não encontrado</h1>
      </div>
    );
  }

  const pixPayload = order.payment?.pixPayload || buildBRCode({
    pixKey: process.env.NEXT_PUBLIC_PIX_KEY || '12345678901234567890',
    amount: order.total,
    txid: order.id.substring(0, 25),
    merchantName: 'Eder Martins',
    merchantCity: 'Santa Catarina'
  });

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixPayload)}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">💳 Pagamento do Pedido</h1>
          <p className="text-sm text-slate-400 mt-2">Pedido #{order.id.slice(0, 8)} — R$ {order.total.toFixed(2)}</p>
        </div>
        <button onClick={() => router.push('/dashboard/client')} className="text-sky-400 hover:text-sky-300">Voltar</button>
      </div>

      <div className="space-y-6">
        {/* Status do Pagamento */}
        <div className="glass-panel rounded-2xl p-6 border-sky-500/30">
          <div className="flex items-center gap-3 mb-4">
            {order.payment?.status === 'paid' ? (
              <CheckCircle className="h-6 w-6 text-green-400" />
            ) : (
              <Clock className="h-6 w-6 text-amber-400" />
            )}
            <h2 className="text-2xl font-bold text-white">
              {order.payment?.status === 'paid' ? '✅ Pagamento Confirmado!' : '⏳ Aguardando Pagamento'}
            </h2>
          </div>
          <p className="text-slate-400 mb-4">
            {order.payment?.status === 'paid'
              ? 'Seu pagamento foi confirmado. Você receberá em breve um email com os próximos passos.'
              : 'Escaneie o QR Code abaixo ou copie a chave PIX para efetuar o pagamento.'}
          </p>
        </div>

        {/* Itens do Pedido */}
        <div className="glass-panel rounded-2xl p-6 border-sky-500/30">
          <h3 className="font-bold text-white mb-4 text-lg">📦 Itens</h3>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.cartId} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <span className="font-medium text-slate-300">{item.title}</span>
                <span className="font-bold text-sky-300">R$ {item.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
            <span className="font-bold text-white text-lg">Total:</span>
            <span className="font-bold text-sky-300 text-2xl">R$ {order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Pagamento via PIX */}
        {order.payment?.method === 'pix' && order.payment?.status !== 'paid' && (
          <div className="glass-panel rounded-2xl p-8 border-sky-500/30">
            <h3 className="font-bold text-white mb-6 text-lg">📲 Pagamento via PIX</h3>

            {/* QR Code */}
            <div className="flex flex-col items-center mb-8">
              <img src={qrCodeUrl} alt="QR Code PIX" className="rounded-xl border-2 border-sky-500/30 shadow-lg" />
              <p className="text-sm text-slate-400 mt-4">Escaneie este código com seu celular</p>
            </div>

            {/* Chave PIX */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Chave PIX para Copiar</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-sky-300 font-mono text-sm break-all p-3 bg-slate-950 rounded-lg">
                  {process.env.NEXT_PUBLIC_PIX_KEY || '12345678901234567890'}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(process.env.NEXT_PUBLIC_PIX_KEY || '12345678901234567890');
                    alert('Chave copiada!');
                  }}
                  className="px-4 py-2 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-colors whitespace-nowrap"
                >
                  Copiar
                </button>
              </div>
            </div>

            {/* Payload QR Text */}
            <div className="mt-6 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">BR Code (para banco):</p>
              <code className="text-sky-300 font-mono text-xs break-all block p-3 bg-slate-950 rounded-lg max-h-24 overflow-y-auto">
                {pixPayload}
              </code>
            </div>
          </div>
        )}

        {/* Pagamento via WhatsApp */}
        {order.payment?.method === 'whatsapp' && order.payment?.status !== 'paid' && (
          <div className="glass-panel rounded-2xl p-8 border-sky-500/30">
            <h3 className="font-bold text-white mb-4 text-lg">💬 Pagamento via WhatsApp</h3>
            <p className="text-slate-300 mb-6">
              Clique no botão abaixo para iniciar uma conversa comigo pelo WhatsApp. Ele te guiará através do pagamento.
            </p>
            <a
              href={`https://wa.me/5548996241068?text=Olá!%20Gostaria%20de%20pagar%20o%20pedido%20%23${order.id.slice(0, 8)}%20no%20valor%20de%20R$%20${order.total.toFixed(2)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
            >
              💚 Iniciar Chat no WhatsApp
            </a>
          </div>
        )}

        {/* Pagamento Cartão */}
        {order.payment?.method === 'card' && order.payment?.status !== 'paid' && (
          <div className="glass-panel rounded-2xl p-8 border-sky-500/30">
            <h3 className="font-bold text-white mb-4 text-lg">💳 Pagamento com Cartão</h3>
            <p className="text-slate-400 mb-6">
              Você será redirecionado para o gateway de pagamento seguro para finalizar com cartão.
            </p>
            <button className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
              Pagar com Cartão (Stripe)
            </button>
          </div>
        )}

        {/* Pagamento Manual */}
        {order.payment?.method === 'manual' && order.payment?.status !== 'paid' && (
          <div className="glass-panel rounded-2xl p-8 border-sky-500/30">
            <h3 className="font-bold text-white mb-4 text-lg">📞 Pagamento Manual</h3>
            <p className="text-slate-400 mb-6">
              Agradecemos sua escolha. Entraremos em contato em breve para finalizar o pagamento.
            </p>
            <p className="text-sm text-slate-500">
              Pedido: #{order.id.slice(0, 8)} | Valor: R$ {order.total.toFixed(2)}
            </p>
          </div>
        )}

        {/* Confirmação de Pagamento */}
        {order.payment?.status === 'paid' && (
          <div className="glass-panel rounded-2xl p-8 border-green-500/30 bg-green-500/10">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-green-300 mb-2">Pagamento Confirmado!</h3>
              <p className="text-slate-300">
                Seu pedido será processado em breve. Você receberá atualizações por email.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
