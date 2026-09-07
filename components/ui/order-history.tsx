import * as React from "react";
import { motion } from "framer-motion";
import { Check, Circle, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils"; // Your utility for merging class names

// Define the type for each timeline item
export interface TimelineItem {
  id: string | number;
  title: string;
  date: string;
  status: "completed" | "in-progress" | "pending";
  icon?: React.ReactNode;
  actionNode?: React.ReactNode;
}

// Define the props for the main component
interface TrackingTimelineProps {
  items: TimelineItem[];
  className?: string;
}

// Status-specific components for icons to keep the main component clean
const StatusIcon = ({ status, customIcon }: { status: TimelineItem["status"]; customIcon?: React.ReactNode }) => {
  if (customIcon) {
    return <>{customIcon}</>;
  }

  switch (status) {
    case "completed":
      return <Check className="h-4 w-4 text-current" />;
    case "in-progress":
      return <CircleDot className="h-4 w-4 text-primary" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground/50" />;
  }
};

const TrackingTimeline = ({ items, className }: TrackingTimelineProps) => {
  // Animation variants for the container and list items
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Animate children one by one
      },
    },
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
    },
  };

  return (
    <motion.ol
      className={cn("relative border-l-2 border-border/50 ml-4 mt-4", className)}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {items.map((item, index) => (
        <motion.li
          key={item.id}
          className="mb-8 ml-8 last:mb-0"
          variants={itemVariants}
          aria-current={item.status === "in-progress" ? "step" : undefined}
        >
          {/* The icon circle */}
          <span
            className={cn(
              "absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-background",
              {
                "bg-primary text-primary-foreground": item.status === "completed",
                "bg-primary/20 text-primary": item.status === "in-progress",
                "bg-muted text-muted-foreground": item.status === "pending",
              }
            )}
          >
            {/* Pulsing animation for the 'in-progress' state */}
            {item.status === "in-progress" && (
              <span className="absolute h-full w-full animate-ping rounded-full bg-primary/40 opacity-75" />
            )}
            <StatusIcon status={item.status} customIcon={item.icon} />
          </span>

          {/* Content: Title and Date */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col">
              <h3
                className={cn("font-bold", {
                  "text-foreground": item.status !== "pending",
                  "text-muted-foreground": item.status === "pending",
                })}
              >
                {item.title}
              </h3>
              <time
                className={cn("text-sm text-muted-foreground mt-0.5", {
                  "font-semibold text-primary/80": item.status === "in-progress",
                })}
              >
                {item.date}
              </time>
            </div>
            
            {/* Action node (e.g. Mark as Shipped button) */}
            {item.actionNode && (
              <div className="shrink-0">
                {item.actionNode}
              </div>
            )}
          </div>
        </motion.li>
      ))}
    </motion.ol>
  );
};

export default TrackingTimeline;
