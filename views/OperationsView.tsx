import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Operation } from '../types';
import { Plus, Edit2, Trash2, Search, X, ArrowLeftRight, CheckSquare, Square } from 'lucide-react';

export const OperationsView: React.FC = () => {
  const { operations, addOperation, updateOperation, deleteOperation } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingOp, setEditingOp] = useState<Operation | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'ENTRADA' | 'SAIDA'>('SAIDA');
  const [stockMov, setStockMov] = useState(true);
  const [active, setActive] = useState(true);
  const [cfop, setCfop] = useState('');

  const filteredOps = operations.filter(o => 
    o.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (op?: Operation) => {
    if (op) {
        setEditingOp(op);
        setName(op.nome);
        setDescription(op.descricao);
        setType(op.tipo);
        setStockMov(op.movimentaEstoque);
        setActive(op.ativa);
        setCfop(op.cfop || '');
    } else {
        setEditingOp(null);
        setName('');
        setDescription('');
        setType('SAIDA');
        setStockMov(true);
        setActive(true);
        setCfop('');
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name) return;

    const opData: Operation = {
        id: editingOp ? editingOp.id : Date.now(),
        nome: name,
        descricao: description,
        tipo: type,
        movimentaEstoque: stockMov,
        ativa: active,
        cfop: cfop
    };

    if (editingOp) {
        updateOperation(opData);
    } else {
        addOperation(opData);
    }
    setShowModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F6F2]">
        <div className="bg-white border-b border-[#D7CCC8] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#4E342E] flex items-center gap-2">
                    <ArrowLeftRight className="text-[#A66B5D]" /> Operações
                </h1>
                <button 
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-[#A66B5D] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#8D5A4D]"
                >
                    <Plus size={20} /> Nova Operação
                </button>
            </div>
            
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A66B5D]" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar operação..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-[#D7CCC8] rounded-lg bg-white focus:outline-none focus:border-[#A66B5D]"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
             <table className="w-full text-left bg-white rounded-xl shadow-sm overflow-hidden">
                <thead className="bg-[#EFEBE9] border-b border-[#D7CCC8] text-[#5D4037]">
                    <tr>
                        <th className="p-4">Nome</th>
                        <th className="p-4">Tipo</th>
                        <th className="p-4">CFOP</th>
                        <th className="p-4 text-center">Mov. Estoque</th>
                        <th className="p-4 text-center">Ativa</th>
                        <th className="p-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                    {filteredOps.map(o => (
                        <tr key={o.id} className="hover:bg-[#FFF8E1] transition-colors">
                            <td className="p-4">
                                <p className="font-bold text-[#4E342E]">{o.nome}</p>
                                <p className="text-xs text-gray-500">{o.descricao}</p>
                            </td>
                            <td className="p-4">
                                <span className={`text-xs px-2 py-1 rounded font-bold ${o.tipo === 'ENTRADA' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                    {o.tipo}
                                </span>
                            </td>
                            <td className="p-4 text-sm text-[#8D6E63] font-mono">{o.cfop || '-'}</td>
                            <td className="p-4 text-center">
                                {o.movimentaEstoque ? <CheckSquare size={18} className="text-green-600 inline"/> : <Square size={18} className="text-gray-300 inline"/>}
                            </td>
                             <td className="p-4 text-center">
                                {o.ativa ? <span className="text-green-600 font-bold text-xs">SIM</span> : <span className="text-red-500 font-bold text-xs">NÃO</span>}
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => openModal(o)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                    <button onClick={() => { if(window.confirm('Excluir operação?')) deleteOperation(o.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
        </div>

        {showModal && (
            <div className="fixed inset-0 bg-[#4E342E]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-[#A66B5D]">
                    <div className="p-6 border-b border-[#E0E0E0] flex justify-between items-center bg-[#F8F6F2] rounded-t-xl">
                        <h3 className="text-xl font-bold text-[#4E342E]">{editingOp ? 'Editar Operação' : 'Nova Operação'}</h3>
                        <button onClick={() => setShowModal(false)}><X className="text-gray-400 hover:text-red-500"/></button>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-[#5D4037] mb-1 uppercase">Nome da Operação</label>
                            <input className="w-full p-2 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] bg-white" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#5D4037] mb-1 uppercase">Descrição</label>
                            <input className="w-full p-2 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] bg-white" value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#5D4037] mb-1 uppercase">Tipo</label>
                                <select 
                                    className="w-full p-2 border border-[#D7CCC8] rounded outline-none bg-white"
                                    value={type}
                                    onChange={e => setType(e.target.value as any)}
                                >
                                    <option value="SAIDA">SAÍDA</option>
                                    <option value="ENTRADA">ENTRADA</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5D4037] mb-1 uppercase">CFOP Padrão</label>
                                <input className="w-full p-2 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] bg-white" value={cfop} onChange={e => setCfop(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-2">
                             <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={stockMov} onChange={e => setStockMov(e.target.checked)} className="w-4 h-4 accent-[#A66B5D]" />
                                <span className="text-sm font-bold text-[#5D4037]">Movimenta Estoque</span>
                             </label>
                             <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="w-4 h-4 accent-[#A66B5D]" />
                                <span className="text-sm font-bold text-[#5D4037]">Ativa</span>
                             </label>
                        </div>
                    </div>

                    <div className="p-6 border-t border-[#E0E0E0] bg-[#FAFAFA] flex gap-3 rounded-b-xl">
                        <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-[#D7CCC8] text-[#5D4037] font-bold rounded hover:bg-[#EFEBE9]">Cancelar</button>
                        <button onClick={handleSave} className="flex-1 py-3 bg-[#4E342E] text-white font-bold rounded hover:bg-[#3E2723]">Salvar</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};