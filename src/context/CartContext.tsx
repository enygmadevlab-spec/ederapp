"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ServiceProduct, CartItem, Order, OrderItem } from '../types';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: ServiceProduct) => void;
  removeFromCart: (cartId: string) => void;
  updateItemDocument: (cartId: string, docName: string, file: File) => void;
  clearCart: () => void;
  orders: Order[];
  placeOrder: (userId: string, userName: string, paymentMethod?: 'pix' | 'whatsapp' | 'card' | 'manual') => Promise<string | null>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  isUploading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const addToCart = (product: ServiceProduct) => {
    const newItem: CartItem = {
      ...product,
      cartId: Math.random().toString(36).substr(2, 9),
      uploadedDocs: {}
    };
    setCart([...cart, newItem]);
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(item => item.cartId !== cartId));
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
    setIsUploading(true);
    try {
      const orderId = Math.random().toString(36).substr(2, 9).toUpperCase();
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
    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, { status });
    } catch (error) {
        console.error("Error updating status:", error);
        throw error;
    }
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateItemDocument, clearCart, orders, placeOrder, updateOrderStatus, isUploading }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};