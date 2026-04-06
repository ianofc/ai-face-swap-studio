import { Download, RotateCcw, AlertCircle, Wand2, DownloadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import JSZip from "jszip";

function base64ToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/png";
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new Blob([array], { type: mime });
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function ResultsGallery() {
  const { generatedResults, setRefinementResult, clearResults } = useAppStore();

  const successResults = generatedResults.filter((r) => r.status === "success");
  if (generatedResults.length === 0) return null;

  const handleDownload = (result: typeof generatedResults[0]) => {
    if (!result.resultUrl) return;
    const blob = base64ToBlob(result.resultUrl);
    downloadBlob(blob, `ai-photo-${result.id}.png`);
  };

  const handleDownloadAll = async () => {
    if (typeof JSZip === "undefined") {
      // Fallback: download one by one
      successResults.forEach((r) => handleDownload(r));
      return;
    }
    const zip = new JSZip();
    successResults.forEach((r, i) => {
      if (!r.resultUrl) return;
      const blob = base64ToBlob(r.resultUrl);
      zip.file(`ai-photo-${i + 1}.png`, blob);
    });
    const content = await zip.generateAsync({ type: "blob" });
    downloadBlob(content, "ai-photo-studio-results.zip");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Resultados ({successResults.length})
        </h2>
        <div className="flex gap-2">
          {successResults.length > 1 && (
            <Button variant="outline" size="sm" onClick={handleDownloadAll} className="text-xs">
              <DownloadCloud className="w-3 h-3 mr-1" /> Baixar Todos
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={clearResults} className="text-xs text-destructive">
            Limpar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {generatedResults.map((result) => (
          <div
            key={result.id}
            className={cn(
              "relative group rounded-lg overflow-hidden border animate-slide-up",
              result.status === "error" ? "border-destructive" : "border-border"
            )}
          >
            {result.status === "success" && result.resultUrl && (
              <>
                <img
                  src={result.resultUrl}
                  alt="Result"
                  className="w-full aspect-[3/4] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => handleDownload(result)}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => setRefinementResult(result)}
                  >
                    <Wand2 className="w-3 h-3" />
                  </Button>
                </div>
              </>
            )}
            {result.status === "processing" && (
              <div className="w-full aspect-[3/4] flex items-center justify-center bg-surface">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {result.status === "pending" && (
              <div className="w-full aspect-[3/4] flex items-center justify-center bg-surface">
                <div className="w-6 h-6 rounded-full bg-muted animate-pulse-neon" />
              </div>
            )}
            {result.status === "error" && (
              <div className="w-full aspect-[3/4] flex flex-col items-center justify-center bg-surface gap-2 p-4">
                <AlertCircle className="w-6 h-6 text-destructive" />
                <p className="text-xs text-destructive text-center">{result.errorMessage}</p>
                <Button variant="outline" size="sm" className="text-xs">
                  <RotateCcw className="w-3 h-3 mr-1" /> Tentar de novo
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}