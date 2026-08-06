// "use client";

// import { useState } from "react";
// import { useParams } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
// import toast from "react-hot-toast";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import { apiClient } from "@/lib/api-client";

// interface TemplateField {
//     id: string;
//     fieldLabel: string;
//     fieldName: string;
//     isRequired: boolean;
// }

// interface Template {
//     id: string;
//     name: string;
//     description: string;
//     fields: TemplateField[];
//     thumbnail?: string;
// }

// // Query function to fetch template by claim URL
// const fetchTemplateByClaimUrl = async (claimUrl: string): Promise<Template> => {
//     const { data } = await apiClient.get(`/template/public/claim/${claimUrl}`);
//     return data.template;
// };

// // Mutation function to submit claim request
// const submitClaimRequest = async (formData: any) => {
//     const { data } = await apiClient.post("/public/claim-certificate", formData);
//     return data;
// };

// export default function ClaimCertificatePage() {
//     const { claimUrl } = useParams();
//     const [success, setSuccess] = useState(false);
//     const [formData, setFormData] = useState({
//         studentName: "",
//         studentEmail: "",
//         studentPhone: "",
//         studentId: "",
//         completionDate: "",
//         additionalInfo: "",
//     });

//     // React Query for fetching template
//     const { 
//         data: template, 
//         isLoading, 
//         error 
//     } = useQuery({
//         queryKey: ['template', 'claim', claimUrl],
//         queryFn: () => fetchTemplateByClaimUrl(claimUrl as string),
//         enabled: !!claimUrl,
//         retry: 1,
//     });

//     // React Query mutation for submitting claim
//     const { mutate: submitClaim, isPending: isSubmitting } = useMutation({
//         mutationFn: submitClaimRequest,
//         onSuccess: () => {
//             setSuccess(true);
//             toast.success("Request submitted successfully! You will receive an email once approved.");
//             // Reset form
//             setFormData({
//                 studentName: "",
//                 studentEmail: "",
//                 studentPhone: "",
//                 studentId: "",
//                 completionDate: "",
//                 additionalInfo: "",
//             });
//             // Reset success message after 5 seconds
//             setTimeout(() => setSuccess(false), 5000);
//         },
//         onError: (error: any) => {
//             console.error("Error submitting claim:", error);
//             toast.error(error.response?.data?.message || "Failed to submit request");
//         },
//     });

//     const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//         setFormData({
//             ...formData,
//             [e.target.name]: e.target.value,
//         });
//     };

//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault();
        
//         submitClaim({
//             ...formData,
//             templateId: template?.id,
//             courseName: template?.name,
//         });
//     };

//     // Loading state
//     if (isLoading) {
//         return (
//             <div className="min-h-screen flex items-center justify-center">
//                 <Loader2 className="h-8 w-8 animate-spin" />
//             </div>
//         );
//     }

//     // Error state
//     if (error || !template) {
//         return (
//             <div className="min-h-screen flex items-center justify-center">
//                 <Card className="max-w-md">
//                     <CardContent className="pt-6">
//                         <Alert variant="destructive">
//                             <AlertCircle className="h-4 w-4" />
//                             <AlertDescription>
//                                 Invalid claim link or this form is no longer active.
//                                 Please contact the administrator.
//                             </AlertDescription>
//                         </Alert>
//                     </CardContent>
//                 </Card>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
//             <div className="max-w-2xl mx-auto">
//                 <Card className="shadow-xl">
//                     <CardHeader className="text-center">
//                         <CardTitle className="text-3xl font-bold text-gray-900">
//                             {template.name}
//                         </CardTitle>
//                         <CardDescription className="text-gray-600">
//                             {template.description || "Please fill out the form below to claim your certificate"}
//                         </CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                         {success ? (
//                             <Alert className="bg-green-50 border-green-200">
//                                 <CheckCircle className="h-4 w-4 text-green-600" />
//                                 <AlertDescription className="text-green-700">
//                                     Your request has been submitted successfully! 
//                                     You will receive an email once your certificate is approved.
//                                 </AlertDescription>
//                             </Alert>
//                         ) : (
//                             <form onSubmit={handleSubmit} className="space-y-6">
//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                     <div className="space-y-2">
//                                         <Label htmlFor="studentName">Full Name *</Label>
//                                         <Input
//                                             id="studentName"
//                                             name="studentName"
//                                             value={formData.studentName}
//                                             onChange={handleChange}
//                                             placeholder="Enter your full name"
//                                             required
//                                         />
//                                     </div>
//                                     <div className="space-y-2">
//                                         <Label htmlFor="studentEmail">Email Address *</Label>
//                                         <Input
//                                             id="studentEmail"
//                                             name="studentEmail"
//                                             type="email"
//                                             value={formData.studentEmail}
//                                             onChange={handleChange}
//                                             placeholder="you@example.com"
//                                             required
//                                         />
//                                     </div>
//                                 </div>

