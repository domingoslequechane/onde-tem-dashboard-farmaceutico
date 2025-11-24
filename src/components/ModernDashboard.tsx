import { useState } from 'react';
import { Search, Bell, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PharmacySidebar from '@/components/PharmacySidebar';
import PharmacyPerformance from '@/components/PharmacyPerformance';
import StatCard from '@/components/StatCard';
import SearchActivityChart from '@/components/SearchActivityChart';
import AgendaWidget from '@/components/AgendaWidget';

interface ModernDashboardProps {
  user: { email: string; name: string } | null;
  onLogout: () => void;
  farmacia?: any;
}

const ModernDashboard = ({ user, onLogout, farmacia }: ModernDashboardProps) => {
  return (
    <div className="flex h-screen bg-muted/20">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <PharmacySidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Header */}
        <header className="bg-card border-b sticky top-0 z-40">
          <div className="flex items-center justify-between p-4 lg:px-8">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Anything here..."
                  className="pl-10 bg-muted/50 border-none"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-none bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <span className="hidden sm:inline">Export</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => {}}>
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 lg:p-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">
              Welcome Back, {user?.name?.split(' ')[0] || 'Alexis'} 👋
            </h1>
            <p className="text-muted-foreground">
              Lorem ipsum dolor sit amet consectetur. Orci pulvinar.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Performance Card - Spans 2 columns on large screens */}
            <div className="lg:col-span-2">
              <PharmacyPerformance />
            </div>

            {/* Stat Cards Column */}
            <div className="space-y-6">
              <StatCard
                title="Novas Consultas"
                value="2,543"
                change="80%"
                trend="up"
                sparklineData={[25, 40, 30, 50, 35, 55, 45]}
              />
              <StatCard
                title="Total de Medicamentos"
                value="12,543"
                change="80%"
                trend="up"
                sparklineData={[30, 45, 35, 55, 40, 60, 50]}
              />
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Stats */}
            <div className="space-y-6">
              <StatCard
                title="Receita Total"
                value="$10,123"
                change="80%"
                trend="up"
                sparklineData={[20, 35, 25, 45, 30, 50, 40]}
              />
              <StatCard
                title="Horas de Atendimento"
                value="32h 42m"
                change="80%"
                trend="up"
                sparklineData={[15, 30, 20, 40, 25, 45, 35]}
              />
            </div>

            {/* Middle Column - Chart */}
            <div className="lg:col-span-1">
              <SearchActivityChart />
            </div>

            {/* Right Column - Agenda */}
            <div>
              <AgendaWidget />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ModernDashboard;
