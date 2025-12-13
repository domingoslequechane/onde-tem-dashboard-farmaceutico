import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeletePharmacyDialogProps {
  pharmacy: {
    id: string;
    nome: string;
  } | null;
  adminEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeletePharmacyDialog({
  pharmacy,
  adminEmail,
  onClose,
  onSuccess,
}: DeletePharmacyDialogProps) {
  const [step, setStep] = useState<"initial" | "code" | "final" | "processing">("initial");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    if (!pharmacy) return;

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("send-deletion-code", {
        body: {
          adminEmail,
          pharmacyName: pharmacy.nome,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;

      toast.success("Código enviado para o seu email");
      setStep("code");
    } catch (error: any) {
      console.error("Error sending code:", error);
      toast.error("Erro ao enviar código de verificação");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = () => {
    if (verificationCode.length !== 6) {
      toast.error("Digite o código de 6 dígitos");
      return;
    }
    setStep("final");
  };

  const handleConfirmDeletion = async () => {
    if (!pharmacy) return;

    setStep("processing");
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("delete-pharmacy", {
        body: {
          pharmacyId: pharmacy.id,
          verificationCode,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;

      toast.success("Farmácia eliminada com sucesso");
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error("Error deleting pharmacy:", error);
      toast.error(error.message || "Erro ao eliminar farmácia");
      setStep("final"); // Volta para o modal de confirmação em caso de erro
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (step === "processing") return; // Não permite fechar enquanto processa
    setStep("initial");
    setVerificationCode("");
    setIsLoading(false);
    onClose();
  };

  if (!pharmacy) return null;

  return (
    <>
      {/* Initial Dialog - Send Code */}
      <Dialog open={step === "initial"} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Eliminar Farmácia
            </DialogTitle>
            <DialogDescription className="pt-4">
              Você está prestes a eliminar a farmácia:{" "}
              <strong className="text-foreground">{pharmacy.nome}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Para confirmar esta ação, será enviado um código de verificação de 6
              dígitos para o email:
            </p>
            <p className="mt-2 font-medium text-foreground">{adminEmail}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleSendCode}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Código
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Code Verification Dialog */}
      <Dialog open={step === "code"} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Digite o Código de Verificação</DialogTitle>
            <DialogDescription>
              Insira o código de 6 dígitos enviado para {adminEmail}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="code">Código de Verificação</Label>
            <Input
              id="code"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setVerificationCode(value);
              }}
              placeholder="000000"
              maxLength={6}
              className="mt-2 text-center text-2xl tracking-widest font-bold"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              O código expira em 10 minutos
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleVerifyCode} disabled={verificationCode.length !== 6}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Confirmation */}
      <AlertDialog open={step === "final"} onOpenChange={handleClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              Confirmação Final - Ação Irreversível
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-4">
              <strong className="text-foreground block mb-2">ATENÇÃO: Esta ação é IRREVERSÍVEL!</strong>
              <p className="mb-4">
                Ao confirmar, a farmácia <strong className="text-foreground">{pharmacy.nome}</strong> e
                todos os dados associados serão permanentemente eliminados do sistema,
                incluindo:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Conta de usuário da farmácia</li>
                <li>Todos os medicamentos em estoque</li>
                <li>Histórico e dados relacionados</li>
              </ul>
              <p className="mt-4 font-semibold text-destructive">
                Esta operação NÃO pode ser desfeita!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleClose} disabled={isLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeletion}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              Confirmar Eliminação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Processing Dialog */}
      <Dialog open={step === "processing"} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-destructive" />
              Eliminando Farmácia
            </DialogTitle>
          </DialogHeader>
          <div className="py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-4 border-muted"></div>
                <div className="absolute top-0 h-20 w-20 rounded-full border-4 border-destructive border-t-transparent animate-spin"></div>
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-foreground">
                  Processando eliminação...
                </p>
                <p className="text-sm text-muted-foreground">
                  Por favor, aguarde enquanto eliminamos todos os dados da farmácia.
                </p>
                <p className="text-xs text-muted-foreground">
                  Esta operação pode levar alguns segundos.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
