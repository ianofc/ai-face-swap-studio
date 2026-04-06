import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/store/useAppStore";
import { fileToBase64, processBatch, urlToBase64 } from "@/services/apiService";
import { toast } from "sonner";

export function BatchProcessor() {
  const {
    targetImage,
    targetFile,
    modelImages,
    isProcessingBatch,
    batchProgress,
    batchTotal,
    setProcessing,
    setBatchProgress,
    addResult,
    updateResult,
  } = useAppStore();

  const selectedModels = modelImages.filter((m) => m.selected);
  const canGenerate = targetImage && selectedModels.length > 0 && !isProcessingBatch;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setProcessing(true);
    setBatchProgress(0, selectedModels.length);

    try {
      // Convert target image to base64
      let targetBase64: string;
      if (targetFile) {
        targetBase64 = await fileToBase64(targetFile);
      } else if (targetImage) {
        targetBase64 = await urlToBase64(targetImage);
      } else {
        throw new Error("No target image");
      }

      // Convert all model images to base64
      const modelData = await Promise.all(
        selectedModels.map(async (m) => {
          let base64: string;
          if (m.file) {
            base64 = await fileToBase64(m.file);
          } else {
            base64 = await urlToBase64(m.url);
          }
          return { id: m.id, base64 };
        })
      );

      // Create pending results
      let completed = 0;
      selectedModels.forEach((m) => {
        addResult({
          id: `result_${m.id}_${Date.now()}`,
          originalModelId: m.id,
          resultUrl: "",
          status: "pending",
        });
      });

      await processBatch(targetBase64, modelData, 2, (modelId, status, resultUrl, errorMessage) => {
        const store = useAppStore.getState();
        const existing = store.generatedResults.find(
          (r) => r.originalModelId === modelId && (r.status === "pending" || r.status === "processing")
        );
        if (existing) {
          updateResult(existing.id, { status, resultUrl: resultUrl || "", errorMessage });
        }
        if (status === "success" || status === "error") {
          completed++;
          setBatchProgress(completed, selectedModels.length);
        }
        if (status === "error") {
          toast.error(`Erro no modelo: ${errorMessage}`);
        }
      });

      toast.success("Lote concluído!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao processar lote");
    } finally {
      setProcessing(false);
    }
  };

  if (!targetImage || selectedModels.length === 0) return null;

  return (
    <div className="glass-panel rounded-xl p-4 space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {selectedModels.length} foto{selectedModels.length > 1 ? "s" : ""} pronta{selectedModels.length > 1 ? "s" : ""} para gerar
        </p>
        <Button onClick={handleGenerate} disabled={!canGenerate} className="neon-glow">
          {isProcessingBatch ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Fotos ({selectedModels.length})
            </>
          )}
        </Button>
      </div>
      {isProcessingBatch && batchTotal > 0 && (
        <div className="space-y-1">
          <Progress value={(batchProgress / batchTotal) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {batchProgress}/{batchTotal}
          </p>
        </div>
      )}
    </div>
  );
}