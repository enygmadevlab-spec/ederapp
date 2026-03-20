"use client";
import { useEffect, useRef } from 'react';
import { initializeFirestoreProducts } from '@/lib/initializeFirestore';

export function FirestoreInitializer() {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    void initializeFirestoreProducts();
  }, []);

  return null; // Componente invisível, apenas executa o efeito
}
