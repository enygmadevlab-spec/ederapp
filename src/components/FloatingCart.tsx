"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, ChevronDown, ChevronUp, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { CartItem } from '@/types';

interface GroupedCartItem {
  productId: string;
  quantity: number;
  subtotal: number;
  sample: CartItem;
}

export function FloatingCart() {
  const { cart, addToCart, removeOneFromProduct } = useCart();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const previousCountRef = useRef(cart.length);

  const shouldHide =
    cart.length === 0 ||
    pathname === '/checkout' ||
    pathname.startsWith('/checkout/');

  useEffect(() => {
    if (cart.length > previousCountRef.current) {
      setIsOpen(true);
    }

    previousCountRef.current = cart.length;
  }, [cart.length]);

  const groupedItems = useMemo<GroupedCartItem[]>(() => {
    const grouped = cart.reduce<Record<string, GroupedCartItem>>((accumulator, item) => {
      if (!accumulator[item.id]) {
        accumulator[item.id] = {
          productId: item.id,
          quantity: 0,
          subtotal: 0,
          sample: item,
        };
      }

      accumulator[item.id].quantity += 1;
      accumulator[item.id].subtotal += item.price;

      return accumulator;
    }, {});

    return Object.values(grouped);
  }, [cart]);

  const total = useMemo(
    () => cart.reduce((accumulator, item) => accumulator + item.price, 0),
    [cart]
  );

  if (shouldHide) {
    return null;
  }

  return (
    <div className="fixed z-[80] bottom-4 left-4 right-4 sm:left-auto sm:w-[390px]">
      {isOpen && (
        <div className="theme-panel mb-3 overflow-hidden rounded-[28px] shadow-[0_24px_60px_rgba(2,12,27,0.28)] backdrop-blur-xl">
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: 'var(--theme-surface-border)' }}
          >
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] theme-text-subtle font-bold">Carrinho</p>
              <h3 className="mt-1 text-lg font-black theme-text-strong">Resumo da compra</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="theme-toggle rounded-full p-2"
              aria-label="Fechar carrinho flutuante"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto px-4 py-4 space-y-3">
            {groupedItems.map((item) => (
              <div
                key={item.productId}
                className="theme-panel-soft rounded-2xl p-3 flex items-start gap-3"
              >
                <img
                  src={item.sample.image}
                  alt={item.sample.title}
                  className="h-14 w-14 rounded-xl object-cover border"
                  style={{ borderColor: 'var(--theme-surface-border)' }}
                />

                <div className="min-w-0 flex-1">
                  <p className="theme-text-strong text-sm font-bold leading-5 line-clamp-2">
                    {item.sample.title}
                  </p>
                  <p className="mt-1 text-xs theme-text-muted">
                    R$ {item.sample.price.toFixed(2)} cada
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-full theme-panel overflow-hidden">
                      <button
                        type="button"
                        onClick={() => removeOneFromProduct(item.productId)}
                        className="px-2.5 py-1.5 theme-text-body hover:text-sky-400 transition-colors"
                        aria-label={`Diminuir quantidade de ${item.sample.title}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-8 text-center text-sm font-bold theme-text-strong">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => addToCart(item.sample)}
                        className="px-2.5 py-1.5 theme-text-body hover:text-sky-400 transition-colors"
                        aria-label={`Aumentar quantidade de ${item.sample.title}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <p className="text-sm font-black text-sky-400">
                      R$ {item.subtotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="px-5 py-4 border-t bg-black/10"
            style={{ borderColor: 'var(--theme-surface-border)' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] theme-text-subtle font-semibold">Total</p>
                <p className="mt-1 text-2xl font-black text-sky-400">R$ {total.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs theme-text-subtle">Itens</p>
                <p className="text-sm font-bold theme-text-strong">{cart.length}</p>
              </div>
            </div>

            <Link
              href="/checkout"
              className="flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-3.5 text-sm font-black text-white transition hover:from-sky-500 hover:to-cyan-400 hover:-translate-y-0.5"
            >
              Finalizar e ir para o checkout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="theme-panel ml-auto flex w-full items-center justify-between gap-3 rounded-[24px] px-4 py-3 shadow-[0_18px_45px_rgba(2,12,27,0.25)] sm:w-auto sm:min-w-[310px]"
        aria-label="Abrir carrinho flutuante"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 text-white shadow-lg shadow-sky-500/25">
            <ShoppingBag className="h-5 w-5" />
          </div>

          <div className="text-left">
            <p className="text-[11px] uppercase tracking-[0.24em] theme-text-subtle font-bold">Carrinho</p>
            <p className="theme-text-strong text-sm font-black">
              {cart.length} {cart.length === 1 ? 'item' : 'itens'}
            </p>
          </div>
        </div>

        <div className="ml-auto text-right">
          <p className="text-[11px] uppercase tracking-[0.2em] theme-text-subtle font-bold">Total</p>
          <p className="text-lg font-black text-sky-400">R$ {total.toFixed(2)}</p>
        </div>

        {isOpen ? (
          <ChevronDown className="h-5 w-5 theme-text-body" />
        ) : (
          <ChevronUp className="h-5 w-5 theme-text-body" />
        )}
      </button>
    </div>
  );
}