//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                     <div className="space-y-2">
//                                         <Label htmlFor="studentPhone">Phone Number</Label>
//                                         <Input
//                                             id="studentPhone"
//                                             name="studentPhone"
//                                             value={formData.studentPhone}
//                                             onChange={handleChange}
//                                             placeholder="+91 XXXXX XXXXX"
//                                         />
//                                     </div>
//                                     <div className="space-y-2">
//                                         <Label htmlFor="studentId">Student ID / Roll Number</Label>
//                                         <Input
//                                             id="studentId"
//                                             name="studentId"
//                                             value={formData.studentId}
//                                             onChange={handleChange}
//                                             placeholder="Enter your student ID"
//                                         />
//                                     </div>
//                                 </div>

//                                 <div className="space-y-2">
//                                     <Label htmlFor="completionDate">Completion Date</Label>
//                                     <Input
//                                         id="completionDate"
//                                         name="completionDate"
//                                         type="date"
//                                         value={formData.completionDate}
//                                         onChange={handleChange}
//                                     />
//                                 </div>

//                                 <div className="space-y-2">
//                                     <Label htmlFor="additionalInfo">Additional Information</Label>
//                                     <textarea
//                                         id="additionalInfo"
//                                         name="additionalInfo"
//                                         rows={3}
//                                         className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                         value={formData.additionalInfo}
//                                         onChange={handleChange}
//                                         placeholder="Any additional information you'd like to provide..."
//                                     />
//                                 </div>

//                                 <Button type="submit" className="w-full" disabled={isSubmitting}>
//                                     {isSubmitting ? (
//                                         <>
//                                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                                             Submitting...
//                                         </>
//                                     ) : (
//                                         "Submit Request"
//                                     )}
//                                 </Button>

//                                 <p className="text-xs text-gray-500 text-center">
//                                     Your request will be reviewed by an administrator.
//                                     You will receive an email once approved.
//                                 </p>
//                             </form>
//                         )}
//                     </CardContent>
//                 </Card>
//             </div>
//         </div>
//     );
// }


// "use client";

// import { useState } from "react";
// import { useParams } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
// import toast from "react-hot-toast";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import { apiClient } from "@/lib/api-client";

// interface TemplateField {
//     id: string;
//     fieldLabel: string;
//     fieldName: string;
//     isRequired: boolean;
// }

// interface Template {
//     id: string;
//     name: string;
//     description: string;
//     fields: TemplateField[];
//     thumbnail?: string;
// }

// interface ClaimFormConfig {
//     requireUrn: boolean;
// }

// // Query function to fetch template by claim URL
// const fetchTemplateByClaimUrl = async (claimUrl: string): Promise<Template> => {
//     const { data } = await apiClient.get(`/template/public/claim/${claimUrl}`);
//     return data.template;
// };

// // Mutation function to submit claim request
// const submitClaimRequest = async (formData: any) => {
//     const { data } = await apiClient.post("/public/claim-certificate", formData);
//     return data;
// };

// export default function ClaimCertificatePage() {
//     const { claimUrl } = useParams();
//     const [success, setSuccess] = useState(false);
//     const [formData, setFormData] = useState<Record<string, string>>({
//         studentName: "",
//         studentEmail: "",
//         studentUrn: "",
//     });
//     const [config, setConfig] = useState<ClaimFormConfig>({ requireUrn: false });

