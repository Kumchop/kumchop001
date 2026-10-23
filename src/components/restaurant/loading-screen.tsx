import { useEffect, useState, useCallback } from "react";
import { Sparkles, Utensils, Clock, Flame, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const DEFAULT_MESSAGES = [
  "Firing up the kitchen in Akungba Akoko...",
  "Simmering authentic soups & fresh spices...",
  "Grilling succulent chicken, beef & peppered fish...",
  "Arranging the finest plates & fresh pastries...",
  "Setting your table — every taste feels good...",
];

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  showProgress?: boolean;
  showTagline?: boolean;
  interactive?: boolean;
}

export function LoadingScreen({
  message,
  fullScreen = true,
  showProgress = true,
  showTagline = true,
  interactive = false,
}: LoadingScreenProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % DEFAULT_MESSAGES.length);
    }, 2400);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 94) return prev;
        const jump = Math.floor(Math.random() * 12) + 4;
        return Math.min(prev + jump, 96);
      });
    }, 400);

    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const currentMessage = message || DEFAULT_MESSAGES[msgIndex];

  return (
    <div
      className={`loading-page-container ${
        fullScreen ? "loading-fullscreen" : "loading-contained"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="loading-ambient-orb" aria-hidden="true" />
      <div className="loading-card">
        {/* Brand Logo & Glowing Halo */}
        <div className="loading-logo-wrapper">
          <div className="loading-pulse-ring" />
          <div className="loading-pulse-ring delay-500" />
          <img
            src="/assets/aistudio/06Oct24_Anis_Free_Upload_b9819ce2.png"
            width={1830}
            height={856}
            alt="Kumchop Restaurant"
            className="loading-logo-image"
          />
        </div>

        {/* Brand Tagline & Header */}
        <div className="loading-text-group">
          <h2 className="loading-brand-title">Kumchop</h2>
          {showTagline && (
            <p className="loading-brand-tagline">
              <span>Every Taste Feels Good...</span>
            </p>
          )}
        </div>

        {/* Dynamic culinary status pill */}
        <div className="loading-status-pill">
          <span className="loading-status-icon">
            {msgIndex % 3 === 0 ? (
              <Utensils size={14} className="text-primary animate-spin-slow" />
            ) : msgIndex % 3 === 1 ? (
              <Flame size={14} className="text-primary animate-pulse" />
            ) : (
              <Sparkles size={14} className="text-primary" />
            )}
          </span>
          <span className="loading-status-text" key={currentMessage}>
            {currentMessage}
          </span>
        </div>

        {/* Visual Progress Bar */}
        {showProgress && (
          <div className="loading-progress-wrapper">
            <div className="loading-progress-track">
              <div
                className="loading-progress-fill"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <div className="loading-progress-meta">
              <span className="flex items-center gap-1">
                <Clock size={11} className="text-muted-foreground" />
                <span>Akungba Akoko, Ondo State</span>
              </span>
              <span className="loading-percent-number">{progress}%</span>
            </div>
          </div>
        )}

        {/* Quick actions for interactive / preview mode */}
        {interactive && (
          <div className="loading-interactive-actions">
            <p className="text-xs text-muted-foreground mb-3">
              This preview demonstrates Kumchop's page transition and loading state.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button asChild size="sm">
                <Link to="/menu">Explore Menu</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/order">Order Online</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/">Back Home</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Startup loading screen shown when the website is about to start
 */
export function StartupLoadingScreen({
  forceShow = false,
  onFinished,
}: {
  forceShow?: boolean;
  onFinished?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(15);
  const [statusMessage, setStatusMessage] = useState("Kumchop is warming up...");
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const dismiss = useCallback(() => {
    setIsFadingOut(true);
    const timer = setTimeout(() => {
      setIsDismissed(true);
      onFinished?.();
    }, 450);
    return () => clearTimeout(timer);
  }, [onFinished]);

  useEffect(() => {
    setMounted(true);

    // Step-by-step startup simulation
    const timer1 = setTimeout(() => {
      setProgress(42);
      setStatusMessage("Firing up the kitchen in Akungba Akoko...");
    }, 350);

    const timer2 = setTimeout(() => {
      setProgress(76);
      setStatusMessage("Simmering authentic soups & fresh spices...");
    }, 850);

    const timer3 = setTimeout(() => {
      setProgress(96);
      setStatusMessage("Setting your table — every taste feels good...");
    }, 1300);

    const timer4 = setTimeout(() => {
      setProgress(100);
      setStatusMessage("Welcome to Kumchop!");
    }, 1600);

    const timer5 = setTimeout(() => {
      setIsFadingOut(true);
    }, 1900);

    const timer6 = setTimeout(() => {
      setIsDismissed(true);
      onFinished?.();
    }, 2350);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") {
        dismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onFinished, dismiss]);

  if (!mounted || isDismissed) {
    return null;
  }

  return (
    <div
      className={`loading-startup-screen ${isFadingOut ? "loading-fade-out" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Kumchop Restaurant is starting"
    >
      <div className="loading-ambient-orb" aria-hidden="true" />

      <div className="loading-card">
        {/* Startup Pill */}
        <div className="loading-startup-badge">
          <Sparkles size={11} className="animate-pulse" />
          <span>Starting Restaurant</span>
        </div>

        {/* Brand Logo & Glowing Halo */}
        <div className="loading-logo-wrapper">
          <div className="loading-pulse-ring" />
          <div className="loading-pulse-ring delay-500" />
          <img
            src="/assets/aistudio/06Oct24_Anis_Free_Upload_b9819ce2.png"
            width={1830}
            height={856}
            alt="Kumchop Restaurant"
            className="loading-logo-image"
          />
        </div>

        {/* Brand Tagline & Header */}
        <div className="loading-text-group">
          <h1 className="loading-brand-title">Kumchop</h1>
          <p className="loading-brand-tagline">
            <span>Every Taste Feels Good...</span>
          </p>
        </div>

        {/* Dynamic culinary status pill */}
        <div className="loading-status-pill">
          <span className="loading-status-icon">
            {progress < 50 ? (
              <Flame size={14} className="text-primary animate-pulse" />
            ) : progress < 90 ? (
              <Utensils size={14} className="text-primary animate-spin-slow" />
            ) : (
              <Sparkles size={14} className="text-primary" />
            )}
          </span>
          <span className="loading-status-text" key={statusMessage}>
            {statusMessage}
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="loading-progress-wrapper">
          <div className="loading-progress-track">
            <div
              className="loading-progress-fill"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="loading-progress-meta">
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-muted-foreground" />
              <span>Akungba Akoko, Ondo State</span>
            </span>
            <span className="loading-percent-number">{progress}%</span>
          </div>
        </div>

        {/* Instant Skip / Enter Button */}
        <button
          type="button"
          onClick={dismiss}
          className="loading-skip-btn"
          aria-label="Enter restaurant immediately"
        >
          <span>Enter restaurant</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

/**
 * Slim top progress bar shown during router page navigation
 */
export function TopRouteLoader({ isNavigating }: { isNavigating: boolean }) {
  if (!isNavigating) return null;
  return (
    <div className="top-navigation-loader" role="progressbar" aria-label="Loading page">
      <div className="top-navigation-loader-bar" />
    </div>
  );
}
