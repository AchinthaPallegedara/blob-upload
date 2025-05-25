"use client";

import { useState, useEffect } from "react";

import MultiImageUploadForm from "@/components/MultiImageUploadForm";

import Link from "next/link";

export default function MultiImageExample() {
  // This ensures any code using browser APIs only runs after hydration
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFormSuccess = (urls: string[]) => {
    console.log("Form upload complete:", urls);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Multiple Image Upload Example</h1>
        <Link
          href="/"
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Back to Home
        </Link>
      </div>

      <div className="grid  gap-10">
        {/* <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            Manual Upload Button Example
          </h2>
          <p className="mb-4 text-gray-600">
            This example shows how to use the MultiImageUpload with an external
            submit button.
          </p>

       
          {isMounted ? (
            <MultiImageUpload
              ref={imageUploaderRef}
              containerName="product-dashboard"
              onImagesSelected={handleFilesSelected}
              buttonLabel="Select Images"
              maxFiles={5}
            />
          ) : (
            <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center h-32">
              <span className="text-gray-500">Loading upload component...</span>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div className="text-sm text-gray-600">
              {selectedFiles.length > 0
                ? `${selectedFiles.length} ${
                    selectedFiles.length === 1 ? "file" : "files"
                  } ready to upload`
                : "No files selected"}
            </div>

            <button
              onClick={handleManualUpload}
              disabled={isUploading || selectedFiles.length === 0}
              className={`w-full px-4 py-2 rounded text-white ${
                isUploading || selectedFiles.length === 0
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isUploading ? "Uploading..." : "Upload Images"}
            </button>

            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {uploadError}
              </div>
            )}

            {uploadedUrls.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Uploaded Images:</h3>
                <div className="grid grid-cols-2 gap-3">
                  {uploadedUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative border rounded overflow-hidden h-32"
                    >
                      <Image
                        src={url}
                        alt={`Uploaded image ${index + 1}`}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div> */}

        {/* Form example */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            Form Integration Example
          </h2>
          <p className="mb-4 text-gray-600">
            This example shows the MultiImageUploadForm component which handles
            the upload process within a form.
          </p>

          {isMounted ? (
            <MultiImageUploadForm
              containerName="product-dashboard"
              onSuccess={handleFormSuccess}
              submitButtonText="Upload All Images"
              maxFiles={5}
            />
          ) : (
            <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center h-32">
              <span className="text-gray-500">Loading upload form...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
