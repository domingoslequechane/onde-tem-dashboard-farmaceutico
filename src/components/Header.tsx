import { useNavigate, useLocation } from 'react-router-dom';
import ondeTemLogo from '@/assets/onde-tem-logo.png';
import { Button } from '@/components/ui/button';
import { LogOut, User, Menu, Settings } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

interface HeaderProps {
  user: { email: string; name: string } | null;
  onLogout: () => void;
}

const Header = ({ user, onLogout }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src={ondeTemLogo} 
              alt="Onde Tem?" 
              className="h-8 sm:h-10 md:h-12 w-auto object-contain" 
            />
          </div>
          
          {/* Desktop User Info & Actions */}
          <div className="hidden md:flex items-center gap-3">
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => isAdminPage ? navigate('/admin/settings') : navigate('/farmacia/settings')}
              title="Configurações"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User size={16} />
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-medium truncate max-w-[180px]">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {user?.email}
                </p>
              </div>
              <Settings size={14} className="text-muted-foreground" />
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9">
                  <LogOut size={14} />
                  Sair
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Saída</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja sair do sistema? Você precisará fazer login novamente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Sim, Sair
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <div className="flex flex-col gap-6 py-6">
                  <div 
                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => isAdminPage ? navigate('/admin/settings') : navigate('/farmacia/settings')}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                      <User size={20} />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                    <Settings size={16} className="text-muted-foreground flex-shrink-0" />
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full gap-2 justify-center">
                        <LogOut size={18} />
                        Sair do Sistema
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Saída</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja sair? Você precisará fazer login novamente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={onLogout}
                          className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Sair
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
