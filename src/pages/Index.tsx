import { useEffect } from "react";
import { Header } from "@/components/Header";
import { ImageUploader } from "@/components/ImageUploader";
import { ModelGallery } from "@/components/ModelGallery";
import { BatchProcessor } from "@/components/BatchProcessor";
import { ResultsGallery } from "@/components/ResultsGallery";
import { RefinementModal } from "@/components/RefinementModal";
import { SettingsDialog } from "@/components/SettingsDialog";
import { useAppStore } from "@/store/useAppStore";

export default function Index() {
  const darkMode = useAppStore((s) => s.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="space-y-6">
            <ImageUploader />
          </aside>

          {/* Main content */}
          <div className="space-y-6">
            <ModelGallery />
            <BatchProcessor />
            <ResultsGallery />
          </div>
        </div>
      </main>
      <RefinementModal />
      <SettingsDialog />
    </div>
  );
}
