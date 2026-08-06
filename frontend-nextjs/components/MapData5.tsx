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
  const [isLoadingHeaders, setIsLoadingHeaders] = useState(false);
  
  const { mutate: generateCertificates, isPending: isGenerating } = useGenerateCertificates();

  const readExcelHeaders = async (file: File) => {
    setIsLoadingHeaders(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet);
      
      if (jsonData.length > 0) {
        const headers = Object.keys(jsonData[0]);
        setExcelHeaders(headers);
        return headers;
      }
      return [];
    } catch (error) {
      console.error("Error reading Excel:", error);
      toast.error("Failed to read Excel file");
      return [];
    } finally {
      setIsLoadingHeaders(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setExcelFile(file);
      const headers = await readExcelHeaders(file);
      if (headers.length > 0) {
        toast.success(`File "${file.name}" uploaded successfully. Found ${headers.length} columns.`);
      } else {
        toast.error("No headers found in Excel file");
      }
    }
  };

  const handleMapField = (fieldName: string, columnName: string) => {
    setFieldMapping((prev) => ({
      ...prev,
      [fieldName]: columnName,
    }));
  };

  const handleGenerate = async () => {
    if (!excelFile) {
      toast.error("Please upload an Excel file");
      return;
    }

    const unmappedFields = fields.filter((field) => !fieldMapping[field.name]);
    if (unmappedFields.length > 0) {
      toast.error(
        `Please map all fields: ${unmappedFields.map((f) => f.name).join(", ")}`
      );
      return;
    }

    const formData = new FormData();
    formData.append("excel", excelFile);
    formData.append("templateId", templateId);
    formData.append("fields", JSON.stringify(fields));
    formData.append("fieldMapping", JSON.stringify(fieldMapping));

    generateCertificates(formData, {
      onSuccess: () => {
        setIsOpen(false);
        // Reset state
        setExcelFile(null);
        setFieldMapping({});
        setExcelHeaders([]);
        setActiveTab("upload");
      },
    });
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
                    Map Fields
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
                    </div>
                  )}

                  {excelFile && (
                    <Button
                      onClick={() => setActiveTab("map")}
                      className="w-full"
                    >
                      Continue to Field Mapping
                    </Button>
                  )}
                </TabsContent>

                <TabsContent value="map" className="mt-4 space-y-4">
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-blue-700">
                        Available columns: {excelHeaders.join(", ")}
                      </p>
                    </div>

                    <h3 className="font-medium">
                      Map Template Fields to Excel Columns
                    </h3>
                    <p className="text-sm text-gray-500">
                      Select which Excel column corresponds to each template field
                    </p>

                    {isLoadingHeaders ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {fields.map((field) => (
                          <div
                            key={field.id}
                            className="grid grid-cols-2 gap-4 items-center"
                          >
                            <Label className="font-medium">{field.name}</Label>
                            <Select
                              value={fieldMapping[field.name] || ""}
                              onValueChange={(value) =>
                                handleMapField(field.name, value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Excel column..." />
                              </SelectTrigger>
                              <SelectContent>
                                {excelHeaders.map((header) => (
                                  <SelectItem key={header} value={header}>
                                    {header}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
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
                      disabled={isGenerating}
                      className="flex-1 gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Settings size={16} />
                          Generate Certificates
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