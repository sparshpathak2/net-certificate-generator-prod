"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Upload, File, Image, FileText, Trash, Loader2 } from "lucide-react";
import { useUploadTemplate } from "@/hooks/useTemplates";

interface TemplateFile {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
  uploadedAt: Date;
  status: "uploading" | "success" | "error";
  s3Url?: string;
  progress?: number;
}

export default function ChooseCertificate() {
  const [templateFiles, setTemplateFiles] = useState<TemplateFile[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // React Query mutation for upload
  const uploadMutation = useUploadTemplate();

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Add files to UI with uploading status
    const newFiles: TemplateFile[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
      uploadedAt: new Date(),
      status: "uploading",
      progress: 0,
    }));

    setTemplateFiles((prev) => [...newFiles, ...prev]);

    // Upload each file
    for (const newFile of newFiles) {
      try {
        // Update progress
        updateFileProgress(newFile.id, 30);
        
        const result = await uploadMutation.mutateAsync(newFile.file);
        
        // Update file status to success
        updateFileStatus(newFile.id, "success", result?.s3Url);
      } catch (error) {
        console.error("Upload failed:", error);
        updateFileStatus(newFile.id, "error");
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateFileProgress = (fileId: string, progress: number) => {
    setTemplateFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, progress } : f
      )
    );
  };

  const updateFileStatus = (fileId: string, status: "success" | "error", s3Url?: string) => {
    setTemplateFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status, s3Url } : f
      )
    );
  };

  const removeFile = (id: string) => {
    setTemplateFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file: TemplateFile) => {
    if (file.type.startsWith("image/")) {
      return <Image className="h-4 w-4 text-blue-500" />;
    }
    if (file.type === "application/pdf") {
      return <FileText className="h-4 w-4 text-red-500" />;
    }
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const getStatusIcon = (file: TemplateFile) => {
    if (file.status === "uploading") {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (file.status === "success") {
      return <div className="h-2 w-2 rounded-full bg-green-500" />;
    }
    if (file.status === "error") {
      return <div className="h-2 w-2 rounded-full bg-red-500" />;
    }
    return null;
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  const hasFiles = templateFiles.length > 0;
  const isUploading = templateFiles.some(f => f.status === "uploading");

  return (
    <div
      className="flex flex-col w-full max-w-3xl mx-auto border rounded-xl gap-4 pt-2 sm:pt-4"
      style={{ height: "calc(100vh - 86px)" }}
    >
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0 flex flex-col gap-2 px-2 sm:px-4">
        <div className="font-semibold text-gray-800 cursor-pointer">
          Upload Certificate Template
        </div>
        <div className="text-sm text-gray-800">
          Upload your certificate template (PDF, PNG, JPG, JPEG)
        </div>
      </div>

      {/* Upload Button - Fixed */}
      <div className="flex-shrink-0 px-2 sm:px-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          onClick={handleButtonClick}
          disabled={isUploading}
          className="gap-2"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isUploading ? "Uploading..." : "Choose Template Files"}
        </Button>
      </div>

      {/* Uploaded Files List - Scrollable */}
      {hasFiles ? (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <div className="flex-shrink-0 flex items-center justify-between px-2 sm:px-4">
            <h4 className="text-sm font-medium text-gray-900">
              Uploaded Templates ({templateFiles.length})
            </h4>
            {templateFiles.every(f => f.status === "success") && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                All uploaded
              </span>
            )}
          </div>

          {/* Scrollable list container */}
          <div className="flex-1 overflow-y-auto min-h-0 border-t px-2 sm:px-4">
            <div className="flex flex-col gap-2 py-2 sm:py-4">
              {templateFiles.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center justify-between rounded-lg border p-3 sm:px-4 sm:py-3 transition-shadow ${
                    file.status === "success" 
                      ? "border-green-200 bg-green-50/30" 
                      : file.status === "error"
                      ? "border-red-200 bg-red-50/30"
                      : "border-gray-200 bg-white"
                  } hover:shadow-sm`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                      {getFileIcon(file)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        {getStatusIcon(file)}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span>{file.size}</span>
                        <span>•</span>
                        <span>
                          {file.type.split("/")[1]?.toUpperCase() || "Unknown"}
                        </span>
                        <span>•</span>
                        <span className="text-blue-500 whitespace-nowrap">
                          {formatTimeAgo(file.uploadedAt)}
                        </span>
                      </div>
                      {file.status === "success" && file.s3Url && (
                        <p className="text-xs text-green-600 truncate mt-1">
                          Uploaded to S3
                        </p>
                      )}
                      {file.status === "error" && (
                        <p className="text-xs text-red-600 mt-1">
                          Upload failed. Please try again.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex gap-2 sm:gap-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      disabled={file.status !== "success"}
                      className={file.status !== "success" ? "opacity-50" : ""}
                    >
                      Use
                    </Button>
                    <button
                      onClick={() => removeFile(file.id)}
                      disabled={file.status === "uploading"}
                      className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Empty state - no files uploaded
        <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-0 border-t">
          <div className="flex flex-col items-center gap-2 text-center px-4">
            <div className="p-3 rounded-full bg-gray-50">
              <File className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                No templates uploaded
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Upload your first certificate template to get started
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}