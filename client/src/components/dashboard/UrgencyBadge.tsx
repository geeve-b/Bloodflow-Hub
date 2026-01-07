import { Badge } from "@/components/ui/badge";

type Urgency = "critical" | "high" | "medium" | "low";

interface UrgencyBadgeProps {
  urgency: Urgency;
  size?: "sm" | "md" | "lg";
}

const urgencyConfig: Record<Urgency, { emoji: string; label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  critical: {
    emoji: "🔴",
    label: "Critical",
    variant: "destructive",
    className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border-red-300 dark:border-red-800",
  },
  high: {
    emoji: "🟠",
    label: "High",
    variant: "destructive",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200 border-orange-300 dark:border-orange-800",
  },
  medium: {
    emoji: "🟡",
    label: "Medium",
    variant: "secondary",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200 border-yellow-300 dark:border-yellow-800",
  },
  low: {
    emoji: "🟢",
    label: "Low",
    variant: "secondary",
    className: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200 border-green-300 dark:border-green-800",
  },
};

export function UrgencyBadge({ urgency, size = "md" }: UrgencyBadgeProps) {
  const config = urgencyConfig[urgency];

  const sizeClass = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-2",
  }[size];

  return (
    <Badge variant="outline" className={`${sizeClass} ${config.className} font-medium border`}>
      <span className="mr-1">{config.emoji}</span>
      {config.label}
    </Badge>
  );
}
