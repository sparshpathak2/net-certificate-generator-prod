'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { FileUpload } from './FileUpload2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LayoutTemplate, FileText, CheckCircle } from 'lucide-react';
// import axios from 'axios'; // Commented out for now
// import { toast } from 'sonner'; // Commented out for now

export default function ChooseCertificate() {
  const [activeTab, setActiveTab] = useState('excel');
  const [excelUploaded, setExcelUploaded] = useState(false);
  const [templateUploaded, setTemplateUploaded] = useState(false);
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [templateFileName, setTemplateFileName] = useState<string | null>(null);

  // Mock upload handler - just for UI demo
  const handleExcelUpload = async (file: File) => {
    console.log('Excel file selected:', file.name);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update UI state
    setExcelUploaded(true);
    setExcelFileName(file.name);
    
    // Mock success response
    const mockResponse = {
      success: true,
      rowCount: 20,
      message: 'Excel file uploaded successfully'
    };
    
    // Show mock alert (replace with toast later)
    alert(`✅ Excel file "${file.name}" uploaded successfully!\nFound ${mockResponse.rowCount} records.`);
    
    return mockResponse;
  };

  // Mock template upload handler
  const handleTemplateUpload = async (file: File) => {
    console.log('Template file selected:', file.name);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update UI state
    setTemplateUploaded(true);
    setTemplateFileName(file.name);
    
    // Mock success response
    const mockResponse = {
      success: true,
      message: 'Template uploaded successfully'
    };
    
    // Show mock alert
    alert(`✅ Template "${file.name}" uploaded successfully!`);
    
    return mockResponse;
  };

  const handleReset = () => {
    setExcelUploaded(false);
    setTemplateUploaded(false);
    setExcelFileName(null);
    setTemplateFileName(null);
    setActiveTab('excel');
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Choose Certificate Files</CardTitle>
        <CardDescription>
          Upload your Excel data file and certificate template
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="excel" className="gap-2">
              <FileText className="h-4 w-4" />
              Excel Data
            </TabsTrigger>
            <TabsTrigger value="template" className="gap-2">
              <LayoutTemplate className="h-4 w-4" />
              Certificate Template
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="excel" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Upload your Excel file (.xlsx, .xls, .csv) containing certificate data
            </div>
            
            {excelUploaded ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Excel file uploaded!</p>
                    <p className="text-sm text-green-700">{excelFileName}</p>
                  </div>
                </div>
              </div>
            ) : (
              <FileUpload
                onFileUpload={handleExcelUpload}
                accept=".xlsx,.xls,.csv"
                buttonText="Upload Excel File"
              />
            )}
          </TabsContent>
          
          <TabsContent value="template" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Upload your certificate template (PDF, PNG, JPG)
            </div>
            
            {templateUploaded ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Template uploaded!</p>
                    <p className="text-sm text-green-700">{templateFileName}</p>
                  </div>
                </div>
              </div>
            ) : (
              <FileUpload
                onFileUpload={handleTemplateUpload}
                accept=".pdf,.png,.jpg,.jpeg"
                buttonText="Upload Template"
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Reset Button - shows when both files are uploaded */}
        {excelUploaded && templateUploaded && (
          <div className="mt-6 flex justify-center">
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="gap-2"
            >
              Reset & Upload New Files
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}