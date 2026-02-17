import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { TagComponent, type Tag, TAG_COLORS } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

interface TagSelectorProps {
  availableTags: Tag[];
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  onCreateTag?: (name: string, color: string) => Promise<Tag>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TagSelector({
  availableTags,
  selectedTags,
  onTagsChange,
  onCreateTag,
  placeholder = "Select tags...",
  className,
  disabled = false,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const handleToggleTag = (tag: Tag) => {
    const isSelected = selectedTags.some(t => t.id === tag.id);
    if (isSelected) {
      onTagsChange(selectedTags.filter(t => t.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleCreateTag = async () => {
    if (!onCreateTag || !newTagName.trim()) return;
    
    setIsCreating(true);
    try {
      const newTag = await onCreateTag(newTagName.trim(), newTagColor);
      onTagsChange([...selectedTags, newTag]);
      setNewTagName("");
      setNewTagColor(TAG_COLORS[0]);
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create tag:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const unselectedTags = availableTags.filter(
    tag => !selectedTags.some(selected => selected.id === tag.id)
  );

  return (
    <div className={className}>
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedTags.map((tag) => (
            <TagComponent
              key={tag.id}
              tag={tag}
              size="sm"
              removable
              onRemove={() => handleToggleTag(tag)}
            />
          ))}
        </div>
      )}

      {/* Tag Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-left font-normal"
            disabled={disabled}
          >
            <span className="truncate">
              {selectedTags.length > 0 
                ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected`
                : placeholder
              }
            </span>
            <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-3" align="start">
          <div className="space-y-3">
            {/* Available Tags */}
            {unselectedTags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Available Tags</Label>
                <div className="flex flex-wrap gap-1.5">
                  {unselectedTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleToggleTag(tag)}
                      className="transition-opacity hover:opacity-80"
                    >
                      <TagComponent tag={tag} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create New Tag */}
            {onCreateTag && (
              <div className="space-y-2 border-t pt-3">
                {!showCreateForm ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateForm(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create new tag
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="tag-name">Tag Name</Label>
                      <Input
                        id="tag-name"
                        placeholder="Enter tag name"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateTag();
                          } else if (e.key === "Escape") {
                            setShowCreateForm(false);
                            setNewTagName("");
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <div className="flex flex-wrap gap-2">
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewTagColor(color)}
                            className={cn(
                              "w-6 h-6 rounded-full border-2 transition-all",
                              newTagColor === color 
                                ? "border-primary scale-110" 
                                : "border-muted hover:scale-105"
                            )}
                            style={{ backgroundColor: color }}
                            aria-label={`Select color ${color}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleCreateTag}
                        disabled={!newTagName.trim() || isCreating}
                        className="flex-1"
                      >
                        {isCreating ? "Creating..." : "Create"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewTagName("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}