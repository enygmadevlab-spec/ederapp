"use client";

import React, { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query } from 'firebase/firestore';
import { BusinessSectionsCards } from '@/components/BusinessSectionsCards';
import { HomePageRenderer } from '@/components/HomePageRenderer';
import { useCart } from '@/context/CartContext';
import { DEFAULT_DOCS_PRODUCTS } from '@/lib/defaultDocsProducts';
import { DEFAULT_SERVICES } from '@/lib/defaultServices';
import { BUSINESS_COLLECTIONS, normalizeServiceProduct } from '@/lib/businessSegments';
import { createDefaultLayout, mergeLayoutWithDefaults } from '@/lib/defaultLayout';
import { db } from '@/lib/firebase';
import { LayoutEditConfig, ServiceProduct } from '@/types';

export default function HomePage() {
  const { addToCart } = useCart();
  const [layout, setLayout] = useState<LayoutEditConfig>(createDefaultLayout());
  const [services, setServices] = useState<ServiceProduct[]>(DEFAULT_SERVICES);
  const [docsProducts, setDocsProducts] = useState<ServiceProduct[]>(DEFAULT_DOCS_PRODUCTS);

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
      query(collection(db, BUSINESS_COLLECTIONS.nautica)),
      (snapshot) => {
        const loadedServices = snapshot.docs.map((document) =>
          normalizeServiceProduct(
            { id: document.id, ...document.data() },
            'nautica'
          )
        );

        setServices(loadedServices.length > 0 ? loadedServices : DEFAULT_SERVICES);
      },
      (error) => {
        console.error('Erro ao carregar serviços da home:', error);
        setServices(DEFAULT_SERVICES);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db) {
      setDocsProducts(DEFAULT_DOCS_PRODUCTS);
      return;
    }

    const unsubscribe = onSnapshot(
      query(collection(db, BUSINESS_COLLECTIONS.docs)),
      (snapshot) => {
        const loadedProducts = snapshot.docs.map((document) =>
          normalizeServiceProduct(
            { id: document.id, ...document.data() },
            'docs'
          )
        );

        setDocsProducts(loadedProducts.length > 0 ? loadedProducts : DEFAULT_DOCS_PRODUCTS);
      },
      (error) => {
        console.error('Erro ao carregar docs PVC da home:', error);
        setDocsProducts(DEFAULT_DOCS_PRODUCTS);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <>
      <BusinessSectionsCards
        nauticaCount={services.length}
        docsCount={docsProducts.length}
        placement="top"
      />
      <HomePageRenderer layout={layout} services={services} onAddToCart={addToCart} />
    </>
  );
}
