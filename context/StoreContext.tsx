import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Product, Client, Sale, ViewState, AuditLog, CashSession, CashMovement, ClientDebt, StoreConfig, UserRole, Supplier, Operation, Budget, CartItem, Service } from '../types';
import { MOCK_USERS, MOCK_PRODUCTS, MOCK_CLIENTS, MOCK_SUPPLIERS, MOCK_OPERATIONS, MOCK_BUDGETS } from '../constants';

interface StoreContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, password?: string) => boolean;
  logout: () => void;
  currentView: ViewState;
  navigate: (view: ViewState) => void;
  products: Product[];
  clients: Client[];
  suppliers: Supplier[];
  sales: Sale[];
  auditLogs: AuditLog[];
  cashSession: CashSession;
  storeConfig: StoreConfig;
  operations: Operation[];
  budgets: Budget[];
  services: Service[];
  
  // Actions
  addSale: (sale: Sale) => void;
  returnSale: (saleId: number) => boolean;
  updateProductStock: (productId: number, variationId: number | undefined, quantitySold: number) => void;
  logActivity: (action: string, details: string) => void;
  
  // Client Management
  addClient: (client: Client) => void;
  payClientDebt: (clientId: number, debtId: string) => boolean; 
  payAllClientDebts: (clientId: number) => boolean; 
  updateDebtDueDate: (clientId: number, debtId: string, newDate: string) => void; 
  getTotalReceivables: () => number;

  // Product & Supplier Management
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: number) => void;
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: number) => void;

  // Service Management
  addService: (service: Service) => void;
  updateService: (service: Service) => void;
  deleteService: (serviceId: number) => void;

  // Operations Management
  addOperation: (op: Operation) => void;
  updateOperation: (op: Operation) => void;
  deleteOperation: (opId: number) => void;

  // Budgets Management
  addBudget: (budget: Budget) => void;
  updateBudget: (budget: Budget) => void;
  deleteBudget: (budgetId: number) => void;
  convertBudgetToSale: (budget: Budget) => void;

  // Cash Management
  openRegister: (startAmount: number) => void;
  closeRegister: () => void;
  addCashMovement: (type: 'WITHDRAWAL' | 'DEPOSIT', amount: number, description: string) => void;
  getDailyCashBalance: () => number;

  // Settings & User Management
  updateStoreConfig: (config: StoreConfig) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: number) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [currentView, setCurrentView] = useState<ViewState>('LOGIN');
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [sales, setSales] = useState<Sale[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // New States
  const [operations, setOperations] = useState<Operation[]>(MOCK_OPERATIONS);
  const [budgets, setBudgets] = useState<Budget[]>(MOCK_BUDGETS);
  const [services, setServices] = useState<Service[]>([]);

  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    storeName: 'BEFIT MODA FITNESS',
    storeAddress: 'Rua da Moda, 123 - Centro',
    primaryColor: '#A66B5D',
    lowStockThreshold: 5,
    budgetValidityDays: 15
  });
  
  // Cash Session State
  const [cashSession, setCashSession] = useState<CashSession>({
    isOpen: false,
    startBalance: 0,
    currentBalance: 0,
    movements: []
  });

  const logActivity = (action: string, details: string) => {
    if (!currentUser) return;
    const newLog: AuditLog = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const login = (username: string, password?: string): boolean => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (user) {
      if (user.password && user.password !== password) return false;
      setCurrentUser(user);
      setCurrentView('POS');
      return true;
    }
    return false;
  };

  const logout = () => {
    logActivity('LOGOUT', 'Usuário realizou logout');
    setCurrentUser(null);
    setCurrentView('LOGIN');
  };

  const navigate = (view: ViewState) => {
    setCurrentView(view);
  };

  // Cash Management Logic
  const openRegister = (startAmount: number) => {
    setCashSession({
      isOpen: true,
      openedAt: new Date().toISOString(),
      startBalance: startAmount,
      currentBalance: startAmount,
      movements: [{
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: 'OPEN',
        amount: startAmount,
        description: 'Abertura de Caixa'
      }]
    });
    logActivity('CAIXA_ABRIR', `Caixa aberto com R$ ${startAmount.toFixed(2)}`);
  };

  const closeRegister = () => {
    if (!cashSession.isOpen) return;
    
    const finalBalance = cashSession.currentBalance;
    
    setCashSession(prev => ({
      ...prev,
      isOpen: false,
      closedAt: new Date().toISOString(),
      movements: [...prev.movements, {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: 'CLOSE',
        amount: finalBalance,
        description: 'Fechamento de Caixa'
      }]
    }));
    logActivity('CAIXA_FECHAR', `Caixa fechado. Saldo final: R$ ${finalBalance.toFixed(2)}`);
  };

  const addCashMovement = (type: 'WITHDRAWAL' | 'DEPOSIT', amount: number, description: string) => {
    if (!cashSession.isOpen) return;
    
    setCashSession(prev => ({
      ...prev,
      currentBalance: type === 'DEPOSIT' ? prev.currentBalance + amount : prev.currentBalance - amount,
      movements: [...prev.movements, {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type,
        amount,
        description
      }]
    }));
    logActivity(type === 'DEPOSIT' ? 'SUPRIMENTO' : 'SANGRIA', `${description}: R$ ${amount.toFixed(2)}`);
  };

  const getDailyCashBalance = () => {
    return cashSession.currentBalance;
  };

  const getTotalReceivables = () => {
    return clients.reduce((total, client) => {
        const clientDebt = client.debts?.filter(d => !d.paid).reduce((acc, d) => acc + d.amount, 0) || 0;
        return total + clientDebt;
    }, 0);
  };

  const addSale = (sale: Sale) => {
    setSales(prev => [sale, ...prev]);
    
    const methodsString = sale.paymentDetails.methods.map(m => m.method).join(' + ');
    logActivity('VENDA_CRIAR', `Venda #${sale.id} - ${methodsString} - Total: R$ ${sale.total.toFixed(2)}`);

    // 1. Process Cash Payments
    let totalCashIn = 0;
    sale.paymentDetails.methods.forEach(part => {
        if (part.method === 'DINHEIRO') {
            totalCashIn += part.amount;
        }
    });

    const netCash = totalCashIn - sale.paymentDetails.change;

    if (netCash !== 0 && cashSession.isOpen) {
      setCashSession(prev => ({
        ...prev,
        currentBalance: prev.currentBalance + netCash,
        movements: [...prev.movements, {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          type: 'SALE',
          amount: netCash,
          description: `Venda #${sale.id} (Dinheiro)`
        }]
      }));
    }

    // 2. Process Carne
    sale.paymentDetails.methods.forEach(part => {
        if (part.method === 'CARNE' && sale.clienteId) {
            const installmentsCount = part.installments || 1;
            const installmentValue = part.amount / installmentsCount;
            const newDebts: ClientDebt[] = [];
            const today = new Date();

            for (let i = 1; i <= installmentsCount; i++) {
                const dueDate = new Date(today);
                dueDate.setMonth(today.getMonth() + i);

                newDebts.push({
                id: Math.random().toString(36).substr(2, 9),
                saleId: sale.id,
                dueDate: dueDate.toISOString(),
                amount: installmentValue,
                installmentNumber: i,
                totalInstallments: installmentsCount,
                paid: false
                });
            }

            setClients(prev => prev.map(c => {
                if (c.id === sale.clienteId) {
                return { ...c, debts: [...(c.debts || []), ...newDebts] };
                }
                return c;
            }));
            logActivity('CARNE_GERAR', `Geradas ${installmentsCount} parcelas (R$ ${part.amount}) para ${sale.clienteNome}`);
        }
    });

    // 3. Process Budget Conversion
    if (sale.originBudgetId) {
        setBudgets(prev => prev.map(b => b.id === sale.originBudgetId ? { ...b, status: 'CONVERTIDO_VENDA' } : b));
    }
  };

  const returnSale = (saleId: number): boolean => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale || sale.status === 'CANCELLED') return false;

    // 1. Mark sale as cancelled/exchanged
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, status: 'CANCELLED' } : s));

    // 2. Restock Items (Reverse logic of updateProductStock)
    sale.items.forEach(item => {
        if (item.product) {
            updateProductStock(item.product.id, item.variation?.id, -item.quantity); 
        }
    });

    // 3. DO NOT Touch Cash - "Mexer apenas no estoque"
    
    logActivity('VENDA_TROCA', `Venda #${saleId} marcada para troca. Itens devolvidos ao estoque.`);
    return true;
  };

  const payClientDebt = (clientId: number, debtId: string): boolean => {
    if (!cashSession.isOpen) return false;
    const client = clients.find(c => c.id === clientId);
    const debt = client?.debts?.find(d => d.id === debtId);
    if (client && debt && !debt.paid) {
      setClients(prevClients => prevClients.map(c => {
        if (c.id === clientId) {
          const currentDebts = c.debts || [];
          return {
            ...c,
            debts: currentDebts.map(d => 
              d.id === debtId 
                ? { ...d, paid: true, paidDate: new Date().toISOString() } 
                : d
            )
          };
        }
        return c;
      }));
      setCashSession(prev => ({
        ...prev,
        currentBalance: prev.currentBalance + debt.amount,
        movements: [...prev.movements, {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          type: 'DEBT_PAYMENT',
          amount: debt.amount,
          description: `Recebimento Carnê ${client.nome} (${debt.installmentNumber}/${debt.totalInstallments})`
        }]
      }));
      logActivity('CARNE_RECEBER', `Recebimento parcela de ${client.nome}: R$ ${debt.amount.toFixed(2)}`);
      return true;
    }
    return false;
  };

  const payAllClientDebts = (clientId: number): boolean => {
      if (!cashSession.isOpen) return false;
      const client = clients.find(c => c.id === clientId);
      if (!client || !client.debts) return false;
      const unpaidDebts = client.debts.filter(d => !d.paid);
      if (unpaidDebts.length === 0) return false;
      const totalAmount = unpaidDebts.reduce((acc, d) => acc + d.amount, 0);
      setClients(prevClients => prevClients.map(c => {
          if (c.id === clientId) {
              const currentDebts = c.debts || [];
              return {
                  ...c,
                  debts: currentDebts.map(d => !d.paid ? { ...d, paid: true, paidDate: new Date().toISOString() } : d)
              };
          }
          return c;
      }));
      setCashSession(prev => ({
          ...prev,
          currentBalance: prev.currentBalance + totalAmount,
          movements: [...prev.movements, {
              id: Date.now(),
              timestamp: new Date().toISOString(),
              type: 'DEBT_PAYMENT',
              amount: totalAmount,
              description: `Quitação Total Carnê ${client.nome} (${unpaidDebts.length} parcelas)`
          }]
      }));
      logActivity('CARNE_QUITAR', `Quitação total ${client.nome}: R$ ${totalAmount.toFixed(2)}`);
      return true;
  };

  const updateDebtDueDate = (clientId: number, debtId: string, newDate: string) => {
      setClients(prev => prev.map(c => {
          if (c.id === clientId) {
              return {
                  ...c,
                  debts: (c.debts || []).map(d => d.id === debtId ? { ...d, dueDate: newDate } : d)
              };
          }
          return c;
      }));
      logActivity('CARNE_ALTERAR_VENC', `Vencimento alterado para ${newDate} - Cliente ID: ${clientId}`);
  };

  const addClient = (client: Client) => {
    setClients(prev => [...prev, { ...client, id: Date.now(), debts: [] }]);
    logActivity('CLIENTE_CRIAR', `Novo cliente: ${client.nome}`);
  };

  // --- PRODUCT MANAGEMENT ---
  const addProduct = (product: Product) => {
    setProducts(prev => [...prev, { ...product, id: product.id || Date.now() }]);
    logActivity('PRODUTO_CRIAR', `Produto criado: ${product.nome}`);
  };

  const updateProduct = (product: Product) => {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    logActivity('PRODUTO_EDITAR', `Produto atualizado: ${product.nome}`);
  };

  const deleteProduct = (productId: number) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    logActivity('PRODUTO_DELETAR', `Produto removido ID: ${productId}`);
  };

  const updateProductStock = (productId: number, variationId: number | undefined, quantitySold: number) => {
    setProducts(prevProducts => prevProducts.map(prod => {
      if (prod.id !== productId) return prod;
      if (variationId && prod.variacoes.length > 0) {
        return {
          ...prod,
          variacoes: prod.variacoes.map(v => 
            v.id === variationId 
              ? { ...v, estoqueAtual: Math.max(0, v.estoqueAtual - quantitySold) }
              : v
          )
        };
      }
      return { ...prod, estoque: Math.max(0, prod.estoque - quantitySold) };
    }));
  };

  // --- SUPPLIER MANAGEMENT ---
  const addSupplier = (supplier: Supplier) => {
    setSuppliers(prev => [...prev, { ...supplier, id: Date.now() }]);
    logActivity('FORNECEDOR_CRIAR', `Fornecedor criado: ${supplier.nome}`);
  };

  const updateSupplier = (supplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === supplier.id ? supplier : s));
    logActivity('FORNECEDOR_EDITAR', `Fornecedor atualizado: ${supplier.nome}`);
  };

  const deleteSupplier = (supplierId: number) => {
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    logActivity('FORNECEDOR_DELETAR', `Fornecedor removido ID: ${supplierId}`);
  };

  // --- SERVICE MANAGEMENT ---
  const addService = (service: Service) => {
    setServices(prev => [...prev, { ...service, id: service.id || Date.now() }]);
    logActivity('SERVICO_CRIAR', `Serviço criado: ${service.nome}`);
  };

  const updateService = (service: Service) => {
    setServices(prev => prev.map(s => s.id === service.id ? service : s));
    logActivity('SERVICO_EDITAR', `Serviço atualizado: ${service.nome}`);
  };

  const deleteService = (serviceId: number) => {
    setServices(prev => prev.filter(s => s.id !== serviceId));
    logActivity('SERVICO_DELETAR', `Serviço removido ID: ${serviceId}`);
  };

  // --- OPERATIONS MANAGEMENT ---
  const addOperation = (op: Operation) => {
    setOperations(prev => [...prev, { ...op, id: Date.now() }]);
    logActivity('OPERACAO_CRIAR', `Operação criada: ${op.nome}`);
  };

  const updateOperation = (op: Operation) => {
    setOperations(prev => prev.map(o => o.id === op.id ? op : o));
    logActivity('OPERACAO_EDITAR', `Operação atualizada: ${op.nome}`);
  };

  const deleteOperation = (opId: number) => {
    setOperations(prev => prev.filter(o => o.id !== opId));
    logActivity('OPERACAO_DELETAR', `Operação removida ID: ${opId}`);
  };

  // --- BUDGETS MANAGEMENT ---
  const addBudget = (budget: Budget) => {
    setBudgets(prev => [budget, ...prev]);
    logActivity('ORCAMENTO_CRIAR', `Orçamento criado #${budget.id} para ${budget.clienteNome}`);
  };

  const updateBudget = (budget: Budget) => {
    setBudgets(prev => prev.map(b => b.id === budget.id ? budget : b));
    logActivity('ORCAMENTO_EDITAR', `Orçamento atualizado #${budget.id}`);
  };

  const deleteBudget = (budgetId: number) => {
    setBudgets(prev => prev.filter(b => b.id !== budgetId));
    logActivity('ORCAMENTO_DELETAR', `Orçamento removido #${budgetId}`);
  };

  const convertBudgetToSale = (budget: Budget) => {
      // 1. Create Sale (Includes Shipping)
      const sale: Sale = {
          id: Date.now(),
          data: new Date().toISOString(),
          clienteNome: budget.clienteNome,
          clienteId: budget.clienteId,
          total: budget.total, // Contains shipping
          shippingCost: budget.shippingCost, // Pass shipping explicitly
          items: budget.items,
          paymentDetails: {
              methods: [{ method: 'DINHEIRO', amount: budget.total }], // Default assumption, usually changed in POS
              totalPaid: budget.total,
              change: 0
          },
          status: 'COMPLETED',
          originBudgetId: budget.id
      };

      addSale(sale);
      
      // 2. Stock Update handled in addSale for items with stock
      budget.items.forEach(item => {
          if (item.product) {
              updateProductStock(item.product.id, item.variation?.id, item.quantity);
          }
      });

      logActivity('ORCAMENTO_CONVERTER', `Orçamento #${budget.id} convertido em venda #${sale.id} (Entrega confirmada/Venda lançada)`);
  };

  // User & Settings Management
  const updateStoreConfig = (config: StoreConfig) => {
    setStoreConfig(config);
    logActivity('CONFIG_ALTERAR', 'Configurações da loja atualizadas');
  };

  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
    logActivity('USUARIO_CRIAR', `Novo usuário adicionado: ${user.username}`);
  };

  const updateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser && currentUser.id === updatedUser.id) {
        setCurrentUser(updatedUser);
    }
    logActivity('USUARIO_EDITAR', `Usuário alterado: ${updatedUser.username}`);
  };

  const deleteUser = (userId: number) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    logActivity('USUARIO_DELETAR', `Usuário removido ID: ${userId}`);
  };

  return (
    <StoreContext.Provider value={{
      currentUser,
      users,
      login,
      logout,
      currentView,
      navigate,
      products,
      clients,
      suppliers,
      sales,
      auditLogs,
      cashSession,
      storeConfig,
      operations,
      budgets,
      services,
      addSale,
      returnSale,
      updateProductStock,
      logActivity,
      addClient,
      payClientDebt,
      payAllClientDebts,
      updateDebtDueDate,
      getTotalReceivables,
      addProduct,
      updateProduct,
      deleteProduct,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addService,
      updateService,
      deleteService,
      addOperation,
      updateOperation,
      deleteOperation,
      addBudget,
      updateBudget,
      deleteBudget,
      convertBudgetToSale,
      openRegister,
      closeRegister,
      addCashMovement,
      getDailyCashBalance,
      updateStoreConfig,
      addUser,
      updateUser,
      deleteUser
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};