"use client";

import React, { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query } from 'firebase/firestore';
import { HomePageRenderer } from '@/components/HomePageRenderer';
import { useCart } from '@/context/CartContext';
import { DEFAULT_SERVICES } from '@/lib/defaultServices';
import { createDefaultLayout, mergeLayoutWithDefaults } from '@/lib/defaultLayout';
import { db } from '@/lib/firebase';
import { LayoutEditConfig, ServiceProduct } from '@/types';

export default function HomePage() {
  const { addToCart } = useCart();
  const [layout, setLayout] = useState<LayoutEditConfig>(createDefaultLayout());
  const [services, setServices] = useState<ServiceProduct[]>(DEFAULT_SERVICES);

  useEffect(() => {
    if (!db) {
      setLayout(createDefaultLayout());
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'layoutEdit', 'default-layout'),
      (snapshot) => {
        if (!snapshot.exists()) {
          setLayout(createDefaultLayout());
          return;
        }

        setLayout(mergeLayoutWithDefaults({ id: snapshot.id, ...snapshot.data() } as Partial<LayoutEditConfig>));
      },
      (error) => {
        console.error('Erro ao carregar layout da home:', error);
        setLayout(createDefaultLayout());
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db) {
      setServices(DEFAULT_SERVICES);
      return;
    }

    const unsubscribe = onSnapshot(
      query(collection(db, 'products')),
      (snapshot) => {
        const loadedServices = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        })) as ServiceProduct[];

        setServices(loadedServices.length > 0 ? loadedServices : DEFAULT_SERVICES);
      },
      (error) => {
        console.error('Erro ao carregar serviços da home:', error);
        setServices(DEFAULT_SERVICES);
      }
    );

    return () => unsubscribe();
  }, []);

  return <HomePageRenderer layout={layout} services={services} onAddToCart={addToCart} />;
}
