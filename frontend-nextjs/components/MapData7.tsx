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
  fontWeight?: string;
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
  // pdfWidth?: number; // ✅ NEW - for scaling
  // pdfHeight?: number; // ✅ NEW - for scaling
}

interface MapDataProps {
  templateId: string;
  fields: Field[];
  children: React.ReactNode;
}

export function MapData({ templateId, fields, children }: MapDataProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [isLoadingHeaders, setIsLoadingHeaders] = useState(false);

  const { mutate: generateCertificates, isPending: isGenerating } =
    useGenerateCertificates();

  const getMappingKey = (field: Field): string => {
    if (field.mappingKey) return field.mappingKey;
    if (field.isDefault) return field.name;
    return field.name;
  };

  const getDisplayName = (field: Field): string => {
    return field.text || field.name;
  };

  const readExcelData = async (file: File) => {
    setIsLoadingHeaders(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData =
        XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet);

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

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setExcelFile(file);
      const { headers } = await readExcelData(file);
      if (headers.length > 0) {
        toast.success(`File uploaded. Found ${headers.length} columns.`);

        // Auto-map fields
        const autoMapping: Record<string, string> = {};
        fields.forEach((field) => {
          const mappingKey = getMappingKey(field);
          const matchingHeader = headers.find(
            (header) => header.toLowerCase() === mappingKey.toLowerCase(),
          );
          if (matchingHeader) {
            autoMapping[field.id] = matchingHeader;
          }
        });

        if (Object.keys(autoMapping).length > 0) {
          setFieldMapping(autoMapping);
        }
      }
    }
  };

  const handleMapField = (fieldId: string, columnName: string) => {
    setFieldMapping((prev) => ({
      ...prev,
      [fieldId]: columnName,
    }));
  };

  // ✅ NEW function - determines font weight from field properties
  const getFontWeight = (field: Field): string => {
    // If fontWeight is explicitly set, use it
    if (field.fontWeight) return field.fontWeight;

    // Fallback to legacy bold/italic flags
    if (field.bold && field.italic) return "bold-italic";
    if (field.bold) return "bold";
    if (field.italic) return "italic";

    return "regular";
  };

  // const handleGenerate = async () => {
  //   if (!excelFile) {
  //     toast.error("Please upload an Excel file");
  //     return;
  //   }

  //   const requiredUnmappedFields = fields.filter(
  //     (field) => field.isRequired && !fieldMapping[field.id],
  //   );

  //   if (requiredUnmappedFields.length > 0) {
  //     toast.error(
  //       `Please map required fields: ${requiredUnmappedFields.map((f) => getDisplayName(f)).join(", ")}`,
  //     );
  //     return;
  //   }

  //   // Create FormData
  //   const formData = new FormData();
  //   formData.append("excel", excelFile);
  //   formData.append("templateId", templateId);

  //   // Send fields in the original format that backend expects
  //   formData.append("fields", JSON.stringify(fields));

  //   // Create a simple field mapping (field name -> excel column)
  //   // This is what your backend likely expects
  //   const simpleMapping: Record<string, string> = {};
  //   Object.entries(fieldMapping).forEach(([fieldId, columnName]) => {
  //     const field = fields.find((f) => f.id === fieldId);
  //     if (field) {
  //       // Use the field name as the key (not ID)
  //       simpleMapping[field.name] = columnName;
  //     }
  //   });

  //   formData.append("fieldMapping", JSON.stringify(simpleMapping));

  //   // Also send the Excel data for preview
  //   if (excelData.length > 0) {
  //     formData.append("excelData", JSON.stringify(excelData));
  //   }

  //   generateCertificates(formData, {
  //     onSuccess: () => {
  //       setIsOpen(false);
  //       setExcelFile(null);
  //       setFieldMapping({});
  //       setExcelHeaders([]);
  //       setExcelData([]);
  //       setActiveTab("upload");
  //       toast.success("Certificates generated successfully!");
  //     },
  //     onError: (error: any) => {
  //       console.error("Generation error:", error);
  //       toast.error(error?.message || "Failed to generate certificates");
  //     },
  //   });
  // };

  const handleGenerate = async () => {
    if (!excelFile) {
      toast.error("Please upload an Excel file");
      return;
    }

    const requiredUnmappedFields = fields.filter(
      (field) => field.isRequired && !fieldMapping[field.id],
    );

    if (requiredUnmappedFields.length > 0) {
      toast.error(
        `Please map required fields: ${requiredUnmappedFields.map((f) => getDisplayName(f)).join(", ")}`,
      );
      return;
    }

    // Create FormData
    const formData = new FormData();
    formData.append("excel", excelFile);
    formData.append("templateId", templateId);

    // ✅ CHANGED: Process fields to ensure fontWeight is included
    const fieldsWithFontWeight = fields.map((field) => ({
      ...field,
      // If fontWeight isn't set, derive it from bold/italic
      fontWeight:
        field.fontWeight ||
        (field.bold ? "bold" : field.italic ? "italic" : "regular"),
    }));

    // Send fields with fontWeight
    formData.append("fields", JSON.stringify(fieldsWithFontWeight));

    // Create a simple field mapping (field name -> excel column)
    const simpleMapping: Record<string, string> = {};
    Object.entries(fieldMapping).forEach(([fieldId, columnName]) => {
      const field = fields.find((f) => f.id === fieldId);
      if (field) {
        simpleMapping[field.name] = columnName;
      }
    });

    formData.append("fieldMapping", JSON.stringify(simpleMapping));

    if (excelData.length > 0) {
      formData.append("excelData", JSON.stringify(excelData));
    }

    generateCertificates(formData, {
      onSuccess: () => {
        setIsOpen(false);
        setExcelFile(null);
        setFieldMapping({});
        setExcelHeaders([]);
        setExcelData([]);
        setActiveTab("upload");
        toast.success("Certificates generated successfully!");
      },
      onError: (error: any) => {
        console.error("Generation error:", error);
        toast.error(error?.message || "Failed to generate certificates");
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
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
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
                        ✓ Found {excelHeaders.length} columns
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {excelData.length} records ready
                      </p>
                    </div>
                  )}

                  {excelFile && excelHeaders.length > 0 && (
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
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-700">Excel Columns:</p>
                      <p className="text-xs text-blue-600 mt-1">
                        {excelHeaders.join(" • ")}
                      </p>
                    </div>

                    <h3 className="font-medium">Map Template Fields</h3>

                    {isLoadingHeaders ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {fields.map((field) => {
                          const isMapped = !!fieldMapping[field.id];
                          const isRequired = field.isRequired;

                          return (
                            <div
                              key={field.id}
                              className={`grid grid-cols-2 gap-4 items-center p-3 rounded-lg border ${
                                isMapped
                                  ? "border-green-200 bg-green-50"
                                  : isRequired
                                    ? "border-red-200 bg-red-50"
                                    : "border-gray-200"
                              }`}
                            >
                              <div>
                                <Label className="font-medium">
                                  {getDisplayName(field)}
                                  {isRequired && (
                                    <span className="text-xs text-red-500 ml-1">
                                      *
                                    </span>
                                  )}
                                </Label>
                                {field.isDefault && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Maps to: {getMappingKey(field)}
                                  </p>
                                )}
                              </div>
                              <Select
                                value={fieldMapping[field.id] || ""}
                                onValueChange={(value) =>
                                  handleMapField(field.id, value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select column..." />
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
                          Generating...
                        </>
                      ) : (
                        <>
                          <Settings size={16} />
                          Generate ({excelData.length} certificates)
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
