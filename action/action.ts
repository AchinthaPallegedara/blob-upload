"use server";

import { BlobServiceClient } from "@azure/storage-blob";
import { revalidatePath } from "next/cache";

/**
 * Convert a File object to a Buffer
 */
async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate a unique file name to avoid overwriting
 */
function generateUniqueFileName(originalName: string): string {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  const extension = originalName.split(".").pop();
  return `${timestamp}-${random}.${extension}`;
}

/**
 * Upload an image to Azure Blob Storage
 */
export async function uploadImage(
  file: File,
  containerName: string = "product-dashboard"
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Get the connection string from environment variables
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error("Azure Storage connection string not provided.");
    }

    // Create the BlobServiceClient
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);

    // Get a reference to the container
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Check if container exists, create if not
    const containerExists = await containerClient.exists();
    if (!containerExists) {
      await containerClient.create();
      // Set container to public access (optional)
      await containerClient.setAccessPolicy("blob");
    }

    // Generate a unique name for the blob
    const uniqueFileName = generateUniqueFileName(file.name);

    // Get a block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(uniqueFileName);

    // Convert file to buffer
    const buffer = await fileToBuffer(file);

    // Upload buffer
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: file.type,
      },
    });

    // Return the URL of the uploaded blob
    const url = blockBlobClient.url;

    // Revalidate the path to ensure fresh data is shown
    revalidatePath("/");

    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

/**
 * Delete an image from Azure Blob Storage
 */
export async function deleteImage(
  blobUrl: string,
  containerName: string = "product-dashboard"
): Promise<{ success: boolean; error?: string }> {
  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error("Azure Storage connection string not provided.");
    }

    // Extract blob name from URL
    const blobName = blobUrl.split("/").pop();
    if (!blobName) {
      throw new Error("Invalid blob URL");
    }

    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Delete the blob
    await blockBlobClient.delete();

    // Revalidate the path
    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting image:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

/**
 * List all images in a container
 */
export async function listImages(
  containerName: string = "product-dashboard",
  maxResults: number = 50
): Promise<{
  success: boolean;
  images?: { name: string; url: string; contentType: string; size: number }[];
  error?: string;
}> {
  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error("Azure Storage connection string not provided.");
    }

    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const images = [];
    let i = 0;

    // List the blobs
    for await (const blob of containerClient.listBlobsFlat()) {
      if (i >= maxResults) break;

      const blobClient = containerClient.getBlobClient(blob.name);
      const properties = await blobClient.getProperties();

      // Filter for image types
      if (
        properties.contentType?.startsWith("image/") ||
        blob.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      ) {
        images.push({
          name: blob.name,
          url: blobClient.url,
          contentType: properties.contentType || "unknown",
          size: properties.contentLength || 0,
        });
      }

      i++;
    }

    return {
      success: true,
      images,
    };
  } catch (error) {
    console.error("Error listing images:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