//     // React Query for fetching template
//     const { 
//         data: template, 
//         isLoading, 
//         error 
//     } = useQuery({
//         queryKey: ['template', 'claim', claimUrl],
//         queryFn: () => fetchTemplateByClaimUrl(claimUrl as string),
//         enabled: !!claimUrl,
//         retry: 1,
//     });

//     // Initialize form fields when template loads
//     const initializeFormFields = (template: Template) => {
//         const initialFields: Record<string, string> = {
//             studentName: "",
//             studentEmail: "",
//             studentUrn: "",
//         };
//         template.fields.forEach(field => {
//             initialFields[field.fieldName] = "";
//         });
//         setFormData(initialFields);
//     };

//     // React Query mutation for submitting claim
//     const { mutate: submitClaim, isPending: isSubmitting } = useMutation({
//         mutationFn: submitClaimRequest,
//         onSuccess: () => {
//             setSuccess(true);
//             toast.success("Request submitted successfully! You will receive an email once approved.");
//             // Reset form
//             const resetFields: Record<string, string> = {
//                 studentName: "",
//                 studentEmail: "",
//                 studentUrn: "",
//             };
//             template?.fields.forEach(field => {
//                 resetFields[field.fieldName] = "";
//             });
//             setFormData(resetFields);
//             // Reset success message after 5 seconds
//             setTimeout(() => setSuccess(false), 5000);
//         },
//         onError: (error: any) => {
//             console.error("Error submitting claim:", error);
//             toast.error(error.response?.data?.message || "Failed to submit request");
//         },
//     });

//     const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//         setFormData({
//             ...formData,
//             [e.target.name]: e.target.value,
//         });
//     };

//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault();
        
//         // Validate required fields
//         if (!formData.studentName) {
//             toast.error("Please enter your full name");
//             return;
//         }
//         if (!formData.studentEmail) {
//             toast.error("Please enter your email address");
//             return;
//         }
//         if (config.requireUrn && !formData.studentUrn) {
//             toast.error("Please enter your University Registration Number (URN)");
//             return;
//         }

//         // Validate template fields
//         for (const field of template?.fields || []) {
//             if (field.isRequired && !formData[field.fieldName]) {
//                 toast.error(`Please fill in "${field.fieldLabel}"`);
//                 return;
//             }
//         }
        
//         submitClaim({
//             ...formData,
//             templateId: template?.id,
//             courseName: template?.name,
//         });
//     };

//     // Loading state
//     if (isLoading) {
//         return (
//             <div className="min-h-screen flex items-center justify-center">
//                 <Loader2 className="h-8 w-8 animate-spin" />
//             </div>
//         );
//     }

//     // Error state
//     if (error || !template) {
//         return (
//             <div className="min-h-screen flex items-center justify-center">
//                 <Card className="max-w-md">
//                     <CardContent className="pt-6">
//                         <Alert variant="destructive">
//                             <AlertCircle className="h-4 w-4" />
//                             <AlertDescription>
//                                 Invalid claim link or this form is no longer active.
//                                 Please contact the administrator.
//                             </AlertDescription>
//                         </Alert>
//                     </CardContent>
//                 </Card>
//             </div>
//         );
//     }

//     // Initialize form fields on template load
//     if (Object.keys(formData).length === 3 && template.fields.length > 0) {
//         initializeFormFields(template);
//     }

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
//             <div className="max-w-2xl mx-auto">
//                 <Card className="shadow-xl">
//                     <CardHeader className="text-center">
//                         <CardTitle className="text-3xl font-bold text-gray-900">
//                             {template.name}
//                         </CardTitle>
//                         <CardDescription className="text-gray-600">
//                             {template.description || "Please fill out the form below to claim your certificate"}
//                         </CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                         {success ? (
//                             <Alert className="bg-green-50 border-green-200">
//                                 <CheckCircle className="h-4 w-4 text-green-600" />
//                                 <AlertDescription className="text-green-700">
//                                     Your request has been submitted successfully! 
//                                     You will receive an email once your certificate is approved.
//                                 </AlertDescription>
//                             </Alert>
//                         ) : (
//                             <form onSubmit={handleSubmit} className="space-y-6">
//                                 {/* Name Field */}
//                                 <div className="space-y-2">
//                                     <Label htmlFor="studentName">
//                                         Full Name <span className="text-red-500">*</span>
//                                     </Label>
//                                     <Input
//                                         id="studentName"
//                                         name="studentName"
//                                         value={formData.studentName || ""}
//                                         onChange={handleChange}
//                                         placeholder="Enter your full name"
//                                         required
//                                     />
//                                 </div>

