import React from 'react';
import { useStore } from '../context/StoreContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, Activity, Wallet, FileText, Award } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { sales, products, auditLogs, getDailyCashBalance, getTotalReceivables } = useStore();

  // Metrics
  const totalSalesValue = sales.reduce((acc, sale) => acc + sale.total, 0);
  const dailyCash = getDailyCashBalance();
  const totalReceivables = getTotalReceivables();
  const lowStockCount = products.filter(p => 
    (p.estoque < 5 && p.variacoes.length === 0) || 
    p.variacoes.some(v => v.estoqueAtual < 5)
  ).length;

  // Calculate Top Selling Products
  const productSalesMap = new Map<string, number>();
  sales.forEach(sale => {
      sale.items.forEach(item => {
          const key = item.product.nome;
          const current = productSalesMap.get(key) || 0;
          productSalesMap.set(key, current + item.quantity);
      });
  });

  const topProducts = Array.from(productSalesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));

  // Mock data for charts
  const salesData = [
    { name: 'Seg', valor: 1200 },
    { name: 'Ter', valor: 900 },
    { name: 'Qua', valor: 1500 },
    { name: 'Qui', valor: 2100 },
    { name: 'Sex', valor: 1800 },
    { name: 'Sab', valor: 3200 },
    { name: 'Dom', valor: 800 },
  ];

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E0D8] flex items-center gap-4">
      <div className={`p-4 rounded-full bg-opacity-10 text-${color} bg-${color === 'text-[#A66B5D]' ? '[#A66B5D]' : color.replace('text-', '')}`}>
        <Icon size={24} className={color} />
      </div>
      <div>
        <p className="text-xs font-bold text-[#8D6E63] uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-[#4E342E]">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#F8F6F2] text-[#4E342E]">
      <header className="mb-8 border-b border-[#D7CCC8] pb-4">
        <h1 className="text-3xl font-bold text-[#4E342E]">Visão Geral</h1>
        <p className="text-[#8D6E63]">Resumo financeiro e operacional da loja</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Em Caixa (Dinheiro)" 
          value={`R$ ${dailyCash.toFixed(2)}`} 
          icon={Wallet} 
          color="text-[#33691E]" 
          subtitle="Saldo em gaveta"
        />
        <StatCard 
          title="Vendas Hoje" 
          value={`R$ ${totalSalesValue.toFixed(2)}`} 
          icon={DollarSign} 
          color="text-[#A66B5D]" 
          subtitle={`${sales.length} vendas`}
        />
        <StatCard 
          title="A Receber (Carnê)" 
          value={`R$ ${totalReceivables.toFixed(2)}`} 
          icon={FileText} 
          color="text-[#E65100]" 
          subtitle="Total em aberto"
        />
        <StatCard 
          title="Estoque Baixo" 
          value={lowStockCount} 
          icon={TrendingUp} 
          color="text-[#D32F2F]" 
          subtitle="Produtos/Variações"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E0D8]">
            <h3 className="text-lg font-bold mb-6 text-[#4E342E]">Faturamento Semanal</h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#8D6E63" />
                    <YAxis axisLine={false} tickLine={false} stroke="#8D6E63" />
                    <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#FFF', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    cursor={{ fill: '#F5F5F5' }}
                    />
                    <Bar dataKey="valor" fill="#A66B5D" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </div>
            </div>

            {/* Top Products Table */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E0D8]">
               <div className="flex items-center gap-2 mb-4">
                  <Award className="text-[#E65100]" />
                  <h3 className="text-lg font-bold text-[#4E342E]">Produtos Mais Vendidos</h3>
               </div>
               <table className="w-full text-left">
                  <thead className="text-xs uppercase text-[#8D6E63] border-b border-[#F0F0F0]">
                      <tr>
                          <th className="pb-2">Produto</th>
                          <th className="pb-2 text-right">Qtd Vendida</th>
                      </tr>
                  </thead>
                  <tbody>
                      {topProducts.map((prod, idx) => (
                          <tr key={idx} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA]">
                              <td className="py-3 font-medium text-[#4E342E]">{prod.name}</td>
                              <td className="py-3 text-right font-bold text-[#A66B5D]">{prod.qty}</td>
                          </tr>
                      ))}
                      {topProducts.length === 0 && (
                          <tr><td colSpan={2} className="py-4 text-center text-gray-400">Sem dados de vendas.</td></tr>
                      )}
                  </tbody>
               </table>
            </div>
        </div>

        {/* Audit / Recent Activity Section */}
        <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E0D8] h-full flex flex-col">
                <div className="p-6 border-b border-[#E5E0D8] flex items-center gap-2">
                    <Activity className="text-[#A66B5D]" size={20} />
                    <h3 className="text-lg font-bold text-[#4E342E]">Atividades Recentes</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {auditLogs.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm mt-10">Nenhuma atividade registrada.</p>
                    ) : (
                        <div className="space-y-4">
                            {auditLogs.map(log => (
                                <div key={log.id} className="flex gap-3 text-sm border-b border-[#F0F0F0] pb-3 last:border-0">
                                    <div className="flex-none">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-[#A66B5D]"></div>
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#4E342E]">{log.action}</p>
                                        <p className="text-gray-500 text-xs">{log.details}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-[#8D6E63] bg-[#EFEBE9] px-1.5 rounded uppercase font-bold">{log.userName}</span>
                                            <span className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};