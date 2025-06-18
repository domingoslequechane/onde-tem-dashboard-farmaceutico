
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

interface HeaderProps {
  user: { email: string; name: string } | null;
  onLogout: () => void;
}

const Header = ({ user, onLogout }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">OT</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Onde Tem</h1>
            <p className="text-xs text-gray-500">Dashboard Farmacêutico</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User size={16} />
            <span>{user?.email}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onLogout}
            className="flex items-center space-x-2"
          >
            <LogOut size={16} />
            <span>Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
