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
  Link as LinkIcon,
  Copy,
  CheckCircle,
  Plus,
  X,
} from "lucide-react";
import {
  useUploadTemplate,
  useGetAllTemplates,
  useDeleteTemplate,
  useDownloadTemplate,
  useUpdateClaimUrl,
} from "@/hooks/useTemplates";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import toast from "react-hot-toast";

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
  claimUrl?: string;
  isPublic?: boolean;
  requireUrn?: boolean;
}

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: string;
  isRequired: boolean;
  x?: number;
  y?: number;
}

export default function ChooseCertificate() {
  const [templateFiles, setTemplateFiles] = useState<TemplateFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateFile | null>(null);
  const [claimUrl, setClaimUrl] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [requireUrn, setRequireUrn] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false);
  const [newField, setNewField] = useState({
    name: "",
    label: "",
    type: "text",
    isRequired: false,
  });
  
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
  const updateClaimUrlMutation = useUpdateClaimUrl();

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
          claimUrl: template.claimUrl,
          isPublic: template.isPublic,
          requireUrn: template.requireUrn,
        }),
      );
      setTemplateFiles(formattedTemplates);
    }
  }, [templatesData]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

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

    for (const newFile of newFiles) {
      try {
        const actualFile = files.find((f) => f.name === newFile.name);
        if (!actualFile) continue;

        const result = await uploadMutation.mutateAsync(actualFile);

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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    refetch();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteMutation.mutateAsync(id);
      setTemplateFiles((prev) => prev.filter((f) => f.id !== id));
      refetch();
    }
  };

  const handleOpenClaimDialog = (template: TemplateFile) => {
    setSelectedTemplate(template);
    const generatedUrl = template.originalName
      ? template.originalName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      : template.id;
    setClaimUrl(template.claimUrl || generatedUrl);
    setIsPublic(template.isPublic !== undefined ? template.isPublic : false);
    setRequireUrn(template.requireUrn !== undefined ? template.requireUrn : false);
    setIsDialogOpen(true);
  };

//   const handleSaveClaimUrl = async () => {
//     if (!selectedTemplate) return;
    
//     if (!claimUrl) {
//       toast.error("Claim URL is required");
//       return;
//     }
    
//     await updateClaimUrlMutation.mutateAsync({
//       id: selectedTemplate.id,
//       claimUrl,
//       isPublic,
//       requireUrn,
//     });
    
