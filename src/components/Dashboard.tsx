
import { useState } from 'react';
import Header from '@/components/Header';
import StockControl from '@/components/StockControl';
import DemandAnalysis from '@/components/DemandAnalysis';
import ServiceImpact from '@/components/ServiceImpact';

interface DashboardProps {
  user: { email: string; name: string } | null;
  onLogout: () => void;
}

const Dashboard = ({ user, onLogout }: DashboardProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo(a), {user?.name || 'Farmácia Central'}!
          </h1>
          <p className="text-gray-600">Gerencie seu estoque e analise a demanda em tempo real</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <StockControl />
          </div>
          <div className="lg:col-span-1">
            <DemandAnalysis />
          </div>
          <div className="lg:col-span-1">
            <ServiceImpact />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
