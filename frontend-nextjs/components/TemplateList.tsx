'use client';

import React, { useState } from 'react';
import { 
  useGetAllTemplates, 
  useDeleteTemplate, 
  useDownloadTemplate,
  useUploadTemplate 
} from '@/hooks/useTemplates';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Upload, Trash, Download, Eye, Loader2 } from 'lucide-react';

export function TemplateList() {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const { data: templatesData, isLoading, refetch } = useGetAllTemplates();
  const uploadTemplate = useUploadTemplate();
  const deleteTemplate = useDeleteTemplate();
  const downloadTemplate = useDownloadTemplate();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    await uploadTemplate.mutateAsync(file);
    setUploading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteTemplate.mutateAsync(id);
    }
  };

  const handleDownload = async (filename: string, originalName: string) => {
    await downloadTemplate.mutateAsync({ filename, originalName });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  const templates = templatesData?.templates || [];

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? 'Uploading...' : 'Upload Template'}
        </Button>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No templates uploaded yet. Click "Upload Template" to add one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{template.originalName}</p>
                    <div className="flex gap-3 text-sm text-gray-500">
                      <span>{(template.size / 1024 / 1024).toFixed(2)} MB</span>
                      <span>•</span>
                      <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(template.filename, template.originalName)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(template.url, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(template.id, template.originalName)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
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