
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, HelpCircle, PlayCircle, FileText, Phone, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Support = () => {
  const [chatMessage, setChatMessage] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    
    toast({
      title: "Mensagem enviada!",
      description: "Nossa equipe responderá em até 5 minutos.",
    });
    setChatMessage('');
  };

  const handleCreateTicket = () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    
    toast({
      title: "Ticket criado!",
      description: `Ticket #${Math.floor(Math.random() * 9999)} criado. Resposta em até 2 horas.`,
    });
    setTicketSubject('');
    setTicketMessage('');
  };

  const faqItems = [
    {
      question: "Como atualizo meu estoque?",
      answer: "Vá para a aba 'Estoque' e clique em 'Adicionar' ou edite medicamentos existentes."
    },
    {
      question: "Por que não recebo alertas de emergência?",
      answer: "Verifique se as notificações estão ativadas no seu navegador e perfil."
    },
    {
      question: "Como funciona o sistema de avaliações?",
      answer: "Clientes avaliam automaticamente após encontrarem medicamentos através da nossa indicação."
    },
    {
      question: "Posso cancelar minha conta Premium?",
      answer: "Sim, entre em contacto conosco ou acesse Configurações > Assinatura."
    }
  ];

  const tutorials = [
    {
      title: "Configuração Inicial da Farmácia",
      duration: "3:45",
      description: "Como configurar seu perfil e começar a usar a plataforma"
    },
    {
      title: "Gestão de Estoque Avançada",
      duration: "7:12",
      description: "Dicas para manter seu estoque sempre atualizado"
    },
    {
      title: "Interpretando Relatórios de Demanda",
      duration: "5:28",
      description: "Como usar os dados para aumentar suas vendas"
    },
    {
      title: "Sistema de Alertas de Emergência",
      duration: "4:03",
      description: "Como responder rapidamente aos alertas SOS"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Chat de Ajuda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageCircle className="mr-2" size={20} />
              Chat de Ajuda
            </div>
            <Badge className="bg-green-100 text-green-800">
              Online
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 h-48 overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  OT
                </div>
                <div className="bg-white rounded-lg p-2 max-w-xs">
                  <p className="text-sm">Olá! Como posso ajudá-lo hoje?</p>
                  <span className="text-xs text-gray-500">14:32</span>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  OT
                </div>
                <div className="bg-white rounded-lg p-2 max-w-xs">
                  <p className="text-sm">Vejo que você é uma farmácia Premium. Tem alguma dúvida sobre os recursos avançados?</p>
                  <span className="text-xs text-gray-500">14:33</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={handleSendMessage}>
              <Send size={16} />
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            💬 Tempo médio de resposta: 3 minutos | Disponível 24/7
          </div>
        </CardContent>
      </Card>

      {/* Create Ticket */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2" size={20} />
            Criar Ticket de Suporte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto</Label>
            <Input
              id="subject"
              placeholder="Ex: Problema com atualização de estoque"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Descrição Detalhada</Label>
            <Textarea
              id="message"
              placeholder="Descreva o problema com o máximo de detalhes possível..."
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              rows={4}
            />
          </div>
          
          <Button onClick={handleCreateTicket} className="w-full">
            Criar Ticket
          </Button>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HelpCircle className="mr-2" size={20} />
            Perguntas Frequentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqItems.map((item, index) => (
            <div key={index} className="border-b pb-4 last:border-b-0">
              <h4 className="font-medium text-gray-900 mb-2">{item.question}</h4>
              <p className="text-sm text-gray-600">{item.answer}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Video Tutorials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PlayCircle className="mr-2" size={20} />
            Tutoriais em Vídeo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tutorials.map((tutorial, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <PlayCircle className="text-white" size={24} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{tutorial.title}</h4>
                  <p className="text-sm text-gray-600">{tutorial.description}</p>
                </div>
              </div>
              <Badge variant="outline">
                {tutorial.duration}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center text-red-700">
            <Phone className="mr-2" size={20} />
            Contacto de Emergência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-red-700 mb-2">Problemas técnicos urgentes?</p>
            <p className="text-2xl font-bold text-red-800 mb-2">+258 84 999 0000</p>
            <p className="text-sm text-red-600">Disponível 24h para farmácias Premium</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Support;
