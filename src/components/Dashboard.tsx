
import { useState } from 'react';
import Header from '@/components/Header';
import StockControl from '@/components/StockControl';
import DemandAnalysis from '@/components/DemandAnalysis';
import ServiceImpact from '@/components/ServiceImpact';
import EmergencyAlert from '@/components/EmergencyAlert';
import Settings from '@/components/Settings';
import Support from '@/components/Support';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DashboardProps {
  user: { email: string; name: string } | null;
  onLogout: () => void;
}

const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />
      
      {/* Emergency Alert */}
      {showEmergencyAlert && (
        <EmergencyAlert onClose={() => setShowEmergencyAlert(false)} />
      )}

      <main className="container mx-auto px-4 py-4 md:py-6">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo(a), {user?.name || 'Farmácia Central'}!
          </h1>
          <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">
            Gerencie seu estoque e analise a demanda em tempo real
          </p>
          
          {/* Verification Badge */}
          <div className="inline-flex items-center px-3 py-2 md:px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-xs md:text-sm font-medium">
            ✅ Farmácia Verificada - Premium
          </div>
        </div>
        
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4 md:mb-6 h-auto">
            <TabsTrigger value="dashboard" className="text-xs md:text-sm px-2">Dashboard</TabsTrigger>
            <TabsTrigger value="estoque" className="text-xs md:text-sm px-2">Estoque</TabsTrigger>
            <TabsTrigger value="demanda" className="text-xs md:text-sm px-2">Demanda</TabsTrigger>
            <TabsTrigger value="configuracoes" className="text-xs md:text-sm px-1">Config.</TabsTrigger>
            <TabsTrigger value="suporte" className="text-xs md:text-sm px-2">Suporte</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
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
          </TabsContent>
          
          <TabsContent value="estoque">
            <StockControl expanded={true} />
          </TabsContent>
          
          <TabsContent value="demanda">
            <DemandAnalysis expanded={true} />
          </TabsContent>
          
          <TabsContent value="configuracoes">
            <Settings />
          </TabsContent>
          
          <TabsContent value="suporte">
            <Support />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
