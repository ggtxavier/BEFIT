import { Product, Client, User, UserRole, Supplier, Operation, Budget } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 1,
    name: 'Administrador',
    username: 'admin', // Replaced email
    password: 'admin', 
    role: UserRole.ADMIN,
    permissions: ['ALL']
  },
  {
    id: 2,
    name: 'Operador Caixa',
    username: 'caixa', // Replaced email
    password: 'caixa',
    role: UserRole.CAIXA,
    permissions: ['VENDAS_CRIAR', 'CAIXA_VISUALIZAR']
  }
];

export const MOCK_SUPPLIERS: Supplier[] = [
  { id: 1, nome: 'ROTA DAGUA' },
  { id: 2, nome: 'NK' },
  { id: 3, nome: 'KELL' },
  { id: 4, nome: 'ESQUADRAO' },
  { id: 5, nome: 'ATLETIKA' },
  { id: 6, nome: 'SPERTOS' },
  { id: 7, nome: 'MF' },
  { id: 8, nome: 'CLEPOL' },
  { id: 9, nome: 'CIA LEGGING' },
  { id: 10, nome: 'PELE DE MEL' },
  { id: 11, nome: 'ELOHIM' },
  { id: 12, nome: 'ESTER FITNESS' }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    referencia: 'REF001',
    nome: 'Legging Fitness Pro',
    preco: 89.90,
    estoque: 0,
    fornecedorNome: 'ROTA DAGUA',
    imageUrl: 'https://picsum.photos/200/200?random=1',
    variacoes: [
      { id: 101, produtoId: 1, cor: 'Preto', tamanho: 'M', estoqueAtual: 10 },
      { id: 102, produtoId: 1, cor: 'Preto', tamanho: 'G', estoqueAtual: 5 },
      { id: 103, produtoId: 1, cor: 'Rosa', tamanho: 'M', estoqueAtual: 8 }
    ]
  },
  {
    id: 2,
    referencia: 'REF002',
    nome: 'Top Alta Sustentação',
    preco: 59.90,
    estoque: 15,
    fornecedorNome: 'KELL',
    imageUrl: 'https://picsum.photos/200/200?random=2',
    variacoes: []
  },
  {
    id: 3,
    referencia: 'REF003',
    nome: 'Garrafa Térmica 1L',
    preco: 45.00,
    estoque: 50,
    fornecedorNome: 'ELOHIM',
    imageUrl: 'https://picsum.photos/200/200?random=3',
    variacoes: []
  }
];

export const MOCK_CLIENTS: Client[] = [
  { id: 1, nome: 'Consumidor Final', documento: '000.000.000-00', telefone: '', cidade: '', ativo: true },
  { id: 2, nome: 'Maria Silva', documento: '123.456.789-00', telefone: '(11) 99999-9999', cidade: 'São Paulo', ativo: true },
  { id: 3, nome: 'João Souza', documento: '987.654.321-00', telefone: '(11) 88888-8888', cidade: 'Campinas', ativo: true },
];

export const MOCK_OPERATIONS: Operation[] = [
  { id: 1, nome: 'Venda de Mercadorias', descricao: 'Venda padrão para consumidor', tipo: 'SAIDA', movimentaEstoque: true, ativa: true, cfop: '5.102' },
  { id: 2, nome: 'Devolução de Venda', descricao: 'Entrada por devolução de cliente', tipo: 'ENTRADA', movimentaEstoque: true, ativa: true, cfop: '1.202' },
  { id: 3, nome: 'Remessa para Conserto', descricao: 'Envio para reparo', tipo: 'SAIDA', movimentaEstoque: true, ativa: true, cfop: '5.915' },
];

export const MOCK_BUDGETS: Budget[] = [
  { 
    id: 1001, 
    dataEmissao: new Date().toISOString(), 
    dataValidade: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), 
    clienteNome: 'Maria Silva', 
    clienteId: 2, 
    total: 169.80, 
    shippingCost: 20.00,
    deliveryAddress: 'Rua das Flores, 123 - Centro',
    status: 'ABERTO',
    items: [
      { uid: 'abc', product: MOCK_PRODUCTS[0], variation: MOCK_PRODUCTS[0].variacoes[0], quantity: 1, subtotal: 89.90 },
      { uid: 'def', product: MOCK_PRODUCTS[1], quantity: 1, subtotal: 59.90 }
    ]
  }
];