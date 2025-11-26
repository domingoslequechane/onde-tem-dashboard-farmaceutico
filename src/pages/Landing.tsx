import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  TrendingUp, 
  BarChart3, 
  Smartphone, 
  Shield, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import logo from '@/assets/ondtem-logo.svg';
import heroBackground from '@/assets/pharmacy-hero-bg.jpg';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header/Navigation */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <img src={logo} alt="ONDTem" className="h-8 md:h-10" />
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/contacto')}
              className="text-sm md:text-base"
            >
              Contacto
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/entrar')}
              className="text-sm md:text-base"
            >
              Entrar
            </Button>
            <Button 
              onClick={() => navigate('/contacto')}
              className="text-sm md:text-base"
            >
              Começar Agora
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="py-16 md:py-24 lg:py-32 relative bg-cover bg-center bg-no-repeat mt-[72px]"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-primary/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
            <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm md:text-base font-medium mb-4">
              PARE DE PERDER VENDAS PARA O VIZINHO
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Transforme o seu Stock em{' '}
              <span className="text-primary">Vendas Imediatas</span>{' '}
              com a Inteligência de Demanda do WhatsApp
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              A ONDTem liga a sua farmácia a clientes que procuram ativamente o que você já tem, 
              no exato momento em que precisam. É a solução que transforma procura em vendas certas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button 
                size="lg" 
                onClick={() => navigate('/contacto')}
                className="text-base md:text-lg px-8 py-6 h-auto"
              >
                Quero Aumentar Minhas Vendas
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-base md:text-lg px-8 py-6 h-auto"
              >
                Ver Como Funciona
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                O SEU STOCK ESTÁ À ESPERA. O SEU CLIENTE NÃO.
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                Todos os dias, clientes desesperados procuram um medicamento ou produto essencial. 
                E todos os dias, a sua farmácia pode ter exatamente o que eles precisam, mas eles não conseguem encontrá-lo.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 space-y-4 bg-background border-destructive/20">
                <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-foreground">
                  Dependência da Localização
                </h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  O seu negócio está limitado a quem passa pela porta.
                </p>
              </Card>

              <Card className="p-6 space-y-4 bg-background border-destructive/20">
                <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-foreground">
                  Stock Parado
                </h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Produtos no armazém representam capital imobilizado.
                </p>
              </Card>

              <Card className="p-6 space-y-4 bg-background border-destructive/20">
                <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-foreground">
                  Falta de Dados
                </h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Você toma decisões de compra no escuro.
                </p>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <p className="text-lg md:text-xl font-semibold text-foreground">
                A ONDTem elimina esta barreira. Nós transformamos a incerteza do cliente em certeza de venda para si.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section - 3 Pillars */}
      <section id="como-funciona" className="py-16 md:py-24 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                Os 3 Pilares do Seu Crescimento
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                A solução completa para transformar a sua farmácia
              </p>
            </div>

            <div className="space-y-8">
              <Card className="p-6 md:p-8 bg-primary/5 border-primary/20">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <ShoppingCart className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <h3 className="text-xl md:text-2xl font-bold text-foreground">
                      1. Vendas Imediatas
                    </h3>
                    <p className="text-base md:text-lg font-semibold text-primary">
                      Aumento de Faturação e Rotatividade de Stock
                    </p>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Conectamos a sua farmácia a clientes que procuram um produto específico, 
                      garantindo que o seu stock é encontrado e vendido rapidamente.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 md:p-8 bg-secondary/5 border-secondary/20">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-16 h-16 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-8 w-8 text-secondary" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <h3 className="text-xl md:text-2xl font-bold text-foreground">
                      2. Visibilidade Digital
                    </h3>
                    <p className="text-base md:text-lg font-semibold text-secondary">
                      Novos Clientes Sem Investimento em Marketing Complexo
                    </p>
                    <p className="text-sm md:text-base text-muted-foreground">
                      A sua farmácia ganha uma presença digital instantânea e credível, 
                      sem precisar de site ou app. Aumente o seu alcance sem complicações.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 md:p-8 bg-orange-50 border-orange-200">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-16 h-16 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                    <BarChart3 className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <h3 className="text-xl md:text-2xl font-bold text-foreground">
                      3. Inteligência de Mercado
                    </h3>
                    <p className="text-base md:text-lg font-semibold text-orange-600">
                      Decisões de Stock Estratégicas e Lucrativas
                    </p>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Aceda a dados exclusivos: Análise de Demanda (o que procuram), 
                      Mapa de Procura por Região (onde procuram) e Comparativo Mensal de Indicações.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Differentiation Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                Por Que a <span className="text-primary">ONDTem</span> é a <span className="text-primary">ÚNICA</span> Solução de Crescimento para a Sua Farmácia?
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 space-y-4 bg-background">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Smartphone className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg md:text-xl font-semibold text-foreground">
                      Funciona no WhatsApp
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Zero Barreira de Entrada. Máxima conveniência, máxima conversão.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-4 bg-background">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg md:text-xl font-semibold text-foreground">
                      Integração Simples
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Sem Mudança de Software. Integra-se no seu fluxo de trabalho atual.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-4 bg-background">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg md:text-xl font-semibold text-foreground">
                      Gera Confiança e Credibilidade
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Posicionamento de Liderança e compromisso moderno com o cliente.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-4 bg-background">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg md:text-xl font-semibold text-foreground">
                      Transparência Total
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Fim da Frustração. Menos chamadas desnecessárias e mais clientes a entrar pela porta com a intenção de comprar.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-6 mb-16">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground">
                A ONDTem é um CUSTO ou um <span className="text-primary">INVESTIMENTO</span>?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Veja o impacto real da ONDTem no crescimento da sua farmácia
              </p>
            </div>

            {/* Comparison Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Left Side - Without ONDTem */}
              <div className="space-y-6">
                <div className="text-center p-4 bg-destructive/10 rounded-xl border-2 border-destructive/30">
                  <h3 className="text-xl md:text-2xl font-bold text-destructive">Sem a ONDTem</h3>
                  <p className="text-sm text-muted-foreground mt-1">Perdas Constantes</p>
                </div>

                <Card className="p-6 border-2 border-destructive/20 bg-background space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-destructive font-bold">✗</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Clientes Perdidos</h4>
                      <p className="text-sm text-muted-foreground">
                        Dezenas de clientes procuram produtos que você tem, mas não conseguem encontrar
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-destructive font-bold">✗</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Stock Encalhado</h4>
                      <p className="text-sm text-muted-foreground">
                        Capital parado em produtos que demoram a vender, prejudicando seu fluxo de caixa
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-destructive font-bold">✗</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Decisões no Escuro</h4>
                      <p className="text-sm text-muted-foreground">
                        Compras baseadas em intuição, sem saber o que o mercado realmente procura
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-destructive font-bold">✗</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Crescimento Limitado</h4>
                      <p className="text-sm text-muted-foreground">
                        Dependência total da localização física e do boca a boca
                      </p>
                    </div>
                  </div>
                </Card>

                <div className="text-center p-4 bg-destructive/5 rounded-lg border-2 border-destructive/20">
                  <p className="text-sm font-semibold text-destructive">Prejuízo Contínuo e Invisível</p>
                </div>
              </div>

              {/* Right Side - With ONDTem */}
              <div className="space-y-6">
                <div className="text-center p-4 bg-primary rounded-xl border-2 border-primary/30 shadow-lg">
                  <h3 className="text-xl md:text-2xl font-bold text-white">Com a ONDTem</h3>
                  <p className="text-sm text-white/90 mt-1">Crescimento Acelerado</p>
                </div>

                <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Vendas Garantidas</h4>
                      <p className="text-sm text-muted-foreground">
                        Clientes encontram seus produtos no momento exato que precisam e vão direto à sua farmácia
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Stock Otimizado</h4>
                      <p className="text-sm text-muted-foreground">
                        Produtos giram rápido, liberando capital para investir no que realmente vende
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Inteligência de Mercado</h4>
                      <p className="text-sm text-muted-foreground">
                        Dados exclusivos sobre o que os clientes procuram e onde procuram
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Visibilidade Digital</h4>
                      <p className="text-sm text-muted-foreground">
                        Presença online instantânea sem precisar de site ou marketing complexo
                      </p>
                    </div>
                  </div>
                </Card>

                <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border-2 border-primary/20">
                  <p className="text-sm font-semibold text-primary">Crescimento Sustentável</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                O Que as Farmácias Parceiras Dizem
              </h2>
            </div>

            <Card className="p-8 md:p-12 bg-background">
              <div className="space-y-6">
                <div className="flex gap-2 text-primary">
                  <span className="text-3xl">⭐</span>
                  <span className="text-3xl">⭐</span>
                  <span className="text-3xl">⭐</span>
                  <span className="text-3xl">⭐</span>
                  <span className="text-3xl">⭐</span>
                </div>
                <p className="text-lg md:text-xl text-foreground italic">
                  "Desde que aderimos à ONDTem, vimos um aumento de 15% na procura por produtos que estavam parados no armazém. 
                  É como ter um vendedor digital 24 horas por dia."
                </p>
                <div className="pt-4 border-t border-border">
                  <p className="font-semibold text-foreground">Dr. Manuel Silva</p>
                  <p className="text-sm text-muted-foreground">Proprietário da Farmácia Central, Maputo</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary via-primary to-primary/80">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8 text-primary-foreground">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold">
              Não Deixe o Seu Concorrente Encontrar<br className="hidden md:block" />
              o Seu Cliente Primeiro
            </h2>
            <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto">
              O futuro da distribuição farmacêutica em Moçambique é digital, simples e acessível. 
              A ONDTem é essa ponte. Garanta a sua fatia do mercado de procura ativa.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/contacto')}
              className="text-base md:text-lg px-8 py-6 h-auto"
            >
              Quero Falar com um Consultor ONDTem
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm opacity-75 pt-4">
              Serviço Gratuito para o Consumidor. Assinatura Exclusiva para Farmácias.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <img src={logo} alt="ONDTem" className="h-8" />
                <p className="text-sm text-muted-foreground">
                  © 2025 ONDTem. Todos os direitos reservados.
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
    </div>
  );
};

export default Landing;
