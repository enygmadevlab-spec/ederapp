"use client";
import { useEffect } from 'react';
import { initializeFirestoreProducts } from '@/lib/initializeFirestore';

export function FirestoreInitializer() {
  useEffect(() => {
    // Inicializa Firestore com serviços padrão na primeira carga
    initializeFirestoreProducts();
  }, []);

  return null; // Componente invisível, apenas executa o efeito
}
