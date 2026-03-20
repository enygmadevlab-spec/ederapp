"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Order, Product, OrderItem, LayoutEditConfig, ServiceProduct } from '@/types';
import { 
  BarChart3, Package, ShoppingCart, TrendingUp, LogOut, Menu, X,
  CheckCircle, Clock, AlertCircle, Loader2, Search, Plus, FileText,
  DollarSign, ArrowUpRight, ArrowDownLeft, Users, Palette, Trash2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { LayoutEditor } from '@/components/LayoutEditor';
import { DEFAULT_SERVICES } from '@/lib/defaultServices';
import { createDefaultLayout, mergeLayoutWithDefaults } from '@/lib/defaultLayout';

type AdminTab = 'dashboard' | 'orders' | 'completed' | 'products' | 'stats' | 'layout';

interface User {
  id: string;
  name?: string;
  email: string;
  role?: string;
}

interface ProductFormData {
  title: string;
  description: string;
  price: number;
  category: 'insurance' | 'license' | 'bureaucracy';
  requiredDocuments: string[];
  requiredFiles: string[];
  image?: string;
  imageFile?: File | null;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userPromoting, setUserPromoting] = useState<Record<string, boolean>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    price: 0,
    category: 'insurance',
    requiredDocuments: [],
    requiredFiles: [],
    image: '',
    imageFile: null
  });
  const [newDoc, setNewDoc] = useState('');
  const [newFile, setNewFile] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderItem, setSelectedOrderItem] = useState<OrderItem | null>(null);
  const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [currentLayout, setCurrentLayout] = useState<LayoutEditConfig>(createDefaultLayout());
  const [layoutLoading, setLayoutLoading] = useState(false);
  const { user: adminUser } = useAuth();
  const router = useRouter();

  // Verificar se é admin
  useEffect(() => {
    if (!adminUser) {
      router.push('/login');
      return;
    }
    if (adminUser.role !== 'admin') {
      router.push('/dashboard/client');
    }
  }, [adminUser, router]);

  // Carregar pedidos
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders: Order[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      setOrders(fetchedOrders);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Carregar usuários
  useEffect(() => {
    const loadUsers = async () => {
      setUsersLoading(true);
      try {
        const q = query(collection(db, "users"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedUsers: User[] = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            email: doc.data().email,
            role: doc.data().role
          }));
          setUsers(fetchedUsers);
          setUsersLoading(false);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        setUsersLoading(false);
      }
    };
    loadUsers();
  }, []);

  // Carregar produtos
  useEffect(() => {
    const loadProducts = async () => {
      setProductsLoading(true);
      try {
        const q = query(collection(db, "products"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedProducts: Product[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Product));
          setProducts(fetchedProducts);
          setProductsLoading(false);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        setProductsLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Carregar layouts
  useEffect(() => {
    setLayoutLoading(true);

    const unsubscribe = onSnapshot(
      doc(db, 'layoutEdit', 'default-layout'),
      (snapshot) => {
        if (!snapshot.exists()) {
          setCurrentLayout(createDefaultLayout());
          setLayoutLoading(false);
          return;
        }

        setCurrentLayout(
          mergeLayoutWithDefaults({
            id: snapshot.id,
            ...snapshot.data(),
          } as Partial<LayoutEditConfig>)
        );
        setLayoutLoading(false);
      },
      (error) => {
        console.error('Erro ao carregar layout principal:', error);
        setCurrentLayout(createDefaultLayout());
        setLayoutLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Cálculos de estatísticas
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending_payment' || o.status === 'pending_docs').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const revenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.total, 0);
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const avgTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

    return { total, pending, completed, revenue, totalRevenue, avgTicket };
  }, [orders]);

  const pendingOrders = useMemo(() => {
    return orders.filter(o => o.status === 'pending_payment' || o.status === 'pending_docs');
  }, [orders]);

  const completedOrders = useMemo(() => {
    return orders.filter(o => o.status === 'completed');
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let result = activeTab === 'completed' ? completedOrders : activeTab === 'orders' ? pendingOrders : [];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.userName?.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.items.some(i => i.title.toLowerCase().includes(q))
      );
    }
    return result;
  }, [activeTab, searchQuery, completedOrders, pendingOrders]);

  const previewServices = useMemo<ServiceProduct[]>(() => {
    if (products.length === 0) {
      return DEFAULT_SERVICES;
    }

    return products.map((product) => ({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      requiredDocuments: product.requiredDocuments,
      image: product.image || DEFAULT_SERVICES[0]?.image || '',
    }));
  }, [products]);

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleLogout = async () => {
    router.push('/login');
  };

  const toggleUserAdmin = async (userId: string, makeAdmin: boolean) => {
    if (!confirm(`Confirma ${makeAdmin ? 'conceder' : 'remover'} acesso de admin?`)) return;
    try {
      setUserPromoting(p => ({ ...p, [userId]: true }));
      await setDoc(doc(db, 'users', userId), { role: makeAdmin ? 'admin' : 'client' }, { merge: true });
      alert('Role atualizado com sucesso');
    } catch (err) {
      console.error(err);
      alert('Falha ao atualizar role');
    } finally {
      setUserPromoting(p => ({ ...p, [userId]: false }));
    }
  };

  const handleUploadMissingDocument = async (docName: string, file: File) => {
    if (!selectedOrder || !selectedOrderItem) return;
    
    try {
      setUploadingDocs(p => ({ ...p, [docName]: true }));
      
      const safeDocName = docName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const storagePath = `users/${selectedOrder.userId}/orders/${selectedOrder.id}/${selectedOrderItem.cartId}/${safeDocName}`;
      const storageRef = ref(storage, storagePath);
      
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Atualizar o documento do pedido com o novo arquivo
      const orderRef = doc(db, 'orders', selectedOrder.id);
      const updatedItems = selectedOrder.items.map(item => {
        if (item.cartId === selectedOrderItem.cartId) {
          return {
            ...item,
            uploadedDocs: {
              ...item.uploadedDocs,
              [docName]: downloadUrl
            }
          };
        }
        return item;
      });
      
      await updateDoc(orderRef, { items: updatedItems });
      alert('Documento enviado com sucesso!');
      
      // Atualizar estado local
      setSelectedOrderItem({
        ...selectedOrderItem,
        uploadedDocs: {
          ...selectedOrderItem.uploadedDocs,
          [docName]: downloadUrl
        }
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao enviar documento');
    } finally {
      setUploadingDocs(p => ({ ...p, [docName]: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_docs': return 'bg-yellow-600/30 text-yellow-300 border-yellow-500/50';
      case 'pending_payment': return 'bg-orange-600/30 text-orange-300 border-orange-500/50';
      case 'processing': return 'bg-blue-600/30 text-blue-300 border-blue-500/50';
      case 'paid': return 'bg-cyan-600/30 text-cyan-300 border-cyan-500/50';
      case 'completed': return 'bg-green-600/30 text-green-300 border-green-500/50';
      case 'rejected': return 'bg-red-600/30 text-red-300 border-red-500/50';
      default: return 'bg-slate-600/30 text-slate-300 border-slate-500/50';
    }
  };

  const isDocumentUploaded = (docName: string): boolean => {
    if (!selectedOrderItem) return false;
    return selectedOrderItem.uploadedDocs && selectedOrderItem.uploadedDocs[docName] ? true : false;
  };

  const handleEditUser = async () => {
    if (!selectedUser || !editingUser) return;
    
    if (!editingUser.name || !editingUser.email) {
      alert('Nome e email são obrigatórios');
      return;
    }

    try {
      await setDoc(doc(db, 'users', selectedUser.id), editingUser, { merge: true });
      alert('Usuário atualizado com sucesso!');
      setEditingUser(null);
      // Atualizar lista local
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...editingUser } as User : u));
      setSelectedUser({ ...selectedUser, ...editingUser } as User);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      alert('Erro ao atualizar usuário');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    if (!confirm(`Tem certeza que deseja deletar o usuário ${selectedUser.name}? Esta ação é irreversível.`)) {
      return;
    }

    try {
      setDeletingUserId(selectedUser.id);
      await deleteDoc(doc(db, 'users', selectedUser.id));
      alert('Usuário deletado com sucesso!');
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setSelectedUser(null);
      setEditingUser(null);
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      alert('Erro ao deletar usuário');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleSaveLayout = async (layout: LayoutEditConfig) => {
    try {
      const normalizedLayout = mergeLayoutWithDefaults({
        ...layout,
        id: 'default-layout',
        name: layout.name || 'Layout Principal do Site',
        description: layout.description || 'Configuração visual da página inicial',
        createdAt: currentLayout.createdAt || layout.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: adminUser?.id || currentLayout.createdBy || 'unknown',
      });

      await setDoc(doc(db, 'layoutEdit', 'default-layout'), normalizedLayout, { merge: true });
      setCurrentLayout(normalizedLayout);
      alert('Layout principal salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar layout:', error);
      alert('Erro ao salvar layout');
    }
  };

  const handleSaveProduct = async () => {
    if (!formData.title || !formData.description || formData.price <= 0 || formData.requiredDocuments.length === 0) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      let imageUrl = formData.image;
      
      // Upload de imagem se fornecida
      if (formData.imageFile) {
        const storageRef = ref(storage, `products/${formData.imageFile.name}-${Date.now()}`);
        await uploadBytes(storageRef, formData.imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const productData = {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        requiredDocuments: formData.requiredDocuments,
        requiredFiles: formData.requiredFiles,
        image: imageUrl,
        updatedAt: new Date().toISOString()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        alert('Produto atualizado com sucesso');
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: new Date().toISOString()
        });
        alert('Produto criado com sucesso');
      }

      resetForm();
      setShowProductForm(false);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto');
    }
  };

  const handleDeleteProduct = async (productId: string, imageUrl?: string) => {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return;
    
    try {
      if (imageUrl) {
        const storageRef = ref(storage, imageUrl);
        try {
          await deleteObject(storageRef);
        } catch (e) {
          console.warn('Erro ao deletar imagem:', e);
        }
      }

      await deleteDoc(doc(db, 'products', productId));
      alert('Produto deletado com sucesso');
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      alert('Erro ao deletar produto');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: 0,
      category: 'insurance',
      requiredDocuments: [],
      requiredFiles: [],
      image: '',
      imageFile: null
    });
    setNewDoc('');
    setNewFile('');
    setEditingProduct(null);
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      requiredDocuments: product.requiredDocuments,
      requiredFiles: product.requiredFiles || [],
      image: product.image,
      imageFile: null
    });
    setShowProductForm(true);
  };

  const StatCard = ({ icon: Icon, label, value, trend }: any) => (
    <div className="glass-panel p-6 rounded-xl border border-sky-500/20 hover:border-sky-500/40 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-400 font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 flex items-center gap-1 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
              {Math.abs(trend)}%
            </p>
          )}
        </div>
        <div className="p-3 bg-sky-600/20 rounded-lg border border-sky-500/30">
          <Icon className="h-6 w-6 text-sky-400" />
        </div>
      </div>
    </div>
  );

  if (!adminUser || adminUser.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#020c1b]">
        <Loader2 className="h-10 w-10 text-sky-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#020c1b] overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white/5 backdrop-blur border-r border-sky-500/20 transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-sky-500/20">
          <div className="flex items-center justify-between">
            {sidebarOpen && <h1 className="text-xl font-bold text-sky-300">🎯 Admin</h1>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: BarChart3 },
            { id: 'orders' as AdminTab, label: 'Pedidos Pendentes', icon: ShoppingCart },
            { id: 'completed' as AdminTab, label: 'Vendas Finalizadas', icon: CheckCircle },
            { id: 'products' as AdminTab, label: 'Produtos', icon: Package },
            { id: 'layout' as AdminTab, label: 'Layout Editor', icon: Palette },
            { id: 'stats' as AdminTab, label: 'Estatísticas', icon: TrendingUp },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === id
                  ? 'bg-sky-600/30 text-sky-300 border border-sky-500/50'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
            </button>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-sky-500/20 space-y-2">
          {sidebarOpen && (
            <div className="text-xs text-slate-400 truncate">
              <p className="font-semibold text-slate-300 truncate">{adminUser?.name}</p>
              <p className="truncate">{adminUser?.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors text-sm font-medium border border-red-500/30"
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && 'Sair'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white/5 backdrop-blur border-b border-sky-500/20 p-6 flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-2xl font-bold text-white capitalize">
            {activeTab === 'dashboard' && '📊 Dashboard'}
            {activeTab === 'orders' && '📦 Pedidos Pendentes'}
            {activeTab === 'completed' && '✅ Vendas Finalizadas'}
            {activeTab === 'products' && '🛍️ Produtos'}
            {activeTab === 'layout' && '🎨 Layout Editor'}
            {activeTab === 'stats' && '📈 Estatísticas'}
          </h2>
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-sky-500/30 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <StatCard icon={ShoppingCart} label="Total Pedidos" value={stats.total} />
                  <StatCard icon={Clock} label="Pendentes" value={stats.pending} />
                  <StatCard icon={CheckCircle} label="Concluídos" value={stats.completed} />
                  <StatCard icon={DollarSign} label="Receita Finalizada" value={`R$ ${stats.revenue.toFixed(2)}`} />
                  <StatCard icon={TrendingUp} label="Receita Total" value={`R$ ${stats.totalRevenue.toFixed(2)}`} />
                </div>

                <div className="glass-panel rounded-xl border border-sky-500/20 p-6">
                  <h3 className="text-lg font-bold text-sky-300 mb-4">📋 Pedidos Recentes</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-sky-500/20">
                          <th className="text-left py-3 px-4 text-slate-400 font-semibold">Cliente</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-semibold">Pedido ID</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-semibold">Valor</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-semibold">Status</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-semibold">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 10).map(order => (
                          <tr key={order.id} className="border-b border-sky-500/10 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 text-slate-300">{order.userName || 'Anônimo'}</td>
                            <td className="py-3 px-4 text-slate-400 font-mono text-xs">{order.id.slice(0, 8)}</td>
                            <td className="py-3 px-4 text-sky-300 font-semibold">R$ {order.total.toFixed(2)}</td>
                            <td className="py-3 px-4">
                              <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                                {order.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-xs">{new Date(order.date).toLocaleDateString('pt-BR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* User Management on Dashboard */}
                <div className="glass-panel p-6 rounded-2xl border border-sky-500/20">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Gerenciar Usuários ({users.length})
                    </h3>
                  </div>

                  {usersLoading ? (
                    <div className="text-center text-slate-400 py-8">Carregando usuários...</div>
                  ) : users.length === 0 ? (
                    <div className="text-sm text-slate-400 py-8">Nenhum usuário encontrado</div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {users.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-sky-500/10 hover:border-sky-500/30 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full bg-sky-600/30 flex items-center justify-center border border-sky-500/30">
                              <Users className="h-5 w-5 text-sky-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-white truncate">{u.name || '(sem nome)'}</div>
                              <div className="text-xs text-slate-400 truncate">{u.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                              u.role === 'admin' 
                                ? 'bg-sky-600/30 text-sky-300 border border-sky-500/30' 
                                : 'bg-slate-600/30 text-slate-300 border border-slate-500/30'
                            }`}>
                              {u.role === 'admin' ? '👑 Admin' : 'Cliente'}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setEditingUser(null);
                              }}
                              className="px-3 py-1 bg-cyan-600 text-white rounded-lg text-xs hover:bg-cyan-500 transition-colors font-medium whitespace-nowrap"
                            >
                              Detalhes
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <div className="glass-panel p-12 text-center rounded-xl border border-sky-500/20">
                    <Package className="h-12 w-12 mx-auto text-slate-500 mb-4" />
                    <p className="text-slate-400">Nenhum pedido pendente</p>
                  </div>
                ) : (
                  filteredOrders.map(order => (
                    <div key={order.id} className="glass-panel p-6 rounded-xl border border-sky-500/20 hover:border-sky-500/40 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-white">{order.userName || 'Cliente'}</h4>
                          <p className="text-xs text-slate-400 font-mono">ID: {order.id}</p>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        {order.items.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedOrder(order);
                              setSelectedOrderItem(item);
                            }}
                            className="w-full text-left text-sm text-slate-300 bg-white/5 hover:bg-sky-600/20 p-3 rounded border border-sky-500/20 hover:border-sky-500/50 transition-all"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-white">{item.title}</p>
                                <p className="text-xs text-slate-400 mt-1">R$ {item.price.toFixed(2)}</p>
                              </div>
                              <div className="text-right">
                                {item.requiredDocuments && item.requiredDocuments.length > 0 && (
                                  <p className="text-xs text-sky-300">
                                    {Object.keys(item.uploadedDocs || {}).length}/{item.requiredDocuments.length} docs
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-sky-500/20">
                        <div>
                          <p className="text-sm text-slate-400">Total</p>
                          <p className="text-xl font-bold text-sky-300">R$ {order.total.toFixed(2)}</p>
                        </div>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'])}
                          className="px-4 py-2 bg-sky-600/30 border border-sky-500/50 rounded-lg text-sky-300 text-sm font-medium focus:outline-none"
                        >
                          <option value="pending_docs">Analisando Docs</option>
                          <option value="pending_payment">Aguardando Pagamento</option>
                          <option value="processing">Em Processamento</option>
                          <option value="paid">Pago</option>
                          <option value="completed">Concluído</option>
                          <option value="rejected">Rejeitado</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Completed Orders Tab */}
            {activeTab === 'completed' && (
              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <div className="glass-panel p-12 text-center rounded-xl border border-sky-500/20">
                    <CheckCircle className="h-12 w-12 mx-auto text-slate-500 mb-4" />
                    <p className="text-slate-400">Nenhuma venda finalizada</p>
                  </div>
                ) : (
                  filteredOrders.map(order => (
                    <div key={order.id} className="glass-panel p-6 rounded-xl border border-green-500/20 hover:border-green-500/40 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-white">{order.userName || 'Cliente'}</h4>
                          <p className="text-xs text-slate-400 font-mono">ID: {order.id}</p>
                          <p className="text-xs text-green-400 mt-1">✅ Finalizado em {new Date(order.date).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-400">Receita</p>
                          <p className="text-2xl font-bold text-green-400">R$ {order.total.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-sm text-slate-300 bg-white/5 p-2 rounded">
                            {item.title} - R$ {item.price.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                {!showProductForm ? (
                  <>
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          resetForm();
                          setShowProductForm(true);
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-500 hover:to-blue-500 transition-all font-semibold flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Novo Produto
                      </button>
                    </div>

                    {productsLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 text-sky-400 animate-spin" />
                      </div>
                    ) : products.length === 0 ? (
                      <div className="glass-panel p-12 text-center rounded-xl border border-sky-500/20">
                        <Package className="h-12 w-12 mx-auto text-slate-500 mb-4" />
                        <p className="text-slate-400">Nenhum produto cadastrado</p>
                        <p className="text-sm text-slate-500 mt-2">Clique em "Novo Produto" para começar</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {products.map(product => (
                          <div key={product.id} className="glass-panel p-6 rounded-xl border border-sky-500/20 hover:border-sky-500/40 transition-all">
                            {product.image && (
                              <img src={product.image} alt={product.title} className="w-full h-40 object-cover rounded-lg mb-4" />
                            )}
                            <h3 className="text-lg font-bold text-white mb-2">{product.title}</h3>
                            <p className="text-sm text-slate-300 mb-3 line-clamp-2">{product.description}</p>
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-2xl font-bold text-sky-300">R$ {product.price.toFixed(2)}</span>
                              <span className="text-xs px-2 py-1 rounded-full bg-sky-600/30 text-sky-300 border border-sky-500/30 capitalize">
                                {product.category === 'insurance' ? 'Seguro' : product.category === 'license' ? 'Licença' : 'Documentação'}
                              </span>
                            </div>
                            <div className="mb-4 flex gap-2 flex-wrap">
                              {product.requiredDocuments.slice(0, 3).map((doc, idx) => (
                                <span key={idx} className="text-xs bg-white/10 text-slate-300 px-2 py-1 rounded border border-slate-500/30">
                                  {doc}
                                </span>
                              ))}
                              {product.requiredDocuments.length > 3 && (
                                <span className="text-xs bg-white/10 text-slate-400 px-2 py-1 rounded">
                                  +{product.requiredDocuments.length - 3}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditProduct(product)}
                                className="flex-1 px-3 py-2 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-500 transition-colors"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id, product.image)}
                                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-500 transition-colors"
                              >
                                Deletar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="glass-panel p-8 rounded-xl border border-sky-500/20">
                    <h3 className="text-2xl font-bold text-white mb-6">
                      {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                    </h3>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Título"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          className="px-4 py-2 bg-white/5 border border-sky-500/20 rounded-lg text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                        />
                        <input
                          type="number"
                          placeholder="Preço"
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                          className="px-4 py-2 bg-white/5 border border-sky-500/20 rounded-lg text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                        />
                      </div>

                      <textarea
                        placeholder="Descrição"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-4 py-2 bg-white/5 border border-sky-500/20 rounded-lg text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none h-24 resize-none"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                          className="px-4 py-2 bg-white/5 border border-sky-500/20 rounded-lg text-white focus:border-sky-500 focus:outline-none"
                        >
                          <option value="insurance">Seguro</option>
                          <option value="license">Licença</option>
                          <option value="bureaucracy">Documentação</option>
                        </select>

                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFormData({...formData, imageFile: e.target.files?.[0] || null})}
                          className="px-4 py-2 bg-white/5 border border-sky-500/20 rounded-lg text-white text-sm"
                        />
                      </div>

                      {/* Documentos Necessários */}
                      <div className="border-t border-sky-500/20 pt-4">
                        <h4 className="text-white font-bold mb-3">Documentos Necessários</h4>
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            placeholder="Ex: RG, CPF, Comprovante de Residência"
                            value={newDoc}
                            onChange={(e) => setNewDoc(e.target.value)}
                            className="flex-1 px-4 py-2 bg-white/5 border border-sky-500/20 rounded-lg text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              if (newDoc.trim()) {
                                setFormData({
                                  ...formData,
                                  requiredDocuments: [...formData.requiredDocuments, newDoc]
                                });
                                setNewDoc('');
                              }
                            }}
                            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.requiredDocuments.map((doc, idx) => (
                            <span key={idx} className="bg-sky-600/30 text-sky-300 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-sky-500/30">
                              {doc}
                              <button
                                onClick={() => setFormData({
                                  ...formData,
                                  requiredDocuments: formData.requiredDocuments.filter((_, i) => i !== idx)
                                })}
                                className="text-red-400 hover:text-red-300"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Arquivos Necessários */}
                      <div className="border-t border-sky-500/20 pt-4">
                        <h4 className="text-white font-bold mb-3">Tipos de Arquivo Aceitos (opcional)</h4>
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            placeholder="Ex: PDF, JPG, PNG"
                            value={newFile}
                            onChange={(e) => setNewFile(e.target.value.toUpperCase())}
                            className="flex-1 px-4 py-2 bg-white/5 border border-sky-500/20 rounded-lg text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              if (newFile.trim()) {
                                setFormData({
                                  ...formData,
                                  requiredFiles: [...formData.requiredFiles, newFile]
                                });
                                setNewFile('');
                              }
                            }}
                            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.requiredFiles.map((file, idx) => (
                            <span key={idx} className="bg-cyan-600/30 text-cyan-300 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-cyan-500/30">
                              {file}
                              <button
                                onClick={() => setFormData({
                                  ...formData,
                                  requiredFiles: formData.requiredFiles.filter((_, i) => i !== idx)
                                })}
                                className="text-red-400 hover:text-red-300"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-sky-500/20">
                        <button
                          onClick={handleSaveProduct}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all font-bold"
                        >
                          {editingProduct ? 'Atualizar Produto' : 'Criar Produto'}
                        </button>
                        <button
                          onClick={() => {
                            resetForm();
                            setShowProductForm(false);
                          }}
                          className="flex-1 px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-bold"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Layout Editor Tab */}
            {activeTab === 'layout' && (
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-xl border border-sky-500/20">
                  <h3 className="text-lg font-bold text-sky-300">Layout Principal da Home</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                    Esta aba controla a página inicial publicada. O preview abaixo usa o mesmo render da home e
                    salva diretamente no layout principal do site.
                  </p>
                </div>

                {layoutLoading ? (
                  <div className="glass-panel rounded-xl border border-sky-500/20 p-10 text-center text-slate-400">
                    Carregando layout principal...
                  </div>
                ) : (
                  <LayoutEditor
                    initialLayout={currentLayout}
                    previewServices={previewServices}
                    onSave={handleSaveLayout}
                  />
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-xl border border-sky-500/20">
                  <h3 className="text-lg font-bold text-sky-300 mb-4">📊 Distribuição por Status</h3>
                  <div className="space-y-3">
                    {['pending_docs', 'pending_payment', 'processing', 'completed', 'rejected'].map(status => {
                      const count = orders.filter(o => o.status === status).length;
                      const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
                      return (
                        <div key={status}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-300 capitalize">{status.replace('_', ' ')}</span>
                            <span className="text-sky-300 font-semibold">{count}</span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-sky-500/20">
                            <div 
                              className="bg-gradient-to-r from-sky-600 to-blue-600 h-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-xl border border-sky-500/20">
                  <h3 className="text-lg font-bold text-sky-300 mb-4">💰 Resumo Financeiro</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-slate-300">Receita Total</span>
                      <span className="text-xl font-bold text-sky-300">R$ {stats.totalRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-slate-300">Receita Finalizada</span>
                      <span className="text-xl font-bold text-green-400">R$ {stats.revenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-slate-300">Ticket Médio</span>
                      <span className="text-xl font-bold text-cyan-300">R$ {stats.avgTicket.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Produto/Pedido */}
      {selectedOrder && selectedOrderItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel rounded-2xl border border-sky-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 p-6 border-b border-sky-500/20 bg-[#020c1b] flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedOrderItem.title}</h3>
                <p className="text-sm text-slate-400 mt-1">Pedido: {selectedOrder.id}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setSelectedOrderItem(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Informações do Produto */}
              <div className="glass-panel p-4 rounded-xl border border-sky-500/20">
                <h4 className="text-sky-300 font-bold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Informações do Serviço
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Categoria</p>
                    <p className="text-white font-semibold capitalize">
                      {selectedOrderItem.category === 'insurance' ? 'Seguro' : selectedOrderItem.category === 'license' ? 'Licença' : 'Documentação'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Preço</p>
                    <p className="text-white font-semibold">R$ {selectedOrderItem.price.toFixed(2)}</p>
                  </div>
                </div>
                <p className="text-slate-300 text-sm mt-3">{selectedOrderItem.description}</p>
              </div>

              {/* Documentos Necessários */}
              {selectedOrderItem.requiredDocuments && selectedOrderItem.requiredDocuments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sky-300 font-bold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documentos Necessários ({Object.keys(selectedOrderItem.uploadedDocs || {}).length}/{selectedOrderItem.requiredDocuments.length})
                  </h4>
                  
                  {selectedOrderItem.requiredDocuments.map((doc) => {
                    const isUploaded = isDocumentUploaded(doc);
                    const isUploading = uploadingDocs[doc];
                    
                    return (
                      <div key={doc} className={`glass-panel p-4 rounded-xl border transition-all ${
                        isUploaded 
                          ? 'border-green-500/30 bg-green-600/10' 
                          : 'border-yellow-500/30 bg-yellow-600/10'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {isUploaded ? (
                              <CheckCircle className="h-5 w-5 text-green-400" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-yellow-400" />
                            )}
                            <div>
                              <p className="text-white font-semibold">{doc}</p>
                              {isUploaded && (
                                <p className="text-xs text-green-400">✅ Documento recebido</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {!isUploaded && (
                          <div className="flex gap-2 items-center">
                            <input
                              id={`file-${doc}`}
                              type="file"
                              accept={selectedOrderItem.requiredFiles?.join(',') || '*'}
                              disabled={isUploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleUploadMissingDocument(doc, file);
                                }
                              }}
                              className="flex-1 text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-500 disabled:opacity-50"
                            />
                            {isUploading && (
                              <Loader2 className="h-5 w-5 text-sky-400 animate-spin" />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Informações do Cliente */}
              <div className="glass-panel p-4 rounded-xl border border-sky-500/20">
                <h4 className="text-sky-300 font-bold mb-3">👤 Cliente</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-slate-400">Nome:</span> <span className="text-white">{selectedOrder.userName || 'N/A'}</span></p>
                  <p><span className="text-slate-400">Status do Pedido:</span> <span className={`font-semibold ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status.replace('_', ' ')}</span></p>
                  <p><span className="text-slate-400">Data:</span> <span className="text-white">{new Date(selectedOrder.date).toLocaleDateString('pt-BR')}</span></p>
                </div>
              </div>

              {/* Botão Fechar */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setSelectedOrderItem(null);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-bold"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Usuário */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel rounded-2xl border border-sky-500/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 p-6 border-b border-sky-500/20 bg-[#020c1b] flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Detalhes do Usuário</h3>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setEditingUser(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {!editingUser ? (
                <>
                  {/* Informações do Usuário */}
                  <div className="space-y-4">
                    <div className="glass-panel p-4 rounded-xl border border-sky-500/20">
                      <p className="text-slate-400 text-sm mb-1">Nome</p>
                      <p className="text-white font-semibold text-lg">{selectedUser.name || '(sem nome)'}</p>
                    </div>

                    <div className="glass-panel p-4 rounded-xl border border-sky-500/20">
                      <p className="text-slate-400 text-sm mb-1">Email</p>
                      <p className="text-white font-semibold">{selectedUser.email}</p>
                    </div>

                    <div className="glass-panel p-4 rounded-xl border border-sky-500/20">
                      <p className="text-slate-400 text-sm mb-1">ID do Usuário</p>
                      <p className="text-slate-300 text-xs font-mono">{selectedUser.id}</p>
                    </div>

                    <div className="glass-panel p-4 rounded-xl border border-sky-500/20">
                      <p className="text-slate-400 text-sm mb-2">Função</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          selectedUser.role === 'admin' 
                            ? 'bg-sky-600/30 text-sky-300 border border-sky-500/30' 
                            : 'bg-slate-600/30 text-slate-300 border border-slate-500/30'
                        }`}>
                          {selectedUser.role === 'admin' ? '👑 Admin' : selectedUser.role === 'employee' ? '👨‍💼 Colaborador' : 'Cliente'}
                        </span>
                        <button
                          onClick={() => toggleUserAdmin(selectedUser.id, selectedUser.role !== 'admin')}
                          disabled={userPromoting[selectedUser.id]}
                          className="px-3 py-1 bg-sky-600 text-white rounded-lg text-xs hover:bg-sky-500 disabled:opacity-50 transition-colors font-medium"
                        >
                          {userPromoting[selectedUser.id] ? '...' : selectedUser.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-2 pt-4 border-t border-sky-500/20">
                    <button
                      onClick={() => setEditingUser({ ...selectedUser })}
                      className="flex-1 px-4 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors font-bold flex items-center justify-center gap-2"
                    >
                      ✎ Editar
                    </button>
                    <button
                      onClick={handleDeleteUser}
                      disabled={deletingUserId === selectedUser.id}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors font-bold flex items-center justify-center gap-2"
                    >
                      {deletingUserId === selectedUser.id ? '...' : '🗑️ Deletar'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Modo Edição */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-slate-400 text-sm font-medium block mb-2">Nome</label>
                      <input
                        type="text"
                        value={editingUser.name || ''}
                        onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                        className="w-full px-4 py-2 bg-white/5 border border-sky-500/20 rounded-lg text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-sm font-medium block mb-2">Email</label>
                      <input
                        type="email"
                        value={editingUser.email || ''}
                        onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                        className="w-full px-4 py-2 bg-white/5 border border-sky-500/20 rounded-lg text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-sm font-medium block mb-2">Função</label>
                      <select
                        value={editingUser.role || 'client'}
                        onChange={(e) => setEditingUser({...editingUser, role: e.target.value as any})}
                        className="w-full px-4 py-2 bg-white/5 border border-sky-500/20 rounded-lg text-white focus:border-sky-500 focus:outline-none"
                      >
                        <option value="client">Cliente</option>
                        <option value="admin">Admin</option>
                        <option value="employee">Colaborador</option>
                      </select>
                    </div>
                  </div>

                  {/* Botões de Edição */}
                  <div className="flex gap-2 pt-4 border-t border-sky-500/20">
                    <button
                      onClick={handleEditUser}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors font-bold"
                    >
                      ✓ Salvar
                    </button>
                    <button
                      onClick={() => setEditingUser(null)}
                      className="flex-1 px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-bold"
                    >
                      ✕ Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
