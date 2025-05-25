"use client";

import { useState, useEffect } from "react";
import ImageUpload from "./ImageUpload";
import ImageGallery from "./ImageGallery";
import ClientWrapper from "./ClientWrapper";

interface ImageManagerProps {
  containerName?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  galleryRefreshInterval?: number | null;
  maxGalleryImages?: number;
  initialView?: "gallery" | "upload";
  onImageSelected?: (url: string) => void;
  selectable?: boolean;
}

export default function ImageManager({
  containerName = "product-dashboard",
  maxSizeMB = 5,
  allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
  galleryRefreshInterval = null,
  maxGalleryImages = 20,
  initialView = "gallery",
  onImageSelected,
  selectable = false,
}: ImageManagerProps) {
  const [view, setView] = useState<"gallery" | "upload">(initialView);
  const [refreshGallery, setRefreshGallery] = useState(0);
  // Add state for client-side mounting
  const [isMounted, setIsMounted] = useState(false);

  // Use useEffect to handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleUploadSuccess = (url: string) => {
    // Force gallery refresh after successful upload
    setRefreshGallery((prev) => prev + 1);

    // Optionally switch back to gallery view
    setView("gallery");

    // Call the callback if provided
    if (onImageSelected) {
      onImageSelected(url);
    }
  };

  if (!isMounted) {
    return null; // or a loading spinner, etc.
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Image Manager</h2>

        <div className="flex space-x-2">
          <button
            onClick={() => setView("gallery")}
            className={`px-3 py-1 rounded text-sm ${
              view === "gallery"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            Gallery
          </button>
          <button
            onClick={() => setView("upload")}
            className={`px-3 py-1 rounded text-sm ${
              view === "upload"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            Upload
          </button>
        </div>
      </div>

      <ClientWrapper
        fallback={
          <div className="border border-gray-200 bg-gray-50 rounded p-8 text-center text-gray-500">
            Loading component...
          </div>
        }
      >
        {view === "upload" ? (
          <ImageUpload
            containerName={containerName}
            maxSizeMB={maxSizeMB}
            allowedTypes={allowedTypes}
            onUploadSuccess={handleUploadSuccess}
          />
        ) : (
          <ImageGallery
            containerName={containerName}
            maxImages={maxGalleryImages}
            refreshInterval={galleryRefreshInterval}
            key={`gallery-${refreshGallery}`} // Force remount on refresh
            onSelect={onImageSelected}
            selectable={selectable}
          />
        )}
      </ClientWrapper>
    </div>
  );
}
