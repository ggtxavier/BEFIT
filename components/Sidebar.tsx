import React from 'react';
import { useStore } from '../context/StoreContext';
import { ViewState, UserRole } from '../types';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  LogOut, 
  History,
  Store,
  Wallet,
  Settings,
  ArrowLeftRight,
  FileText
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { navigate, currentView, logout, currentUser, storeConfig } = useStore();

  const MenuItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => navigate(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors duration-200 border-l-4 ${
        currentView === view 
          ? 'bg-[#5D4037] text-white border-[#A66B5D]' 
          : 'text-[#D7CCC8] border-transparent hover:bg-[#3E2723] hover:text-white'
      }`}
    >
      <Icon size={20} className={currentView === view ? 'text-[#A66B5D]' : ''} />
      <span>{label}</span>
    </button>
  );

  const isCaixa = currentUser?.role === UserRole.CAIXA;

  return (
    <div className="w-64 bg-[#4E342E] flex flex-col h-screen text-[#EFEBE9] shadow-xl relative z-20">
      <div className="p-6 flex items-center gap-3 border-b border-[#5D4037]">
        <div className="bg-[#A66B5D] p-2 rounded-lg text-white">
          <Store size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none tracking-widest text-[#F8F6F2] line-clamp-1" title={storeConfig.storeName}>{storeConfig.storeName}</h1>
          <span className="text-[10px] text-[#D7CCC8] uppercase tracking-wide">PDV System</span>
        </div>
      </div>

      <div className="flex-1 py-4 overflow-y-auto">
        {/* --- FRENTE DE LOJA --- */}
        <div className="px-4 mb-2 text-[10px] font-bold text-[#A1887F] uppercase tracking-wider">
          Frente de Loja
        </div>
        <MenuItem view="POS" icon={ShoppingCart} label="Caixa / Venda" />
        <MenuItem view="BUDGETS" icon={FileText} label="Orçamentos" />
        <MenuItem view="CASH_DRAWER" icon={Wallet} label="Controle de Caixa" />
        
        {/* --- CADASTROS --- */}
        <div className="px-4 mt-6 mb-2 text-[10px] font-bold text-[#A1887F] uppercase tracking-wider">
          Cadastros
        </div>
        <MenuItem view="PRODUCTS" icon={Package} label="Estoque & Produtos" />
        <MenuItem view="CLIENTS" icon={Users} label="Clientes & Carnê" />
        
        {!isCaixa && (
             <MenuItem view="OPERATIONS" icon={ArrowLeftRight} label="Operações" />
        )}

        {/* --- GESTÃO --- */}
        {!isCaixa && (
          <>
            <div className="px-4 mt-6 mb-2 text-[10px] font-bold text-[#A1887F] uppercase tracking-wider">
              Gestão
            </div>
            <MenuItem view="DASHBOARD" icon={LayoutDashboard} label="Visão Geral" />
            <MenuItem view="SALES_HISTORY" icon={History} label="Histórico de Vendas" />
            
            <div className="px-4 mt-6 mb-2 text-[10px] font-bold text-[#A1887F] uppercase tracking-wider">
              Sistema
            </div>
            <MenuItem view="SETTINGS" icon={Settings} label="Configurações" />
          </>
        )}
      </div>

      <div className="p-4 border-t border-[#5D4037] bg-[#3E2723]">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-[#A66B5D] flex items-center justify-center text-sm font-bold text-white border-2 border-[#5D4037]">
            {currentUser?.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-[#F8F6F2]">{currentUser?.name}</p>
            <p className="text-xs text-[#BCAAA4] truncate">{currentUser?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-[#FFAB91] hover:bg-[#5D4037] rounded transition-colors border border-[#5D4037]"
        >
          <LogOut size={16} />
          <span>Encerrar Sessão</span>
        </button>
      </div>
    </div>
  );
};