"use client";

import ImageManager from "@/components/ImageManager";
import ImageUploadForm from "@/components/ImageUploadForm";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  // Add state for client-side mounting
  const [isMounted, setIsMounted] = useState(false);

  // Use useEffect to handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleImageSelected = (url: string) => {
    setSelectedImage(url);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Image Picker Example</h1>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dropdown-example"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            View Dropdown Image Selector
          </Link>

          <Link
            href="/multi-image-example"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            View Multi-Image Upload
          </Link>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          {showForm
            ? "Show Standard Image Manager"
            : "Show Form With Dropdown Selector"}
        </button>
      </div>

      {showForm ? (
        <div className="bg-white shadow rounded-lg">
          <ImageUploadForm />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="bg-white shadow rounded-lg p-6">
              <ImageManager
                containerName="product-dashboard"
                maxSizeMB={5}
                allowedTypes={["image/jpeg", "image/png", "image/gif"]}
                onImageSelected={handleImageSelected}
                selectable={true}
              />
            </div>
          </div>

          <div>
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Selected Image</h2>

              {selectedImage ? (
                <div>
                  <div className="aspect-video relative mb-4 border rounded-lg overflow-hidden">
                    {isMounted && (
                      <Image
                        src={selectedImage}
                        alt="Selected"
                        fill
                        style={{ objectFit: "contain" }}
                        priority
                      />
                    )}
                  </div>
                  <div className="flex justify-between">
                    <input
                      type="text"
                      value={selectedImage}
                      readOnly
                      className="bg-gray-50 p-2 rounded border w-full text-sm text-gray-700"
                    />
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(selectedImage)
                      }
                      className="ml-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Copy URL
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                  No image selected. Select an image from the gallery or upload
                  a new one.
                </div>
              )}
            </div>

            <div className="mt-6 bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Usage Example</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm overflow-auto">
                  {`// Import the component
import ImageManager from '@/components/ImageManager';

// Use in your component
<ImageManager
  containerName="product-dashboard"
  maxSizeMB={5}
  allowedTypes={['image/jpeg', 'image/png']}
  onImageSelected={(url) => {
    console.log('Selected image URL:', url);
    // Do something with the URL
  }}
  selectable={true}
/>`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
