import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Service } from '../types';
import { Plus, Edit2, Trash2, Search, X, Scissors } from 'lucide-react';

export const ServicesView: React.FC = () => {
  const { services, addService, updateService, deleteService } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [activityCode, setActivityCode] = useState('');
  const [cnae, setCnae] = useState('');
  const [price, setPrice] = useState('');
  const [municipalCode, setMunicipalCode] = useState('');

  const filteredServices = services.filter(s => 
    s.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (service?: Service) => {
    if (service) {
        setEditingService(service);
        setName(service.nome);
        setActivityCode(service.codigoAtividade);
        setCnae(service.cnae || '');
        setPrice(service.valor.toString());
        setMunicipalCode(service.codigoMunicipal || '');
    } else {
        setEditingService(null);
        setName('');
        setActivityCode('');
        setCnae('');
        setPrice('');
        setMunicipalCode('');
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name || !price) return;

    const serviceData: Service = {
        id: editingService ? editingService.id : Date.now(),
        nome: name,
        codigoAtividade: activityCode,
        cnae: cnae,
        valor: parseFloat(price),
        codigoMunicipal: municipalCode
    };

    if (editingService) {
        updateService(serviceData);
    } else {
        addService(serviceData);
    }
    setShowModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F6F2]">
        <div className="bg-white border-b border-[#D7CCC8] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#4E342E] flex items-center gap-2">
                    <Scissors className="text-[#A66B5D]" /> Serviços
                </h1>
                <button 
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-[#A66B5D] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#8D5A4D]"
                >
                    <Plus size={20} /> Novo Serviço
                </button>
            </div>
            
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A66B5D]" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar serviço por nome..."
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
                        <th className="p-4">Código Ativ.</th>
                        <th className="p-4">Serviço</th>
                        <th className="p-4">CNAE</th>
                        <th className="p-4 text-right">Valor</th>
                        <th className="p-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                    {filteredServices.map(s => (
                        <tr key={s.id} className="hover:bg-[#FFF8E1] transition-colors">
                            <td className="p-4 font-mono text-sm text-gray-500">{s.codigoAtividade}</td>
                            <td className="p-4 font-bold text-[#4E342E]">{s.nome}</td>
                            <td className="p-4 text-sm text-[#8D6E63]">{s.cnae || '-'}</td>
                            <td className="p-4 text-right font-bold text-[#A66B5D]">R$ {s.valor.toFixed(2)}</td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => openModal(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                    <button onClick={() => { if(window.confirm('Excluir serviço?')) deleteService(s.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredServices.length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum serviço encontrado.</td></tr>
                    )}
                </tbody>
             </table>
        </div>

        {showModal && (
            <div className="fixed inset-0 bg-[#4E342E]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-[#A66B5D]">
                    <div className="p-6 border-b border-[#E0E0E0] flex justify-between items-center bg-[#F8F6F2] rounded-t-xl">
                        <h3 className="text-xl font-bold text-[#4E342E]">{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                        <button onClick={() => setShowModal(false)}><X className="text-gray-400 hover:text-red-500"/></button>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-[#5D4037] mb-1 uppercase">Nome do Serviço</label>
                            <input className="w-full p-2 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] bg-white" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#5D4037] mb-1 uppercase">Código Atividade</label>
                                <input className="w-full p-2 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] bg-white" value={activityCode} onChange={e => setActivityCode(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5D4037] mb-1 uppercase">Valor (R$)</label>
                                <input type="number" className="w-full p-2 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] bg-white font-bold" value={price} onChange={e => setPrice(e.target.value)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#5D4037] mb-1 uppercase">CNAE</label>
                                <input className="w-full p-2 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] bg-white" value={cnae} onChange={e => setCnae(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5D4037] mb-1 uppercase">Cód. Municipal</label>
                                <input className="w-full p-2 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] bg-white" value={municipalCode} onChange={e => setMunicipalCode(e.target.value)} />
                            </div>
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