'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  status: 'uploading' | 'success' | 'error';
  progress?: number;
  url?: string;
  uploadedAt?: Date;
}

interface FileUploadProps {
  onFileUpload?: (file: File) => Promise<any>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  buttonText?: string;
  className?: string;
  uploadedFiles?: UploadedFile[];
  onFileRemove?: (fileId: string) => void;
  onFilesChange?: (files: UploadedFile[]) => void;
}

export function FileUpload({ 
  onFileUpload, 
  accept = '.pdf,.png,.jpg,.jpeg', 
  multiple = false,
  maxSize,
  buttonText = "Upload File",
  className,
  uploadedFiles: externalFiles = [],
  onFileRemove,
  onFilesChange
}: FileUploadProps) {
  const [internalFiles, setInternalFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use external files if provided, otherwise use internal state
  const files = externalFiles.length > 0 ? externalFiles : internalFiles;

  // Notify parent when internal files change
  useEffect(() => {
    if (onFilesChange && externalFiles.length === 0) {
      onFilesChange(internalFiles);
    }
  }, [internalFiles, onFilesChange, externalFiles.length]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const addFile = (file: File) => {
    const newFile: UploadedFile = {
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      status: 'uploading',
      uploadedAt: new Date(),
    };
    
    if (externalFiles.length > 0 && onFilesChange) {
      // If using external state, update through parent
      onFilesChange([...externalFiles, newFile]);
    } else {
      setInternalFiles(prev => [...prev, newFile]);
    }
    
    return newFile;
  };

  const updateFileStatus = (fileId: string, updates: Partial<UploadedFile>) => {
    if (externalFiles.length > 0 && onFilesChange) {
      const updatedFiles = externalFiles.map(f =>
        f.id === fileId ? { ...f, ...updates } : f
      );
      onFilesChange(updatedFiles);
    } else {
      setInternalFiles(prev =>
        prev.map(f =>
          f.id === fileId ? { ...f, ...updates } : f
        )
      );
    }
  };

  const removeFile = (fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId);
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    
    if (externalFiles.length > 0 && onFileRemove) {
      onFileRemove(fileId);
    } else if (onFilesChange) {
      const filteredFiles = files.filter(f => f.id !== fileId);
      onFilesChange(filteredFiles);
    } else {
      setInternalFiles(prev => prev.filter(f => f.id !== fileId));
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    // Validate file size
    if (maxSize) {
      const oversizedFiles = selectedFiles.filter(f => f.size > maxSize);
      if (oversizedFiles.length > 0) {
        alert(`Files larger than ${maxSize / (1024 * 1024)}MB are not allowed`);
        return;
      }
    }

    setIsUploading(true);

    // Process each file
    for (const file of selectedFiles) {
      const newFile = addFile(file);
      
      try {
        // Simulate progress
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 200));
          updateFileStatus(newFile.id, { progress });
        }
        
        // Call the upload handler if provided
        if (onFileUpload) {
          const result = await onFileUpload(file);
          updateFileStatus(newFile.id, { 
            status: 'success', 
            url: result?.url 
          });
        } else {
          updateFileStatus(newFile.id, { status: 'success' });
        }
      } catch (error) {
        updateFileStatus(newFile.id, { status: 'error' });
      }
    }

    setIsUploading(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <File className="h-8 w-8 text-blue-500" />;
    if (file.type === 'application/pdf') return <File className="h-8 w-8 text-red-500" />;
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) return <File className="h-8 w-8 text-green-500" />;
    if (file.name.endsWith('.csv')) return <File className="h-8 w-8 text-purple-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
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
        {isUploading ? 'Uploading...' : buttonText}
      </Button>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">
              Uploaded Files ({files.length})
            </h4>
            {files.every(f => f.status === 'success') && files.length > 0 && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                All files uploaded
              </span>
            )}
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {files.map((uploadedFile) => (
              <Card key={uploadedFile.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* File Icon */}
                    <div className="flex-shrink-0">
                      {uploadedFile.status === 'uploading' ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        </div>
                      ) : uploadedFile.status === 'success' ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        </div>
                      ) : uploadedFile.status === 'error' ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50">
                          <AlertCircle className="h-6 w-6 text-red-500" />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                          {getFileIcon(uploadedFile.file)}
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {uploadedFile.file.name}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <p className="text-xs text-gray-500">
                              {formatFileSize(uploadedFile.file.size)}
                            </p>
                            <p className="text-xs text-gray-500">•</p>
                            <p className="text-xs text-gray-500">
                              {uploadedFile.file.type.split('/')[1]?.toUpperCase() || 'Unknown'}
                            </p>
                            {uploadedFile.uploadedAt && (
                              <>
                                <p className="text-xs text-gray-500">•</p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(uploadedFile.uploadedAt)}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                          onClick={() => removeFile(uploadedFile.id)}
                          disabled={uploadedFile.status === 'uploading'}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Progress Bar */}
                      {uploadedFile.status === 'uploading' && (
                        <div className="mt-2">
                          <Progress value={uploadedFile.progress || 0} className="h-1.5" />
                          <p className="mt-1 text-xs text-blue-600">
                            Uploading... {uploadedFile.progress || 0}%
                          </p>
                        </div>
                      )}
                      
                      {/* Status Message */}
                      {uploadedFile.status === 'success' && uploadedFile.url && (
                        <p className="mt-1 text-xs text-green-600 truncate">
                          URL: {uploadedFile.url}
                        </p>
                      )}
                      {uploadedFile.status === 'error' && (
                        <p className="mt-1 text-xs text-red-600">
                          Upload failed. Please try again.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}