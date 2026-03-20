"use client";
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { CartItem, Order, OrderItem, ServiceProduct } from '../types';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: ServiceProduct) => void;
  removeFromCart: (cartId: string) => void;
  removeOneFromProduct: (productId: string) => void;
  updateItemDocument: (cartId: string, docName: string, file: File) => void;
  clearCart: () => void;
  placeOrder: (userId: string, userName: string, paymentMethod?: 'pix' | 'whatsapp' | 'card' | 'manual') => Promise<string | null>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  isUploading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'eder-cart-items';

type PersistedCartItem = Omit<CartItem, 'uploadedDocs'>;

function createLocalId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function createOrderReference() {
  return createLocalId().replace(/-/g, '').slice(0, 10).toUpperCase();
}

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [cartHydrated, setCartHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);

      if (!storedCart) {
        setCartHydrated(true);
        return;
      }

      const parsedCart = JSON.parse(storedCart) as PersistedCartItem[];
      setCart(parsedCart.map((item) => ({ ...item, uploadedDocs: {} })));
    } catch (error) {
      console.error('Erro ao restaurar carrinho salvo:', error);
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } finally {
      setCartHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!cartHydrated) {
      return;
    }

    try {
      if (cart.length === 0) {
        window.localStorage.removeItem(CART_STORAGE_KEY);
        return;
      }

      const persistedCart: PersistedCartItem[] = cart.map(({ uploadedDocs, ...item }) => item);
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(persistedCart));
    } catch (error) {
      console.error('Erro ao salvar carrinho localmente:', error);
    }
  }, [cart, cartHydrated]);

  const addToCart = (product: ServiceProduct) => {
    const newItem: CartItem = {
      ...product,
      cartId: createLocalId(),
      uploadedDocs: {}
    };
    setCart(prev => [...prev, newItem]);
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const removeOneFromProduct = (productId: string) => {
    setCart(prev => {
      const indexToRemove = prev.findIndex(item => item.id === productId);

      if (indexToRemove === -1) {
        return prev;
      }

      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const updateItemDocument = (cartId: string, docName: string, file: File) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        return {
          ...item,
          uploadedDocs: {
            ...item.uploadedDocs,
            [docName]: file
          }
        };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const placeOrder = async (userId: string, userName: string, paymentMethod: 'pix' | 'whatsapp' | 'card' | 'manual' = 'pix'): Promise<string | null> => {
    if (!db || !storage) {
      throw new Error('Firebase indisponível para finalizar o pedido.');
    }

    setIsUploading(true);
    try {
      const orderId = createOrderReference();
      const processedItems: OrderItem[] = [];

      for (const item of cart) {
         const uploadedDocsUrls: Record<string, string> = {};

         for (const [docName, file] of Object.entries(item.uploadedDocs)) {
            if (file) {
               const safeDocName = docName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
               const storagePath = `users/${userId}/orders/${orderId}/${item.cartId}/${safeDocName}`;
               const storageRef = ref(storage, storagePath);
               await uploadBytes(storageRef, file);
               const downloadUrl = await getDownloadURL(storageRef);
               uploadedDocsUrls[docName] = downloadUrl;
            }
         }

         processedItems.push({
            ...item,
            uploadedDocs: uploadedDocsUrls
         });
      }

      const newOrderData: Omit<Order, 'id'> = {
        userId,
        userName,
        items: processedItems,
        total: cart.reduce((acc, item) => acc + item.price, 0),
        status: 'pending_payment',
        date: new Date().toISOString(),
        payment: {
          method: paymentMethod,
          status: 'pending_payment',
          createdAt: new Date().toISOString()
        }
      };

      const docRef = await addDoc(collection(db, "orders"), newOrderData);
      clearCart();
      return docRef.id;
    } catch (error) {
        console.error("Error placing order:", error);
        throw error;
    } finally {
        setIsUploading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    if (!db) {
      throw new Error('Firebase indisponível para atualizar o pedido.');
    }

    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, { status });
    } catch (error) {
        console.error("Error updating status:", error);
        throw error;
    }
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, removeOneFromProduct, updateItemDocument, clearCart, placeOrder, updateOrderStatus, isUploading }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
