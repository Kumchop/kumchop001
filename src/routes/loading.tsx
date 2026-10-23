import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LoadingScreen, StartupLoadingScreen } from "@/components/restaurant/loading-screen";
import { pageHead } from "@/lib/menu";
import { Button } from "@/components/ui/button";
import { Play, Sparkles } from "lucide-react";

export const Route = createFileRoute("/loading")({
  head: () =>
    pageHead(
      "Loading — Kumchop",
      "Loading Kumchop Restaurant in Akungba Akoko. Every Taste Feels Good...",
    ),
  component: LoadingPage,
});

function LoadingPage() {
  const [playStartup, setPlayStartup] = useState(false);

  return (
    <div className="site-container py-12">
      {playStartup && (
        <StartupLoadingScreen forceShow={true} onFinished={() => setPlayStartup(false)} />
      )}

      <div className="mx-auto max-w-xl text-center mb-8">
        <span className="eyebrow justify-center">Brand Experience</span>
        <h1 className="text-3xl font-display mt-2 mb-3">Kumchop Loading Screens</h1>
        <p className="text-sm text-muted-foreground mb-6">
          This preview showcases the brand preloader and initial startup screen that activates when
          the website is starting up.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => setPlayStartup(true)} className="gap-2">
            <Play size={14} />
            <span>Replay Full Startup Screen</span>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
            <Sparkles size={14} />
            <span>Test Fresh Site Boot (Reload)</span>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <LoadingScreen fullScreen={false} interactive={true} />
      </div>
    </div>
  );
}
