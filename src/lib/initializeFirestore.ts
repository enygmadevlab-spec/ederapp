import { db } from './firebase';
import { addDoc, collection, getDocs, query } from 'firebase/firestore';
import { DEFAULT_SERVICES } from './defaultServices';
import { ServiceProduct } from '@/types';

let initializationPromise: Promise<void> | null = null;

function createProductPayload(service: ServiceProduct) {
  return {
    title: service.title,
    description: service.description,
    price: service.price,
    category: service.category,
    image: service.image,
    requiredDocuments: service.requiredDocuments,
    requiredFiles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
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
    const productsRef = collection(db, "products");
    try {
      const snapshot = await getDocs(query(productsRef));

      if (snapshot.size > 0) {
        console.log(`✅ Firestore já contém ${snapshot.size} produtos`);
        return;
      }

      console.log('📦 Populando Firestore com serviços padrão...');

      await Promise.all(
        DEFAULT_SERVICES.map((service) => addDoc(productsRef, createProductPayload(service)))
      );

      console.log(`✅ ${DEFAULT_SERVICES.length} serviços adicionados ao Firestore`);
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