//                                 {/* Email Field */}
//                                 <div className="space-y-2">
//                                     <Label htmlFor="studentEmail">
//                                         Email Address <span className="text-red-500">*</span>
//                                     </Label>
//                                     <Input
//                                         id="studentEmail"
//                                         name="studentEmail"
//                                         type="email"
//                                         value={formData.studentEmail || ""}
//                                         onChange={handleChange}
//                                         placeholder="you@example.com"
//                                         required
//                                     />
//                                 </div>

//                                 {/* URN Field - conditionally required */}
//                                 <div className="space-y-2">
//                                     <div className="flex items-center gap-2">
//                                         <Label htmlFor="studentUrn">
//                                             University Registration Number (URN)
//                                             {config.requireUrn && <span className="text-red-500 ml-1">*</span>}
//                                         </Label>
//                                         <span className="text-xs text-gray-400">
//                                             (optional if not marked required)
//                                         </span>
//                                     </div>
//                                     <Input
//                                         id="studentUrn"
//                                         name="studentUrn"
//                                         value={formData.studentUrn || ""}
//                                         onChange={handleChange}
//                                         placeholder="e.g., 2024CS001"
//                                     />
//                                 </div>

//                                 {/* Dynamic Template Fields */}
//                                 {template.fields.length > 0 && (
//                                     <div className="border-t pt-4">
//                                         <h3 className="font-medium mb-4">Additional Information</h3>
//                                         <div className="space-y-4">
//                                             {template.fields.map((field) => (
//                                                 <div key={field.id} className="space-y-2">
//                                                     <Label htmlFor={field.fieldName}>
//                                                         {field.fieldLabel}
//                                                         {field.isRequired && <span className="text-red-500 ml-1">*</span>}
//                                                     </Label>
//                                                     <Input
//                                                         id={field.fieldName}
//                                                         name={field.fieldName}
//                                                         value={formData[field.fieldName] || ""}
//                                                         onChange={handleChange}
//                                                         placeholder={`Enter ${field.fieldLabel.toLowerCase()}`}
//                                                         required={field.isRequired}
//                                                     />
//                                                 </div>
//                                             ))}
//                                         </div>
//                                     </div>
//                                 )}

//                                 <Button type="submit" className="w-full" disabled={isSubmitting}>
//                                     {isSubmitting ? (
//                                         <>
//                                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                                             Submitting...
//                                         </>
//                                     ) : (
//                                         "Submit Request"
//                                     )}
//                                 </Button>

//                                 <p className="text-xs text-gray-500 text-center">
//                                     Your request will be reviewed by an administrator.
//                                     You will receive an email once approved.
//                                 </p>
//                             </form>
//                         )}
//                     </CardContent>
//                 </Card>
//             </div>
//         </div>
//     );
// }


"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface TemplateField {
    id: string;
    fieldLabel: string;
    fieldName: string;
    fieldType: string;
    isRequired: boolean;
    isDefault: boolean;
}

interface Template {
    id: string;
    name: string;
    description: string;
    requireUrn: boolean;
    fields: TemplateField[];
    thumbnail?: string;
}

// Query function to fetch template by claim URL
const fetchTemplateByClaimUrl = async (claimUrl: string): Promise<Template> => {
    const { data } = await apiClient.get(`/template/public/claim/${claimUrl}`);
    return data.template;
};

// Mutation function to submit claim request
const submitClaimRequest = async (formData: any) => {
    const { data } = await apiClient.post("/public/claim-certificate", formData);
    return data;
};

