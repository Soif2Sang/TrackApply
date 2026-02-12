import React from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagProps {
  tag: Tag;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "secondary";
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function TagComponent({ 
  tag, 
  size = "md", 
  variant = "default", 
  removable = false, 
  onRemove,
  className 
}: TagProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <Badge
      variant={variant}
      className={cn(
        "inline-flex items-center gap-1.5 font-medium",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: variant === "default" ? tag.color : undefined,
        borderColor: variant === "outline" ? tag.color : undefined,
        color: variant === "outline" ? tag.color : undefined,
      }}
    >
      <span className="truncate max-w-[120px]">{tag.name}</span>
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 h-3 w-3 rounded-full hover:bg-black/20 flex items-center justify-center transition-colors"
          aria-label={`Remove ${tag.name} tag`}
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </Badge>
  );
}

interface TagListProps {
  tags: Tag[];
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "secondary";
  removable?: boolean;
  onRemoveTag?: (tagId: string) => void;
  maxVisible?: number;
  className?: string;
}

export function TagList({ 
  tags, 
  size = "md", 
  variant = "default", 
  removable = false, 
  onRemoveTag,
  maxVisible,
  className 
}: TagListProps) {
  const visibleTags = maxVisible ? tags.slice(0, maxVisible) : tags;
  const remainingCount = maxVisible && tags.length > maxVisible ? tags.length - maxVisible : 0;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {visibleTags.map((tag) => (
        <TagComponent
          key={tag.id}
          tag={tag}
          size={size}
          variant={variant}
          removable={removable}
          onRemove={onRemoveTag ? () => onRemoveTag(tag.id) : undefined}
        />
      ))}
      {remainingCount > 0 && (
        <Badge variant="secondary" className={cn("font-medium", sizeClasses[size])}>
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}

// Color preset for creating new tags
export const TAG_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
];

const sizeClasses = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-1",
  lg: "text-base px-3 py-1.5",
};