"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileSpreadsheet, Settings, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { useGenerateCertificates } from "@/hooks/useCertificates";

interface Field {
  id: string;
  name: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  text: string;
  align: string;
  bold: boolean;
  italic: boolean;
  isDefault?: boolean;
  fieldType?: string;
  isRequired?: boolean;
  mappingKey?: string;
  placeholder?: string;
}

interface MapDataProps {
  templateId: string;
  fields: Field[];
  children: React.ReactNode;
}

export function MapData({
  templateId,
  fields,
  children,
}: MapDataProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [isLoadingHeaders, setIsLoadingHeaders] = useState(false);
  
  const { mutate: generateCertificates, isPending: isGenerating } = useGenerateCertificates();

  // Helper function to get the correct mapping key for a field
  const getMappingKey = (field: Field): string => {
    if (field.mappingKey) return field.mappingKey;
    if (field.isDefault) return field.name;
    return field.name;
  };

  // Helper function to get display name for UI
  const getDisplayName = (field: Field): string => {
    return field.text || field.name;
  };

  const readExcelData = async (file: File) => {
    setIsLoadingHeaders(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet);
      
      if (jsonData.length > 0) {
        const headers = Object.keys(jsonData[0]);
        setExcelHeaders(headers);
        setExcelData(jsonData);
        return { headers, data: jsonData };
      }
      return { headers: [], data: [] };
    } catch (error) {
      console.error("Error reading Excel:", error);
      toast.error("Failed to read Excel file");
      return { headers: [], data: [] };
    } finally {
      setIsLoadingHeaders(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setExcelFile(file);
      const { headers } = await readExcelData(file);
      if (headers.length > 0) {
        toast.success(`File "${file.name}" uploaded successfully. Found ${headers.length} columns.`);
        
        // Auto-map fields if column names match field mapping keys
        const autoMapping: Record<string, string> = {};
        fields.forEach(field => {
          const mappingKey = getMappingKey(field);
          const matchingHeader = headers.find(
            header => header.toLowerCase() === mappingKey.toLowerCase()
          );
          if (matchingHeader) {
            autoMapping[field.id] = matchingHeader;
            console.log(`Auto-mapped field "${getDisplayName(field)}" to column "${matchingHeader}"`);
          }
        });
        
        if (Object.keys(autoMapping).length > 0) {
          setFieldMapping(autoMapping);
          toast.success(`Auto-mapped ${Object.keys(autoMapping).length} fields`);
        }
      } else {
        toast.error("No headers found in Excel file");
      }
    }
  };

  const handleMapField = (fieldId: string, columnName: string) => {
    setFieldMapping((prev) => ({
      ...prev,
      [fieldId]: columnName,
    }));
  };

  const handleGenerate = async () => {
    // Check if excel file exists
    if (!excelFile) {
      toast.error("Please upload an Excel file");
      return;
    }

    // Check required fields are mapped
    const requiredUnmappedFields = fields.filter(
      field => field.isRequired && !fieldMapping[field.id]
    );
    
    if (requiredUnmappedFields.length > 0) {
      toast.error(
        `Please map required fields: ${requiredUnmappedFields.map(f => getDisplayName(f)).join(", ")}`
      );
      return;
    }

    // Proceed with generation
    handleProceedWithGeneration();
  };

  const handleProceedWithGeneration = async () => {
    // Double check excelFile exists (it does here because handleGenerate checks)
    if (!excelFile) {
      toast.error("No Excel file found");
      return;
    }

    const formData = new FormData();
    
    // Append excel file (non-null assertion since we checked above)
    formData.append("excel", excelFile);
    formData.append("templateId", templateId);
    formData.append("fields", JSON.stringify(fields));
    
    // Send mapping with field IDs and their corresponding Excel columns
    const mappingWithKeys = Object.entries(fieldMapping).reduce((acc, [fieldId, columnName]) => {
      const field = fields.find(f => f.id === fieldId);
      if (field) {
        acc[fieldId] = {
          excelColumn: columnName,
          mappingKey: getMappingKey(field),
          isDefault: field.isDefault || false,
          fieldName: field.name,
          displayName: getDisplayName(field)
        };
      }
      return acc;
    }, {} as Record<string, any>);
    
    formData.append("fieldMapping", JSON.stringify(mappingWithKeys));
    
    // Only append excelData if we have it
    if (excelData.length > 0) {
      formData.append("excelData", JSON.stringify(excelData));
    }
    
    // Also append headers for backend reference
    formData.append("excelHeaders", JSON.stringify(excelHeaders));

    generateCertificates(formData, {
      onSuccess: () => {
        setIsOpen(false);
        // Reset state
        setExcelFile(null);
        setFieldMapping({});
        setExcelHeaders([]);
        setExcelData([]);
        setActiveTab("upload");
        toast.success("Certificates generated successfully!");
      },
      onError: (error) => {
        console.error("Generation error:", error);
        toast.error("Failed to generate certificates");
      }
    });
  };

  const handleAutoMapAll = () => {
    const newMapping = { ...fieldMapping };
    fields.forEach(field => {
      if (!newMapping[field.id]) {
        const mappingKey = getMappingKey(field);
        const matchingHeader = excelHeaders.find(
          header => header.toLowerCase() === mappingKey.toLowerCase()
        );
        if (matchingHeader) {
          newMapping[field.id] = matchingHeader;
        }
      }
    });
    setFieldMapping(newMapping);
    const newlyMapped = Object.keys(newMapping).filter(id => !fieldMapping[id]).length;
    if (newlyMapped > 0) {
      toast.success(`Auto-mapped ${newlyMapped} fields`);
    } else {
      toast("Default field removed", { icon: 'ℹ️' });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="!h-[90vh] !max-h-[90vh] p-0"
        style={{ height: "90vh", maxHeight: "90vh" }}
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 border-b shrink-0">
            <SheetTitle className="text-lg font-semibold">
              Generate Certificates
            </SheetTitle>
            <SheetDescription>
              Upload Excel file and map fields to generate certificates in bulk
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6 max-w-4xl mx-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload" className="gap-2">
                    <Upload size={16} />
                    Select Data
                  </TabsTrigger>
                  <TabsTrigger
                    value="map"
                    className="gap-2"
                    disabled={!excelFile}
                  >
                    <FileSpreadsheet size={16} />
                    Map Fields ({Object.keys(fieldMapping).length}/{fields.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-4 space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="excel-upload"
                    />
                    <label
                      htmlFor="excel-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload size={40} className="text-gray-400" />
                      <span className="text-sm font-medium">
                        {excelFile
                          ? excelFile.name
                          : "Click to upload Excel file"}
                      </span>
                      <span className="text-xs text-gray-500">
                        Supports .xlsx, .xls, .csv
                      </span>
                    </label>
                  </div>

                  {excelHeaders.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-700">
                        ✓ Found {excelHeaders.length} columns: {excelHeaders.join(", ")}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Total {excelData.length} records found
                      </p>
                    </div>
                  )}

                  {excelFile && excelHeaders.length > 0 && (
                    <Button
                      onClick={() => setActiveTab("map")}
                      className="w-full"
                    >
                      Continue to Field Mapping ({Object.keys(fieldMapping).length} fields mapped)
                    </Button>
                  )}
                </TabsContent>

                <TabsContent value="map" className="mt-4 space-y-4">
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-blue-700 font-medium">
                        Available Excel Columns:
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {excelHeaders.join(" • ")}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Map Template Fields to Excel Columns</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAutoMapAll}
                        disabled={excelHeaders.length === 0}
                      >
                        Auto-map All
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Select which Excel column corresponds to each template field
                    </p>

                    {isLoadingHeaders ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {fields.map((field) => {
                          const mappingKey = getMappingKey(field);
                          const isMapped = !!fieldMapping[field.id];
                          const isRequired = field.isRequired;
                          
                          return (
                            <div
                              key={field.id}
                              className={`grid grid-cols-2 gap-4 items-center p-3 rounded-lg border ${
                                isMapped ? 'border-green-200 bg-green-50' : 
                                isRequired ? 'border-red-200 bg-red-50' : 'border-gray-200'
                              }`}
                            >
                              <div>
                                <Label className="font-medium flex items-center gap-2">
                                  {getDisplayName(field)}
                                  {isRequired && (
                                    <span className="text-xs text-red-500">(Required)</span>
                                  )}
                                </Label>
                                {field.isDefault && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Expected column: {mappingKey}
                                  </p>
                                )}
                              </div>
                              <Select
                                value={fieldMapping[field.id] || ""}
                                onValueChange={(value) =>
                                  handleMapField(field.id, value)
                                }
                              >
                                <SelectTrigger className={!isMapped && isRequired ? 'border-red-500' : ''}>
                                  <SelectValue placeholder="Select Excel column..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {excelHeaders.map((header) => (
                                    <SelectItem key={header} value={header}>
                                      {header}
                                      {mappingKey.toLowerCase() === header.toLowerCase() && 
                                        " ✓ (Recommended)"
                                      }
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("upload")}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || !excelFile}
                      className="flex-1 gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating Certificates...
                        </>
                      ) : (
                        <>
                          <Settings size={16} />
                          Generate Certificates ({excelData.length} recipients)
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}