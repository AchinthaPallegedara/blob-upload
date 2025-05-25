"use client";

import { useState, useRef, useEffect } from "react";
import MultiImageUpload, { MultiImageUploadRef } from "./MultiImageUpload";
import ClientWrapper from "./ClientWrapper";

interface MultiImageUploadFormProps {
  onSuccess?: (imageUrls: string[]) => void;
  submitButtonText?: string;
  containerName?: string;
  maxSizeMB?: number;
  maxFiles?: number;
}

export default function MultiImageUploadForm({
  onSuccess,
  submitButtonText = "Upload Images",
  containerName = "product-dashboard",
  maxSizeMB = 5,
  maxFiles = 10,
}: MultiImageUploadFormProps) {
  // Initialize state with safe default values
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  // Use useRef for stable references across renders
  const imageUploadRef = useRef<MultiImageUploadRef>(null);

  // Adding useEffect to ensure code only runs on client after hydration
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageUploadRef.current) return;

    // If no files are selected, show error
    if (!imageUploadRef.current.hasFilesToUpload()) {
      setSubmitError("Please select at least one image first");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Upload the files
      const urls = await imageUploadRef.current.uploadFiles();

      if (urls.length > 0) {
        setUploadedUrls(urls);
        setSubmitSuccess(true);

        // Log URLs to console as requested
        console.log("Uploaded image URLs:", urls);

        // Call the success callback if provided
        if (onSuccess) {
          onSuccess(urls);
        }
      } else {
        setSubmitError("Failed to upload images. Please try again.");
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "An error occurred during image upload"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    imageUploadRef.current?.reset();
    setSubmitError(null);
    setSubmitSuccess(false);
    setUploadedUrls([]);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Images to Upload
        </label>

        <ClientWrapper
          fallback={
            <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center py-12">
              <p className="text-sm text-gray-500">Loading uploader...</p>
            </div>
          }
        >
          <MultiImageUpload
            ref={imageUploadRef}
            containerName={containerName}
            maxSizeMB={maxSizeMB}
            maxFiles={maxFiles}
            buttonLabel="Click to add images"
          />
        </ClientWrapper>
      </div>

      {mounted && submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {submitError}
        </div>
      )}

      {mounted && submitSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {uploadedUrls.length} {uploadedUrls.length === 1 ? "image" : "images"}{" "}
          successfully uploaded!
        </div>
      )}

      {/* Render buttons inside ClientWrapper to ensure consistent hydration */}
      <ClientWrapper
        fallback={
          <div className="flex space-x-4">
            <div className="px-4 py-2 rounded bg-gray-200 text-gray-500">
              {submitButtonText}
            </div>
            <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded">
              Reset
            </div>
          </div>
        }
      >
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded text-white ${
              isSubmitting
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Uploading..." : submitButtonText}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
          >
            Reset
          </button>
        </div>
      </ClientWrapper>
    </form>
  );
}
