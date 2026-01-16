import { Badge } from "@/components/ui/badge";

type Urgency = "critical" | "normal";

interface UrgencyBadgeProps {
  urgency?: string | null;
  size?: "sm" | "md" | "lg";
}

const urgencyConfig: Record<Urgency, { emoji: string; label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  critical: {
    emoji: "🔴",
    label: "Critical",
    variant: "destructive",
    className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border-red-300 dark:border-red-800",
  },
  normal: {
    emoji: "🔵",
    label: "Normal",
    variant: "secondary",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border-blue-300 dark:border-blue-800",
  },
};

export function UrgencyBadge({ urgency, size = "md" }: UrgencyBadgeProps) {
  const normalizedUrgency: Urgency = urgency === "critical" ? "critical" : "normal";
  const config = urgencyConfig[normalizedUrgency];

  const sizeClass = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-2",
  }[size];

  const emphasisClass =
    normalizedUrgency === "critical"
      ? "ring-2 ring-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.35)]"
      : "";

  return (
    <Badge
      variant={config.variant}
      className={`${sizeClass} ${config.className} font-medium border ${emphasisClass}`}
    >
      <span className="mr-1">{config.emoji}</span>
      {config.label}
    </Badge>
  );
}
