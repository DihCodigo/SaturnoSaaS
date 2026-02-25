import { useState, useEffect, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingStep {
  title: string;
  description: string;
  targetSelector?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
}

interface OnboardingGuideProps {
  storageKey: string;
  steps: OnboardingStep[];
  onComplete?: () => void;
}

export function OnboardingGuide({ storageKey, steps, onComplete }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const [arrowDirection, setArrowDirection] = useState<"top" | "bottom" | "left" | "right">("top");

  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const positionTooltip = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return;

    if (!step.targetSelector || step.position === "center") {
      setTooltipStyle({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10001,
      });
      setArrowStyle({ display: "none" });
      return;
    }

    const el = document.querySelector(step.targetSelector);
    if (!el) {
      setTooltipStyle({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10001,
      });
      setArrowStyle({ display: "none" });
      return;
    }

    const rect = el.getBoundingClientRect();
    const pos = step.position || "bottom";
    const tooltipWidth = 320;
    const gap = 12;

    let top = 0;
    let left = 0;

    switch (pos) {
      case "bottom":
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        setArrowDirection("top");
        setArrowStyle({
          position: "absolute",
          top: -6,
          left: "50%",
          transform: "translateX(-50%) rotate(45deg)",
          width: 12,
          height: 12,
        });
        break;
      case "top":
        top = rect.top - gap - 160;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        setArrowDirection("bottom");
        setArrowStyle({
          position: "absolute",
          bottom: -6,
          left: "50%",
          transform: "translateX(-50%) rotate(45deg)",
          width: 12,
          height: 12,
        });
        break;
      case "right":
        top = rect.top + rect.height / 2 - 60;
        left = rect.right + gap;
        setArrowDirection("left");
        setArrowStyle({
          position: "absolute",
          left: -6,
          top: "50%",
          transform: "translateY(-50%) rotate(45deg)",
          width: 12,
          height: 12,
        });
        break;
      case "left":
        top = rect.top + rect.height / 2 - 60;
        left = rect.left - tooltipWidth - gap;
        setArrowDirection("right");
        setArrowStyle({
          position: "absolute",
          right: -6,
          top: "50%",
          transform: "translateY(-50%) rotate(45deg)",
          width: 12,
          height: 12,
        });
        break;
    }

    left = Math.max(12, Math.min(left, window.innerWidth - tooltipWidth - 12));
    top = Math.max(12, Math.min(top, window.innerHeight - 200));

    setTooltipStyle({
      position: "fixed",
      top,
      left,
      width: tooltipWidth,
      zIndex: 10001,
    });

    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [currentStep, steps]);

  useEffect(() => {
    if (visible) {
      positionTooltip();
      window.addEventListener("resize", positionTooltip);
      window.addEventListener("scroll", positionTooltip, true);
      return () => {
        window.removeEventListener("resize", positionTooltip);
        window.removeEventListener("scroll", positionTooltip, true);
      };
    }
  }, [visible, positionTooltip]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(storageKey, "true");
    onComplete?.();
  };

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      dismiss();
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!visible || !steps.length) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[10000] transition-opacity duration-300"
        onClick={dismiss}
        data-testid="onboarding-overlay"
      />

      {step.targetSelector && step.position !== "center" && (() => {
        const el = document.querySelector(step.targetSelector);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return (
          <div
            className="fixed z-[10000] rounded-lg ring-4 ring-primary/50 ring-offset-2 ring-offset-background pointer-events-none transition-all duration-300"
            style={{
              top: rect.top - 4,
              left: rect.left - 4,
              width: rect.width + 8,
              height: rect.height + 8,
            }}
          />
        );
      })()}

      <div
        style={tooltipStyle}
        className="bg-popover text-popover-foreground rounded-xl shadow-2xl border border-border/50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300"
        data-testid="onboarding-tooltip"
      >
        <div
          style={arrowStyle}
          className="bg-popover border-l border-t border-border/50"
        />

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">{step.title}</h3>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0 -mt-1 -mr-1"
              onClick={dismiss}
              data-testid="button-close-onboarding"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === currentStep ? "bg-primary" : "bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7 px-2"
                onClick={dismiss}
                data-testid="button-skip-onboarding"
              >
                Pular
              </Button>
              {!isFirst && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2 gap-1"
                  onClick={prev}
                  data-testid="button-prev-step"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Anterior
                </Button>
              )}
              <Button
                size="sm"
                className="text-xs h-7 px-3 gap-1"
                onClick={next}
                data-testid="button-next-step"
              >
                {isLast ? "Entendi!" : "Proximo"}
                {!isLast && <ChevronRight className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
