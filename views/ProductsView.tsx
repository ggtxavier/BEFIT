import React, { useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, ProductVariation, Supplier } from '../types';
import { Plus, Edit2, Trash2, Upload, FileSpreadsheet, Package, Truck, Search, X, Check, Save, Download, AlertCircle } from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { products, suppliers, addProduct, updateProduct, deleteProduct, addSupplier, updateSupplier, deleteSupplier, storeConfig } = useStore();
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'SUPPLIERS'>('PRODUCTS');
  const [searchTerm, setSearchTerm] = useState('');
  
  // -- CSV Import State --
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  // -- Product Modal State --
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodRef, setProdRef] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodSupplier, setProdSupplier] = useState('');
  
  // -- Variations State within Modal --
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [simpleStock, setSimpleStock] = useState('0'); // Used if no variations
  const [newVarColor, setNewVarColor] = useState('');
  const [newVarSize, setNewVarSize] = useState('');
  const [newVarQty, setNewVarQty] = useState('');

  // -- Supplier Modal State --
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supName, setSupName] = useState('');

  // --- CSV LOGIC ---
  const handleExportCSV = () => {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Qtd,Nome,Referencia,Cor,Tamanho,Preco,Fornecedor\n";

      products.forEach(p => {
          if (p.variacoes.length > 0) {
              p.variacoes.forEach(v => {
                  csvContent += `${v.estoqueAtual},"${p.nome}","${p.referencia}","${v.cor}","${v.tamanho}",${p.preco},"${p.fornecedorNome}"\n`;
              });
          } else {
              csvContent += `${p.estoque},"${p.nome}","${p.referencia}","","",${p.preco},"${p.fornecedorNome}"\n`;
          }
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "inventario_befit.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(l => l.trim() !== '');
    
    // Helper to clean quotes
    const clean = (str: string) => str ? str.replace(/^"|"$/g, '').trim() : '';
    
    // Helper to parse currency specifically for BR format
    const parseCurrency = (str: string) => {
        if(!str) return 0;
        let cleanStr = clean(str).replace('R$', '').trim();
        if (cleanStr.includes(',')) {
            cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
        }
        return parseFloat(cleanStr) || 0;
    };

    // 1. Group rows by Reference to handle duplicates in CSV
    interface CSVRow {
        qtd: number;
        nome: string;
        ref: string;
        cor: string;
        tamanho: string;
        preco: number;
        fornecedor: string;
    }

    const groups: Record<string, CSVRow[]> = {};

    for (let i = 1; i < lines.length; i++) {
        // Parse columns
        const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!matches || matches.length < 7) continue;

        const row: CSVRow = {
            qtd: parseInt(clean(matches[0])) || 0,
            nome: clean(matches[1]),
            ref: clean(matches[2]),
            cor: clean(matches[3]),
            tamanho: clean(matches[4]),
            preco: parseCurrency(matches[5]),
            fornecedor: clean(matches[6])
        };

        if (!row.ref) continue;

        if (!groups[row.ref]) {
            groups[row.ref] = [];
        }
        groups[row.ref].push(row);
    }

    let processedGroups = 0;

    // 2. Process each unique Reference
    Object.keys(groups).forEach(refKey => {
        const rows = groups[refKey];
        const baseRow = rows[0]; // Use first row for Name, Price, Supplier info

        // Ensure Supplier Exists
        if (baseRow.fornecedor) {
            const existingSup = suppliers.find(s => s.nome.toUpperCase() === baseRow.fornecedor.toUpperCase());
            if (!existingSup) {
                addSupplier({ id: Date.now() + Math.random(), nome: baseRow.fornecedor });
            }
        }

        const existingProd = products.find(p => p.referencia === refKey);

        if (existingProd) {
            // MERGE Logic: Update existing product with new variations
            let updatedVariations = [...existingProd.variacoes];

            rows.forEach(row => {
                // Check if this specific color/size combo exists
                const existingVarIndex = updatedVariations.findIndex(v => 
                    v.cor.toLowerCase() === row.cor.toLowerCase() && 
                    v.tamanho.toLowerCase() === row.tamanho.toLowerCase()
                );

                if (existingVarIndex >= 0) {
                    // Update existing variation stock
                    updatedVariations[existingVarIndex] = {
                        ...updatedVariations[existingVarIndex],
                        estoqueAtual: updatedVariations[existingVarIndex].estoqueAtual + row.qtd
                    };
                } else {
                    // Add new variation
                    updatedVariations.push({
                        id: Date.now() + Math.random(),
                        produtoId: existingProd.id,
                        cor: row.cor,
                        tamanho: row.tamanho,
                        estoqueAtual: row.qtd
                    });
                }
            });

            updateProduct({
                ...existingProd,
                variacoes: updatedVariations,
                preco: baseRow.preco > 0 ? baseRow.preco : existingProd.preco // Update price if provided
            });

        } else {
            // CREATE Logic: Create new product with all aggregated variations
            const newVariations: ProductVariation[] = rows.map(row => ({
                id: Date.now() + Math.random(),
                produtoId: 0, // Placeholder
                cor: row.cor,
                tamanho: row.tamanho,
                estoqueAtual: row.qtd
            }));

            const newProd: Product = {
                id: Date.now() + Math.random(),
                referencia: baseRow.ref,
                nome: baseRow.nome,
                preco: baseRow.preco,
                estoque: 0, // Master stock 0 for varied products
                fornecedorNome: baseRow.fornecedor,
                variacoes: newVariations,
                imageUrl: 'https://placehold.co/200'
            };
            addProduct(newProd);
        }
        processedGroups++;
    });

    alert(`Importação concluída! ${processedGroups} produtos processados/atualizados.`);
  };

  // --- CRUD HANDLERS ---
  const handleAddVariation = () => {
    if (!newVarColor || !newVarSize || !newVarQty) return;
    const newVar: ProductVariation = {
        id: Date.now() + Math.random(),
        produtoId: editingProduct ? editingProduct.id : 0, 
        cor: newVarColor,
        tamanho: newVarSize,
        estoqueAtual: parseInt(newVarQty)
    };
    setVariations([...variations, newVar]);
    setNewVarColor('');
    setNewVarSize('');
    setNewVarQty('');
  };

  const handleRemoveVariation = (id: number) => {
    setVariations(variations.filter(v => v.id !== id));
  };

  const handleSaveProduct = () => {
    if(!prodName || !prodPrice) return;
    
    const hasVariations = variations.length > 0;
    const finalStock = hasVariations ? 0 : (parseInt(simpleStock) || 0);

    const productData: Product = {
        id: editingProduct ? editingProduct.id : Date.now(),
        nome: prodName,
        referencia: prodRef,
        preco: parseFloat(prodPrice),
        estoque: finalStock,
        fornecedorNome: prodSupplier,
        imageUrl: editingProduct?.imageUrl || 'https://placehold.co/200',
        variacoes: variations
    };

    if (editingProduct) {
        updateProduct(productData);
    } else {
        addProduct(productData);
    }
    setShowProductModal(false);
  };

  const openProductModal = (product?: Product) => {
    if (product) {
        setEditingProduct(product);
        setProdName(product.nome);
        setProdRef(product.referencia);
        setProdPrice(product.preco.toString());
        setProdSupplier(product.fornecedorNome);
        setVariations(product.variacoes);
        setSimpleStock(product.estoque.toString());
    } else {
        setEditingProduct(null);
        setProdName('');
        setProdRef('');
        setProdPrice('');
        setProdSupplier('');
        setVariations([]);
        setSimpleStock('0');
    }
    setNewVarColor('');
    setNewVarSize('');
    setNewVarQty('');
    setShowProductModal(true);
  };

  const handleSaveSupplier = () => {
    if(!supName) return;
    if(editingSupplier) {
        updateSupplier({ ...editingSupplier, nome: supName });
    } else {
        addSupplier({ id: Date.now(), nome: supName });
    }
    setShowSupplierModal(false);
  };

  const openSupplierModal = (supplier?: Supplier) => {
    if(supplier) {
        setEditingSupplier(supplier);
        setSupName(supplier.nome);
    } else {
        setEditingSupplier(null);
        setSupName('');
    }
    setShowSupplierModal(true);
  };

  // --- RENDER ---

  const filteredProducts = products.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || p.referencia.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredSuppliers = suppliers.filter(s => s.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  // Check if a product has low stock
  const isLowStock = (p: Product) => {
      const thresh = storeConfig.lowStockThreshold || 5;
      if (p.variacoes.length > 0) {
          return p.variacoes.some(v => v.estoqueAtual < thresh);
      }
      return p.estoque < thresh;
  };
  
  // Check if a product has ZERO stock (critical)
  const isZeroStock = (p: Product) => {
      if (p.variacoes.length > 0) {
          // If all variations are zero, or if specific critical variations are zero (simplify to ANY zero for visual cue)
          return p.variacoes.some(v => v.estoqueAtual === 0);
      }
      return p.estoque === 0;
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F6F2]">
        {/* Header & Tabs */}
        <div className="bg-white border-b border-[#D7CCC8] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#4E342E]">Estoque & Produtos</h1>
                
                {activeTab === 'PRODUCTS' && (
                    <div className="flex gap-2">
                         <input 
                            type="file" 
                            accept=".csv" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleFileUpload} 
                        />
                         <button 
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 bg-white text-[#5D4037] px-4 py-2 rounded-lg font-bold border border-[#D7CCC8] hover:bg-[#EFEBE9]"
                        >
                            <Download size={20} /> Exportar
                        </button>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isImporting}
                            className="flex items-center gap-2 bg-[#EFEBE9] text-[#5D4037] px-4 py-2 rounded-lg font-bold border border-[#D7CCC8] hover:bg-[#D7CCC8]"
                        >
                            {isImporting ? <span className="animate-spin">⌛</span> : <FileSpreadsheet size={20} />}
                            Importar CSV
                        </button>
                        <button 
                            onClick={() => openProductModal()}
                            className="flex items-center gap-2 bg-[#A66B5D] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#8D5A4D]"
                        >
                            <Plus size={20} /> Novo Produto
                        </button>
                    </div>
                )}
                 {activeTab === 'SUPPLIERS' && (
                     <button 
                        onClick={() => openSupplierModal()}
                        className="flex items-center gap-2 bg-[#A66B5D] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#8D5A4D]"
                    >
                        <Plus size={20} /> Novo Fornecedor
                    </button>
                 )}
            </div>

            <div className="flex gap-4">
                <button 
                    onClick={() => setActiveTab('PRODUCTS')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-bold transition-colors ${activeTab === 'PRODUCTS' ? 'bg-[#4E342E] text-white' : 'text-[#8D6E63] hover:bg-[#EFEBE9]'}`}
                >
                    <Package size={18} /> Produtos
                </button>
                <button 
                    onClick={() => setActiveTab('SUPPLIERS')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-bold transition-colors ${activeTab === 'SUPPLIERS' ? 'bg-[#4E342E] text-white' : 'text-[#8D6E63] hover:bg-[#EFEBE9]'}`}
                >
                    <Truck size={18} /> Fornecedores
                </button>
            </div>
            
            <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A66B5D]" size={18} />
                <input 
                    type="text" 
                    placeholder={`Buscar ${activeTab === 'PRODUCTS' ? 'produto ou referência' : 'fornecedor'}...`}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-[#D7CCC8] rounded-lg bg-white focus:outline-none focus:border-[#A66B5D]"
                />
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'PRODUCTS' && (
                <div className="grid grid-cols-1 gap-4">
                     <table className="w-full text-left bg-white rounded-xl shadow-sm overflow-hidden">
                        <thead className="bg-[#EFEBE9] border-b border-[#D7CCC8] text-[#5D4037]">
                            <tr>
                                <th className="p-4">Ref</th>
                                <th className="p-4">Nome</th>
                                <th className="p-4">Fornecedor</th>
                                <th className="p-4 text-right">Preço</th>
                                <th className="p-4 text-center">Grade / Estoque</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F0F0]">
                            {filteredProducts.map(p => {
                                const zeroStock = isZeroStock(p);
                                const lowStock = isLowStock(p);
                                return (
                                    <tr key={p.id} className={`hover:bg-[#FFF8E1] transition-colors ${zeroStock ? 'bg-red-50' : ''}`}>
                                        <td className="p-4 font-mono text-sm text-gray-500 flex items-center gap-2">
                                            {p.referencia}
                                            {lowStock && !zeroStock && <AlertCircle size={14} className="text-orange-500" title="Estoque Baixo" />}
                                        </td>
                                        <td className={`p-4 font-bold ${zeroStock ? 'text-red-700' : 'text-[#4E342E]'}`}>{p.nome}</td>
                                        <td className="p-4 text-sm text-[#8D6E63]">{p.fornecedorNome}</td>
                                        <td className="p-4 text-right font-bold text-[#A66B5D]">R$ {p.preco.toFixed(2)}</td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1 justify-center">
                                                {p.variacoes.length > 0 ? p.variacoes.map(v => (
                                                    <span key={v.id} className={`text-[10px] px-2 py-1 rounded border ${v.estoqueAtual === 0 ? 'bg-red-100 border-red-200 text-red-700 font-bold' : v.estoqueAtual < (storeConfig.lowStockThreshold || 5) ? 'bg-orange-100 border-orange-200 text-orange-800' : 'bg-[#EFEBE9] border-[#D7CCC8] text-[#5D4037]'}`} title={`Estoque: ${v.estoqueAtual}`}>
                                                        {v.cor}-{v.tamanho} ({v.estoqueAtual})
                                                    </span>
                                                )) : (
                                                    <span className={`${p.estoque === 0 ? 'text-red-600 font-bold' : p.estoque < (storeConfig.lowStockThreshold || 5) ? 'text-orange-500 font-bold' : 'text-green-600 font-bold'}`}>{p.estoque} un</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openProductModal(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                                <button onClick={() => { if(window.confirm('Excluir produto?')) deleteProduct(p.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                     </table>
                </div>
            )}

            {activeTab === 'SUPPLIERS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSuppliers.map(s => (
                        <div key={s.id} className="bg-white p-6 rounded-xl shadow-sm border border-[#D7CCC8] flex justify-between items-center group">
                            <div>
                                <h3 className="font-bold text-[#4E342E] text-lg">{s.nome}</h3>
                                <p className="text-xs text-[#8D6E63]">ID: {s.id}</p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openSupplierModal(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                <button onClick={() => { if(window.confirm('Excluir fornecedor?')) deleteSupplier(s.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* --- MODALS --- */}
        
        {/* Product Modal */}
        {showProductModal && (
            <div className="fixed inset-0 bg-[#4E342E]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-[#A66B5D] flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b border-[#E0E0E0] flex justify-between items-center bg-[#F8F6F2] rounded-t-xl">
                        <h3 className="text-xl font-bold text-[#4E342E]">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
                        <button onClick={() => setShowProductModal(false)}><X className="text-gray-400 hover:text-red-500"/></button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto flex-1">
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-[#5D4037] mb-1 uppercase">Referência</label>
                                    <input className="w-full p-2 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] bg-white" value={prodRef} onChange={e => setProdRef(e.target.value)} placeholder="Ex: 1234" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-[#5D4037] mb-1 uppercase">Nome do Produto</label>
                                    <input className="w-full p-2 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] bg-white" value={prodName} onChange={e => setProdName(e.target.value)} placeholder="Ex: Calça Legging" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#5D4037] mb-1 uppercase">Preço Venda (R$)</label>
                                    <input type="number" className="w-full p-2 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] font-bold text-[#4E342E] bg-white" value={prodPrice} onChange={e => setProdPrice(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#5D4037] mb-1 uppercase">Fornecedor</label>
                                    <select 
                                        className="w-full p-2 border border-[#D7CCC8] rounded outline-none bg-white"
                                        value={prodSupplier}
                                        onChange={e => setProdSupplier(e.target.value)}
                                    >
                                        <option value="">Selecione...</option>
                                        {suppliers.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Variations Section */}
                            <div className="bg-[#FAFAFA] p-4 rounded-lg border border-[#E0E0E0] mt-4">
                                <h4 className="font-bold text-[#A66B5D] mb-3 flex items-center gap-2"><Package size={16}/> Grade / Variações</h4>
                                
                                <div className="flex gap-2 items-end mb-4">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-[#8D6E63] uppercase">Cor</label>
                                        <input className="w-full p-2 border border-[#D7CCC8] rounded text-sm bg-white" value={newVarColor} onChange={e => setNewVarColor(e.target.value)} placeholder="Ex: Azul" />
                                    </div>
                                    <div className="w-20">
                                        <label className="block text-[10px] font-bold text-[#8D6E63] uppercase">Tam</label>
                                        <input className="w-full p-2 border border-[#D7CCC8] rounded text-sm bg-white" value={newVarSize} onChange={e => setNewVarSize(e.target.value)} placeholder="Ex: M" />
                                    </div>
                                    <div className="w-20">
                                        <label className="block text-[10px] font-bold text-[#8D6E63] uppercase">Qtd</label>
                                        <input type="number" className="w-full p-2 border border-[#D7CCC8] rounded text-sm bg-white" value={newVarQty} onChange={e => setNewVarQty(e.target.value)} placeholder="0" />
                                    </div>
                                    <button onClick={handleAddVariation} className="bg-[#4E342E] text-white p-2 rounded hover:bg-[#3E2723] h-[38px] w-[38px] flex items-center justify-center">
                                        <Plus size={18} />
                                    </button>
                                </div>

                                <div className="max-h-32 overflow-y-auto border-t border-[#E0E0E0]">
                                    {variations.length > 0 ? variations.map(v => (
                                        <div key={v.id} className="grid grid-cols-4 gap-2 py-2 border-b border-[#F0F0F0] items-center text-sm">
                                            <span className="font-medium text-[#4E342E]">{v.cor}</span>
                                            <span className="text-center bg-white border px-1 rounded">{v.tamanho}</span>
                                            <span className="text-center font-bold">{v.estoqueAtual} un</span>
                                            <button onClick={() => handleRemoveVariation(v.id)} className="text-red-400 hover:text-red-600 text-right pr-2">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )) : (
                                        <div className="py-4 text-center">
                                            <p className="text-xs text-gray-400 italic mb-2">Sem variações cadastradas. Usando estoque simples.</p>
                                            <div className="flex items-center justify-center gap-2">
                                                <label className="text-xs font-bold text-[#5D4037]">Estoque Simples:</label>
                                                <input type="number" className="w-24 p-1 border border-[#D7CCC8] rounded text-center bg-white" value={simpleStock} onChange={e => setSimpleStock(e.target.value)} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-[#E0E0E0] bg-[#FAFAFA] flex gap-3 rounded-b-xl">
                        <button onClick={() => setShowProductModal(false)} className="flex-1 py-3 border border-[#D7CCC8] text-[#5D4037] font-bold rounded hover:bg-[#EFEBE9]">Cancelar</button>
                        <button onClick={handleSaveProduct} className="flex-1 py-3 bg-[#4E342E] text-white font-bold rounded hover:bg-[#3E2723] flex items-center justify-center gap-2">
                            <Save size={18} /> Salvar Produto
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Supplier Modal */}
        {showSupplierModal && (
            <div className="fixed inset-0 bg-[#4E342E]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-[#A66B5D]">
                    <h3 className="text-xl font-bold text-[#4E342E] mb-4">{editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-[#5D4037] mb-1">Nome</label>
                            <input className="w-full p-2 border border-[#D7CCC8] rounded outline-none bg-white" value={supName} onChange={e => setSupName(e.target.value)} />
                        </div>
                    </div>
                     <div className="flex gap-3 mt-6">
                        <button onClick={() => setShowSupplierModal(false)} className="flex-1 py-2 border border-[#D7CCC8] text-[#5D4037] font-bold rounded">Cancelar</button>
                        <button onClick={handleSaveSupplier} className="flex-1 py-2 bg-[#4E342E] text-white font-bold rounded">Salvar</button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};