import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Budget, Client, Product, CartItem } from '../types';
import { 
    FileText, Plus, Search, Trash2, Printer, CheckCircle, 
    X, User, ShoppingBag, Calendar, Save, Truck, MapPin
} from 'lucide-react';

export const BudgetsView: React.FC = () => {
  const { budgets, addBudget, updateBudget, deleteBudget, convertBudgetToSale, clients, products, storeConfig } = useStore();
  const [viewMode, setViewMode] = useState<'LIST' | 'EDIT'>('LIST');
  const [searchTerm, setSearchTerm] = useState('');

  // --- EDITOR STATE ---
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [validityDate, setValidityDate] = useState('');
  const [items, setItems] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  
  // Delivery State
  const [shippingCost, setShippingCost] = useState<string>('0.00');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Item adding state
  const [searchItem, setSearchItem] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (searchItem.trim() === '') {
        setFilteredProducts([]);
    } else {
        const lower = searchItem.toLowerCase();
        setFilteredProducts(products.filter(p => p.nome.toLowerCase().includes(lower) || p.referencia.toLowerCase().includes(lower)).slice(0, 5));
    }
  }, [searchItem, products]);

  const startNewBudget = () => {
    setEditingId(null);
    setSelectedClient(null);
    const valid = new Date();
    valid.setDate(valid.getDate() + (storeConfig.budgetValidityDays || 15));
    setValidityDate(valid.toISOString().split('T')[0]);
    setItems([]);
    setNotes('');
    setShippingCost('0.00');
    setDeliveryAddress('');
    setViewMode('EDIT');
  };

  const editBudget = (budget: Budget) => {
    if(budget.status === 'CONVERTIDO_VENDA') {
        alert("Orçamentos convertidos não podem ser editados.");
        return;
    }
    setEditingId(budget.id);
    setSelectedClient(clients.find(c => c.id === budget.clienteId) || null);
    setValidityDate(budget.dataValidade.split('T')[0]);
    setItems([...budget.items]);
    setNotes(budget.observacoes || '');
    setShippingCost(budget.shippingCost?.toFixed(2) || '0.00');
    setDeliveryAddress(budget.deliveryAddress || '');
    setViewMode('EDIT');
  };

  const addItem = (item: Product) => {
    const newItem: CartItem = {
        uid: Math.random().toString(36).substr(2, 9),
        quantity: 1,
        subtotal: item.preco,
        product: item,
    };
    setItems([...items, newItem]);
    setSearchItem('');
  };

  const removeItem = (uid: string) => {
      setItems(items.filter(i => i.uid !== uid));
  };

  // Calculate totals
  const itemsSubtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
  const shipping = parseFloat(shippingCost) || 0;
  const grandTotal = itemsSubtotal + shipping;

  const saveBudget = () => {
    if (items.length === 0) {
        alert('Adicione itens ao orçamento.');
        return;
    }

    const budgetData: Budget = {
        id: editingId || Date.now(),
        dataEmissao: editingId ? (budgets.find(b=>b.id===editingId)?.dataEmissao || new Date().toISOString()) : new Date().toISOString(),
        dataValidade: new Date(validityDate).toISOString(),
        clienteNome: selectedClient?.nome || 'Consumidor Final',
        clienteId: selectedClient?.id,
        shippingCost: shipping,
        deliveryAddress: deliveryAddress,
        total: grandTotal, // Includes Shipping
        items: items,
        status: 'ABERTO',
        observacoes: notes
    };

    if(editingId) {
        updateBudget(budgetData);
    } else {
        addBudget(budgetData);
    }
    setViewMode('LIST');
  };

  const handleConvert = (budget: Budget) => {
      const msg = budget.shippingCost && budget.shippingCost > 0 
        ? `Converter orçamento #${budget.id} em Venda?\n(Frete de R$ ${budget.shippingCost.toFixed(2)} será incluso)`
        : `Converter orçamento #${budget.id} em Venda?`;

      if(window.confirm(msg)) {
          convertBudgetToSale(budget);
          alert('Venda gerada com sucesso! Consulte o histórico de vendas.');
          // Force UI refresh if needed, though Context should handle it.
          setViewMode('LIST'); 
      }
  };

  // --- RENDER ---
  if (viewMode === 'LIST') {
      const filteredBudgets = budgets.filter(b => b.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) || b.id.toString().includes(searchTerm));

      return (
        <div className="flex flex-col h-full bg-[#F8F6F2]">
            <div className="bg-white border-b border-[#D7CCC8] p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-[#4E342E] flex items-center gap-2">
                        <FileText className="text-[#A66B5D]" /> Orçamentos
                    </h1>
                    <button onClick={startNewBudget} className="flex items-center gap-2 bg-[#A66B5D] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#8D5A4D]">
                        <Plus size={20} /> Novo Orçamento
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A66B5D]" size={18} />
                    <input type="text" placeholder="Buscar orçamento por cliente ou ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-[#D7CCC8] rounded-lg bg-white focus:outline-none focus:border-[#A66B5D]" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
                <div className="grid gap-4">
                    {filteredBudgets.map(b => (
                        <div key={b.id} className="bg-white p-4 rounded-xl shadow-sm border border-[#D7CCC8] flex justify-between items-center hover:bg-[#FAFAFA]">
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-lg text-[#4E342E]">#{b.id}</span>
                                    <span className={`text-xs px-2 py-1 rounded font-bold ${b.status === 'ABERTO' ? 'bg-blue-100 text-blue-800' : b.status === 'CONVERTIDO_VENDA' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                                        {b.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <p className="text-[#5D4037] mt-1">{b.clienteNome}</p>
                                <p className="text-xs text-gray-400">
                                    Emitido: {new Date(b.dataEmissao).toLocaleDateString()} • Validade: {new Date(b.dataValidade).toLocaleDateString()}
                                    {b.shippingCost && b.shippingCost > 0 && ` • Frete: R$ ${b.shippingCost.toFixed(2)}`}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-bold text-[#A66B5D]">R$ {b.total.toFixed(2)}</p>
                                <div className="flex gap-2 mt-2">
                                    <button onClick={() => deleteBudget(b.id)} className="p-2 text-red-400 hover:bg-red-50 rounded" title="Excluir"><Trash2 size={16}/></button>
                                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded" title="Imprimir"><Printer size={16}/></button>
                                    {b.status === 'ABERTO' && (
                                        <>
                                            <button onClick={() => editBudget(b)} className="p-2 text-blue-500 hover:bg-blue-50 rounded" title="Editar"><FileText size={16}/></button>
                                            <button onClick={() => handleConvert(b)} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 shadow-sm" title="Gerar Venda (Após Entrega/Pgto)">
                                                <CheckCircle size={14}/> Gerar Venda
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredBudgets.length === 0 && <p className="text-center text-gray-400 mt-10">Nenhum orçamento encontrado.</p>}
                </div>
            </div>
        </div>
      );
  }

  // --- EDITOR MODE ---
  return (
    <div className="flex h-full bg-[#F8F6F2]">
        <div className="flex-1 flex flex-col border-r border-[#D7CCC8]">
            {/* Header */}
            <div className="bg-white p-6 border-b border-[#D7CCC8]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-[#4E342E]">{editingId ? `Editando Orçamento #${editingId}` : 'Novo Orçamento'}</h2>
                    <button onClick={() => setViewMode('LIST')} className="text-gray-400 hover:text-red-500"><X /></button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-[#5D4037] uppercase mb-1">Cliente</label>
                        <select 
                            className="w-full p-2 border border-[#D7CCC8] rounded bg-white"
                            value={selectedClient?.id || ''}
                            onChange={e => setSelectedClient(clients.find(c => c.id === Number(e.target.value)) || null)}
                        >
                            <option value="">Consumidor Final</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#5D4037] uppercase mb-1">Validade</label>
                        <input type="date" className="w-full p-2 border border-[#D7CCC8] rounded bg-white" value={validityDate} onChange={e => setValidityDate(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Item List */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
                <table className="w-full text-left">
                    <thead className="text-xs uppercase text-[#8D6E63] border-b border-[#F0F0F0]">
                        <tr>
                            <th className="pb-2">Item</th>
                            <th className="pb-2 text-right">Valor</th>
                            <th className="pb-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0F0]">
                        {items.map(item => (
                            <tr key={item.uid}>
                                <td className="py-3">
                                    <div className="font-bold text-[#4E342E]">{item.product.nome}</div>
                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                        <ShoppingBag size={10}/> Produto
                                    </div>
                                </td>
                                <td className="py-3 text-right font-mono text-[#4E342E]">R$ {item.subtotal.toFixed(2)}</td>
                                <td className="py-3 text-right">
                                    <button onClick={() => removeItem(item.uid)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Delivery & Totals */}
            <div className="p-6 bg-[#EFEBE9] border-t border-[#D7CCC8]">
                
                {/* Delivery Section */}
                <div className="bg-white rounded-lg p-3 mb-4 border border-[#D7CCC8]">
                    <h4 className="font-bold text-[#A66B5D] text-xs uppercase mb-2 flex items-center gap-2">
                        <Truck size={14}/> Entrega / Frete
                    </h4>
                    <div className="flex gap-4 mb-2">
                        <div className="w-1/3">
                            <label className="block text-[10px] font-bold text-[#5D4037] mb-1">Custo do Frete (R$)</label>
                            <input 
                                type="number" 
                                className="w-full p-2 border border-[#D7CCC8] rounded text-right font-bold text-[#4E342E]"
                                value={shippingCost}
                                onChange={e => setShippingCost(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-[#5D4037] mb-1">Endereço de Entrega</label>
                            <input 
                                type="text" 
                                className="w-full p-2 border border-[#D7CCC8] rounded text-sm"
                                placeholder="Rua, Número, Bairro..."
                                value={deliveryAddress}
                                onChange={e => setDeliveryAddress(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-2 text-sm text-[#8D6E63]">
                    <span>Subtotal Itens</span>
                    <span>R$ {itemsSubtotal.toFixed(2)}</span>
                </div>
                {shipping > 0 && (
                     <div className="flex justify-between items-center mb-2 text-sm text-[#8D6E63]">
                        <span>+ Frete</span>
                        <span>R$ {shipping.toFixed(2)}</span>
                    </div>
                )}
                
                <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-[#5D4037]">Total Geral</span>
                    <span className="text-2xl font-bold text-[#A66B5D]">R$ {grandTotal.toFixed(2)}</span>
                </div>

                <div className="flex gap-3">
                     <button onClick={() => setViewMode('LIST')} className="flex-1 py-3 border border-[#D7CCC8] text-[#5D4037] font-bold rounded">Cancelar</button>
                     <button onClick={saveBudget} className="flex-1 py-3 bg-[#4E342E] text-white font-bold rounded hover:bg-[#3E2723] flex items-center justify-center gap-2">
                        <Save size={18}/> Salvar
                     </button>
                </div>
            </div>
        </div>

        {/* Right Panel: Item Picker */}
        <div className="w-80 bg-[#FAFAFA] border-l border-[#D7CCC8] p-4 flex flex-col">
            <h3 className="font-bold text-[#4E342E] mb-4">Adicionar Produtos</h3>
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    className="w-full pl-9 pr-3 py-2 border border-[#D7CCC8] rounded text-sm outline-none focus:border-[#A66B5D] bg-white"
                    placeholder="Buscar produtos..."
                    value={searchItem}
                    onChange={e => setSearchItem(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
                {searchItem && (
                    <>
                        {filteredProducts.length > 0 && (
                            <div className="space-y-2">
                                {filteredProducts.map(p => (
                                    <div key={p.id} onClick={() => addItem(p)} className="p-2 bg-white border border-[#E0E0E0] rounded cursor-pointer hover:bg-[#FFF8E1] transition-colors">
                                        <div className="font-bold text-sm text-[#4E342E]">{p.nome}</div>
                                        <div className="text-xs text-[#8D6E63] flex justify-between mt-1">
                                            <span>{p.referencia}</span>
                                            <span className="font-bold">R$ {p.preco.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
                {!searchItem && <p className="text-center text-sm text-gray-400 mt-10">Digite para buscar produtos...</p>}
            </div>
            
            <div className="mt-4 pt-4 border-t border-[#D7CCC8]">
                 <label className="block text-xs font-bold text-[#5D4037] mb-1">Observações / Notas</label>
                 <textarea 
                    className="w-full p-2 border border-[#D7CCC8] rounded h-24 text-sm resize-none bg-white"
                    placeholder="Detalhes adicionais..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                 />
            </div>
        </div>
    </div>
  );
};