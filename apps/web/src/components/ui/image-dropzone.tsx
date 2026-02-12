import React, { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ImageDropzoneProps {
  onImageSelect: (file: File) => void;
  currentImage?: string; // base64 data URL or preview URL
  accept?: string;
  disabled?: boolean;
}

export function ImageDropzone({
  onImageSelect,
  currentImage,
  accept = "image/*",
  disabled = false,
}: ImageDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
        console.log(e)
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragActive(e.type === "dragenter" || e.type === "dragover");
      }
    },
    [disabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
                console.log(e)
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        console.log(e.dataTransfer)
        console.log("iciiiii")
        console.log(files)
        const file = files[0];
        
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast.error("Please drop an image file");
          return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error("File size must be less than 5MB");
          return;
        }

        onImageSelect(file);
      }
    },
    [onImageSelect, disabled]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
                console.log(e)
      const files = e.target.files;
      if (files && files.length > 0) {

        onImageSelect(files[0]);
      }
    },
    [onImageSelect]
  );

  return (
    <div className="space-y-4 w-full">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-colors",
          "flex flex-col items-center justify-center gap-2",
          "h-48 w-full",
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Upload className={cn(
          "w-8 h-8",
          isDragActive ? "text-blue-500" : "text-gray-400"
        )} />
        
        <div className="text-center">
          <p className="font-medium text-gray-900">
            Drag and drop your image here
          </p>
          <p className="text-sm text-gray-500">
            or click to select from your computer
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Supported formats: JPG, PNG, WebP, GIF (max 5MB)
          </p>
        </div>

        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Upload image"
        />
      </div>

      {currentImage && (
        <div className="flex justify-center">
          <img
            src={currentImage}
            alt="Preview"
            className="max-w-[200px] max-h-[200px] object-contain border rounded"
          />
        </div>
      )}
    </div>
  );
}
