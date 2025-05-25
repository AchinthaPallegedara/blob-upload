"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { uploadImage } from "@/action/action";

interface ImageUploadProps {
  containerName?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
}

export default function ImageUpload({
  containerName = "product-dashboard",
  maxSizeMB = 5,
  allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
  onUploadSuccess,
  onUploadError,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Add state for client-side mounting
  const [isMounted, setIsMounted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeInBytes = maxSizeMB * 1024 * 1024;

  // Add useEffect to handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setError(null);
    setPreviewUrl(null);
    setUploadedImageUrl(null);

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      setError(`File type not allowed. Please use: ${allowedTypes.join(", ")}`);
      return;
    }

    // Validate file size
    if (file.size > maxSizeInBytes) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    handleUpload(file);
  };
  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Use deterministic progress updates to avoid hydration issues
      let step = 0;
      const maxSteps = 10;
      const stepSize = 9; // Fixed increment per step

      const progressInterval = setInterval(() => {
        if (step < maxSteps) {
          step++;
          // Calculate progress with fixed step increment
          const currentProgress = Math.min(95, step * stepSize);
          setUploadProgress(currentProgress);
        }
      }, 200);

      // Upload image using server action
      const response = await uploadImage(file, containerName);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success && response.url) {
        setUploadedImageUrl(response.url);
        onUploadSuccess?.(response.url);
      } else {
        throw new Error(response.error || "Upload failed");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetUpload = () => {
    setPreviewUrl(null);
    setUploadedImageUrl(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Don't render the component until client-side mounting is complete
  if (!isMounted) {
    return (
      <div className="w-full max-w-md">
        <div className="mb-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-wait transition-colors bg-gray-50 border-gray-300">
            <div className="flex flex-col items-center justify-center h-40">
              <p className="text-gray-500 mb-2">Loading uploader...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={allowedTypes.join(",")}
          className="hidden"
        />

        <div
          onClick={triggerFileInput}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${
              isUploading
                ? "bg-gray-100 border-gray-300"
                : "hover:bg-gray-50 border-gray-300 hover:border-blue-500"
            }`}
        >
          {previewUrl ? (
            <div className="relative w-full h-40 mb-2">
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40">
              <svg
                className="w-10 h-10 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
              <p className="text-gray-600">Click to select an image</p>
              <p className="text-gray-400 text-sm">Max {maxSizeMB}MB</p>
            </div>
          )}

          {isUploading && (
            <div className="w-full mt-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}
        </div>

        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

        {uploadedImageUrl && !isUploading && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-green-600 text-sm">Upload successful!</span>
            <button
              onClick={resetUpload}
              className="text-blue-500 text-sm hover:text-blue-700"
            >
              Upload another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
