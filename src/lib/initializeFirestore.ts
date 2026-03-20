import { db } from './firebase';
import { collection, query, getDocs, addDoc, writeBatch } from 'firebase/firestore';
import { DEFAULT_SERVICES } from './defaultServices';

/**
 * Inicializa o Firestore com serviços padrão na primeira vez
 * Verifica se a coleção está vazia e popula com DEFAULT_SERVICES
 */
export async function initializeFirestoreProducts() {
  try {
    const q = query(collection(db, "products"));
    const snapshot = await getDocs(q);

    // Se já existem produtos, não faz nada
    if (snapshot.size > 0) {
      console.log(`✅ Firestore já contém ${snapshot.size} produtos`);
      return;
    }

    console.log('📦 Populando Firestore com serviços padrão...');
    const batch = writeBatch(db);
    const productsRef = collection(db, "products");

    DEFAULT_SERVICES.forEach((service) => {
      const newDocRef = addDoc(productsRef, {
        title: service.title,
        description: service.description,
        price: service.price,
        category: service.category,
        image: service.image,
        requiredDocuments: service.requiredDocuments,
        requiredFiles: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    // Aguarda todas as operações
    for (const service of DEFAULT_SERVICES) {
      await addDoc(productsRef, {
        title: service.title,
        description: service.description,
        price: service.price,
        category: service.category,
        image: service.image,
        requiredDocuments: service.requiredDocuments,
        requiredFiles: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log(`✅ ${DEFAULT_SERVICES.length} serviços adicionados ao Firestore`);
  } catch (error) {
    console.error('❌ Erro ao inicializar Firestore:', error);
  }
}
