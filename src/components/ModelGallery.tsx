import { useCallback, useRef } from "react";
import { ImagePlus, CheckSquare, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore, ModelImage } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

export function ModelGallery() {
  const {
    modelImages,
    addModelImages,
    removeModelImage,
    toggleModelSelection,
    selectAllModels,
    deselectAllModels,
  } = useAppStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const selectedCount = modelImages.filter((m) => m.selected).length;

  const handleFiles = useCallback(
    (files: FileList) => {
      const newImages: ModelImage[] = [];
      Array.from(files).forEach((file) => {
        if (!file.type.startsWith("image/")) return;
        const id = `model_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const url = URL.createObjectURL(file);
        newImages.push({ id, url, selected: false, file });
      });
      if (newImages.length) addModelImages(newImages);
    },
    [addModelImages]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Fotos Modelo ({modelImages.length})
        </h2>
        <div className="flex gap-2">
          {modelImages.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={selectedCount === modelImages.length ? deselectAllModels : selectAllModels}
                className="text-xs"
              >
                {selectedCount === modelImages.length ? (
                  <><Square className="w-3 h-3 mr-1" /> Desmarcar</>
                ) : (
                  <><CheckSquare className="w-3 h-3 mr-1" /> Selecionar Tudo</>
                )}
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} className="text-xs">
            <ImagePlus className="w-3 h-3 mr-1" /> Adicionar
          </Button>
        </div>
      </div>

      {modelImages.length === 0 ? (
        <div
          className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-all"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Adicione fotos modelo (templates de pose/roupa)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Selecione múltiplas imagens de uma vez
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {modelImages.map((model) => (
            <div
              key={model.id}
              className={cn(
                "relative group rounded-lg overflow-hidden cursor-pointer transition-all border-2 animate-slide-up",
                model.selected
                  ? "border-primary neon-glow"
                  : "border-transparent hover:border-primary/30"
              )}
              onClick={() => toggleModelSelection(model.id)}
            >
              <img
                src={model.url}
                alt="Model"
                className="w-full aspect-[3/4] object-cover"
              />
              <div
                className={cn(
                  "absolute inset-0 transition-all",
                  model.selected ? "bg-primary/20" : "bg-transparent"
                )}
              />
              <div
                className={cn(
                  "absolute top-2 left-2 w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-all",
                  model.selected
                    ? "bg-primary border-primary"
                    : "border-foreground/30 bg-background/50"
                )}
              >
                {model.selected && (
                  <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12">
                    <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                )}
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeModelImage(model.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {selectedCount > 0 && (
        <p className="text-xs text-primary font-medium">
          {selectedCount} modelo{selectedCount > 1 ? "s" : ""} selecionado{selectedCount > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}