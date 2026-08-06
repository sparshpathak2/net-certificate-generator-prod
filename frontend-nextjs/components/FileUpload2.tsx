'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface UploadedFile {
  file: File;
  preview: string;
  status: 'uploading' | 'success' | 'error';
  progress?: number;
  url?: string;
}

interface FileUploadProps {
  onFileUpload?: (file: File) => Promise<any>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  buttonText?: string;
  className?: string;
}

export function FileUpload({ 
  onFileUpload, 
  accept = '.pdf,.png,.jpg,.jpeg', 
  multiple = false,
  maxSize,
  buttonText = "Upload File",
  className 
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate file size
    if (maxSize) {
      const oversizedFiles = files.filter(f => f.size > maxSize);
      if (oversizedFiles.length > 0) {
        alert(`Files larger than ${maxSize / (1024 * 1024)}MB are not allowed`);
        return;
      }
    }

    const newFiles: UploadedFile[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'uploading',
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setIsUploading(true);

    // Upload each file
    for (const uploadedFile of newFiles) {
      try {
        // Simulate progress
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setUploadedFiles(prev =>
            prev.map(f =>
              f.file === uploadedFile.file
                ? { ...f, progress }
                : f
            )
          );
        }
        
        // Call the upload handler if provided
        if (onFileUpload) {
          const result = await onFileUpload(uploadedFile.file);
          setUploadedFiles(prev =>
            prev.map(f =>
              f.file === uploadedFile.file
                ? { ...f, status: 'success', url: result?.url }
                : f
            )
          );
        } else {
          setUploadedFiles(prev =>
            prev.map(f =>
              f.file === uploadedFile.file
                ? { ...f, status: 'success' }
                : f
            )
          );
        }
      } catch (error) {
        setUploadedFiles(prev =>
          prev.map(f =>
            f.file === uploadedFile.file
              ? { ...f, status: 'error' }
              : f
          )
        );
      }
    }

    setIsUploading(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileToRemove: File) => {
    const fileToRevoke = uploadedFiles.find(f => f.file === fileToRemove);
    if (fileToRevoke?.preview) {
      URL.revokeObjectURL(fileToRevoke.preview);
    }
    setUploadedFiles(prev => prev.filter(f => f.file !== fileToRemove));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <File className="h-8 w-8 text-blue-500" />;
    if (file.type === 'application/pdf') return <File className="h-8 w-8 text-red-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
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
        {buttonText}
      </Button>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</h4>
          {uploadedFiles.map((uploadedFile, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {/* File Preview */}
                  {uploadedFile.status === 'uploading' ? (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      {getFileIcon(uploadedFile.file)}
                    </div>
                  )}

                  {/* File Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium line-clamp-1">
                          {uploadedFile.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(uploadedFile.file.size / (1024 * 1024)).toFixed(2)} MB •{' '}
                          {uploadedFile.file.type.split('/')[1]?.toUpperCase() || 'Unknown'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeFile(uploadedFile.file)}
                        disabled={uploadedFile.status === 'uploading'}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Progress Bar */}
                    {uploadedFile.status === 'uploading' && (
                      <div className="mt-2">
                        <Progress value={uploadedFile.progress || 0} className="h-1" />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {uploadedFile.progress || 0}% uploaded
                        </p>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    {uploadedFile.status === 'success' && (
                      <p className="mt-1 text-xs text-green-600">Upload complete!</p>
                    )}
                    {uploadedFile.status === 'error' && (
                      <p className="mt-1 text-xs text-red-600">Upload failed. Please try again.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}