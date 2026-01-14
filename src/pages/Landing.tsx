import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { 
  Scale, 
  Shield, 
  Heart, 
  FileCheck, 
  MapPin, 
  Users, 
  Building2, 
  BarChart3, 
  CheckCircle2,
  Search,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ClipboardCheck,
  UserCheck,
  FileText
} from 'lucide-react';
import logo from '@/assets/ondtem-logo.png';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header/Navigation */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex justify-between items-center">
          <img src={logo} alt="ONDTem" className="h-6 md:h-8 lg:h-10" />
          <div className="flex gap-2 md:gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/entrar')}
              className="text-xs md:text-sm lg:text-base px-2 md:px-4"
              size="sm"
            >
              Entrar
            </Button>
            <Button 
              onClick={() => navigate('/contacto')}
              className="text-xs md:text-sm lg:text-base px-3 md:px-4"
              size="sm"
            >
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
            <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-3xl mx-auto">
              Informação de disponibilidade de medicamentos.
            </p>
            <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
              Ao serviço da saúde pública.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button 
                size="lg" 
                onClick={() => {
                  const element = document.getElementById('como-funciona');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-sm md:text-base px-6 md:px-8 py-3 md:py-4 h-auto"
              >
                Saber Mais
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/contacto')}
                className="text-sm md:text-base px-6 md:px-8 py-3 md:py-4 h-auto"
              >
                Contactar
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Bloco 1 - O Desafio do Acesso */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-6">
                O Desafio do Acesso à Saúde
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
                Todos os dias, cidadãos percorrem várias farmácias à procura de medicamentos essenciais — muitas vezes sem sucesso.
              </p>
            </div>

            <div className="mb-12">
              <p className="text-center text-lg md:text-xl text-foreground mb-8">
                Ao mesmo tempo, farmácias com stock disponível não conseguem ser localizadas por quem precisa.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 space-y-4 bg-background border-muted">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-foreground">
                    Falta de informação
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Os cidadãos não têm forma de saber onde encontrar um medicamento específico na sua zona.
                  </p>
                </Card>

                <Card className="p-6 space-y-4 bg-background border-muted">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-foreground">
                    Deslocações desnecessárias
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Múltiplas deslocações sem garantia de encontrar o medicamento necessário.
                  </p>
                </Card>

                <Card className="p-6 space-y-4 bg-background border-muted">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-foreground">
                    Ineficiência no acesso
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Tempo perdido e frustração para cidadãos que precisam de cuidados de saúde.
                  </p>
                </Card>
              </div>
            </div>

            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 md:p-8">
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Esta desconexão afeta:
              </h3>
              <ul className="space-y-3 text-base md:text-lg text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-destructive font-bold">•</span>
                  <span>A qualidade de vida dos cidadãos</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive font-bold">•</span>
                  <span>A eficiência do sistema de saúde</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive font-bold">•</span>
                  <span>O acesso equitativo a medicamentos</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Bloco 2 - Como a Onde-Tem Funciona */}
      <section id="como-funciona" className="py-16 md:py-24 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                Como a Onde-Tem Funciona
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                Informação de disponibilidade de medicamentos ao serviço do cidadão
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
                      Informação por Proximidade
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
                      Acesso Facilitado
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      O cidadão encontra informação sobre farmácias da sua região de forma directa.
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
                      Funciona com critérios objectivos, sem favorecimentos ou destaques diferenciados.
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
                      Opera em conformidade com o regulamento farmacêutico em vigor.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              {[
                { step: 1, icon: Search, title: "Cidadão procura", description: "O cidadão procura um medicamento específico na plataforma." },
                { step: 2, icon: MapPin, title: "Plataforma identifica", description: "A plataforma identifica farmácias próximas com disponibilidade reportada." },
                { step: 3, icon: Building2, title: "Informação disponibilizada", description: "O cidadão recebe informação sobre localização e contacto das farmácias." },
                { step: 4, icon: CheckCircle2, title: "Acesso à farmácia", description: "O cidadão pode contactar ou dirigir-se à farmácia com informação prévia." }
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4 md:gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg md:text-xl">
                      {item.step}
                    </div>
                    {item.step < 4 && <div className="w-0.5 h-8 bg-primary/30 mt-2" />}
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bloco 3 - Participação das Farmácias */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                Participação das Farmácias
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                Responsabilidades e compromissos das farmácias participantes
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-background border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Confirmação de Disponibilidade
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      A farmácia confirma a disponibilidade de stock sob responsabilidade do farmacêutico.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-background border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <UserCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Responsabilidade Técnica
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Toda a informação é verificada e atualizada por profissional responsável identificado.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-background border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Dados Actualizados
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Manutenção de informação precisa e actualizada sobre disponibilidade.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-background border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Serviço de Saúde
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Contribuição para um serviço de informação de saúde mais eficiente.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Bloco 4 - Dados Agregados (Opcional) */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <div className="inline-block px-4 py-1 bg-secondary/20 text-secondary-foreground rounded-full text-sm font-medium mb-4">
                Opcional
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                Dados Agregados
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                A plataforma disponibiliza relatórios analíticos opcionais com dados agregados e anónimos:
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
                    <p className="text-sm text-muted-foreground">Tendências agregadas de procura na região</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-background">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Padrões regionais</h3>
                    <p className="text-sm text-muted-foreground">Dados agregados por área geográfica</p>
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
                    <h3 className="font-semibold text-foreground">Evolução temporal</h3>
                    <p className="text-sm text-muted-foreground">Acompanhamento da evolução da procura ao longo do tempo</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="mt-10 text-center">
              <p className="text-base md:text-lg text-muted-foreground">
                Todos os dados são anónimos e agregados, destinados a apoiar decisões internas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bloco 5 - Princípios de Funcionamento */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                Princípios de Funcionamento
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                Como a plataforma opera
              </p>
            </div>

            <Card className="p-8 md:p-10 bg-background border-border">
              <div className="space-y-6">
                {[
                  "Tratamento igualitário de todas as farmácias participantes",
                  "Sem destaques diferenciados ou posicionamentos pagos",
                  "Sem rankings ou classificações comparativas",
                  "Informação factual e verificada pelo farmacêutico responsável",
                  "Neutralidade técnica em todos os processos"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-base md:text-lg text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Bloco 6 - Enquadramento Regulamentar */}
      <section id="conformidade" className="py-16 md:py-24 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                Enquadramento Regulamentar
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                Conformidade com o regulamento farmacêutico
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <Card className="p-6 bg-background">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Regulamento Farmacêutico
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Conformidade com as normas que regem o setor farmacêutico nacional.
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
                      Art. 94 e Art. 95
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Respeito às disposições sobre publicidade e informação de medicamentos.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-background">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <UserCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Art. 80 - Responsabilidade Técnica
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Exigência de farmacêutico ou técnico responsável identificado.
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
                      Art. 90 - Alvará
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Verificação de licenciamento e alvará emitido pela ANARME.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Declaração Legal */}
            <Card className="p-6 md:p-8 bg-muted/50 border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Declaração de Conformidade
              </h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                O serviço Onde-Tem presta informação de disponibilidade de medicamentos com caráter estritamente informativo e de utilidade pública. Não realiza, directa ou indirectamente, promoção, publicidade, divulgação de preços, comparações ou incentivos de qualquer natureza (cf. Art. 94 e Art. 95 do Regulamento). Toda informação sobre disponibilidade deverá ser confirmada por farmacêutico titular ou técnico responsável, cuja identificação e alvará serão exigidos no processo de adesão (cf. Art. 80 e Art. 90).
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Bloco 7 - Processo de Adesão */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-6">
              Processo de Adesão
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-10">
              A integração de farmácias ocorre de forma progressiva e responsável.
            </p>

            <Card className="p-8 md:p-10 bg-background border-border mb-10">
              <p className="text-lg md:text-xl font-medium text-foreground mb-6">
                Requisitos para participação:
              </p>
              <div className="grid sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto mb-8">
                {[
                  "Alvará válido emitido pela ANARME",
                  "Farmacêutico responsável identificado",
                  "Compromisso com actualização de dados",
                  "Conformidade regulamentar"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-foreground text-sm md:text-base">{item}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-border pt-6">
                <p className="text-sm md:text-base text-muted-foreground">
                  O processo inclui: submissão de documentação, verificação de licenciamento e ativação na plataforma.
                </p>
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/contacto')}
                className="text-sm md:text-base px-6 md:px-8 py-3 md:py-4 h-auto"
              >
                Solicitar Informações
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => {
                  const element = document.getElementById('conformidade');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-sm md:text-base px-6 md:px-8 py-3 md:py-4 h-auto"
              >
                Ver Enquadramento Regulamentar
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-12 bg-muted/50 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <img src={logo} alt="ONDTem" className="h-6 md:h-8" />
            <p className="text-sm text-muted-foreground text-center md:text-right">
              © {new Date().getFullYear()} ONDTem. Serviço de informação de saúde pública.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
