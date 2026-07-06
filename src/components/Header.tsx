import { Camera, Moon, Sun, Settings, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";

export function Header() {
  const { darkMode, toggleDarkMode, setSettingsOpen, setHistoryOpen, history } = useAppStore();

  return (
    <header className="glass-panel sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center neon-glow">
          <Camera className="w-5 h-5 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">
          AI Photo <span className="text-primary neon-text">Studio</span>
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)} className="gap-2">
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">Histórico</span>
          {history.length > 0 && (
            <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-mono">
              {history.length}
            </span>
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
