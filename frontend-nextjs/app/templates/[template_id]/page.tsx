"use client";

import { useParams } from "next/navigation";
import { TemplateEditor } from "@/components/TemplateEditor12";
import {
  useGetTemplateById,
  useUpdateTemplateFields,
} from "@/hooks/useTemplates";
import { Loader2 } from "lucide-react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SidebarLeft } from "@/components/sidebar-left";

export default function TemplateEditorPage() {
  const { template_id } = useParams();
  const { data, isLoading } = useGetTemplateById(template_id as string);
  // const { mutate: updateFields, isPending: isSaving } =
  //   useUpdateTemplateFields();

  const {
    mutate: updateFields,
    isPending: isSaving,
    isSuccess: isSaveSuccess,
  } = useUpdateTemplateFields();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data?.template) {
    return <div>Template not found</div>;
  }

  // ✅ Check if s3Url exists
  if (!data.template.s3Url) {
    return (
      <div>Template URL not available. Please re-upload the template.</div>
    );
  }

  // Convert database fields to frontend format
  const initialFields =
    data.template.fields?.map((field: any) => ({
      id: field.id,
      name: field.fieldLabel,
      x: field.x,
      y: field.y,
      fontSize: field.fontSize,
      // fontFamily: "Arial",
      fontFamily: "Lobster", // ✅ All fields use Lobster
      fontWeight: "regular", // ✅ All fields use regular weight
      color: field.fontColor,
      text: field.fieldLabel,
      align: field.alignment,
      bold: false,
      italic: false,
    })) || [];

  // const handleSaveFields = (fields: any[]) => {
  //   console.log("Saved fields:", fields);
  //   // TODO: Save fields to database
  //   alert(`Saved ${fields.length} fields! Check console for details.`);
  // };

  // const handleSaveFields = (fields: any[]) => {
  //   console.log("Saving fields:", fields);

  //   const formattedFields = fields.map((field, index) => ({
  //     id: field.id,
  //     fieldName: field.name.toLowerCase().replace(/\s/g, "_"),
  //     fieldLabel: field.name,
  //     x: field.x,
  //     y: field.y,
  //     fontSize: field.fontSize,
  //     fontColor: field.color,
  //     alignment: field.align,
  //     isRequired: true,
  //     order: index,
  //   }));

  //   updateFields({
  //     id: template_id as string,
  //     fields: formattedFields,
  //   });
  // };

  const handleSaveFields = async (fields: any[]) => {
    console.log("Saving fields:", fields);

    const formattedFields = fields.map((field, index) => ({
      id: field.id,
      fieldName: field.name.toLowerCase().replace(/\s/g, "_"),
      fieldLabel: field.name,
      x: field.x,
      y: field.y,
      fontSize: field.fontSize,
      fontColor: field.color,
      alignment: field.align,
      isRequired: true,
      order: index,
      // fontFamily: "Arial",
      fontFamily: "Lobster", // ✅ Save Lobster
      fontWeight: "regular", // ✅ Save regular weight
    }));

    // Return the promise from the mutation
    return updateFields({
      id: template_id as string,
      fields: formattedFields,
    });
  };

  // const handleGenerateCertificates = (fields: any[]) => {
  //   console.log("Generating certificates with fields:", fields);
  //   // Navigate to certificate generation page with template ID and fields
  //   // router.push(`/generate-certificates/${template_id}`);
  // };

  // Update handleGenerateCertificates to accept FormData
  const handleGenerateCertificates = async (formData: FormData) => {
    // Call your API to generate certificates
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        // Download the generated ZIP file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "certificates.zip";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Generation failed:", error);
    }
  };

  return (
    <SidebarProvider>
      <SidebarLeft />
      <SidebarInset className="h-screen flex flex-col">
        <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b bg-background">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <h1 className="font-semibold">{data.template.originalName}</h1>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-hidden">
          <TemplateEditor
            templateUrl={data.template.s3Url}
            templateId={template_id as string}
            onSave={handleSaveFields}
            onGenerate={handleGenerateCertificates}
            initialFields={initialFields}
            isSaving={isSaving}
            // isSaveSuccess={isSaveSuccess}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