//     setIsDialogOpen(false);
//     refetch();
//   };

  const handleSaveClaimUrl = async () => {
    if (!selectedTemplate) return;
    
    if (!claimUrl) {
        toast.error("Claim URL is required");
        return;
    }
    
    await updateClaimUrlMutation.mutateAsync({
        id: selectedTemplate.id,
        claimUrl,
        isPublic,
        requireUrn,  // ✅ Send requireUrn to backend
    });
    
    setIsDialogOpen(false);
    refetch();
};

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const addCustomField = () => {
    if (!newField.name || !newField.label) {
      toast.error("Field name and label are required");
      return;
    }
    
    setCustomFields([
      ...customFields,
      {
        id: Date.now().toString(),
        name: newField.name.toLowerCase().replace(/\s/g, '_'),
        label: newField.label,
        type: newField.type,
        isRequired: newField.isRequired,
      },
    ]);
    
    setNewField({
      name: "",
      label: "",
      type: "text",
      isRequired: false,
    });
    setShowAddFieldDialog(false);
    toast.success("Custom field added");
  };

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter(f => f.id !== id));
    toast.success("Custom field removed");
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
  const claimFormUrl = claimUrl ? `${window.location.origin}/claim/${claimUrl}` : "";

  if (isLoadingTemplates && templateFiles.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <>
      <div
        className="flex flex-col w-full max-w-3xl mx-auto border rounded-xl gap-4 pt-2 sm:pt-4"
        style={{ height: "calc(100vh - 86px)" }}
      >
        {/* Header Section */}
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

        {/* Upload Button */}
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

        {/* Templates List */}
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
                        {/* {file.claimUrl && (
                          <p className="text-xs text-blue-600 truncate mt-1">
                            🔗 Claim URL: /claim/{file.claimUrl}
                          </p>
                        )} */}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex gap-2 sm:gap-4">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={file.status !== "success"}
                        className={file.status !== "success" ? "opacity-50" : ""}
                        onClick={() => {
                          router.push(`/templates/${file.id}`);
                        }}
                      >
                        Edit
                      </Button>
                      {/* <Button
                        size="sm"
                        variant="outline"
                        disabled={file.status !== "success"}
                        className={file.status !== "success" ? "opacity-50" : ""}
                        onClick={() => handleOpenClaimDialog(file)}
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button> */}
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

      {/* Claim URL Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Claim URL</DialogTitle>
            <DialogDescription>
              Create a unique URL that students can use to claim their certificate for "{selectedTemplate?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="claimUrl">Claim URL Slug</Label>
              <Input
                id="claimUrl"
                placeholder="e.g., web-dev-bootcamp-2024"
                value={claimUrl}
                onChange={(e) => setClaimUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Full URL will be: {window.location.origin}/claim/{claimUrl || "your-slug"}
              </p>
            </div>
            
            {/* Default Fields Section */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Default Fields (Always Included)</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Recipient Name</span>
                  <span className="text-xs text-gray-500">Required</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Recipient Email</span>
                  <span className="text-xs text-gray-500">Required</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">URN (University Registration Number)</span>
                    <Switch
                      checked={requireUrn}
                      onCheckedChange={setRequireUrn}
                      className="scale-75"
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {requireUrn ? "Required" : "Optional"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Completion Date</span>
                  <span className="text-xs text-gray-500">Optional</span>
                </div>
              </div>
            </div>

            {/* Custom Fields Section */}
            {/* <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Custom Fields</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddFieldDialog(true)}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Field
                </Button>
              </div>
              
              {customFields.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No custom fields added. Click "Add Field" to create custom fields for this claim form.
                </p>
              ) : (
                <div className="space-y-2">
                  {customFields.map((field) => (
                    <div key={field.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium">{field.label}</p>
                        <p className="text-xs text-gray-500">
                          Field name: {field.name} • Type: {field.type}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {field.isRequired ? "Required" : "Optional"}
                        </span>
                        <button
                          onClick={() => removeCustomField(field.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div> */}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isPublic">Enable Public Form</Label>
                <p className="text-xs text-muted-foreground">
                  Allow students to submit certificate requests via this form
                </p>
              </div>
              <Switch
                id="isPublic"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
            
            {isPublic && claimUrl && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm font-medium mb-2">Share this link with students:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background p-2 rounded">
                    {claimFormUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(claimFormUrl)}
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveClaimUrl} disabled={!claimUrl}>
              Save & Generate Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Custom Field Dialog */}
      <Dialog open={showAddFieldDialog} onOpenChange={setShowAddFieldDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Field</DialogTitle>
            <DialogDescription>
              Create a custom field to collect additional information from students
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fieldName">Field Name (slug)</Label>
              <Input
                id="fieldName"
                placeholder="e.g., graduation_year"
                value={newField.name}
                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Used as the database field name (lowercase, no spaces)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldLabel">Field Label</Label>
              <Input
                id="fieldLabel"
                placeholder="e.g., Graduation Year"
                value={newField.label}
                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldType">Field Type</Label>
              <Select
                value={newField.type}
                onValueChange={(value) => setNewField({ ...newField, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="tel">Phone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isRequired"
                checked={newField.isRequired}
                onCheckedChange={(checked) => 
                  setNewField({ ...newField, isRequired: checked === true })
                }
              />
              <Label htmlFor="isRequired">This field is required</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddFieldDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addCustomField}>
              Add Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}