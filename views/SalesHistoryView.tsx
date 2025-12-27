import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Sale, CartItem, PaymentPart } from '../types';
import { Printer, Calendar } from 'lucide-react';

export const SalesHistoryView: React.FC = () => {
  const { sales, storeConfig } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const printReceipt = (sale: Sale) => {
    const methodsString = sale.paymentDetails.methods.map(m => 
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
          Data: ${new Date(sale.data).toLocaleString()}<br/>
          Venda: #${sale.id}<br/>
          Cliente: ${sale.clienteNome}
        </div>
        <div style="border-bottom: 1px dashed #000; margin-bottom: 5px;"></div>
        <table style="width: 100%; font-size: 12px;">
            <tr style="text-align: left;">
              <th>Item</th>
              <th style="text-align: right;">Qtd</th>
              <th style="text-align: right;">Total</th>
            </tr>
            ${sale.items.map((item: CartItem) => `
              <tr>
                <td>${item.product.nome} ${item.variation ? `(${item.variation.tamanho})` : ''}</td>
                <td style="text-align: right;">${item.quantity}</td>
                <td style="text-align: right;">${item.subtotal.toFixed(2)}</td>
              </tr>
            `).join('')}
        </table>
        <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>
        <div style="text-align: right; font-weight: bold; font-size: 14px;">
          TOTAL: R$ ${sale.total.toFixed(2)}
        </div>
        <div style="margin-top: 5px;">
          Pagamentos:<br/>
          ${methodsString}
        </div>
        <div style="text-align: right; margin-top: 5px;">
            ${sale.paymentDetails.change > 0 ? `Troco: R$ ${sale.paymentDetails.change.toFixed(2)}` : ''}
        </div>
        <div style="border-bottom: 1px dashed #000; margin: 10px 0;"></div>
        <div style="text-align: center;">
            <p>*** REIMPRESSÃO ***</p>
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

  const filteredSales = sales.filter(s => s.data.startsWith(selectedDate));

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#F8F6F2]">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#4E342E]">Histórico de Vendas</h1>
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-[#D7CCC8]">
              <Calendar size={20} className="text-[#A66B5D]" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="outline-none text-[#4E342E] font-bold"
              />
          </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-[#D7CCC8] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#EFEBE9] border-b border-[#D7CCC8]">
            <tr>
              <th className="p-4 font-bold text-[#5D4037]">Data/Hora</th>
              <th className="p-4 font-bold text-[#5D4037]">ID</th>
              <th className="p-4 font-bold text-[#5D4037]">Cliente</th>
              <th className="p-4 font-bold text-[#5D4037]">Pagamento</th>
              <th className="p-4 font-bold text-[#5D4037]">Status</th>
              <th className="p-4 font-bold text-[#5D4037]">Total</th>
              <th className="p-4 font-bold text-[#5D4037] text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F0]">
            {filteredSales.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">Nenhuma venda encontrada nesta data.</td></tr>
            ) : (
                filteredSales.slice().reverse().map(sale => (
                <tr key={sale.id} className="hover:bg-[#FFF8E1]">
                    <td className="p-4 text-sm text-[#4E342E]">{new Date(sale.data).toLocaleTimeString()}</td>
                    <td className="p-4 font-mono text-sm text-[#8D6E63]">#{sale.id}</td>
                    <td className="p-4 font-medium text-[#4E342E]">{sale.clienteNome}</td>
                    <td className="p-4 text-sm text-[#5D4037]">
                        {sale.paymentDetails.methods.map((m, idx) => (
                            <span key={idx} className="block text-xs bg-[#EFEBE9] px-2 py-1 rounded mb-1 w-fit">
                                {m.method}
                            </span>
                        ))}
                    </td>
                    <td className="p-4 text-sm">
                        {sale.status === 'CANCELLED' 
                            ? <span className="text-red-500 font-bold bg-red-50 px-2 py-1 rounded">CANCELADA</span> 
                            : <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded">CONCLUÍDA</span>
                        }
                    </td>
                    <td className="p-4 font-bold text-[#A66B5D]">R$ {sale.total.toFixed(2)}</td>
                    <td className="p-4 text-right">
                        <button 
                            onClick={() => printReceipt(sale)}
                            className="text-[#4E342E] hover:text-[#A66B5D] p-2 hover:bg-[#EFEBE9] rounded"
                            title="Reimprimir Cupom"
                        >
                            <Printer size={18} />
                        </button>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};