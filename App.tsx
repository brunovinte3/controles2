
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeeView from './components/EmployeeView';
import VisitorSearchView from './components/VisitorSearchView';
import Reports from './components/Reports';
import MatrixView from './components/MatrixView';
import ConfigView from './components/ConfigView';
import AuthView from './components/AuthView';
import { Employee, UserRole } from './types';
import { StorageService } from './services/storage';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null); 

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (userRole === 'visitor') {
      setActiveTab('visitor_search');
    } else if (userRole === 'admin') {
      setActiveTab('dashboard');
    }
  }, [userRole]);

  const loadData = async (forceSync = false) => {
    setIsLoading(true);
    try {
      const data = await StorageService.getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userRole) {
      loadData();
    }
  }, [userRole]);

  if (!userRole) {
    return <AuthView onLogin={(role) => setUserRole(role)} />;
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest italic">Sincronizando com Base de Dados...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard employees={employees} isAdmin={isAdmin} />;
      case 'employees': return isAdmin ? <EmployeeView employees={employees} onUpdate={loadData} isAdmin={isAdmin} /> : null;
      case 'visitor_search': return <VisitorSearchView employees={employees} />;
      case 'reports': return <Reports employees={employees} />;
      case 'matrix': return <MatrixView />;
      case 'config': return isAdmin ? <ConfigView onUpdate={loadData} /> : null;
      default: return <Dashboard employees={employees} isAdmin={isAdmin} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      userRole={userRole} 
      onLogout={() => setUserRole(null)}
      onRefreshData={() => loadData(true)}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
