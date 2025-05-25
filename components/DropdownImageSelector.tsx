"use client";

import {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { uploadImage } from "@/action/action";
import Image from "next/image";

export interface DropdownImageSelectorRef {
  uploadFile: () => Promise<string | null>;
  reset: () => void;
  hasFileToUpload: () => boolean;
}

interface DropdownImageSelectorProps {
  containerName?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  maxGalleryImages?: number;
  onImageSelected?: (url: string) => void;
  buttonLabel?: string;
}

const DropdownImageSelector = forwardRef<
  DropdownImageSelectorRef,
  DropdownImageSelectorProps
>(
  (
    {
      containerName = "product-dashboard",
      maxSizeMB = 5,
      allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
      onImageSelected,
      buttonLabel = "Choose Image",
    },
    ref
  ) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    // Add client-side mounting state
    const [isMounted, setIsMounted] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const maxSizeInBytes = maxSizeMB * 1024 * 1024;

    // Ensure we only use browser APIs after mounting
    useEffect(() => {
      setIsMounted(true);
    }, []);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      async uploadFile() {
        if (!selectedFile) return selectedImage; // Return already selected image URL if no new file

        try {
          setIsUploading(true);
          setUploadProgress(0);
          setError(null);

          // Use deterministic progress updates to avoid hydration issues
          let step = 0;
          const maxSteps = 10;
          const stepSize = 9; // Fixed increment size

          const progressInterval = setInterval(() => {
            if (step < maxSteps) {
              step++;
              // Calculate progress deterministically
              const currentProgress = Math.min(95, step * stepSize);
              setUploadProgress(currentProgress);
            }
          }, 200);

          // Upload image using server action
          const response = await uploadImage(selectedFile, containerName);

          clearInterval(progressInterval);
          setUploadProgress(100);

          if (response.success && response.url) {
            setSelectedImage(response.url);
            setSelectedFile(null);
            setPreviewUrl(null);
            onImageSelected?.(response.url);
            return response.url;
          } else {
            throw new Error(response.error || "Upload failed");
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Upload failed";
          setError(errorMessage);
          return null;
        } finally {
          setIsUploading(false);
          setIsDropdownOpen(false);
        }
      },

      reset() {
        setSelectedFile(null);
        setPreviewUrl(null);
        setSelectedImage(null);
        setError(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },

      hasFileToUpload() {
        return !!selectedFile;
      },
    }));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset states
      setError(null);

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        setError(
          `File type not allowed. Please use: ${allowedTypes.join(", ")}`
        );
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

      setSelectedFile(file);
      setSelectedImage(null); // Clear any previously selected image
    };

    const triggerFileInput = () => {
      fileInputRef.current?.click();
    };

    // Conditional rendering based on client-side mounting
    if (!isMounted) {
      // Return a placeholder until client-side hydration is complete
      return (
        <div className="relative">
          <button className="w-full p-3 border border-gray-300 bg-white rounded-lg text-left text-gray-500">
            {selectedImage ? "Image selected" : buttonLabel}
          </button>
        </div>
      );
    }

    return (
      <div className="relative w-full">
        <div
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-gray-400"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {selectedImage ? (
            <div className="relative w-full h-40 mb-2">
              <Image
                src={selectedImage}
                alt="Selected image"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
          ) : previewUrl ? (
            <div className="relative w-full h-40 mb-2">
              <Image
                src={previewUrl}
                alt="File preview"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <svg
                className="w-12 h-12 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
              <p className="text-sm">{buttonLabel}</p>
            </div>
          )}

          <div className="text-center text-sm mt-2">
            {selectedImage ? (
              <span className="text-blue-500">Image selected from gallery</span>
            ) : selectedFile ? (
              <span className="text-blue-500">Image ready to upload</span>
            ) : (
              <span>Click to select or upload an image</span>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}

        {/* Progress bar */}
        {isUploading && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-center mt-1">
              {Math.round(uploadProgress)}%
            </p>
          </div>
        )}

        {/* Dropdown panel */}
        {isDropdownOpen && (
          <div className="absolute z-10 w-full mt-2 bg-white rounded-lg border border-gray-300 shadow-lg">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Image Selector</h3>
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  ✕
                </button>
              </div>

              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={triggerFileInput}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Upload New Image
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept={allowedTypes.join(",")}
                  className="hidden"
                />
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Select an image from your device by clicking the button above.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

DropdownImageSelector.displayName = "DropdownImageSelector";

export default DropdownImageSelector;
