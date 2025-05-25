"use client";

import { useState, useEffect } from "react";

import Image from "next/image";
import { deleteImage, listImages } from "@/action/action";

interface GalleryProps {
  containerName?: string;
  maxImages?: number;
  refreshInterval?: number | null;
  onSelect?: (imageUrl: string) => void;
  selectable?: boolean;
  deletable?: boolean;
  layout?: "grid" | "list";
  imageHeight?: number;
}

export default function ImageGallery({
  containerName = "product-dashboard",
  maxImages = 20,
  refreshInterval = null,
  onSelect,
  selectable = false,
  deletable = true,
  layout = "grid",
  imageHeight = 150,
}: GalleryProps) {
  const [images, setImages] = useState<
    Array<{ name: string; url: string; contentType: string; size: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const result = await listImages(containerName, maxImages);

      if (result.success && result.images) {
        setImages(result.images);
        setError(null);
      } else {
        setError(result.error || "Failed to load images");
      }
    } catch (err) {
      setError("An error occurred while fetching images");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();

    // Set up refresh interval if specified
    if (refreshInterval) {
      const interval = setInterval(fetchImages, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [containerName, maxImages, refreshInterval]);

  const handleImageSelect = (url: string) => {
    if (!selectable) return;

    setSelectedImage(url);
    if (onSelect) {
      onSelect(url);
    }
  };

  const handleDeleteImage = async (url: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (window.confirm("Are you sure you want to delete this image?")) {
      try {
        setDeletingImage(url);
        const result = await deleteImage(url, containerName);

        if (result.success) {
          setImages(images.filter((img) => img.url !== url));
        } else {
          alert(`Failed to delete image: ${result.error}`);
        }
      } catch (err) {
        console.error("Error deleting image:", err);
        alert("An error occurred while deleting the image");
      } finally {
        setDeletingImage(null);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading && images.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && images.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <button
          onClick={fetchImages}
          className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500">No images found</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${loading ? "opacity-60" : ""}`}>
      {layout === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.url}
              onClick={() => handleImageSelect(image.url)}
              className={`relative group rounded-lg overflow-hidden border ${
                selectedImage === image.url ? "ring-2 ring-blue-500" : ""
              } ${selectable ? "cursor-pointer" : ""}`}
              style={{ height: `${imageHeight}px` }}
            >
              <Image
                src={image.url}
                alt={image.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                className="object-cover"
              />

              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200"></div>

              {deletable && (
                <button
                  onClick={(e) => handleDeleteImage(image.url, e)}
                  disabled={deletingImage === image.url}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  {deletingImage === image.url ? (
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {images.map((image) => (
            <div
              key={image.url}
              onClick={() => handleImageSelect(image.url)}
              className={`flex items-center p-2 border rounded ${
                selectedImage === image.url ? "bg-blue-50 border-blue-200" : ""
              } ${selectable ? "cursor-pointer hover:bg-gray-50" : ""}`}
            >
              <div className="relative h-12 w-12 mr-3 flex-shrink-0">
                <Image
                  src={image.url}
                  alt={image.name}
                  fill
                  className="object-cover rounded"
                />
              </div>

              <div className="flex-grow">
                <div className="truncate text-sm">{image.name}</div>
                <div className="text-xs text-gray-500">
                  {formatFileSize(image.size)}
                </div>
              </div>

              {deletable && (
                <button
                  onClick={(e) => handleDeleteImage(image.url, e)}
                  disabled={deletingImage === image.url}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  {deletingImage === image.url ? (
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {loading && images.length > 0 && (
        <div className="text-center mt-4">
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-500">Refreshing...</span>
        </div>
      )}
    </div>
  );
}
