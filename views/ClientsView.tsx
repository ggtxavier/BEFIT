import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Client, ClientDebt } from '../types';
import { Search, Plus, User, FileText, Check, X, Wallet, Edit2, Calendar, AlertOctagon } from 'lucide-react';

export const ClientsView: React.FC = () => {
  const { clients, addClient, payClientDebt, payAllClientDebts, updateDebtDueDate, cashSession, navigate } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  // New Client Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientDoc, setNewClientDoc] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Date Edit State
  const [editingDebt, setEditingDebt] = useState<ClientDebt | null>(null);
  const [newDate, setNewDate] = useState('');

  // Derive selected client from the global state to ensure updates (payments) are reflected immediately
  const activeClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : null;

  const filteredClients = clients.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.documento.includes(searchTerm)
  );

  const handleAddClient = () => {
    if (newClientName && newClientPhone) {
      addClient({
        id: 0, // Assigned in context
        nome: newClientName,
        documento: newClientDoc,
        telefone: newClientPhone,
        cidade: '',
        ativo: true
      });
      setShowAddModal(false);
      setNewClientName('');
      setNewClientDoc('');
      setNewClientPhone('');
    }
  };

  const calculateDebt = (client: Client) => {
    return client.debts?.filter(d => !d.paid).reduce((acc, d) => acc + d.amount, 0) || 0;
  };

  const handlePay = (debt: ClientDebt) => {
    if (!cashSession.isOpen) {
        alert('CAIXA FECHADO! É necessário abrir o caixa para movimentar valores.');
        return;
    }
    if(window.confirm(`Confirmar recebimento de R$ ${debt.amount.toFixed(2)}?`)) {
       const success = payClientDebt(activeClient!.id, debt.id);
       if (!success) {
           alert('Não foi possível processar o pagamento. Verifique se o débito já está pago.');
       }
    }
  };

  const handlePayAll = () => {
     if (!activeClient) return;
     if (!cashSession.isOpen) {
        alert('CAIXA FECHADO! É necessário abrir o caixa para movimentar valores.');
        return;
    }
    const total = calculateDebt(activeClient);
    if(window.confirm(`Confirmar QUITAÇÃO TOTAL de R$ ${total.toFixed(2)}?`)) {
        const success = payAllClientDebts(activeClient.id);
        if(!success) {
            alert('Erro ao processar quitação. Verifique se há débitos pendentes.');
        }
    }
  };

  const handleSaveDate = () => {
      if (activeClient && editingDebt && newDate) {
          updateDebtDueDate(activeClient.id, editingDebt.id, newDate);
          setEditingDebt(null);
      }
  };

  return (
    <div className="flex h-full bg-[#F8F6F2]">
      {/* Left: Client List */}
      <div className={`flex-1 flex flex-col border-r border-[#D7CCC8] ${activeClient ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-[#D7CCC8]">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-[#4E342E]">Clientes</h1>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-[#A66B5D] text-white p-2 rounded-lg hover:bg-[#8D5A4D]"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A66B5D]" size={18} />
             <input 
               type="text" 
               placeholder="Buscar cliente..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2 border border-[#D7CCC8] rounded-lg bg-white focus:outline-none focus:border-[#A66B5D]"
             />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredClients.map(client => {
            const debt = calculateDebt(client);
            return (
              <div 
                key={client.id} 
                onClick={() => setSelectedClientId(client.id)}
                className={`p-4 border-b border-[#E0E0E0] cursor-pointer hover:bg-[#FFF8E1] transition-colors ${activeClient?.id === client.id ? 'bg-[#FFF8E1] border-l-4 border-l-[#A66B5D]' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-[#4E342E]">{client.nome}</h3>
                    <p className="text-xs text-[#8D6E63]">{client.telefone}</p>
                  </div>
                  {debt > 0 && (
                     <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-bold">
                       Devendo R$ {debt.toFixed(2)}
                     </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Client Details & Debts */}
      <div className={`flex-[2] bg-white flex flex-col ${!activeClient ? 'hidden md:flex' : 'flex'}`}>
        {activeClient ? (
          <>
            {/* CASH DRAWER WARNING BANNER */}
            {!cashSession.isOpen && (
                <div className="bg-red-50 p-4 border-b border-red-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-red-700">
                        <AlertOctagon size={24} />
                        <div>
                            <p className="font-bold">Caixa Fechado</p>
                            <p className="text-xs">Abra o caixa para receber pagamentos.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('CASH_DRAWER')}
                        className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded text-xs font-bold"
                    >
                        ABRIR AGORA
                    </button>
                </div>
            )}

            <div className="p-8 border-b border-[#E0E0E0] bg-[#FAFAFA]">
               <button className="md:hidden text-[#A66B5D] mb-4 font-bold" onClick={() => setSelectedClientId(null)}>← Voltar</button>
               <div className="flex items-center gap-4">
                 <div className="w-16 h-16 bg-[#EFEBE9] rounded-full flex items-center justify-center text-[#5D4037]">
                   <User size={32} />
                 </div>
                 <div>
                   <h2 className="text-3xl font-bold text-[#4E342E]">{activeClient.nome}</h2>
                   <div className="flex gap-4 text-sm text-[#8D6E63] mt-1">
                     <span>{activeClient.documento || 'Sem CPF'}</span>
                     <span>•</span>
                     <span>{activeClient.telefone}</span>
                   </div>
                 </div>
               </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
               <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-bold text-[#4E342E] flex items-center gap-2">
                     <Wallet className="text-[#A66B5D]" /> Contas a Receber (Carnê)
                   </h3>
                   {calculateDebt(activeClient) > 0 && (
                       <button 
                        onClick={handlePayAll}
                        disabled={!cashSession.isOpen}
                        className={`px-4 py-2 rounded-lg font-bold shadow flex items-center gap-2 transition-all ${!cashSession.isOpen ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                       >
                           <Check size={18}/> Quitar Tudo
                       </button>
                   )}
               </div>
               
               {(!activeClient.debts || activeClient.debts.length === 0) ? (
                 <div className="text-center py-12 bg-[#F8F6F2] rounded-xl border border-dashed border-[#D7CCC8]">
                   <p className="text-[#8D6E63]">Este cliente não possui débitos pendentes.</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                    {/* Sort by ID or Date to keep list stable */}
                    {activeClient.debts.slice().sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map((debt: ClientDebt) => (
                      <div key={debt.id} className={`p-4 rounded-xl border flex justify-between items-center transition-all ${debt.paid ? 'bg-[#E8F5E9] border-[#C8E6C9] opacity-70' : 'bg-white border-[#D7CCC8] shadow-sm'}`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#4E342E]">Venda #{debt.saleId}</span>
                            <span className="text-xs bg-[#EFEBE9] px-2 rounded text-[#5D4037]">Parcela {debt.installmentNumber}/{debt.totalInstallments}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                             <p className="text-sm text-[#8D6E63]">
                                Vencimento: <span className="font-mono">{new Date(debt.dueDate).toLocaleDateString()}</span>
                             </p>
                             {!debt.paid && (
                                <button 
                                    onClick={() => { setEditingDebt(debt); setNewDate(debt.dueDate.split('T')[0]); }}
                                    className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="Alterar Data"
                                >
                                    <Edit2 size={12} />
                                </button>
                             )}
                          </div>

                          {debt.paid && <p className="text-xs text-green-700 font-bold mt-1">Pago em {new Date(debt.paidDate!).toLocaleDateString()}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#4E342E]">R$ {debt.amount.toFixed(2)}</p>
                          {!debt.paid && (
                            <button 
                              onClick={() => handlePay(debt)}
                              disabled={!cashSession.isOpen}
                              className={`mt-2 text-xs px-3 py-1.5 rounded transition-colors ${!cashSession.isOpen ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#A66B5D] text-white hover:bg-[#8D5A4D]'}`}
                            >
                              Receber
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#D7CCC8]">
            <User size={64} className="mb-4" />
            <p>Selecione um cliente para ver os detalhes</p>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#4E342E]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md border border-[#A66B5D]">
              <h2 className="text-2xl font-bold text-[#4E342E] mb-6">Novo Cliente</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#5D4037] mb-1">Nome Completo</label>
                  <input className="w-full p-3 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] bg-white" value={newClientName} onChange={e => setNewClientName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#5D4037] mb-1">Telefone</label>
                  <input className="w-full p-3 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] bg-white" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#5D4037] mb-1">CPF (Opcional)</label>
                  <input className="w-full p-3 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] bg-white" value={newClientDoc} onChange={e => setNewClientDoc(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 border border-[#D7CCC8] text-[#5D4037] font-bold rounded">Cancelar</button>
                <button onClick={handleAddClient} className="flex-1 py-3 bg-[#4E342E] text-white font-bold rounded hover:bg-[#3E2723]">Salvar</button>
              </div>
           </div>
        </div>
      )}

      {/* Edit Date Modal */}
      {editingDebt && (
        <div className="fixed inset-0 bg-[#4E342E]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-[#A66B5D]">
              <h3 className="text-xl font-bold text-[#4E342E] mb-4 flex items-center gap-2">
                  <Calendar size={20} /> Alterar Vencimento
              </h3>
              <p className="text-sm text-[#8D6E63] mb-4">Parcela {editingDebt.installmentNumber}/{editingDebt.totalInstallments} - R$ {editingDebt.amount.toFixed(2)}</p>
              
              <div className="mb-6">
                 <label className="block text-sm font-bold text-[#5D4037] mb-2">Nova Data</label>
                 <input 
                    type="date" 
                    value={newDate} 
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full p-3 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] text-[#4E342E] bg-white font-bold"
                 />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setEditingDebt(null)} className="flex-1 py-2 border border-[#D7CCC8] text-[#5D4037] font-bold rounded">Cancelar</button>
                <button onClick={handleSaveDate} className="flex-1 py-2 bg-[#4E342E] text-white font-bold rounded hover:bg-[#3E2723]">Salvar</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};