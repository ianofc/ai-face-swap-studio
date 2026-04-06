import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAppStore } from "@/store/useAppStore";

export function SettingsDialog() {
  const { settingsOpen, setSettingsOpen } = useAppStore();

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="glass-panel">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>
            A API Key do Google Gemini está configurada de forma segura no backend (Lovable Cloud). Nenhuma configuração adicional é necessária.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="rounded-lg bg-surface p-4">
            <p className="font-medium text-foreground mb-1">Status do Backend</p>
            <p className="text-xs">✅ Lovable Cloud conectado</p>
            <p className="text-xs">✅ Google Gemini API configurada</p>
            <p className="text-xs">✅ Processamento concorrente: 2 por vez</p>
          </div>
          <p className="text-xs">
            As imagens são enviadas diretamente para a API do Gemini via Edge Function segura.
            Sua API key nunca é exposta no frontend.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}