import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Wallet, Lock, ArrowUpCircle, ArrowDownCircle, AlertTriangle, CheckCircle, History, Printer } from 'lucide-react';

export const CashDrawerView: React.FC = () => {
  const { cashSession, openRegister, closeRegister, addCashMovement, storeConfig } = useStore();
  const [startAmount, setStartAmount] = useState('0.00');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDesc, setMovementDesc] = useState('');
  const [showMovementModal, setShowMovementModal] = useState<'WITHDRAWAL' | 'DEPOSIT' | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const printDailyReport = () => {
    const reportContent = `
      <div style="font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 10px;">
        <div style="text-align: center; margin-bottom: 10px;">
          <h2 style="margin: 0; font-size: 16px;">${storeConfig.storeName}</h2>
          <p style="margin: 0;">FECHAMENTO DE CAIXA</p>
        </div>
        <div style="border-bottom: 1px dashed #000; margin-bottom: 5px;"></div>
        <div style="margin-bottom: 5px;">
          Data Abertura: ${new Date(cashSession.openedAt || '').toLocaleString()}<br/>
          Data Fechamento: ${new Date().toLocaleString()}
        </div>
        <div style="border-bottom: 1px dashed #000; margin-bottom: 10px;"></div>
        
        <table style="width: 100%; text-align: left;">
            <tr><td>Saldo Inicial:</td><td style="text-align: right;">R$ ${cashSession.startBalance.toFixed(2)}</td></tr>
            <tr><td>Entradas (Dinheiro):</td><td style="text-align: right;">R$ ${(cashSession.movements.filter(m => (m.type === 'SALE' || m.type === 'DEPOSIT' || m.type === 'DEBT_PAYMENT')).reduce((acc, m) => acc + m.amount, 0)).toFixed(2)}</td></tr>
            <tr><td>Saídas (Sangrias/Trocos):</td><td style="text-align: right;">R$ ${(cashSession.movements.filter(m => m.type === 'WITHDRAWAL').reduce((acc, m) => acc + m.amount, 0)).toFixed(2)}</td></tr>
        </table>
        
        <div style="border-bottom: 1px dashed #000; margin: 10px 0;"></div>
        <div style="text-align: right; font-weight: bold; font-size: 14px;">
          SALDO FINAL: R$ ${cashSession.currentBalance.toFixed(2)}
        </div>
        <div style="border-bottom: 1px dashed #000; margin: 10px 0;"></div>
        <div style="text-align: center; font-style: italic;">
          Conferido por: Usuário
        </div>
      </div>
    `;

    const printWindow = window.open('', '', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Relatório de Caixa</title></head><body>');
      printWindow.document.write(reportContent);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  if (!cashSession.isOpen) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#F8F6F2] p-8">
        <div className="bg-white p-10 rounded-xl shadow-lg border border-[#D7CCC8] max-w-md w-full text-center">
          <div className="bg-[#EFEBE9] p-4 rounded-full inline-block mb-6">
            <Lock size={48} className="text-[#A66B5D]" />
          </div>
          <h2 className="text-2xl font-bold text-[#4E342E] mb-2">Caixa Fechado</h2>
          <p className="text-[#8D6E63] mb-8">Informe o saldo inicial para iniciar as vendas.</p>
          
          <div className="mb-6 text-left">
            <label className="block text-sm font-bold text-[#5D4037] mb-2 uppercase">Fundo de Troco (R$)</label>
            <input 
              type="number" 
              value={startAmount}
              onChange={e => setStartAmount(e.target.value)}
              className="w-full text-3xl font-bold p-4 border border-[#A66B5D] rounded text-[#4E342E] focus:outline-none focus:ring-2 focus:ring-[#A66B5D] bg-white"
            />
          </div>

          <button 
            onClick={() => openRegister(parseFloat(startAmount) || 0)}
            className="w-full bg-[#4E342E] text-white py-4 rounded-lg font-bold hover:bg-[#3E2723] transition-all shadow-md"
          >
            ABRIR CAIXA
          </button>
        </div>
      </div>
    );
  }

  const handleMovement = () => {
    if (showMovementModal && movementAmount && movementDesc) {
      addCashMovement(showMovementModal, parseFloat(movementAmount), movementDesc);
      setShowMovementModal(null);
      setMovementAmount('');
      setMovementDesc('');
    }
  };

  const handleCloseRegister = () => {
      if(window.confirm("Deseja imprimir o relatório de fechamento antes de sair?")) {
          printDailyReport();
      }
      closeRegister();
      setShowCloseConfirm(false);
  };

  return (
    <div className="p-8 h-full bg-[#F8F6F2] overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold text-[#4E342E]">Controle de Caixa</h1>
           <p className="text-[#8D6E63]">Gerencie o fluxo financeiro do dia</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowMovementModal('DEPOSIT')}
            className="flex items-center gap-2 bg-[#E8F5E9] text-[#2E7D32] px-4 py-2 rounded-lg font-bold border border-[#C8E6C9] hover:bg-[#C8E6C9]"
          >
            <ArrowUpCircle size={20} /> Suprimento
          </button>
          <button 
            onClick={() => setShowMovementModal('WITHDRAWAL')}
            className="flex items-center gap-2 bg-[#FFEBEE] text-[#C62828] px-4 py-2 rounded-lg font-bold border border-[#FFCDD2] hover:bg-[#FFCDD2]"
          >
            <ArrowDownCircle size={20} /> Sangria
          </button>
          <button 
            onClick={printDailyReport}
            className="flex items-center gap-2 bg-white text-[#5D4037] px-4 py-2 rounded-lg font-bold border border-[#D7CCC8] hover:bg-[#EFEBE9]"
          >
            <Printer size={20} /> Relatório Parcial
          </button>
          <button 
            onClick={() => setShowCloseConfirm(true)}
            className="flex items-center gap-2 bg-[#4E342E] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#3E2723] ml-4 shadow"
          >
            <Lock size={20} /> Fechar Caixa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#D7CCC8]">
          <p className="text-xs font-bold text-[#8D6E63] uppercase">Saldo Inicial</p>
          <p className="text-3xl font-bold text-[#4E342E] mt-2">R$ {cashSession.startBalance.toFixed(2)}</p>
        </div>
        <div className="bg-[#4E342E] p-6 rounded-xl shadow-md border border-[#3E2723]">
          <p className="text-xs font-bold text-[#D7CCC8] uppercase">Saldo Atual (Gaveta)</p>
          <p className="text-3xl font-bold text-white mt-2">R$ {cashSession.currentBalance.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#D7CCC8]">
          <p className="text-xs font-bold text-[#8D6E63] uppercase">Movimentos</p>
          <p className="text-3xl font-bold text-[#A66B5D] mt-2">{cashSession.movements.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#D7CCC8] overflow-hidden">
        <div className="p-4 bg-[#EFEBE9] border-b border-[#D7CCC8] flex items-center gap-2">
          <History size={20} className="text-[#5D4037]" />
          <h3 className="font-bold text-[#5D4037]">Extrato de Movimentações</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-[#F8F6F2] text-[#8D6E63] text-xs uppercase">
            <tr>
              <th className="p-4">Hora</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Descrição</th>
              <th className="p-4 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F0]">
            {cashSession.movements.slice().reverse().map(mov => (
              <tr key={mov.id} className="hover:bg-[#FFF8E1]">
                <td className="p-4 text-[#4E342E] font-mono">{new Date(mov.timestamp).toLocaleTimeString()}</td>
                <td className="p-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    mov.type === 'SALE' || mov.type === 'DEPOSIT' || mov.type === 'DEBT_PAYMENT' ? 'bg-green-100 text-green-800' :
                    mov.type === 'WITHDRAWAL' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {mov.type === 'SALE' ? 'VENDA' : 
                     mov.type === 'DEBT_PAYMENT' ? 'RECEB. CARNÊ' :
                     mov.type === 'WITHDRAWAL' ? 'SANGRIA' : 
                     mov.type === 'DEPOSIT' ? 'SUPRIMENTO' : mov.type}
                  </span>
                </td>
                <td className="p-4 text-[#5D4037]">{mov.description}</td>
                <td className={`p-4 text-right font-bold ${
                   mov.type === 'SALE' || mov.type === 'DEPOSIT' || mov.type === 'OPEN' || mov.type === 'DEBT_PAYMENT' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {mov.type === 'WITHDRAWAL' ? '-' : '+'} R$ {mov.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showMovementModal && (
        <div className="fixed inset-0 bg-[#4E342E]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-[#A66B5D]">
              <h3 className="text-xl font-bold text-[#4E342E] mb-4">
                {showMovementModal === 'DEPOSIT' ? 'Realizar Suprimento' : 'Realizar Sangria'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#5D4037] mb-1">Valor (R$)</label>
                  <input 
                    type="number" 
                    autoFocus
                    value={movementAmount}
                    onChange={e => setMovementAmount(e.target.value)}
                    className="w-full p-3 border border-[#D7CCC8] rounded text-lg text-[#4E342E] focus:border-[#A66B5D] outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#5D4037] mb-1">Motivo / Descrição</label>
                  <input 
                    type="text" 
                    value={movementDesc}
                    onChange={e => setMovementDesc(e.target.value)}
                    className="w-full p-3 border border-[#D7CCC8] rounded text-[#4E342E] focus:border-[#A66B5D] outline-none bg-white"
                    placeholder="Ex: Pagamento Fornecedor"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowMovementModal(null)} className="flex-1 py-3 border border-[#D7CCC8] text-[#5D4037] font-bold rounded">Cancelar</button>
                <button 
                  onClick={handleMovement}
                  disabled={!movementAmount || !movementDesc}
                  className="flex-1 py-3 bg-[#4E342E] text-white font-bold rounded hover:bg-[#3E2723] disabled:opacity-50"
                >
                  Confirmar
                </button>
              </div>
           </div>
        </div>
      )}

      {showCloseConfirm && (
          <div className="fixed inset-0 bg-[#4E342E]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md border border-[#A66B5D] text-center">
                <AlertTriangle size={48} className="text-orange-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-[#4E342E] mb-2">Fechar Caixa?</h3>
                <p className="text-[#8D6E63] mb-6">O saldo final em dinheiro é de <span className="font-bold text-[#4E342E]">R$ {cashSession.currentBalance.toFixed(2)}</span>. Confirma o fechamento?</p>
                <div className="flex gap-3">
                    <button onClick={() => setShowCloseConfirm(false)} className="flex-1 py-3 border border-[#D7CCC8] text-[#5D4037] font-bold rounded">Cancelar</button>
                    <button onClick={handleCloseRegister} className="flex-1 py-3 bg-[#4E342E] text-white font-bold rounded hover:bg-[#3E2723]">Confirmar</button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};