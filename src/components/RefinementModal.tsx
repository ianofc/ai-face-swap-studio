import { useState } from "react";
import { Wand2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { refineImage } from "@/services/apiService";
import { toast } from "sonner";

export function RefinementModal() {
  const { refinementResult, setRefinementResult, updateResult } = useAppStore();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  if (!refinementResult) return null;

  const handleRefine = async () => {
    if (!prompt.trim() || !refinementResult.resultUrl) return;
    setLoading(true);
    try {
      // Extract base64 from data URL
      const base64 = refinementResult.resultUrl.split(",")[1];
      const result = await refineImage(base64, prompt);
      const newUrl = `data:${result.mimeType};base64,${result.imageBase64}`;
      updateResult(refinementResult.id, { resultUrl: newUrl });
      setRefinementResult({ ...refinementResult, resultUrl: newUrl });
      setPrompt("");
      toast.success("Imagem refinada com sucesso!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao refinar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={!!refinementResult}
      onOpenChange={(open) => {
        if (!open) setRefinementResult(null);
      }}
    >
      <DialogContent className="max-w-2xl glass-panel">
        <DialogHeader>
          <DialogTitle>Refinar Imagem</DialogTitle>
          <DialogDescription>
            Descreva as alterações que deseja fazer na imagem gerada.
          </DialogDescription>
        </DialogHeader>
        {refinementResult.resultUrl && (
          <img
            src={refinementResult.resultUrl}
            alt="Result"
            className="w-full max-h-[400px] object-contain rounded-lg"
          />
        )}
        <div className="flex gap-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Corrigir a mão, mudar a cor da camisa para azul..."
            onKeyDown={(e) => e.key === "Enter" && handleRefine()}
            disabled={loading}
          />
          <Button onClick={handleRefine} disabled={loading || !prompt.trim()}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}