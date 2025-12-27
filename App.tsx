import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { POSView } from './views/POSView';
import { Sidebar } from './components/Sidebar';
import { ProductsView } from './views/ProductsView';
import { ClientsView } from './views/ClientsView';
import { SalesHistoryView } from './views/SalesHistoryView';
import { CashDrawerView } from './views/CashDrawerView';
import { SettingsView } from './views/SettingsView';
import { OperationsView } from './views/OperationsView';
import { BudgetsView } from './views/BudgetsView';

const MainLayout: React.FC = () => {
  const { currentView, currentUser } = useStore();

  if (!currentUser) {
    return <LoginView />;
  }

  // POS has its own full-screen layout, typical for POS systems to maximize space
  if (currentView === 'POS') {
    return (
      <div className="flex h-screen bg-[#F8F6F2]">
        <Sidebar /> {/* Collapsed state usually, but keeping simple here */}
        <div className="flex-1 overflow-hidden">
          <POSView />
        </div>
      </div>
    );
  }

  // Admin/Dashboard Layout
  return (
    <div className="flex h-screen bg-[#F8F6F2] font-sans antialiased">
      <Sidebar />
      <div className="flex-1 overflow-hidden relative">
        {currentView === 'DASHBOARD' && <DashboardView />}
        {currentView === 'PRODUCTS' && <ProductsView />}
        {currentView === 'CLIENTS' && <ClientsView />}
        {currentView === 'SALES_HISTORY' && <SalesHistoryView />}
        {currentView === 'CASH_DRAWER' && <CashDrawerView />}
        {currentView === 'SETTINGS' && <SettingsView />}
        {currentView === 'OPERATIONS' && <OperationsView />}
        {currentView === 'BUDGETS' && <BudgetsView />}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <MainLayout />
    </StoreProvider>
  );
};

export default App;