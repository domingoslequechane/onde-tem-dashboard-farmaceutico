import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Scale, Shield, Heart, FileCheck, MapPin, Users, Building2, BarChart3, CheckCircle2, Search, ArrowRight, Clock, TrendingUp, Eye, AlertCircle } from 'lucide-react';
import logo from '@/assets/ondtem-logo.png';
import Footer from '@/components/Footer';

const Landing = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header/Navigation */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex justify-between items-center">
          <img src={logo} alt="ONDTem" className="h-6 md:h-8 lg:h-10" />
          <div className="flex gap-2 md:gap-3">
            <Button variant="ghost" onClick={() => navigate('/entrar')} className="text-xs md:text-sm lg:text-base px-2 md:px-4" size="sm">
              Entrar
            </Button>
            <Button onClick={() => navigate('/contacto')} className="text-xs md:text-sm lg:text-base px-3 md:px-4" size="sm">
              Contacto
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 lg:py-32 relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 mt-[64px] md:mt-[72px]">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Onde-Tem
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-3xl mx-auto font-medium">
              A plataforma que conecta farmácias à procura real da sua região.
            </p>
            
            <div className="flex flex-col gap-2 text-base md:text-lg text-foreground/80 max-w-2xl mx-auto pt-4">
              <p className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                Mais visibilidade institucional.
              </p>
              <p className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                Mais inteligência de decisão.
              </p>
              <p className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                Sem publicidade. Sem concorrência desleal.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button size="lg" onClick={() => navigate('/contacto')} className="text-sm md:text-base px-6 md:px-8 py-3 md:py-4 h-auto">
                Solicitar Integração Institucional
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => {
              const element = document.getElementById('conformidade');
              element?.scrollIntoView({
                behavior: 'smooth'
              });
            }} className="text-sm md:text-base px-6 md:px-8 py-3 md:py-4 h-auto">
                Conhecer o Enquadramento
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Bloco 1 - O Problema Real */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-6">
                O Problema Real
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
                Todos os dias, milhares de cidadãos percorrem farmácias à procura de medicamentos essenciais — muitas vezes sem sucesso.
              </p>
            </div>

            <div className="mb-12">
              <p className="text-center text-lg md:text-xl text-foreground mb-8 font-medium">
                Os cidadãos não têm forma de saber onde encontrar um medicamento específico na sua região.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 space-y-4 bg-background border-muted">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <Eye className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-foreground">
                    Não são encontradas
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Os cidadãos não sabem onde procurar quando precisam de um medicamento específico.
                  </p>
                </Card>

                <Card className="p-6 space-y-4 bg-background border-muted">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-foreground">
                    Não são lembradas
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Fora do momento de necessidade, a farmácia deixa de fazer parte da memória do cliente.
                  </p>
                </Card>

                <Card className="p-6 space-y-4 bg-background border-muted">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-foreground">
                    Não fazem parte da decisão
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    O cliente escolhe outra farmácia por falta de informação acessível.
                  </p>
                </Card>
              </div>
            </div>

            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 md:p-8">
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Essa desconexão gera:
              </h3>
              <ul className="space-y-3 text-base md:text-lg text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-destructive font-bold">•</span>
                  <span>Deslocações desnecessárias para o cidadão</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive font-bold">•</span>
                  <span>Frustração e perda de tempo</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive font-bold">•</span>
                  <span>Oportunidades perdidas para a farmácia</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Bloco 2 - A Proposta da Onde-Tem */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                A Proposta da Onde-Tem
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                Uma plataforma de interesse público ao serviço da saúde
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Card className="p-6 bg-primary/5 border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Disponibilidade por Proximidade
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Indica a disponibilidade de medicamentos com base na localização do cidadão.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-primary/5 border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Conexão com a População
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Conecta a população às farmácias da sua região de forma direta e eficiente.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-primary/5 border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Scale className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Critérios Técnicos e Neutros
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Funciona com critérios objetivos, sem favorecimentos ou rankings comerciais.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-primary/5 border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Enquadramento Legal
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Respeita integralmente o enquadramento legal do setor farmacêutico.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="text-center bg-secondary/10 rounded-xl p-6 md:p-8 border border-secondary/20">
              <p className="text-xl md:text-2xl font-semibold text-foreground">
                Não é publicidade.<br />
                Não é promoção.<br />
                <span className="text-primary">É serviço.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bloco 3 - Como Funciona */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                Como Funciona
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                Um processo simples, objetivo e eficiente
              </p>
            </div>

            <div className="space-y-6">
              {[{
              step: 1,
              icon: Search,
              title: "Cidadão procura",
              description: "O cidadão procura um medicamento específico na plataforma."
            }, {
              step: 2,
              icon: MapPin,
              title: "Plataforma identifica",
              description: "A plataforma identifica farmácias próximas com disponibilidade do produto."
            }, {
              step: 3,
              icon: Building2,
              title: "Farmácia é encontrada",
              description: "A farmácia é encontrada no momento certo, quando o cidadão precisa."
            }, {
              step: 4,
              icon: ArrowRight,
              title: "Acesso facilitado",
              description: "O acesso às informações de contacto e localização é facilitado."
            }, {
              step: 5,
              icon: CheckCircle2,
              title: "Decisão eficiente",
              description: "A decisão é mais rápida e eficiente para todos."
            }].map(item => <div key={item.step} className="flex items-start gap-4 md:gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg md:text-xl">
                      {item.step}
                    </div>
                    {item.step < 5 && <div className="w-0.5 h-8 bg-primary/30 mt-2" />}
                  </div>
                  <Card className="flex-1 p-4 md:p-6 bg-background">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">{item.title}</h3>
                        <p className="text-sm md:text-base text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                </div>)}
            </div>

            <div className="mt-12 text-center">
              <p className="text-base md:text-lg text-muted-foreground italic">
                Tudo de forma objetiva, sem exposição comercial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bloco 4 - Benefícios para a Farmácia */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                Benefícios para a Farmácia
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                Ao integrar a Onde-Tem, a farmácia passa a:
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-background border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Ser encontrada
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Por quem realmente procura um medicamento que a farmácia tem disponível.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-background border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Reduzir chamadas improdutivas
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Menos visitas e chamadas de clientes à procura de produtos não disponíveis.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-background border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Fortalecer presença regional
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Aumentar a visibilidade institucional junto da comunidade local.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-background border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Contribuir para a saúde
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Fazer parte de um serviço de saúde mais eficiente e acessível para todos.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="mt-10 text-center">
              <p className="text-base md:text-lg font-medium text-foreground bg-muted/50 inline-block px-6 py-3 rounded-lg">
                A visibilidade é técnica, não comercial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bloco 5 - Inteligência de Dados (Opcional) */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <div className="inline-block px-4 py-1 bg-secondary/20 text-secondary-foreground rounded-full text-sm font-medium mb-4">
                Opcional
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                Inteligência de Dados
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Além da presença institucional, a Onde-Tem disponibiliza relatórios analíticos opcionais, com dados agregados sobre:
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-background">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <Search className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Procura por medicamentos</h3>
                    <p className="text-sm text-muted-foreground">Quais produtos são mais procurados na região</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-background">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Tendências regionais</h3>
                    <p className="text-sm text-muted-foreground">Padrões de procura por área geográfica</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-background">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <BarChart3 className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Demandas atendidas</h3>
                    <p className="text-sm text-muted-foreground">Análise de demandas atendidas e não atendidas</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-background">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Evolução mensal</h3>
                    <p className="text-sm text-muted-foreground">Acompanhamento da evolução da procura ao longo do tempo</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="mt-10 text-center">
              <p className="text-base md:text-lg text-muted-foreground italic">
                Esses dados apoiam decisões internas, sem exposição pública.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bloco 6 - Igualdade, Ética e Neutralidade */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                Igualdade, Ética e Neutralidade
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                Na Onde-Tem, todos são tratados de forma igual
              </p>
            </div>

            <Card className="p-8 md:p-10 bg-primary/5 border-primary/20">
              <div className="space-y-6">
                {["Todas as farmácias têm os mesmos direitos", "Nenhuma paga para aparecer", "Não existem rankings comerciais", "Não há publicidade de medicamentos", "A plataforma é neutra por definição"].map((item, index) => <div key={index} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-base md:text-lg text-foreground font-medium">{item}</p>
                  </div>)}
              </div>

              <div className="mt-10 pt-8 border-t border-primary/20 text-center">
                <p className="text-xl md:text-2xl font-bold text-primary">
                  O interesse público vem primeiro.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Bloco 7 - Conformidade Legal */}
      <section id="conformidade" className="py-16 md:py-24 bg-muted/30 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                Conformidade Legal
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                A plataforma foi concebida com base em princípios rigorosos
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-background">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Regulamento Farmacêutico Nacional
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Respeito integral às normas que regem o setor farmacêutico em Portugal.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-background">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Princípio da Não Publicidade
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      A plataforma não promove nem publicita medicamentos de qualquer forma.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-background">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Scale className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Igualdade entre Farmácias
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Todas as farmácias têm os mesmos deveres e direitos na plataforma.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-background">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Proteção Institucional
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Os dados são tratados com proteção institucional e confidencialidade.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="mt-10 text-center">
              <p className="text-base md:text-lg font-medium text-foreground bg-background inline-block px-6 py-3 rounded-lg border border-border">
                A Onde-Tem atua como sistema informativo, não promocional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bloco 8 - Convite Institucional */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-6">
              Convite Institucional
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-10">
              Estamos a integrar farmácias de forma progressiva e responsável.
            </p>

            <Card className="p-8 md:p-10 bg-background border-border mb-10">
              <p className="text-lg md:text-xl font-medium text-foreground mb-6">
                Se a sua farmácia acredita em:
              </p>
              <div className="grid sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto">
                {["Serviço à comunidade", "Uso ético de dados", "Decisão baseada em informação", "Evolução do setor farmacêutico"].map((item, index) => <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </div>)}
              </div>
              <p className="text-lg md:text-xl font-semibold text-primary mt-8">
                Então a Onde-Tem faz sentido para si.
              </p>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/contacto')} className="text-sm md:text-base px-6 md:px-8 py-3 md:py-4 h-auto">
                Solicitar Integração Institucional
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/contacto')} className="text-sm md:text-base px-6 md:px-8 py-3 md:py-4 h-auto">
                Conhecer o Enquadramento da Plataforma
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer variant="minimal" />
    </div>;
};
export default Landing;