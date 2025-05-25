"use client";

import { useState } from "react";
import DropdownImageSelector, {
  DropdownImageSelectorRef,
} from "@/components/DropdownImageSelector";
import { useRef } from "react";
import ImageUploadForm from "@/components/ImageUploadForm";
import Image from "next/image";

export default function DropdownExample() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [formUploadedImage, setFormUploadedImage] = useState<string | null>(
    null
  );
  const imageUploaderRef = useRef<DropdownImageSelectorRef>(null);

  const handleImageSelected = (url: string) => {
    setSelectedImage(url);
  };

  const handleManualUpload = async () => {
    if (!imageUploaderRef.current) return;

    const url = await imageUploaderRef.current.uploadFile();
    if (url) {
      setUploadResult(`Image uploaded successfully: ${url}`);
    } else {
      setUploadResult("Upload failed or no image was selected");
    }
  };

  const handleFormSuccess = (imageUrl: string) => {
    setFormUploadedImage(imageUrl);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Dropdown Image Selector Examples
      </h1>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Manual upload example */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            Manual Submit Button Example
          </h2>
          <p className="mb-4 text-gray-600">
            This example shows how to use the DropdownImageSelector with an
            external submit button.
          </p>

          <DropdownImageSelector
            ref={imageUploaderRef}
            containerName="product-dashboard"
            onImageSelected={handleImageSelected}
            buttonLabel="Select an Image"
          />

          <div className="mt-6 space-y-4">
            <button
              onClick={handleManualUpload}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Upload Image
            </button>

            {uploadResult && (
              <div className="p-3 bg-gray-100 rounded text-sm">
                {uploadResult}
              </div>
            )}

            {selectedImage && (
              <div>
                <h3 className="text-lg font-medium mb-2">Selected Image:</h3>
                <div className="relative w-full h-40 border rounded overflow-hidden">
                  <Image
                    src={selectedImage}
                    alt="Selected image"
                    fill
                    style={{ objectFit: "contain" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form example */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            Form Integration Example
          </h2>
          <p className="mb-4 text-gray-600">
            This example shows the ImageUploadForm component which wraps the
            DropdownImageSelector in a form.
          </p>

          <ImageUploadForm
            containerName="product-dashboard"
            onSuccess={handleFormSuccess}
            submitButtonText="Save Image"
          />

          {formUploadedImage && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Uploaded Image:</h3>
              <div className="relative w-full h-40 border rounded overflow-hidden">
                <Image
                  src={formUploadedImage}
                  alt="Uploaded image"
                  fill
                  style={{ objectFit: "contain" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
