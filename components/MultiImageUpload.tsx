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

// Define a type for our selected files with additional metadata
interface SelectedFileInfo {
  file: File;
  id: string;
  previewUrl: string;
  error?: string;
}

export interface MultiImageUploadRef {
  uploadFiles: () => Promise<string[]>;
  reset: () => void;
  hasFilesToUpload: () => boolean;
  getFiles: () => File[];
}

interface MultiImageUploadProps {
  containerName?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  onImagesSelected?: (files: File[]) => void;
  onUploadComplete?: (urls: string[]) => void;
  buttonLabel?: string;
  maxFiles?: number;
}

const MultiImageUpload = forwardRef<MultiImageUploadRef, MultiImageUploadProps>(
  (
    {
      containerName = "product-dashboard",
      maxSizeMB = 5,
      allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
      onImagesSelected,
      onUploadComplete,
      buttonLabel = "Add Images",
      maxFiles = 10,
    },
    ref
  ) => {
    const [selectedFiles, setSelectedFiles] = useState<SelectedFileInfo[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
    const [totalUploads, setTotalUploads] = useState(0);
    const [isMounted, setIsMounted] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const idCounterRef = useRef<number>(0);
    const maxSizeInBytes = maxSizeMB * 1024 * 1024;

    useEffect(() => {
      setIsMounted(true);
    }, []);

    // Format file size
    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      async uploadFiles() {
        if (selectedFiles.length === 0) return [];

        try {
          setIsUploading(true);
          setUploadProgress(0);
          setError(null);
          setTotalUploads(selectedFiles.length);
          setCurrentUploadIndex(0);

          const uploadedUrls: string[] = [];

          for (let i = 0; i < selectedFiles.length; i++) {
            setCurrentUploadIndex(i + 1);

            // Calculate progress with fixed values to avoid random numbers
            const baseProgress = Math.floor((i / selectedFiles.length) * 100);
            const targetProgress = Math.floor(
              ((i + 1) / selectedFiles.length) * 100
            );
            const progressSteps = 10; // Number of steps for this file's progress

            // Set initial progress for this file
            setUploadProgress(baseProgress);

            // Create a fixed step progress simulation
            let currentStep = 0;
            const progressInterval = setInterval(() => {
              if (currentStep < progressSteps) {
                currentStep++;
                const stepIncrement =
                  (targetProgress - baseProgress) / progressSteps;
                const currentProgress =
                  baseProgress + Math.floor(stepIncrement * currentStep);
                setUploadProgress(Math.min(currentProgress, 95)); // Cap at 95% until complete
              }
            }, 200);

            // Upload image using server action
            const response = await uploadImage(
              selectedFiles[i].file,
              containerName
            );

            clearInterval(progressInterval);

            if (response.success && response.url) {
              uploadedUrls.push(response.url);
              console.log(`Uploaded image: ${response.url}`);
            } else {
              throw new Error(
                response.error || `Failed to upload image ${i + 1}`
              );
            }
          }

          setUploadProgress(100);

          if (onUploadComplete) {
            onUploadComplete(uploadedUrls);
          }

          // Clear selected files after successful upload
          setSelectedFiles([]);
          return uploadedUrls;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Upload failed";
          setError(errorMessage);
          return [];
        } finally {
          setIsUploading(false);
        }
      },

      reset() {
        console.log("Reset method called - clearing all selected files");
        setSelectedFiles([]);
        setError(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },

      hasFilesToUpload() {
        return selectedFiles.length > 0;
      },

      getFiles() {
        return selectedFiles.map((fileInfo: SelectedFileInfo) => fileInfo.file);
      },
    }));

    // Generate unique IDs that persist between renders
    // Using a persistent counter via useRef and timestamp to guarantee uniqueness
    const generateId = () => {
      // Combine counter with timestamp for guaranteed uniqueness
      const timestamp = new Date().getTime();
      return `file-${timestamp}-${idCounterRef.current++}`;
    };

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setError(null);

      // Check if adding these files would exceed the maximum
      if (selectedFiles.length + files.length > maxFiles) {
        setError(`You can only upload a maximum of ${maxFiles} files at once.`);
        return;
      }

      const newFiles: SelectedFileInfo[] = [];
      const filePromises: Promise<SelectedFileInfo>[] = [];

      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!allowedTypes.includes(file.type)) {
          newFiles.push({
            file,
            id: generateId(),
            previewUrl: "",
            error: `File type not allowed: ${file.name}`,
          });
          continue;
        }

        // Validate file size
        if (file.size > maxSizeInBytes) {
          newFiles.push({
            file,
            id: generateId(),
            previewUrl: "",
            error: `File size exceeds ${maxSizeMB}MB limit: ${file.name}`,
          });
          continue;
        }

        // Create preview
        const promise = new Promise<SelectedFileInfo>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              file,
              id: generateId(),
              previewUrl: reader.result as string,
            });
          };
          reader.readAsDataURL(file);
        });

        filePromises.push(promise);
      }

      // Wait for all previews to be generated
      Promise.all(filePromises).then((validFiles) => {
        const allNewFiles = [...newFiles, ...validFiles];
        setSelectedFiles((prev: SelectedFileInfo[]) => [
          ...prev,
          ...allNewFiles,
        ]);

        // Call callback with all files
        if (onImagesSelected) {
          onImagesSelected(
            [...selectedFiles, ...allNewFiles].map(
              (f: SelectedFileInfo) => f.file
            )
          );
        }
      });

      // Reset the input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    // Remove a file from selection
    const removeFile = (id: string) => {
      // Log for debugging purposes
      console.log(`Removing file with id: ${id}`);
      console.log(
        "Current files:",
        selectedFiles.map((f) => ({ id: f.id, name: f.file.name }))
      );

      const newFiles = selectedFiles.filter(
        (f: SelectedFileInfo) => f.id !== id
      );

      console.log(
        "Files after removal:",
        newFiles.map((f) => ({ id: f.id, name: f.file.name }))
      );

      setSelectedFiles(newFiles);

      // Call callback with updated files
      if (onImagesSelected) {
        onImagesSelected(newFiles.map((f: SelectedFileInfo) => f.file));
      }
    };

    const triggerFileInput = () => {
      fileInputRef.current?.click();
    };

    return (
      <div className="w-full">
        <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400">
          <div
            className="flex flex-col items-center justify-center py-4 text-gray-500 cursor-pointer"
            onClick={triggerFileInput}
          >
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
            <p className="text-xs mt-2">
              {selectedFiles.length > 0
                ? `${selectedFiles.length} ${
                    selectedFiles.length === 1 ? "file" : "files"
                  } selected`
                : "Click to select files"}
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={allowedTypes.join(",")}
              multiple
              className="hidden"
            />
          </div>

          {/* Only render dynamic content client-side after hydration */}
          {isMounted && selectedFiles.length > 0 && (
            <div className="mt-4 space-y-3">
              <h3 className="font-medium text-sm">
                Selected Files ({selectedFiles.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedFiles.map((fileInfo) => (
                  <div
                    key={fileInfo.id}
                    className={`relative border rounded-md overflow-hidden ${
                      fileInfo.error
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start p-3">
                      <div className="w-16 h-16 flex-shrink-0 mr-3">
                        {fileInfo.previewUrl ? (
                          <div className="relative w-16 h-16">
                            <Image
                              src={fileInfo.previewUrl}
                              alt={fileInfo.file.name}
                              fill
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-16 h-16 bg-gray-100">
                            <svg
                              className="w-8 h-8 text-gray-400"
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
                          </div>
                        )}
                      </div>

                      <div className="flex-grow min-w-0 mr-3">
                        <p className="text-sm font-medium truncate">
                          {fileInfo.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {fileInfo.file.type} •{" "}
                          {formatFileSize(fileInfo.file.size)}
                        </p>
                        {fileInfo.error && (
                          <p className="text-xs text-red-500 mt-1">
                            {fileInfo.error}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent event from bubbling up
                          removeFile(fileInfo.id);
                        }}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <svg
                          className="w-5 h-5"
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
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error and progress indicators - only show after mounting */}
        {isMounted && error && (
          <div className="mt-2 text-red-500 text-sm">{error}</div>
        )}

        {/* Progress bar - only render after mounting */}
        {isMounted && isUploading && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span>
                Uploading {currentUploadIndex} of {totalUploads}
              </span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

MultiImageUpload.displayName = "MultiImageUpload";

export default MultiImageUpload;
