import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, ProductVariation, CartItem, Client, PaymentPart, PaymentMethodType, Sale } from '../types';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  QrCode, 
  User,
  RotateCcw,
  Tag,
  Box,
  X,
  Loader,
  Menu,
  Printer,
  FileText,
  Percent,
  Check,
  AlertOctagon,
  ArrowRightLeft,
  History,
  List,
  ShieldCheck
} from 'lucide-react';

export const POSView: React.FC = () => {
  const { products, clients, addSale, updateProductStock, logActivity, storeConfig, returnSale, sales, cashSession, openRegister } = useStore();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // -- Hybrid Payment State --
  const [paymentParts, setPaymentParts] = useState<PaymentPart[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<PaymentMethodType | null>(null);
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<string>('');
  const [currentInstallments, setCurrentInstallments] = useState(1);
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);
  const [cpfNota, setCpfNota] = useState(''); // Fiscal ID State

  // Discount State
  const [discountValue, setDiscountValue] = useState(0); // Value in R$
  const [discountPercent, setDiscountPercent] = useState(0); // Value in %
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  // Client Selection Modal
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  // Return/Exchange Modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnSaleId, setReturnSaleId] = useState('');

  // Sales of Day Modal
  const [showDailySalesModal, setShowDailySalesModal] = useState(false);

  // Variation Modal State
  const [variationModalOpen, setVariationModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);

  // Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Open Register State (Inline)
  const [startAmount, setStartAmount] = useState('0.00');

  // Search Logic
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // --- SEARCH LOGIC (Suggestions) ---
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts([]);
      setShowSuggestions(false);
    } else {
      const lower = searchTerm.toLowerCase();
      const results = products.filter(p => 
        p.nome.toLowerCase().includes(lower) || 
        p.referencia.toLowerCase().includes(lower)
      ).slice(0, 8); // Limit to 8 suggestions
      setFilteredProducts(results);
      setShowSuggestions(true);
    }
  }, [searchTerm, products]);

  // Cart Logic
  const addToCart = (product: Product, variation?: ProductVariation) => {
    if (!cashSession.isOpen) {
        // Just focus search to trigger the overlay if clicked outside
        return;
    }

    const existingItem = cart.find(item => 
      item.product.id === product.id && 
      item.variation?.id === variation?.id
    );

    if (existingItem) {
      setCart(cart.map(item => 
        item.uid === existingItem.uid 
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.product.preco }
          : item
      ));
    } else {
      setCart([...cart, {
        uid: Math.random().toString(36).substr(2, 9),
        product,
        variation,
        quantity: 1,
        subtotal: product.preco
      }]);
    }
    setVariationModalOpen(false);
    setPendingProduct(null);
    setSearchTerm('');
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleProductClick = (product: Product) => {
    if (product.variacoes && product.variacoes.length > 0) {
      setPendingProduct(product);
      setVariationModalOpen(true);
      setShowSuggestions(false);
    } else {
      addToCart(product);
    }
  };

  const updateQuantity = (uid: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.uid === uid) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, subtotal: newQty * item.product.preco };
      }
      return item;
    }));
  };

  const removeFromCart = (uid: string) => {
    setCart(cart.filter(item => item.uid !== uid));
  };

  // Totals
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const total = Math.max(0, subtotal - discountValue);

  // --- PRINTING LOGIC ---
  const handlePrint = (data: any) => {
      const methodsString = data.methods.map((m: PaymentPart) => 
        `${m.method}${m.installments ? ` (${m.installments}x)` : ''}: R$ ${m.amount.toFixed(2)}`
      ).join('<br/>');

      const receiptContent = `
        <div style="font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 10px;">
          <div style="text-align: center; margin-bottom: 10px;">
            <h2 style="margin: 0; font-size: 16px;">${storeConfig.storeName}</h2>
            <p style="margin: 0; white-space: pre-wrap;">${storeConfig.storeAddress}</p>
          </div>
          <div style="border-bottom: 1px dashed #000; margin-bottom: 5px;"></div>
          <div style="margin-bottom: 5px;">
            Data: ${new Date().toLocaleString()}<br/>
            Venda: #${data.id}<br/>
            Cliente: ${data.cliente}<br/>
            ${data.cpfNota ? `CPF/CNPJ: ${data.cpfNota}<br/>` : ''}
          </div>
          <div style="border-bottom: 1px dashed #000; margin-bottom: 5px;"></div>
          <table style="width: 100%; font-size: 12px;">
            <tr style="text-align: left;">
              <th>Item</th>
              <th style="text-align: right;">Qtd</th>
              <th style="text-align: right;">Total</th>
            </tr>
            ${data.items.map((item: CartItem) => `
              <tr>
                <td>${item.product.nome} ${item.variation ? `(${item.variation.tamanho})` : ''}</td>
                <td style="text-align: right;">${item.quantity}</td>
                <td style="text-align: right;">${item.subtotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </table>
          <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>
          ${discountValue > 0 ? `
          <div style="text-align: right; font-size: 12px;">
            Subtotal: R$ ${subtotal.toFixed(2)}<br/>
            Desconto: R$ ${discountValue.toFixed(2)}
          </div>
          ` : ''}
          <div style="text-align: right; font-weight: bold; font-size: 14px;">
            TOTAL: R$ ${data.total.toFixed(2)}
          </div>
          <div style="margin-top: 5px;">
            Pagamentos:<br/>
            ${methodsString}
          </div>
          <div style="text-align: right; margin-top: 5px;">
              ${data.change > 0 ? `Troco: R$ ${data.change.toFixed(2)}` : ''}
          </div>
          <div style="border-bottom: 1px dashed #000; margin: 10px 0;"></div>
          <div style="text-align: center;">
            <p>Obrigado pela preferência!</p>
            <p>Trocas somente com este cupom em até 7 dias.</p>
          </div>
        </div>
      `;

      const printWindow = window.open('', '', 'width=400,height=600');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Cupom Fiscal</title></head><body>');
        printWindow.document.write(receiptContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
  };

  // --- ACTIONS ---
  const handleReprint = (sale?: Sale) => {
      const targetSale = sale || (sales.length > 0 ? sales[0] : null);
      if (targetSale) {
          const printableSale = {
              id: targetSale.id,
              total: targetSale.total,
              items: targetSale.items,
              methods: targetSale.paymentDetails.methods,
              change: targetSale.paymentDetails.change,
              cliente: targetSale.clienteNome,
              cpfNota: targetSale.cpfNota
          };
          setReceiptData(printableSale);
          setShowReceiptModal(true);
      } else {
          alert('Nenhuma venda encontrada.');
      }
  };

  const handleExchange = () => {
      if (!returnSaleId) return;
      if (window.confirm(`Deseja realmente estornar a venda #${returnSaleId}? Os itens voltarão ao estoque.`)) {
          const success = returnSale(parseInt(returnSaleId));
          if (success) {
              alert(`Venda #${returnSaleId} estornada com sucesso.`);
              setShowReturnModal(false);
              setReturnSaleId('');
          } else {
              alert('Venda não encontrada ou já processada.');
          }
      }
  };

  // --- HYBRID PAYMENT LOGIC ---
  const totalPaid = paymentParts.reduce((acc, p) => acc + p.amount, 0);
  const remaining = Math.max(0, total - totalPaid);
  const change = totalPaid > total ? totalPaid - total : 0;

  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setPaymentParts([]);
    setLastSaleId(null);
    setCurrentPaymentMethod(null);
    setCurrentPaymentAmount('');
    setCpfNota(selectedClient?.documento || '');
    setShowPaymentModal(true);
  };

  const addPaymentPart = () => {
    if (!currentPaymentMethod) return;
    
    // Validate Carnê
    if (currentPaymentMethod === 'CARNE' && !selectedClient) {
        alert('Selecione um cliente para vender no Carnê.');
        return;
    }

    const amount = parseFloat(currentPaymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    setPaymentParts([...paymentParts, {
        method: currentPaymentMethod,
        amount: amount,
        installments: (currentPaymentMethod === 'CARTAO_CREDITO' || currentPaymentMethod === 'CARNE') ? currentInstallments : undefined
    }]);

    setCurrentPaymentMethod(null);
    setCurrentPaymentAmount('');
    setCurrentInstallments(1);
  };

  const removePaymentPart = (index: number) => {
    const newParts = [...paymentParts];
    newParts.splice(index, 1);
    setPaymentParts(newParts);
  };

  const finishSale = async () => {
    if (remaining > 0.01) { 
        alert('O valor total ainda não foi atingido.');
        return;
    }

    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating API

      const saleId = Date.now();
      const saleDetails: Sale = {
        id: saleId,
        data: new Date().toISOString(),
        clienteNome: selectedClient ? selectedClient.nome : 'Consumidor Final',
        clienteId: selectedClient?.id,
        cpfNota: cpfNota, // Fiscal compliance
        total,
        items: [...cart],
        paymentDetails: {
            methods: paymentParts,
            totalPaid,
            change
        },
        status: 'COMPLETED' as const
      };

      addSale(saleDetails);

      // Inventory Update
      cart.forEach(item => {
        updateProductStock(item.product.id, item.variation?.id, item.quantity);
      });

      // Prepare Receipt
      const printableSale = {
          id: saleId,
          total: total,
          items: cart,
          methods: paymentParts,
          change: change,
          cliente: selectedClient?.nome || 'Consumidor Final',
          cpfNota: cpfNota
      };

      setReceiptData(printableSale);
      setShowPaymentModal(false);
      resetPOS();
      setShowReceiptModal(true);
      
    } catch (error: any) {
      console.error("Erro na venda:", error);
      logActivity('VENDA_ERRO', `Erro ao finalizar venda: ${error.message}`);
      alert('Erro ao processar venda.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetPOS = () => {
      setCart([]);
      setSelectedClient(null);
      setDiscountValue(0);
      setDiscountPercent(0);
      setLastSaleId(null);
      setPaymentParts([]);
      setCurrentPaymentMethod(null);
      setCpfNota('');
  };

  const handleOpenCash = () => {
      const amount = parseFloat(startAmount);
      if(!isNaN(amount)) {
          openRegister(amount);
      }
  };

  // Helper to get today's sales
  const getDailySales = () => {
      const today = new Date().toISOString().split('T')[0];
      return sales.filter(s => s.data.startsWith(today)).reverse();
  };

  // Quick Cash Buttons (GDOOR Inspired)
  const quickMoneyOptions = [2, 5, 10, 20, 50, 100, 200];

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F10' && cart.length > 0 && !showPaymentModal && !showReceiptModal) handleOpenPayment();
      if (e.key === 'F3' && !showPaymentModal) searchInputRef.current?.focus();
      if (e.key === 'F12' && !showPaymentModal && cart.length > 0) {
          handleOpenPayment();
          setTimeout(() => {
             setCurrentPaymentMethod('DINHEIRO');
             setCurrentPaymentAmount(total.toFixed(2));
          }, 100);
      }
      if (e.key === 'Escape') {
        if (showDiscountModal) setShowDiscountModal(false);
        else if (showReturnModal) setShowReturnModal(false);
        else if (showPaymentModal) setShowPaymentModal(false);
        else if (showClientModal) setShowClientModal(false);
        else if (variationModalOpen) setVariationModalOpen(false);
        else if (showReceiptModal) setShowReceiptModal(false);
        else if (showDailySalesModal) setShowDailySalesModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, showPaymentModal, showDiscountModal, lastSaleId, showClientModal, showReturnModal, variationModalOpen, showReceiptModal, total, showDailySalesModal]);

  return (
    <div className="flex h-screen bg-[#F8F6F2] overflow-hidden text-[#4E342E] font-sans relative">
      
      {/* CLOSED REGISTER OVERLAY & INTEGRATED OPENER */}
      {!cashSession.isOpen && (
          <div className="absolute inset-0 bg-[#4E342E]/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white p-8 rounded-xl shadow-2xl border-4 border-[#A66B5D] text-center max-w-md w-full">
                  <div className="flex flex-col items-center">
                    <div className="bg-[#EFEBE9] p-4 rounded-full mb-4">
                        <AlertOctagon size={48} className="text-[#A66B5D]" />
                    </div>
                    <h2 className="text-3xl font-bold text-[#4E342E] mb-2">CAIXA FECHADO</h2>
                    <p className="text-gray-600 mb-6">Informe o saldo inicial para abrir o caixa e iniciar as vendas.</p>
                    
                    <div className="w-full mb-6">
                        <label className="block text-left text-xs font-bold text-[#5D4037] mb-1 uppercase">Fundo de Troco (R$)</label>
                        <input 
                            type="number" 
                            autoFocus
                            value={startAmount}
                            onChange={e => setStartAmount(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleOpenCash()}
                            className="w-full text-3xl font-bold p-3 border border-[#D7CCC8] rounded text-[#4E342E] focus:outline-none focus:border-[#A66B5D] bg-[#F8F6F2]"
                        />
                    </div>

                    <button 
                        onClick={handleOpenCash}
                        className="w-full bg-[#4E342E] text-white py-4 rounded-lg font-bold hover:bg-[#3E2723] shadow-md uppercase tracking-wider"
                    >
                        ABRIR CAIXA
                    </button>
                  </div>
              </div>
          </div>
      )}

      {/* LEFT: Transaction Area */}
      <div className="flex-1 flex flex-col border-r border-[#E0E0E0]">
        
        {/* Top Search Bar */}
        <div className="h-16 bg-white border-b border-[#E0E0E0] flex items-center px-6 gap-3 shadow-sm z-10 relative">
           <Search size={20} className="text-[#A66B5D]" />
           <input 
             ref={searchInputRef}
             type="text" 
             placeholder="Pesquisar produto por nome ou referência... (F3)" 
             className="bg-white border-none outline-none text-[#4E342E] w-full placeholder-[#BCAAA4] text-lg h-full"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
           
           {/* SEARCH SUGGESTIONS DROPDOWN (Enhanced) */}
           {showSuggestions && filteredProducts.length > 0 && (
             <div className="absolute top-full left-0 w-full bg-white shadow-xl border-t border-[#E0E0E0] max-h-[60vh] overflow-y-auto z-50">
                <div className="grid grid-cols-12 bg-[#EFEBE9] p-2 text-xs font-bold text-[#5D4037] uppercase">
                    <div className="col-span-2 pl-2">Referência</div>
                    <div className="col-span-6">Produto</div>
                    <div className="col-span-2 text-center">Estoque</div>
                    <div className="col-span-2 text-right pr-2">Preço</div>
                </div>
                {filteredProducts.map(p => (
                  <div 
                    key={p.id}
                    onMouseDown={() => handleProductClick(p)} // onMouseDown fires before onBlur
                    className="grid grid-cols-12 items-center p-3 hover:bg-[#FFF8E1] cursor-pointer border-b border-[#F0F0F0] text-sm"
                  >
                     <div className="col-span-2 pl-2 font-mono text-[#8D6E63]">{p.referencia}</div>
                     <div className="col-span-6">
                       <p className="font-bold text-[#4E342E]">{p.nome}</p>
                       {p.variacoes.length > 0 && <p className="text-xs text-gray-500">Grade Disponível</p>}
                     </div>
                     <div className="col-span-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${p.estoque > 0 || p.variacoes.some(v=>v.estoqueAtual>0) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                         {p.variacoes.length > 0 ? 'Var.' : `${p.estoque} un`}
                       </span>
                     </div>
                     <div className="col-span-2 text-right pr-2 font-bold text-[#A66B5D]">
                        R$ {p.preco.toFixed(2)}
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>

        {/* List Header - Matches Desktop Video Columns */}
        <div className="grid grid-cols-12 bg-[#EFEBE9] py-3 px-4 text-xs font-bold text-[#5D4037] uppercase border-b border-[#D7CCC8]">
          <div className="col-span-2">Ref</div>
          <div className="col-span-4">Produto</div>
          <div className="col-span-1 text-center">Cor</div>
          <div className="col-span-1 text-center">Tam</div>
          <div className="col-span-1 text-center">Qtd</div>
          <div className="col-span-1 text-right">Preço</div>
          <div className="col-span-2 text-right">SubTotal</div>
        </div>

        {/* Cart Items or Empty State */}
        <div className="flex-1 bg-white overflow-y-auto relative custom-scrollbar">
          {cart.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#D7CCC8] select-none">
              <div className="bg-[#F8F6F2] p-8 rounded-full mb-6">
                <Box size={64} className="opacity-50 text-[#A66B5D]" />
              </div>
              <h2 className="text-2xl font-bold opacity-70 text-[#4E342E]">Caixa Livre</h2>
              <p className="text-sm opacity-60 mt-2 font-medium">Use a barra superior para buscar (F3)</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {cart.map((item, idx) => (
                <div key={item.uid} className={`grid grid-cols-12 py-3 px-4 border-b border-[#F0F0F0] items-center hover:bg-[#FFF8E1] transition-colors text-sm ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}>
                   <div className="col-span-2 font-mono text-[#8D6E63]">{item.product.referencia}</div>
                   <div className="col-span-4 font-bold text-[#3E2723] truncate pr-2">{item.product.nome}</div>
                   <div className="col-span-1 text-center text-[#5D4037]">{item.variation?.cor || '-'}</div>
                   <div className="col-span-1 text-center font-bold text-[#4E342E]">{item.variation?.tamanho || '-'}</div>
                   
                   {/* Quantity Control */}
                   <div className="col-span-1 flex justify-center">
                        <div className="flex items-center border border-[#D7CCC8] rounded bg-white">
                            <button onClick={() => updateQuantity(item.uid, -1)} className="p-1 hover:bg-[#EFEBE9] text-[#A66B5D]"><Minus size={10} /></button>
                            <span className="w-6 text-center font-mono font-bold text-xs">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.uid, 1)} className="p-1 hover:bg-[#EFEBE9] text-[#A66B5D]"><Plus size={10} /></button>
                        </div>
                   </div>

                   <div className="col-span-1 text-right font-mono text-[#5D4037]">
                     {item.product.preco.toFixed(2)}
                   </div>
                   
                   <div className="col-span-2 text-right font-mono text-[#3E2723] font-bold flex justify-end gap-2 items-center">
                     <span className="text-lg">{item.subtotal.toFixed(2)}</span>
                     <button onClick={() => removeFromCart(item.uid)} className="text-[#E57373] hover:text-red-600 ml-2"><Trash2 size={14} /></button>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Totals Bar */}
        <div className="bg-[#EFEBE9] border-t border-[#D7CCC8] p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
           <div className="flex justify-between items-end">
              <div className="flex flex-col gap-2">
                <div className="text-[#5D4037] text-sm font-medium">
                    {selectedClient ? (
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-[#D7CCC8]">
                        <User size={16} className="text-[#A66B5D]"/> 
                        <span className="font-bold">{selectedClient.nome}</span>
                        <button onClick={() => setSelectedClient(null)} className="ml-2 text-gray-400 hover:text-red-500"><X size={12}/></button>
                    </div>
                    ) : (
                        <span className="flex items-center gap-2 text-gray-500 italic"><User size={16}/> Cliente não identificado</span>
                    )}
                </div>
                {discountValue > 0 && (
                   <div className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded inline-block flex items-center gap-1">
                     <Tag size={12} /> Desconto ({discountPercent.toFixed(1)}%): - R$ {discountValue.toFixed(2)}
                   </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-[#8D6E63] text-sm uppercase font-bold mb-1">Total a Pagar</p>
                <div className="text-5xl font-extrabold text-[#3E2723] tracking-tighter">
                  <span className="text-2xl text-[#A66B5D] mr-2">R$</span>
                  {total.toFixed(2)}
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* RIGHT: Action Sidebar */}
      <div className="w-80 bg-[#F8F6F2] flex flex-col border-l border-[#D7CCC8] shadow-xl z-20">
        
        {/* Grid of Tools - REORGANIZED, REMOVED TOP ACTIONS */}
        <div className="flex-1 p-3 grid grid-cols-2 gap-2 content-start bg-[#F8F6F2] overflow-y-auto pt-6">
          <button 
            onClick={() => { if(cart.length > 0) setShowDiscountModal(true); }}
            className="bg-white border border-[#D7CCC8] p-3 rounded flex items-center gap-3 text-xs hover:bg-[#EFEBE9] text-[#4E342E] font-medium shadow-sm transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-[#EFEBE9] flex items-center justify-center text-[#A66B5D]"><Percent size={16}/></div>
            <span>Desconto</span>
          </button>
          <button 
            className="bg-white border border-[#D7CCC8] p-3 rounded flex items-center gap-3 text-xs hover:bg-[#EFEBE9] text-[#4E342E] font-medium shadow-sm transition-all" 
            onClick={() => setShowClientModal(true)}
          >
            <div className="w-8 h-8 rounded-full bg-[#EFEBE9] flex items-center justify-center text-[#A66B5D]"><User size={16}/></div>
            <span>Cliente</span>
          </button>
          
          <button 
            onClick={() => setShowDailySalesModal(true)}
            className="bg-white border border-[#D7CCC8] p-3 rounded flex items-center gap-3 text-xs hover:bg-[#EFEBE9] text-[#4E342E] font-medium shadow-sm transition-all"
          >
             <div className="w-8 h-8 rounded-full bg-[#EFEBE9] flex items-center justify-center text-[#A66B5D]"><List size={16}/></div>
             <span>Vendas do Dia</span>
          </button>

          <button 
            onClick={() => setShowReturnModal(true)}
            className="bg-white border border-[#D7CCC8] p-3 rounded flex items-center gap-3 text-xs hover:bg-[#EFEBE9] text-[#4E342E] font-medium shadow-sm transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-[#EFEBE9] flex items-center justify-center text-[#A66B5D]"><ArrowRightLeft size={16}/></div>
            <span>Troca</span>
          </button>
          <button 
            onClick={() => handleReprint()}
            className="bg-white border border-[#D7CCC8] p-3 rounded flex items-center gap-3 text-xs hover:bg-[#EFEBE9] text-[#4E342E] font-medium shadow-sm transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-[#EFEBE9] flex items-center justify-center text-[#A66B5D]"><Printer size={16}/></div>
            <span>Reimprimir</span>
          </button>
        </div>

        {/* Big Pay Button */}
        <div className="p-4 bg-white border-t border-[#D7CCC8]">
          <button 
            onClick={handleOpenPayment}
            disabled={cart.length === 0}
            className="w-full h-20 bg-[#A66B5D] hover:bg-[#8D5A4D] text-white font-bold rounded-lg shadow-lg flex flex-col items-center justify-center disabled:grayscale disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            <span className="text-2xl uppercase tracking-widest">Finalizar</span>
            <span className="text-xs text-[#EFEBE9] bg-[#8D5A4D] px-2 py-0.5 rounded mt-1">Tecla F10</span>
          </button>
        </div>
      </div>

      {/* --- MODALS --- */}
      {/* Daily Sales Modal */}
      {showDailySalesModal && (
          <div className="fixed inset-0 bg-[#4E342E]/80 z-[55] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl p-6 border border-[#A66B5D] flex flex-col max-h-[85vh]">
                  <div className="flex justify-between items-center mb-6 border-b border-[#F0F0F0] pb-2">
                     <h3 className="text-xl font-bold text-[#4E342E] flex items-center gap-2"><List/> Vendas do Dia ({new Date().toLocaleDateString()})</h3>
                     <button onClick={() => setShowDailySalesModal(false)}><X /></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                          <thead className="bg-[#EFEBE9] text-[#5D4037] text-sm sticky top-0">
                              <tr>
                                  <th className="p-3">Hora</th>
                                  <th className="p-3">ID</th>
                                  <th className="p-3">Cliente</th>
                                  <th className="p-3 text-right">Total</th>
                                  <th className="p-3 text-center">Status</th>
                                  <th className="p-3 text-right">Ações</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F0F0F0]">
                              {getDailySales().map(sale => (
                                  <tr key={sale.id} className="hover:bg-[#FFF8E1]">
                                      <td className="p-3 text-sm text-[#8D6E63] font-mono">{new Date(sale.data).toLocaleTimeString()}</td>
                                      <td className="p-3 text-sm font-bold text-[#4E342E]">#{sale.id}</td>
                                      <td className="p-3 text-sm text-[#4E342E]">{sale.clienteNome}</td>
                                      <td className="p-3 text-right font-bold text-[#A66B5D]">R$ {sale.total.toFixed(2)}</td>
                                      <td className="p-3 text-center">
                                          {sale.status === 'CANCELLED' ? (
                                              <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-bold">CANCELADA</span>
                                          ) : (
                                              <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded font-bold">OK</span>
                                          )}
                                      </td>
                                      <td className="p-3 text-right flex justify-end gap-2">
                                          <button 
                                            onClick={() => { handleReprint(sale); }}
                                            className="p-2 text-[#4E342E] hover:bg-[#EFEBE9] rounded border border-[#D7CCC8]"
                                            title="Imprimir Cupom"
                                          >
                                              <Printer size={16}/>
                                          </button>
                                          {sale.status !== 'CANCELLED' && (
                                              <button 
                                                onClick={() => { setReturnSaleId(sale.id.toString()); setShowDailySalesModal(false); setShowReturnModal(true); }}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded border border-red-200"
                                                title="Trocar / Estornar"
                                              >
                                                  <RotateCcw size={16}/>
                                              </button>
                                          )}
                                      </td>
                                  </tr>
                              ))}
                              {getDailySales().length === 0 && (
                                  <tr>
                                      <td colSpan={6} className="p-8 text-center text-gray-400">Nenhuma venda registrada hoje.</td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* Receipt Preview Modal */}
      {showReceiptModal && receiptData && (
          <div className="fixed inset-0 bg-[#4E342E]/80 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-2xl p-6 border border-[#A66B5D] flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center mb-4 border-b border-[#F0F0F0] pb-2">
                     <h3 className="text-xl font-bold text-[#4E342E]">Cupom Não Fiscal</h3>
                     <button onClick={() => setShowReceiptModal(false)}><X /></button>
                  </div>
                  
                  <div className="bg-[#F8F6F2] p-4 font-mono text-xs border border-gray-300 shadow-inner overflow-y-auto w-[80mm] mx-auto mb-4" style={{ minHeight: '300px' }}>
                     <div className="text-center mb-2">
                        <h2 className="font-bold text-sm">{storeConfig.storeName}</h2>
                        <p>{storeConfig.storeAddress}</p>
                     </div>
                     <div className="border-b border-dashed border-gray-400 mb-2"></div>
                     <div className="mb-2">
                        Data: {new Date().toLocaleString()}<br/>
                        Venda: #{receiptData.id}<br/>
                        Cliente: {receiptData.cliente}<br/>
                        {receiptData.cpfNota && <span>CPF: {receiptData.cpfNota}</span>}
                     </div>
                     <div className="border-b border-dashed border-gray-400 mb-2"></div>
                     <table className="w-full text-left">
                         <thead>
                             <tr><th>Item</th><th className="text-right">Qtd</th><th className="text-right">Total</th></tr>
                         </thead>
                         <tbody>
                             {receiptData.items.map((item: CartItem, i: number) => (
                                 <tr key={i}>
                                     <td>{item.product.nome} {item.variation ? `(${item.variation.tamanho})` : ''}</td>
                                     <td className="text-right">{item.quantity}</td>
                                     <td className="text-right">{item.subtotal.toFixed(2)}</td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                     <div className="border-b border-dashed border-gray-400 my-2"></div>
                     <div className="text-right font-bold text-sm">TOTAL: R$ {receiptData.total.toFixed(2)}</div>
                     <div className="mt-2">
                         Pagamentos:<br/>
                         {receiptData.methods.map((m: PaymentPart) => `${m.method}: R$ ${m.amount.toFixed(2)}`).join(', ')}
                     </div>
                     {receiptData.change > 0 && <div className="text-right mt-1">Troco: R$ {receiptData.change.toFixed(2)}</div>}
                     <div className="border-b border-dashed border-gray-400 my-2"></div>
                     <div className="text-center italic">Obrigado pela preferência!</div>
                  </div>

                  <div className="flex gap-2">
                      <button onClick={() => handlePrint(receiptData)} className="flex-1 bg-[#4E342E] text-white py-3 rounded font-bold hover:bg-[#3E2723] flex items-center justify-center gap-2">
                          <Printer size={18}/> Imprimir
                      </button>
                      <button onClick={() => setShowReceiptModal(false)} className="flex-1 border border-[#D7CCC8] text-[#5D4037] py-3 rounded font-bold hover:bg-[#EFEBE9]">
                          Fechar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Client Selection Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-[#4E342E]/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl p-6 border border-[#A66B5D] flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center mb-4 border-b border-[#F0F0F0] pb-2">
                   <h3 className="text-xl font-bold text-[#4E342E]">Selecionar Cliente</h3>
                   <button onClick={() => setShowClientModal(false)}><X /></button>
                </div>
                
                <div className="mb-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        autoFocus
                        placeholder="Buscar por nome ou CPF..." 
                        className="w-full pl-10 pr-4 py-2 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] bg-white"
                        value={clientSearch}
                        onChange={e => setClientSearch(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                    {clients.filter(c => c.nome.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
                        <div 
                            key={c.id} 
                            onClick={() => { setSelectedClient(c); setShowClientModal(false); }}
                            className="p-3 bg-[#FAFAFA] hover:bg-[#EFEBE9] rounded cursor-pointer border border-[#F0F0F0] flex justify-between items-center"
                        >
                            <div>
                                <p className="font-bold text-[#4E342E]">{c.nome}</p>
                                <p className="text-xs text-gray-500">{c.telefone} {c.documento ? `• ${c.documento}` : ''}</p>
                            </div>
                            {selectedClient?.id === c.id && <Check className="text-green-600" size={18} />}
                        </div>
                    ))}
                    {clients.length === 0 && <p className="text-center text-gray-400">Nenhum cliente encontrado.</p>}
                </div>
            </div>
        </div>
      )}

      {/* Return/Exchange Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-[#4E342E]/80 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl p-6 border border-[#A66B5D]">
                <h3 className="text-xl font-bold text-[#4E342E] mb-4 flex items-center gap-2"><ArrowRightLeft/> Troca de Itens</h3>
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Digite o número da venda para realizar a troca. Os itens voltarão ao estoque.</p>
                    
                    <div>
                        <label className="block text-xs font-bold text-[#5D4037] mb-1">ID da Venda</label>
                        <input 
                            type="number" 
                            className="w-full p-2 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] font-bold text-[#4E342E] bg-white"
                            placeholder="Ex: 12345"
                            value={returnSaleId}
                            onChange={(e) => setReturnSaleId(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowReturnModal(false)}
                            className="flex-1 border border-[#D7CCC8] text-[#5D4037] py-3 rounded font-bold hover:bg-[#EFEBE9]"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleExchange}
                            className="flex-1 bg-[#4E342E] text-white py-3 rounded font-bold hover:bg-[#3E2723]"
                        >
                            Confirmar Troca
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Custom Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-[#4E342E]/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl p-6 border border-[#A66B5D]">
                <h3 className="text-xl font-bold text-[#4E342E] mb-4">Aplicar Desconto</h3>
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Subtotal atual: <span className="font-bold">R$ {subtotal.toFixed(2)}</span></p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#5D4037] mb-1">Porcentagem (%)</label>
                        <input 
                            type="number" 
                            className="w-full p-2 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] font-bold text-[#4E342E] bg-white"
                            placeholder="0"
                            value={discountPercent || ''}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if(!isNaN(val)) {
                                  setDiscountPercent(val);
                                  setDiscountValue(subtotal * (val / 100));
                                } else {
                                  setDiscountPercent(0);
                                  setDiscountValue(0);
                                }
                            }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#5D4037] mb-1">Valor (R$)</label>
                        <input 
                            type="number" 
                            className="w-full p-2 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] font-bold text-[#4E342E] bg-white"
                            placeholder="0.00"
                            value={discountValue || ''}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if(!isNaN(val)) {
                                  setDiscountValue(val);
                                  setDiscountPercent((val / subtotal) * 100);
                                } else {
                                  setDiscountValue(0);
                                  setDiscountPercent(0);
                                }
                            }}
                        />
                      </div>
                    </div>

                    <button 
                        onClick={() => setShowDiscountModal(false)}
                        className="w-full bg-[#4E342E] text-white py-3 rounded font-bold hover:bg-[#3E2723]"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Variation Selection Modal */}
      {variationModalOpen && pendingProduct && (
        <div className="fixed inset-0 bg-[#4E342E]/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl p-6 border border-[#A1887F]">
            <div className="flex justify-between items-center mb-6 border-b border-[#F0F0F0] pb-4">
              <h3 className="text-xl font-bold text-[#4E342E]">Selecione a Variação</h3>
              <button onClick={() => setVariationModalOpen(false)}><X className="text-gray-400 hover:text-red-500" /></button>
            </div>
            
            <div className="flex gap-4 mb-6">
               <div className="w-24 h-24 bg-[#F8F6F2] rounded-lg flex items-center justify-center border border-[#E0E0E0]">
                  <img src={pendingProduct.imageUrl} className="w-full h-full object-cover rounded-lg" />
               </div>
               <div>
                 <h4 className="font-bold text-lg text-[#4E342E]">{pendingProduct.nome}</h4>
                 <p className="text-[#8D6E63] text-sm">{pendingProduct.referencia}</p>
                 <p className="font-bold text-[#A66B5D] mt-2 text-xl">R$ {pendingProduct.preco.toFixed(2)}</p>
               </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2 font-bold text-xs text-[#8D6E63] uppercase px-2">
                <span>Cor</span>
                <span>Tam</span>
                <span>Qtd</span>
                <span>Adicionar</span>
              </div>
              {pendingProduct.variacoes.map(v => (
                <div key={v.id} className="grid grid-cols-4 gap-2 items-center bg-[#FAFAFA] p-3 rounded-lg hover:bg-[#FFF8E1] transition-colors border border-[#F0F0F0]">
                  <span className="font-medium text-[#4E342E]">{v.cor}</span>
                  <span className="bg-white border border-[#E0E0E0] px-2 py-1 rounded text-center text-sm font-bold text-[#5D4037]">{v.tamanho}</span>
                  <span className={`text-sm font-bold ${v.estoqueAtual > 0 ? 'text-green-600' : 'text-red-500'}`}>{v.estoqueAtual}</span>
                  <button 
                    disabled={v.estoqueAtual === 0}
                    onClick={() => addToCart(pendingProduct, v)}
                    className="bg-[#A66B5D] text-white p-2 rounded hover:bg-[#8D5A4D] disabled:bg-[#E0E0E0] disabled:text-gray-400 flex items-center justify-center shadow-sm"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hybrid Payment Modal - Improved Layout */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-[#4E342E]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#F8F6F2] rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[650px] border border-[#A1887F] relative">
            
            {/* Header */}
            <div className="p-6 bg-[#A66B5D] text-white flex justify-between items-center shadow-md">
              <div>
                <h2 className="text-2xl font-bold tracking-wide">PAGAMENTO</h2>
                <div className="flex gap-4 mt-1 opacity-90 text-sm">
                  <p>Total: <span className="font-bold text-lg">R$ {total.toFixed(2)}</span></p>
                </div>
              </div>
              <button onClick={() => { if(!isProcessing) setShowPaymentModal(false); }} className="bg-white/20 p-2 rounded hover:bg-white/30 text-white"><X /></button>
            </div>

            <div className="flex-1 flex bg-[#F8F6F2]">
                
                {/* LEFT Panel: Input and Methods */}
                <div className="flex-1 p-6 relative flex flex-col">
                     
                     {/* CPF Input Bar (Visible when no method selected) */}
                     {!currentPaymentMethod && (
                        <div className="mb-4 bg-white p-3 rounded border border-[#D7CCC8] flex items-center gap-2">
                           <ShieldCheck size={20} className="text-[#A66B5D]"/>
                           <input 
                              type="text"
                              placeholder="CPF/CNPJ na Nota (Opcional)"
                              value={cpfNota}
                              onChange={e => setCpfNota(e.target.value)}
                              className="flex-1 outline-none text-[#4E342E] bg-transparent font-medium"
                           />
                        </div>
                     )}

                     {!currentPaymentMethod ? (
                        <>
                            <h3 className="font-bold text-[#5D4037] mb-4 uppercase">Selecione a forma de pagamento</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => { setCurrentPaymentMethod('DINHEIRO'); setCurrentPaymentAmount(remaining.toFixed(2)); }} className="h-28 bg-white hover:bg-[#F1F8E9] border-l-4 border-[#33691E] rounded shadow-sm p-4 flex flex-col justify-between group transition-all">
                                    <Banknote size={32} className="text-[#33691E]" />
                                    <span className="text-left font-bold text-[#4E342E]">Dinheiro</span>
                                </button>
                                <button onClick={() => { setCurrentPaymentMethod('PIX'); setCurrentPaymentAmount(remaining.toFixed(2)); }} className="h-28 bg-white hover:bg-[#E0F2F1] border-l-4 border-[#00695C] rounded shadow-sm p-4 flex flex-col justify-between group transition-all">
                                    <QrCode size={32} className="text-[#00695C]" />
                                    <span className="text-left font-bold text-[#4E342E]">PIX</span>
                                </button>
                                <button onClick={() => { setCurrentPaymentMethod('CARTAO_CREDITO'); setCurrentPaymentAmount(remaining.toFixed(2)); }} className="h-28 bg-white hover:bg-[#E3F2FD] border-l-4 border-[#0D47A1] rounded shadow-sm p-4 flex flex-col justify-between group transition-all">
                                    <CreditCard size={32} className="text-[#0D47A1]" />
                                    <span className="text-left font-bold text-[#4E342E]">Cartão Crédito</span>
                                </button>
                                <button onClick={() => { setCurrentPaymentMethod('CARTAO_DEBITO'); setCurrentPaymentAmount(remaining.toFixed(2)); }} className="h-28 bg-white hover:bg-[#E3F2FD] border-l-4 border-[#1565C0] rounded shadow-sm p-4 flex flex-col justify-between group transition-all">
                                    <CreditCard size={32} className="text-[#1565C0]" />
                                    <span className="text-left font-bold text-[#4E342E]">Cartão Débito</span>
                                </button>
                                <button onClick={() => { setCurrentPaymentMethod('CARNE'); setCurrentPaymentAmount(remaining.toFixed(2)); }} className="h-28 bg-white hover:bg-[#FFF3E0] border-l-4 border-[#E65100] rounded shadow-sm p-4 flex flex-col justify-between group transition-all">
                                    <FileText size={32} className="text-[#E65100]" />
                                    <span className="text-left font-bold text-[#4E342E]">Carnê / Crediário</span>
                                </button>
                            </div>
                        </>
                     ) : (
                        <div className="bg-white p-6 rounded-xl border border-[#D7CCC8] shadow-sm max-w-md mx-auto mt-4 w-full">
                            <h3 className="text-xl font-bold text-[#4E342E] mb-6 flex items-center gap-2">
                                {currentPaymentMethod === 'DINHEIRO' && <Banknote />}
                                {currentPaymentMethod === 'PIX' && <QrCode />}
                                {(currentPaymentMethod === 'CARTAO_CREDITO' || currentPaymentMethod === 'CARTAO_DEBITO') && <CreditCard />}
                                {currentPaymentMethod === 'CARNE' && <FileText />}
                                {currentPaymentMethod.replace('_', ' ')}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#5D4037] mb-2">Valor a Pagar / Recebido</label>
                                    <input 
                                        type="number"
                                        autoFocus
                                        className="w-full p-3 border border-[#D7CCC8] rounded text-xl font-bold text-[#4E342E] focus:border-[#A66B5D] outline-none bg-white"
                                        value={currentPaymentAmount}
                                        onChange={(e) => setCurrentPaymentAmount(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addPaymentPart()}
                                    />
                                    
                                    {/* QUICK CASH BUTTONS (GDOOR Inspired) */}
                                    {currentPaymentMethod === 'DINHEIRO' && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {quickMoneyOptions.map(val => (
                                                <button 
                                                    key={val}
                                                    onClick={() => setCurrentPaymentAmount(val.toString())}
                                                    className="bg-[#EFEBE9] hover:bg-[#D7CCC8] text-[#5D4037] text-xs font-bold px-3 py-2 rounded border border-[#D7CCC8]"
                                                >
                                                    R$ {val}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {currentPaymentMethod === 'DINHEIRO' && parseFloat(currentPaymentAmount) > remaining && (
                                        <p className="text-sm font-bold text-green-600 mt-2">Troco Estimado: R$ {(parseFloat(currentPaymentAmount) - remaining).toFixed(2)}</p>
                                    )}
                                </div>

                                {(currentPaymentMethod === 'CARTAO_CREDITO' || currentPaymentMethod === 'CARNE') && (
                                    <div>
                                        <label className="block text-sm font-bold text-[#5D4037] mb-2">Parcelas</label>
                                        <select 
                                            className="w-full p-3 border border-[#D7CCC8] rounded bg-white font-medium"
                                            value={currentInstallments}
                                            onChange={(e) => setCurrentInstallments(Number(e.target.value))}
                                        >
                                            {[1,2,3,4,5,6,10,12].map(i => (
                                                <option key={i} value={i}>{i}x</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button onClick={() => setCurrentPaymentMethod(null)} className="flex-1 py-3 border border-[#D7CCC8] text-[#5D4037] font-bold rounded">Voltar</button>
                                <button onClick={addPaymentPart} className="flex-1 py-3 bg-[#4E342E] text-white font-bold rounded hover:bg-[#3E2723]">Adicionar</button>
                            </div>
                        </div>
                     )}
                </div>

                {/* RIGHT Panel: Summary List */}
                <div className="w-1/3 bg-white border-l border-[#D7CCC8] flex flex-col">
                    <div className="p-6 border-b border-[#D7CCC8] bg-gray-50">
                        <p className="text-sm font-bold text-[#8D6E63] uppercase mb-1">Restante a Pagar</p>
                        <p className={`text-4xl font-extrabold ${remaining > 0 ? 'text-[#A66B5D]' : 'text-green-600'}`}>
                        R$ {remaining.toFixed(2)}
                        </p>
                        {change > 0 && (
                        <p className="text-sm font-bold text-green-600 mt-2 bg-green-50 px-2 py-1 rounded inline-block border border-green-200">
                            Troco: R$ {change.toFixed(2)}
                        </p>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Pagamentos Adicionados</h4>
                    {paymentParts.map((part, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-[#F8F6F2] p-3 rounded border border-[#E0E0E0]">
                            <div>
                                <p className="font-bold text-[#4E342E] text-sm">
                                    {part.method === 'CARTAO_CREDITO' ? 'CRÉDITO' : 
                                        part.method === 'CARTAO_DEBITO' ? 'DÉBITO' : part.method}
                                    {part.installments && ` (${part.installments}x)`}
                                </p>
                                <p className="text-xs text-[#8D6E63]">R$ {part.amount.toFixed(2)}</p>
                            </div>
                            <button onClick={() => removePaymentPart(idx)} className="text-red-400 hover:text-red-600 p-1">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {paymentParts.length === 0 && (
                        <p className="text-center text-gray-400 text-sm mt-4 italic">Nenhum pagamento.</p>
                    )}
                    </div>

                    <div className="p-4 border-t border-[#D7CCC8]">
                        <button 
                        onClick={finishSale}
                        disabled={remaining > 0.01}
                        className="w-full py-4 bg-[#4E342E] text-white font-bold rounded hover:bg-[#3E2723] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider shadow-lg"
                        >
                            FINALIZAR VENDA
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};