'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { FileUpload } from './FileUpload3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LayoutTemplate, FileText, CheckCircle, Trash2 } from 'lucide-react';

interface UploadedFileType {
  id: string;
  file: File;
  preview: string;
  status: 'uploading' | 'success' | 'error';
  progress?: number;
  url?: string;
  uploadedAt?: Date;
}

export default function ChooseCertificate() {
  const [activeTab, setActiveTab] = useState('excel');
  const [excelFiles, setExcelFiles] = useState<UploadedFileType[]>([]);
  const [templateFiles, setTemplateFiles] = useState<UploadedFileType[]>([]);

  // Mock Excel upload handler
  const handleExcelUpload = async (file: File) => {
    console.log('Excel file selected:', file.name);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock success response
    const mockResponse = {
      success: true,
      rowCount: 20,
      message: 'Excel file uploaded successfully'
    };
    
    console.log(`✅ Excel file "${file.name}" uploaded! Found ${mockResponse.rowCount} records`);
    
    return mockResponse;
  };

  // Mock template upload handler
  const handleTemplateUpload = async (file: File) => {
    console.log('Template file selected:', file.name);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock success response
    const mockResponse = {
      success: true,
      message: 'Template uploaded successfully'
    };
    
    console.log(`✅ Template "${file.name}" uploaded successfully!`);
    
    return mockResponse;
  };

  const handleRemoveExcelFile = (fileId: string) => {
    setExcelFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleRemoveTemplateFile = (fileId: string) => {
    setTemplateFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleResetAll = () => {
    setExcelFiles([]);
    setTemplateFiles([]);
    setActiveTab('excel');
  };

  const hasExcelFiles = excelFiles.length > 0;
  const hasTemplateFiles = templateFiles.length > 0;
  const allExcelSuccess = excelFiles.length > 0 && excelFiles.every(f => f.status === 'success');
  const allTemplateSuccess = templateFiles.length > 0 && templateFiles.every(f => f.status === 'success');

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Choose Certificate Files</CardTitle>
        <CardDescription>
          Upload your Excel data file and certificate template
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="excel" className="gap-2">
              <FileText className="h-4 w-4" />
              Excel Data
              {hasExcelFiles && (
                <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                  {excelFiles.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="template" className="gap-2">
              <LayoutTemplate className="h-4 w-4" />
              Certificate Template
              {hasTemplateFiles && (
                <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                  {templateFiles.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="excel" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Upload your Excel file (.xlsx, .xls, .csv) containing certificate data
            </div>
            
            {allExcelSuccess ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Excel files uploaded successfully!</p>
                      <p className="text-sm text-green-700">
                        {excelFiles.length} file(s) ready for certificate generation
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExcelFiles([])}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <FileUpload
                  onFileUpload={handleExcelUpload}
                  accept=".xlsx,.xls,.csv"
                  buttonText="Upload Excel File"
                  uploadedFiles={excelFiles}
                  onFileRemove={handleRemoveExcelFile}
                />
                {excelFiles.length > 0 && !allExcelSuccess && (
                  <p className="text-xs text-amber-600">
                    ⚠️ Waiting for upload to complete...
                  </p>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="template" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Upload your certificate template (PDF, PNG, JPG)
            </div>
            
            {allTemplateSuccess ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Template uploaded successfully!</p>
                      <p className="text-sm text-green-700">
                        {templateFiles.length} template(s) ready for use
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTemplateFiles([])}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <FileUpload
                  onFileUpload={handleTemplateUpload}
                  accept=".pdf,.png,.jpg,.jpeg"
                  buttonText="Upload Template"
                  uploadedFiles={templateFiles}
                  onFileRemove={handleRemoveTemplateFile}
                />
                {templateFiles.length > 0 && !allTemplateSuccess && (
                  <p className="text-xs text-amber-600">
                    ⚠️ Waiting for upload to complete...
                  </p>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Reset Button - shows when both files are uploaded */}
        {allExcelSuccess && allTemplateSuccess && (
          <div className="mt-6 flex justify-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleResetAll}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Reset & Upload New Files
            </Button>
            <Button 
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              Generate Certificates
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}