export default function ClaimCertificatePage() {
    const { claimUrl } = useParams();
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState<Record<string, string>>({});

    // React Query for fetching template
    const { 
        data: template, 
        isLoading, 
        error 
    } = useQuery({
        queryKey: ['template', 'claim', claimUrl],
        queryFn: () => fetchTemplateByClaimUrl(claimUrl as string),
        enabled: !!claimUrl,
        retry: 1,
    });

    // React Query mutation for submitting claim
    const { mutate: submitClaim, isPending: isSubmitting } = useMutation({
        mutationFn: submitClaimRequest,
        onSuccess: () => {
            setSuccess(true);
            toast.success("Request submitted successfully! You will receive an email once approved.");
            // Reset form
            const resetFields: Record<string, string> = {};
            template?.fields.forEach(field => {
                resetFields[field.fieldName] = "";
            });
            setFormData(resetFields);
            // Reset success message after 5 seconds
            setTimeout(() => setSuccess(false), 5000);
        },
        onError: (error: any) => {
            console.error("Error submitting claim:", error);
            toast.error(error.response?.data?.message || "Failed to submit request");
        },
    });

    // Initialize form fields when template loads
    if (template && Object.keys(formData).length === 0) {
        const initialFields: Record<string, string> = {};
        template.fields.forEach(field => {
            initialFields[field.fieldName] = "";
        });
        setFormData(initialFields);
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate required fields
        for (const field of template?.fields || []) {
            if (field.isRequired && !formData[field.fieldName]) {
                toast.error(`Please fill in "${field.fieldLabel}"`);
                return;
            }
        }
        
        submitClaim({
            ...formData,
            templateId: template?.id,
            courseName: template?.name,
        });
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // Error state
    if (error || !template) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="pt-6">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Invalid claim link or this form is no longer active.
                                Please contact the administrator.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Separate default and custom fields
    const defaultFields = template.fields.filter(f => f.isDefault);
    const customFields = template.fields.filter(f => !f.isDefault);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <Card className="shadow-xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-bold text-gray-900">
                            {template.name}
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            {template.description || "Please fill out the form below to claim your certificate"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {success ? (
                            <Alert className="bg-green-50 border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-700">
                                    Your request has been submitted successfully! 
                                    You will receive an email once your certificate is approved.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Default Fields Section */}
                                {defaultFields.length > 0 && (
                                    <>
                                        <div className="border-b pb-2">
                                            <h3 className="font-semibold text-lg">Personal Information</h3>
                                        </div>
                                        {defaultFields.map((field) => (
                                            <div key={field.id} className="space-y-2">
                                                <Label htmlFor={field.fieldName}>
                                                    {field.fieldLabel}
                                                    {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                                                </Label>
                                                <Input
                                                    id={field.fieldName}
                                                    name={field.fieldName}
                                                    type={field.fieldType === 'email' ? 'email' : 'text'}
                                                    value={formData[field.fieldName] || ""}
                                                    onChange={handleChange}
                                                    placeholder={`Enter ${field.fieldLabel.toLowerCase()}`}
                                                    required={field.isRequired}
                                                />
                                            </div>
                                        ))}
                                    </>
                                )}

                                {/* Custom Fields Section */}
                                {customFields.length > 0 && (
                                    <>
                                        <div className="border-b pb-2 mt-4">
                                            <h3 className="font-semibold text-lg">Additional Information</h3>
                                        </div>
                                        {customFields.map((field) => (
                                            <div key={field.id} className="space-y-2">
                                                <Label htmlFor={field.fieldName}>
                                                    {field.fieldLabel}
                                                    {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                                                </Label>
                                                <Input
                                                    id={field.fieldName}
                                                    name={field.fieldName}
                                                    type={field.fieldType}
                                                    value={formData[field.fieldName] || ""}
                                                    onChange={handleChange}
                                                    placeholder={`Enter ${field.fieldLabel.toLowerCase()}`}
                                                    required={field.isRequired}
                                                />
                                            </div>
                                        ))}
                                    </>
                                )}

                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit Request"
                                    )}
                                </Button>

                                <p className="text-xs text-gray-500 text-center">
                                    Your request will be reviewed by an administrator.
                                    You will receive an email once approved.
                                </p>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}