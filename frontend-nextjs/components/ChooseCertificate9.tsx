"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Upload,
  File,
  Image,
  FileText,
  Trash,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  useUploadTemplate,
  useGetAllTemplates,
  useDeleteTemplate,
  useDownloadTemplate,
} from "@/hooks/useTemplates";
import { useRouter } from "next/navigation";

interface TemplateFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  status: "uploading" | "success" | "error";
  s3Url?: string;
  url?: string;
  progress?: number;
  filename?: string;
  originalName?: string;
}

export default function ChooseCertificate() {
  const [templateFiles, setTemplateFiles] = useState<TemplateFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  // React Query hooks
  const {
    data: templatesData,
    isLoading: isLoadingTemplates,
    refetch,
  } = useGetAllTemplates();
  const uploadMutation = useUploadTemplate();
  const deleteMutation = useDeleteTemplate();
  const downloadMutation = useDownloadTemplate();

  // Load templates from API when component mounts
  useEffect(() => {
    if (templatesData?.templates) {
      const formattedTemplates: TemplateFile[] = templatesData.templates.map(
        (template: any) => ({
          id: template.id,
          name: template.originalName || template.filename,
          size: formatFileSize(template.size),
          type: template.filename.split(".").pop()?.toUpperCase() || "Unknown",
          uploadedAt: template.createdAt,
          status: "success",
          s3Url: template.s3Url,
          url: template.url,
          filename: template.filename,
          originalName: template.originalName,
        }),
      );
      setTemplateFiles(formattedTemplates);
    }
  }, [templatesData]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Add files to UI with uploading status
    const newFiles: TemplateFile[] = files.map((file) => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type.split("/")[1]?.toUpperCase() || "Unknown",
      uploadedAt: new Date().toISOString(),
      status: "uploading",
      progress: 0,
    }));

    setTemplateFiles((prev) => [...newFiles, ...prev]);
    setIsUploading(true);

    // Upload each file
    for (const newFile of newFiles) {
      try {
        // Find the actual File object
        const actualFile = files.find((f) => f.name === newFile.name);
        if (!actualFile) continue;

        const result = await uploadMutation.mutateAsync(actualFile);

        // Update file status to success with real data
        setTemplateFiles((prev) =>
          prev.map((f) =>
            f.id === newFile.id
              ? {
                  ...f,
                  status: "success",
                  s3Url: result.s3Url,
                  id: result.id,
                  filename: result.filename,
                  originalName: result.originalName,
                  url: result.templateUrl,
                }
              : f,
          ),
        );
      } catch (error) {
        console.error("Upload failed:", error);
        setTemplateFiles((prev) =>
          prev.map((f) =>
            f.id === newFile.id ? { ...f, status: "error" } : f,
          ),
        );
      }
    }

    setIsUploading(false);

    // Reset input and refresh list
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Refetch templates from API
    refetch();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteMutation.mutateAsync(id);
      // Remove from local state
      setTemplateFiles((prev) => prev.filter((f) => f.id !== id));
      // Refetch to ensure consistency
      refetch();
    }
  };

  const handleDownload = async (filename: string, originalName: string) => {
    await downloadMutation.mutateAsync({ filename, originalName });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file: TemplateFile) => {
    const fileType = file.type.toLowerCase();
    if (
      fileType.includes("png") ||
      fileType.includes("jpg") ||
      fileType.includes("jpeg") ||
      fileType.includes("gif")
    ) {
      return <Image className="h-4 w-4 text-blue-500" />;
    }
    if (fileType.includes("pdf")) {
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
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
  const hasUploading = templateFiles.some((f) => f.status === "uploading");

  if (isLoadingTemplates && templateFiles.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col w-full max-w-3xl mx-auto border rounded-xl gap-4 pt-2 sm:pt-4"
      style={{ height: "calc(100vh - 86px)" }}
    >
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0 flex flex-col gap-2 px-2 sm:px-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gray-800">
            Upload Certificate Template
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
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
          disabled={hasUploading}
          className="gap-2"
        >
          {hasUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {hasUploading ? "Uploading..." : "Choose Template Files"}
        </Button>
      </div>

      {/* Uploaded Files List - Scrollable */}
      {hasFiles ? (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <div className="flex-shrink-0 flex items-center justify-between px-2 sm:px-4">
            <h4 className="text-sm font-medium text-gray-900">
              Uploaded Templates ({templateFiles.length})
            </h4>
            {templateFiles.every((f) => f.status === "success") &&
              templateFiles.length > 0 && (
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
                      ? "border"
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
                        <span>{file.type}</span>
                        <span>•</span>
                        <span className="text-blue-500 whitespace-nowrap">
                          {formatTimeAgo(file.uploadedAt)}
                        </span>
                      </div>
                      {file.status === "success" && file.s3Url && (
                        <p className="text-xs text-green-600 truncate mt-1">
                          ✓ Uploaded to S3
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
                    {/* <Button
                      size="sm"
                      variant="outline"
                      disabled={file.status !== "success"}
                      className={file.status !== "success" ? "opacity-50" : ""}
                      onClick={() => {
                        // Use S3 URL directly
                        if (file.s3Url) {
                          window.open(file.s3Url, "_blank");
                        } else if (file.url) {
                          window.open(file.url, "_blank");
                        } else {
                          console.error("No URL available for this template");
                        }
                      }}
                    >
                      View
                    </Button> */}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={file.status !== "success"}
                      className={file.status !== "success" ? "opacity-50" : ""}
                      onClick={() => {
                        router.push(`/dashboard/${file.id}`);
                      }}
                    >
                      Use Template
                    </Button>
                    {/* {file.status === "success" && file.filename && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownload(file.filename!, file.originalName || file.name)}
                      >
                        Download
                      </Button>
                    )} */}
                    <button
                      onClick={() => handleDelete(file.id, file.name)}
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
