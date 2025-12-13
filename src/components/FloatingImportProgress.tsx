import { useImport } from '@/contexts/ImportContext';
import { X, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useState } from 'react';

const FloatingImportProgress = () => {
  const { importState, maximizeImport, cancelImport } = useImport();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (!importState.isImporting || !importState.isMinimized) {
    return null;
  }

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = () => {
    cancelImport();
    setShowCancelConfirm(false);
  };

  return (
    <>
      <div 
        className="fixed bottom-4 right-4 z-50 bg-card border border-border rounded-xl shadow-lg p-3 w-72 animate-in slide-in-from-bottom-5 duration-300"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-foreground truncate flex-1">
            {importState.actionText}
          </span>
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={maximizeImport}
              title="Expandir"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={handleCancelClick}
              title="Cancelar"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>({importState.currentIndex}/{importState.totalItems})</span>
          <span className="font-medium">{importState.progress}%</span>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${importState.progress}%` }}
          />
        </div>

        {importState.skippedCount > 0 && (
          <p className="text-xs text-amber-600 mt-1.5 text-center">
            {importState.skippedCount} ignorado(s)
          </p>
        )}
      </div>

      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent className="rounded-xl max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Cancelar importação?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm space-y-2">
              <p>A importação está em andamento ({importState.currentIndex}/{importState.totalItems} medicamentos processados).</p>
              <p className="text-amber-600 font-medium">
                Se cancelar agora, os {importState.currentIndex} medicamento(s) já importados permanecerão no sistema.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="text-sm">Continuar importando</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm"
            >
              Sim, interromper
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FloatingImportProgress;
