// Enums and Interfaces mirroring the provided report

export enum UserRole {
  ADMIN = 'ADMIN',
  CAIXA = 'CAIXA',
  GERENTE = 'GERENTE'
}

export interface User {
  id: number;
  name: string;
  username: string; // Changed from email to username/nickname
  role: UserRole;
  permissions: string[];
  password?: string;
}

export interface Supplier {
  id: number;
  nome: string;
  contato?: string;
  telefone?: string;
}

export interface ProductVariation {
  id: number;
  produtoId: number;
  cor: string;
  tamanho: string;
  estoqueAtual: number;
}

export interface Product {
  id: number;
  referencia: string;
  nome: string;
  preco: number;
  estoque: number;
  fornecedorNome: string;
  variacoes: ProductVariation[];
  imageUrl?: string;
}

export interface Service {
  id: number;
  nome: string;
  codigoAtividade: string;
  cnae?: string;
  valor: number;
  codigoMunicipal?: string;
}

export interface Operation {
  id: number;
  nome: string;
  descricao: string;
  tipo: 'ENTRADA' | 'SAIDA';
  movimentaEstoque: boolean;
  ativa: boolean;
  // Simplified taxation for UI demo
  cfop?: string;
}

export type BudgetStatus = 'ABERTO' | 'APROVADO' | 'CANCELADO' | 'CONVERTIDO_VENDA';

export interface Budget {
  id: number;
  dataEmissao: string;
  dataValidade: string;
  clienteNome: string;
  clienteId?: number;
  vendedorId?: number;
  shippingCost?: number; // New: Valor do Frete
  deliveryAddress?: string; // New: Endereço de Entrega
  total: number; // Includes shipping
  items: CartItem[]; 
  status: BudgetStatus;
  observacoes?: string;
}

// ----------------------------

// Updated Client to support Debts
export interface ClientDebt {
  id: string;
  saleId: number;
  dueDate: string;
  amount: number;
  installmentNumber: number;
  totalInstallments: number;
  paid: boolean;
  paidDate?: string;
}

export interface Client {
  id: number;
  nome: string;
  documento: string;
  telefone: string;
  cidade: string;
  ativo: boolean;
  debts?: ClientDebt[]; // For Carnê tracking
}

export interface CartItem {
  uid: string;
  product: Product; 
  variation?: ProductVariation;
  quantity: number;
  subtotal: number;
}

// HYBRID PAYMENT STRUCTURE
export type PaymentMethodType = 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX' | 'CARNE';

export interface PaymentPart {
  method: PaymentMethodType;
  amount: number;
  installments?: number; // Only for Credit Card or Carne
}

export interface PaymentDetails {
  methods: PaymentPart[]; // List of partial payments
  totalPaid: number;
  change: number; // Troco
}

export interface Sale {
  id: number;
  data: string;
  clienteNome: string;
  clienteId?: number;
  cpfNota?: string; // New field inspired by GDOOR NFC-e
  shippingCost?: number; // New: Include shipping in sale record
  total: number;
  items: CartItem[];
  paymentDetails: PaymentDetails;
  status: 'COMPLETED' | 'CANCELLED';
  originBudgetId?: number; // Link to Budget if converted
}

export interface AuditLog {
  id: number;
  timestamp: string;
  userId: number;
  userName: string;
  action: string;
  details: string;
}

// Cash Drawer Types
export interface CashMovement {
  id: number;
  timestamp: string;
  type: 'OPEN' | 'CLOSE' | 'SALE' | 'WITHDRAWAL' | 'DEPOSIT' | 'DEBT_PAYMENT';
  amount: number;
  description: string;
}

export interface CashSession {
  isOpen: boolean;
  openedAt?: string;
  closedAt?: string;
  startBalance: number;
  currentBalance: number; // Only tracks CASH
  movements: CashMovement[];
}

export interface StoreConfig {
  storeName: string;
  storeAddress: string;
  primaryColor: string; // Hex code for simple theming
  lowStockThreshold: number; // User configurable threshold
  budgetValidityDays: number; // New config
}

export type ViewState = 'LOGIN' | 'DASHBOARD' | 'POS' | 'PRODUCTS' | 'CLIENTS' | 'SALES_HISTORY' | 'CASH_DRAWER' | 'SETTINGS' | 'OPERATIONS' | 'BUDGETS' | 'SERVICES';