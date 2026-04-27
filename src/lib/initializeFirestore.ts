import { db } from './firebase';
import { addDoc, collection, getDocs, query } from 'firebase/firestore';
import { DEFAULT_SERVICES } from './defaultServices';
import { DEFAULT_DOCS_PRODUCTS } from './defaultDocsProducts';
import { ServiceProduct } from '@/types';
import { BUSINESS_COLLECTIONS, normalizeBusinessSegment } from './businessSegments';

let initializationPromise: Promise<void> | null = null;

function normalizeTitleKey(title: string) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function createProductPayload(service: ServiceProduct) {
  return {
    title: service.title,
    description: service.description,
    price: service.price,
    category: service.category,
    image: service.image,
    requiredDocuments: service.requiredDocuments,
    requiredFiles: [],
    businessSegment: normalizeBusinessSegment(service.businessSegment),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function initializeCollection(collectionName: string, defaults: ServiceProduct[]) {
  const productsRef = collection(db!, collectionName);
  const snapshot = await getDocs(query(productsRef));
  const existingTitleKeys = new Set(
    snapshot.docs
      .map((document) => document.data().title)
      .filter((title): title is string => typeof title === 'string' && title.trim().length > 0)
      .map((title) => normalizeTitleKey(title))
  );

  if (snapshot.size > 0) {
    const missingDefaults = defaults.filter(
      (service) => !existingTitleKeys.has(normalizeTitleKey(service.title))
    );

    if (missingDefaults.length === 0) {
      console.log(`✅ Firestore já contém ${snapshot.size} registros em ${collectionName}`);
      return;
    }

    console.log(`🧩 Adicionando ${missingDefaults.length} itens novos em ${collectionName}...`);

    await Promise.all(
      missingDefaults.map((service) => addDoc(productsRef, createProductPayload(service)))
    );

    console.log(`✅ ${missingDefaults.length} novos serviços adicionados em ${collectionName}`);
    return;
  }

  console.log(`📦 Populando ${collectionName} com serviços padrão...`);

  await Promise.all(
    defaults.map((service) => addDoc(productsRef, createProductPayload(service)))
  );

  console.log(`✅ ${defaults.length} serviços adicionados em ${collectionName}`);
}

/**
 * Inicializa o Firestore com serviços padrão na primeira vez
 * Verifica se a coleção está vazia e popula com DEFAULT_SERVICES
 */
export async function initializeFirestoreProducts() {
  if (!db) {
    return;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      await initializeCollection(BUSINESS_COLLECTIONS.nautica, DEFAULT_SERVICES);
      await initializeCollection(BUSINESS_COLLECTIONS.docs, DEFAULT_DOCS_PRODUCTS);
    } catch (error) {
      console.error('❌ Erro ao inicializar Firestore:', error);
      throw error;
    }
  })();

  try {
    await initializationPromise;
  } finally {
    initializationPromise = null;
  }
}
