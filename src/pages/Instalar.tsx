import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Smartphone, CheckCircle2, ArrowLeft } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import ondtemLogo from "@/assets/onde-tem-logo.png";

const Instalar = () => {
  const navigate = useNavigate();
  const { isInstallable, isInstalled, installPWA } = usePWAInstall();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <img 
              src={ondtemLogo} 
              alt="ONDTem Logo" 
              className="h-16 mx-auto mb-4"
            />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Instale o App ONDTem
            </h1>
            <p className="text-lg text-muted-foreground">
              Acesse rapidamente a plataforma direto da tela inicial do seu dispositivo
            </p>
          </div>

          {isInstalled && (
            <Card className="p-6 mb-6 bg-primary/10 border-primary">
              <div className="flex items-center gap-3 text-primary">
                <CheckCircle2 className="w-6 h-6" />
                <p className="font-semibold">App já instalado! Você pode acessá-lo pela tela inicial.</p>
              </div>
            </Card>
          )}

          {isInstallable && !isInstalled && (
            <Card className="p-8 mb-6 text-center">
              <Smartphone className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-4">Pronto para Instalar!</h2>
              <p className="text-muted-foreground mb-6">
                Clique no botão abaixo para instalar o app ONDTem no seu dispositivo.
              </p>
              <Button 
                onClick={installPWA} 
                size="lg"
                className="w-full md:w-auto"
              >
                <Download className="w-5 h-5 mr-2" />
                Instalar Agora
              </Button>
            </Card>
          )}

          {!isInstallable && !isInstalled && (
            <Card className="p-8 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-center">Como Instalar</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">1</span>
                    iPhone / iPad (Safari)
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-10">
                    <li>Toque no ícone de compartilhar (quadrado com seta)</li>
                    <li>Role para baixo e toque em "Adicionar à Tela de Início"</li>
                    <li>Toque em "Adicionar" no canto superior direito</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">2</span>
                    Android (Chrome)
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-10">
                    <li>Toque no menu (três pontos) no canto superior direito</li>
                    <li>Toque em "Instalar app" ou "Adicionar à tela inicial"</li>
                    <li>Confirme tocando em "Instalar"</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">3</span>
                    Desktop (Chrome, Edge, Brave)
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-10">
                    <li>Clique no ícone de instalação na barra de endereço</li>
                    <li>Ou abra o menu e selecione "Instalar ONDTem"</li>
                    <li>Confirme clicando em "Instalar"</li>
                  </ol>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
            <h3 className="font-semibold text-lg mb-4">Benefícios do App Instalado</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span className="text-muted-foreground">Acesso rápido direto da tela inicial</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span className="text-muted-foreground">Funciona offline para consultas básicas</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span className="text-muted-foreground">Experiência de app nativo</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span className="text-muted-foreground">Carregamento mais rápido</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      <footer className="mt-16 py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © 2025 ONDTem. Todos os direitos reservados. by <a href="https://onixagence.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Onix Agence</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Instalar;
