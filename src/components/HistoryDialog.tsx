import { useMemo } from "react";
import { Download, Trash2, History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppStore, HistoryEntry } from "@/store/useAppStore";

function base64ToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/png";
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new Blob([array], { type: mime });
}

function downloadEntry(entry: HistoryEntry) {
  const blob = base64ToBlob(entry.resultUrl);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ai-photo-${entry.id}.png`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDateKey(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(d, today)) return "Hoje";
  if (isSameDay(d, yesterday)) return "Ontem";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function HistoryDialog() {
  const { historyOpen, setHistoryOpen, history, clearHistory } = useAppStore();

  const grouped = useMemo(() => {
    const groups: Record<string, HistoryEntry[]> = {};
    history.forEach((h) => {
      const key = formatDateKey(h.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(h);
    });
    return Object.entries(groups);
  }, [history]);

  return (
    <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
      <DialogContent className="glass-panel max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5" /> Histórico de Gerações
              </DialogTitle>
              <DialogDescription>
                {history.length} imagem{history.length !== 1 ? "ns" : ""} gerada{history.length !== 1 ? "s" : ""} — organizadas por data
              </DialogDescription>
            </div>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-destructive"
              >
                <Trash2 className="w-3 h-3 mr-1" /> Limpar histórico
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="overflow-y-auto pr-2 -mr-2 space-y-6">
          {history.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Nenhuma imagem gerada ainda. As suas criações aparecerão aqui.
            </div>
          ) : (
            grouped.map(([date, entries]) => (
              <div key={date} className="space-y-3 animate-slide-up">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {date}
                  </h3>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">
                    {entries.length} {entries.length === 1 ? "foto" : "fotos"}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="relative group rounded-lg overflow-hidden border border-border"
                    >
                      <img
                        src={entry.resultUrl}
                        alt="History"
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-7 w-7"
                          onClick={() => downloadEntry(entry)}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="absolute bottom-1 left-1 right-1 text-[10px] text-white/80 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        {new Date(entry.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
