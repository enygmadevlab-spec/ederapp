"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Upload, FileCheck, Trash2, ArrowRight, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function CheckoutPage() {
  const { cart, removeFromCart, updateItemDocument, placeOrder, isUploading } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'whatsapp' | 'card' | 'manual'>('pix');

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-32 text-center text-white">
        <div className="inline-block p-6 rounded-full bg-slate-800/50 backdrop-blur mb-6">
          <AlertCircle className="h-12 w-12 text-slate-400" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Seu carrinho está vazio</h2>
        <button onClick={() => router.push('/services')} className="text-sky-400 hover:text-sky-300 font-medium hover:underline text-lg">
          Voltar para serviços
        </button>
      </div>
    );
  }

  const handleFinishOrder = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setError(null);

    try {
      const orderId = await placeOrder(user.id, user.name, paymentMethod);
      if (orderId) {
        router.push(`/checkout/${orderId}`);
      } else {
        router.push('/dashboard/client');
      }
    } catch (err) {
      setError('Ocorreu um erro ao processar seu pedido. Tente novamente.');
      console.error(err);
    }
  };

  const handleFileChange = (cartId: string, docName: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      updateItemDocument(cartId, docName, event.target.files[0]);
      setError(null);
    }
  };

  const total = cart.reduce((acc, item) => acc + item.price, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-12 animate-fade-in">
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">📋 Finalizar Solicitação</h1>

      {error && (
        <div className="bg-red-500/10 backdrop-blur border border-red-500/50 text-red-200 px-6 py-4 rounded-xl mb-8 flex items-center gap-3 shadow-lg">
          <AlertCircle className="h-6 w-6 shrink-0" />
          {error}
        </div>
      )}

      {isUploading && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex flex-col items-center justify-center">
          <Loader2 className="h-16 w-16 text-sky-400 animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-white">Enviando Documentos...</h2>
          <p className="text-slate-400 mt-2">Criptografando e salvando na nuvem. Aguarde.</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-sky-600/10 border border-sky-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
          <p className="text-sm text-sky-200">
            <span className="font-semibold">ℹ️ Dica:</span> Você pode enviar os documentos agora ou adicionar depois no seu painel de cliente. Não é necessário completar tudo agora.
          </p>
        </div>
      </div>

      <div className="space-y-6 mt-6">
        {cart.map((item, index) => (
          <div key={item.cartId} className="glass-panel rounded-2xl overflow-hidden shadow-lg transition-all hover:shadow-xl">
            <div className="bg-sky-50/10 backdrop-blur px-4 sm:px-6 md:px-8 py-4 border-b border-sky-500/20 flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-lg sm:text-xl flex items-center gap-3">
                  <span className="bg-sky-600 text-white w-7 h-7 rounded-lg text-sm flex items-center justify-center shadow-md shadow-sky-500/30">{index + 1}</span>
                  <span className="truncate">{item.title}</span>
                </h3>
                <p className="text-sm text-slate-400 mt-1 font-medium">
                  {item.category === 'insurance' ? '🛡️ Seguro' : item.category === 'license' ? '📜 Licença' : '📝 Documentação'}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="font-bold text-sky-300 text-lg sm:text-xl">R$ {item.price.toFixed(2)}</span>
                <button
                  onClick={() => removeFromCart(item.cartId)}
                  className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-500/10 transition-colors"
                  title="Remover item"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <p className="text-sm font-semibold text-sky-300 mb-5 uppercase tracking-wide">📎 Anexe os documentos (opcional):</p>
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {item.requiredDocuments.map((doc) => {
                  const isUploaded = !!item.uploadedDocs[doc];
                  return (
                    <div key={doc} className={`border rounded-xl p-4 transition-all duration-300 min-h-[110px] flex flex-col justify-between ${isUploaded ? 'border-sky-400/50 bg-sky-500/10' : 'border-slate-600 bg-slate-800/50 hover:bg-slate-800'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <label className="text-sm font-bold text-slate-200 block max-w-[85%] leading-tight">
                          {doc}
                        </label>
                        {isUploaded ? <CheckCircle className="h-5 w-5 text-sky-400" /> : <AlertCircle className="h-5 w-5 text-amber-500" />}
                      </div>

                      <div className="relative">
                        <input
                          type="file"
                          id={`file-${item.cartId}-${doc}`}
                          className="hidden"
                          onChange={(e) => handleFileChange(item.cartId, doc, e)}
                        />
                        <label
                          htmlFor={`file-${item.cartId}-${doc}`}
                          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border text-sm font-bold cursor-pointer transition-all ${
                            isUploaded
                              ? 'border-sky-400/50 text-sky-300 bg-sky-500/10'
                              : 'border-slate-600 text-slate-400 hover:text-sky-400 hover:border-sky-400/50 hover:bg-sky-500/5'
                          }`}
                        >
                          {isUploaded ? (
                            <>
                              <FileCheck className="h-4 w-4" />
                              <span className="truncate max-w-[140px]">{item.uploadedDocs[doc]?.name}</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Anexar arquivo
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 space-y-6">
        <div className="glass-panel rounded-2xl p-6 border-sky-500/30">
          <h3 className="font-bold text-white mb-4 text-lg">💳 Método de Pagamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['pix', 'whatsapp', 'card', 'manual'] as const).map((method) => (
              <label key={method} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="sr-only"
                />
                <div className={`p-4 rounded-lg border-2 transition-all text-center font-semibold ${
                  paymentMethod === method
                    ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                    : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500'
                }`}>
                  {method === 'pix' && '📲 PIX'}
                  {method === 'whatsapp' && '💬 WhatsApp'}
                  {method === 'card' && '💳 Cartão'}
                  {method === 'manual' && '📞 Manual'}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-sky-600/20 to-cyan-600/20 border border-sky-500/30 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-slate-400 text-sm mb-2">Total do Pedido</p>
            <p className="text-4xl font-black text-sky-300">R$ {total.toFixed(2)}</p>
          </div>
          <button
            onClick={handleFinishOrder}
            disabled={isUploading}
            className="flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-sky-500 to-cyan-500 text-[#020c1b] font-bold text-lg rounded-xl hover:from-sky-400 hover:to-cyan-400 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-500/30"
          >
            ✨ Finalizar Pedido
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}