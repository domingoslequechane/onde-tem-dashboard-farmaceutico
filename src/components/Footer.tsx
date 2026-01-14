import { useNavigate } from 'react-router-dom';
import logo from '@/assets/ondtem-logo.png';

interface FooterProps {
  variant?: 'default' | 'minimal';
}

const Footer = ({ variant = 'default' }: FooterProps) => {
  const navigate = useNavigate();

  if (variant === 'minimal') {
    return (
      <footer className="py-8 md:py-12 bg-muted/50 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <img src={logo} alt="ONDTem" className="h-6 md:h-8" />
            <p className="text-sm text-muted-foreground text-center md:text-right">
              © {new Date().getFullYear()} ONDTem. Plataforma de interesse público.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="py-12 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <img src={logo} alt="ONDTem" className="h-8" />
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} ONDTem. Todos os direitos reservados.
                <br />
                by <a href="https://onixagence.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Onix Agence</a>
              </p>
            </div>
            <div className="flex gap-6">
              <a 
                href="https://ondtem.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                ondtem.com
              </a>
              <button 
                onClick={() => navigate('/entrar')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
