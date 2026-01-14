import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Shield, Phone, Mail, Clock, Search, Building2, ArrowRight, FileCheck } from 'lucide-react';
import logo from '@/assets/ondtem-logo.png';
import Footer from '@/components/Footer';
import heroBackground from '@/assets/pharmacy-hero-bg.jpg';

const Landing = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Top Bar */}
      <div className="bg-secondary text-secondary-foreground py-2 px-4 text-sm">
        <div className="container mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Seg-Sex: 09:00-18:00</span>
              <span className="sm:hidden">09:00-18:00</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              <span className="hidden md:inline">geral@ondtem.pt</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs md:text-sm">Plataforma de Informação Farmacêutica</span>
          </div>
        </div>
      </div>

      {/* Header/Navigation */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <img src={logo} alt="ONDTem" className="h-8 md:h-10 lg:h-12" />
          
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => document.getElementById('sobre')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-foreground/80 hover:text-foreground transition-colors font-medium"
            >
              Sobre
            </button>
            <button 
              onClick={() => document.getElementById('servicos')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-foreground/80 hover:text-foreground transition-colors font-medium"
            >
              Serviços
            </button>
            <button 
              onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-foreground/80 hover:text-foreground transition-colors font-medium"
            >
              Como Funciona
            </button>
            <button 
              onClick={() => navigate('/contacto')}
              className="text-foreground/80 hover:text-foreground transition-colors font-medium"
            >
              Contacto
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 text-secondary">
              <Phone className="h-5 w-5" />
              <span className="font-semibold">Contacto</span>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/entrar')} 
              className="text-sm"
            >
              Entrar
            </Button>
            <Button 
              onClick={() => navigate('/contacto')} 
              className="bg-secondary hover:bg-secondary/90 text-sm"
            >
              Sou Farmácia
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Full Height with Background Image */}
      <section className="relative min-h-[calc(100vh-140px)] flex items-center">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBackground})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/30" />
        </div>

        {/* Hero Content */}
        <div className="container mx-auto px-4 relative z-10 py-16 md:py-24">
          <div className="max-w-2xl text-white space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Onde-Tem
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed">
              Plataforma de informação sobre disponibilidade de medicamentos. 
              Conectamos farmácias à procura real da sua região, de forma ética e transparente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                size="lg" 
                onClick={() => document.getElementById('sobre')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-secondary hover:bg-secondary/90 text-white px-8 py-6 text-base font-medium"
              >
                Saber Mais
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/encontrar')}
                className="bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20 px-8 py-6 text-base font-medium"
              >
                Procurar Medicamento
              </Button>
            </div>
          </div>
        </div>

        {/* Feature Cards - Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 z-20 px-4">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {/* Card 1 - Green */}
              <Card className="bg-secondary text-secondary-foreground p-6 shadow-xl">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                    <Search className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-semibold">Informação de Disponibilidade</h3>
                  <p className="text-sm text-white/80">
                    Acesso rápido à informação sobre medicamentos disponíveis nas farmácias da região.
                  </p>
                </div>
              </Card>

              {/* Card 2 - Green */}
              <Card className="bg-secondary text-secondary-foreground p-6 shadow-xl">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                    <MapPin className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-semibold">Proximidade Geográfica</h3>
                  <p className="text-sm text-white/80">
                    Resultados ordenados por proximidade, facilitando o acesso do cidadão.
                  </p>
                </div>
              </Card>

              {/* Card 3 - White */}
              <Card className="bg-white text-foreground p-6 shadow-xl border-0">
                <div className="flex flex-col items-center text-center space-y-3">
                  <h3 className="text-lg font-semibold text-secondary">É Farmácia?</h3>
                  <p className="text-sm text-muted-foreground">
                    Solicite informação sobre integração na plataforma de forma institucional.
                  </p>
                  <Button 
                    onClick={() => navigate('/contacto')}
                    className="bg-secondary hover:bg-secondary/90 mt-2"
                  >
                    Solicitar Informação
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Spacer for cards */}
      <div className="h-32 md:h-40" />

      {/* Sobre Section */}
      <section id="sobre" className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Sobre a Onde-Tem
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Uma plataforma de interesse público ao serviço da saúde
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="p-6 bg-white border-0 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Conexão com a População
                    </h3>
                    <p className="text-muted-foreground">
                      Conectamos cidadãos às farmácias da sua região de forma direta e eficiente.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border-0 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <Shield className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Critérios Técnicos e Neutros
                    </h3>
                    <p className="text-muted-foreground">
                      Funciona com critérios objetivos, sem favorecimentos ou rankings comerciais.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border-0 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Disponibilidade por Proximidade
                    </h3>
                    <p className="text-muted-foreground">
                      Indica disponibilidade de medicamentos com base na localização do cidadão.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border-0 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <FileCheck className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Enquadramento Legal
                    </h3>
                    <p className="text-muted-foreground">
                      Respeita integralmente o enquadramento legal do setor farmacêutico.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="text-center bg-secondary/5 rounded-xl p-8 border border-secondary/20">
              <p className="text-xl md:text-2xl font-semibold text-foreground">
                Não é publicidade. Não é promoção.<br />
                <span className="text-secondary">É informação ao serviço da saúde.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços Section */}
      <section id="servicos" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Serviços da Plataforma
              </h2>
              <p className="text-lg text-muted-foreground">
                O que a Onde-Tem oferece aos cidadãos e farmácias
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-8 bg-secondary text-secondary-foreground shadow-lg border-0">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                    <Search className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold">Para Cidadãos</h3>
                  <p className="text-white/85">
                    Pesquise medicamentos e encontre farmácias próximas com disponibilidade. 
                    Informação gratuita e sem registo necessário.
                  </p>
                  <Button 
                    variant="secondary"
                    onClick={() => navigate('/encontrar')}
                    className="bg-white text-secondary hover:bg-white/90 mt-2"
                  >
                    Pesquisar Medicamento
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>

              <Card className="p-8 bg-white shadow-lg border border-secondary/20">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Para Farmácias</h3>
                  <p className="text-muted-foreground">
                    Integração institucional na plataforma. Gestão de disponibilidade 
                    e visibilidade junto da comunidade local.
                  </p>
                  <Button 
                    onClick={() => navigate('/contacto')}
                    className="bg-secondary hover:bg-secondary/90 mt-2"
                  >
                    Solicitar Integração
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section id="como-funciona" className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Como Funciona
              </h2>
              <p className="text-lg text-muted-foreground">
                Um processo simples, objetivo e eficiente
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: 1,
                  icon: Search,
                  title: "Pesquisa",
                  description: "O cidadão pesquisa o medicamento que precisa na plataforma."
                },
                {
                  step: 2,
                  icon: MapPin,
                  title: "Localização",
                  description: "A plataforma identifica farmácias próximas com o produto disponível."
                },
                {
                  step: 3,
                  icon: Building2,
                  title: "Contacto",
                  description: "O cidadão obtém as informações de contacto e localização da farmácia."
                }
              ].map((item) => (
                <Card key={item.step} className="p-6 bg-white border-0 shadow-md text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-xl">
                      {item.step}
                    </div>
                    <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center">
                      <item.icon className="h-7 w-7 text-secondary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-6">
                Tudo de forma objetiva, sem exposição comercial.
              </p>
              <Button 
                size="lg"
                onClick={() => navigate('/encontrar')}
                className="bg-secondary hover:bg-secondary/90"
              >
                Experimentar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              É Farmacêutico?
            </h2>
            <p className="text-lg text-white/85">
              A Onde-Tem integra farmácias de forma progressiva e responsável. 
              Solicite informação sobre o processo de adesão.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg"
                variant="secondary"
                onClick={() => navigate('/contacto')}
                className="bg-white text-secondary hover:bg-white/90 px-8"
              >
                Solicitar Integração
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/entrar')}
                className="border-white/30 text-white hover:bg-white/10 px-8"
              >
                Já tenho conta
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer variant="default" />
    </div>
  );
};

export default Landing;
