"use client";

import { useState, useRef, useEffect } from "react";
import DropdownImageSelector, {
  DropdownImageSelectorRef,
} from "./DropdownImageSelector";
import ClientWrapper from "./ClientWrapper";

interface ImageUploadFormProps {
  onSuccess?: (imageUrl: string) => void;
  submitButtonText?: string;
  containerName?: string;
  maxSizeMB?: number;
}

export default function ImageUploadForm({
  onSuccess,
  submitButtonText = "Save Image",
  containerName = "product-dashboard",
  maxSizeMB = 5,
}: ImageUploadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Add state for client-side mounting
  const [, setIsMounted] = useState(false);

  // Use useEffect to handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const imageUploadRef = useRef<DropdownImageSelectorRef>(null);

  const handleImageSelected = (url: string) => {
    setSelectedImageUrl(url);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageUploadRef.current) return;

    // If no file is selected and no image is selected from gallery, show error
    if (!imageUploadRef.current.hasFileToUpload() && !selectedImageUrl) {
      setSubmitError("Please select an image first");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Upload the file if needed, or get the already selected URL
      const imageUrl = await imageUploadRef.current.uploadFile();

      if (imageUrl) {
        setSelectedImageUrl(imageUrl);
        setSubmitSuccess(true);
        onSuccess?.(imageUrl);
      } else {
        setSubmitError("Failed to upload image. Please try again.");
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
    setSelectedImageUrl(null);
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select or Upload an Image
        </label>

        <ClientWrapper
          fallback={
            <div className="w-full p-3 border border-gray-300 bg-gray-50 rounded-lg text-gray-500">
              Loading image selector...
            </div>
          }
        >
          <DropdownImageSelector
            ref={imageUploadRef}
            onImageSelected={handleImageSelected}
            containerName={containerName}
            maxSizeMB={maxSizeMB}
          />
        </ClientWrapper>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {submitError}
        </div>
      )}

      {submitSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Image successfully uploaded!
        </div>
      )}

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
          {isSubmitting ? "Processing..." : submitButtonText}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
