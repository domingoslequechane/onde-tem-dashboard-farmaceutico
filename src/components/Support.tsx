
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, User, Bot, Phone, Mail, Video, FileText, Play } from 'lucide-react';
import VideoModal from './VideoModal';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
}

const Support = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Olá! Como posso ajudá-lo hoje? Estou aqui para esclarecer dúvidas sobre o uso da plataforma Onde Tem.",
      isUser: false,
      timestamp: "14:30"
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<{title: string, description: string, duration: string} | null>(null);

  const autoResponses = [
    "Entendi sua solicitação. Vou verificar isso para você e retornar em breve.",
    "Obrigado por entrar em contato! Para problemas técnicos, recomendo verificar se sua internet está estável.",
    "Essa é uma ótima pergunta! Você pode encontrar mais informações na seção de tutoriais do dashboard.",
    "Para alterar informações da farmácia, acesse a aba 'Configurações' no menu principal.",
    "Caso o problema persista, posso agendar uma chamada de suporte para você. Seria útil?",
    "Vou encaminhar sua solicitação para nossa equipe técnica. Você receberá um retorno em até 2 horas."
  ];

  const tutorials = [
    {
      title: "Primeiros Passos",
      description: "Como configurar sua farmácia na plataforma Onde Tem. Aprenda a fazer login, navegar pelo dashboard e configurar informações básicas da sua farmácia.",
      duration: "5 min"
    },
    {
      title: "Gestão de Estoque",
      description: "Como adicionar e gerenciar medicamentos no seu estoque. Veja como marcar disponibilidade, criar promoções e organizar seu inventário.",
      duration: "8 min"
    },
    {
      title: "Análise de Demanda",
      description: "Entenda como interpretar os dados de demanda por região e usar essas informações para otimizar seu estoque e vendas.",
      duration: "6 min"
    },
    {
      title: "Configurações da Farmácia",
      description: "Configure horários de funcionamento, formas de pagamento, serviços oferecidos e área de entrega da sua farmácia.",
      duration: "4 min"
    }
  ];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const userMessage: Message = {
        id: messages.length + 1,
        text: newMessage,
        isUser: true,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages([...messages, userMessage]);
      
      // Simulate auto response after a delay
      setTimeout(() => {
        const randomResponse = autoResponses[Math.floor(Math.random() * autoResponses.length)];
        const botMessage: Message = {
          id: messages.length + 2,
          text: randomResponse,
          isUser: false,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMessage]);
      }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds

      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const openVideoModal = (tutorial: typeof tutorials[0]) => {
    setSelectedVideo(tutorial);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Support Options */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4 text-center">
            <MessageCircle className="mx-auto mb-1 sm:mb-2 text-blue-500 flex-shrink-0" size={24} />
            <h3 className="font-medium text-sm md:text-base">Chat Online</h3>
            <p className="text-xs sm:text-sm text-gray-600">Disponível 24/7</p>
            <Badge className="mt-1 sm:mt-2 bg-green-100 text-green-800 text-xs whitespace-nowrap">Online</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4 text-center">
            <Phone className="mx-auto mb-1 sm:mb-2 text-green-500 flex-shrink-0" size={24} />
            <h3 className="font-medium text-sm md:text-base">Telefone</h3>
            <p className="text-xs sm:text-sm text-gray-600">+258 84 000 0000</p>
            <Badge className="mt-1 sm:mt-2 bg-blue-100 text-blue-800 text-xs whitespace-nowrap">8h-18h</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4 text-center">
            <Mail className="mx-auto mb-1 sm:mb-2 text-purple-500 flex-shrink-0" size={24} />
            <h3 className="font-medium text-sm md:text-base">E-mail</h3>
            <p className="text-xs sm:text-sm text-gray-600">suporte@ondetem.co.mz</p>
            <Badge className="mt-1 sm:mt-2 bg-orange-100 text-orange-800 text-xs whitespace-nowrap">24-48h</Badge>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4 text-center">
            <Video className="mx-auto mb-1 sm:mb-2 text-red-500 flex-shrink-0" size={24} />
            <h3 className="font-medium text-sm md:text-base">Videochamada</h3>
            <p className="text-xs sm:text-sm text-gray-600">Suporte visual</p>
            <Badge className="mt-1 sm:mt-2 bg-yellow-100 text-yellow-800 text-xs whitespace-nowrap">Agendado</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Live Chat */}
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center text-base md:text-lg">
            <MessageCircle className="mr-2 flex-shrink-0" size={16} />
            <span className="truncate">Chat de Suporte</span>
            <Badge className="ml-2 bg-green-100 text-green-800 text-xs whitespace-nowrap">Online</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {/* Chat Messages */}
            <div className="h-60 sm:h-80 overflow-y-auto border rounded-lg p-3 sm:p-4 bg-gray-50 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-start space-x-2 max-w-xs">
                    {!message.isUser && (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot size={12} className="text-white sm:w-4 sm:h-4" />
                      </div>
                    )}
                    <div
                      className={`p-2 sm:p-3 rounded-lg ${
                        message.isUser
                          ? 'bg-green-500 text-white'
                          : 'bg-white border'
                      }`}
                    >
                      <p className="text-xs sm:text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${message.isUser ? 'text-green-100' : 'text-gray-500'}`}>
                        {message.timestamp}
                      </p>
                    </div>
                    {message.isUser && (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={12} className="text-white sm:w-4 sm:h-4" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="flex space-x-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 text-sm md:text-base"
              />
              <Button onClick={handleSendMessage} className="bg-green-500 hover:bg-green-600 flex-shrink-0">
                <Send size={14} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center text-base md:text-lg">
            <FileText className="mr-2 flex-shrink-0" size={16} />
            <span className="truncate">Perguntas Frequentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            <div className="border-l-4 border-blue-500 pl-3 sm:pl-4">
              <h4 className="font-medium text-gray-900 text-sm md:text-base">Como atualizar o status dos medicamentos?</h4>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Na aba "Estoque", clique diretamente sobre o medicamento para alterar seu status entre Disponível/Indisponível.
              </p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-3 sm:pl-4">
              <h4 className="font-medium text-gray-900 text-sm md:text-base">Como criar uma promoção?</h4>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Use o toggle "Promoção" ao lado de cada medicamento na visualização expandida do estoque.
              </p>
            </div>
            
            <div className="border-l-4 border-orange-500 pl-3 sm:pl-4">
              <h4 className="font-medium text-gray-900 text-sm md:text-base">Como interpretar o mapa de demanda?</h4>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                As cores indicam o nível de demanda: vermelho (alta), amarelo (média), verde (baixa). Clique nas regiões para ver detalhes.
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-3 sm:pl-4">
              <h4 className="font-medium text-gray-900 text-sm md:text-base">Como exportar relatórios?</h4>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Use o botão "Exportar CSV" na seção de estoque ou "Download do Relatório Completo" nos resultados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tutorials */}
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-base md:text-lg">Tutoriais em Vídeo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tutorials.map((tutorial, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => openVideoModal(tutorial)}
              >
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Play size={14} className="text-gray-600 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 text-sm md:text-base truncate">{tutorial.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{tutorial.description}</p>
                    <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">Duração: {tutorial.duration}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="flex-shrink-0 text-xs sm:text-sm">
                  Assistir
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          title={selectedVideo.title}
          description={selectedVideo.description}
          duration={selectedVideo.duration}
        />
      )}
    </div>
  );
};

export default Support;
