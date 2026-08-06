import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { notifications } from "@mantine/notifications";

// Types
export interface Template {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  localUrl?: string;
  s3Url?: string;
  fields?: TemplateField[];
  claimUrl?: string;
  isPublic?: boolean; 
  size: number;
  createdAt: string;
  modifiedAt: string;
}

// export interface UpdateClaimUrlResponse {
//   success: boolean;
//   message: string;
//   template: {
//     id: string;
//     name: string;
//     claimUrl: string;
//     isPublic: boolean;
//   };
//   claimFormUrl: string;
// }

// Update the interface to match the actual response
export interface UpdateClaimUrlResponse {
  success: boolean;
  message: string;
  template: {
    id: string;
    name: string;
    claimUrl: string;
    isPublic: boolean;
    requireUrn: boolean;
    defaultFields?: Array<{
      name: string;
      label: string;
      isRequired: boolean;
    }>;
    customFields?: CustomField[];
  };
  claimFormUrl: string;
}

export interface UploadTemplateResponse {
  success: boolean;
  id: string;
  templatePath: string;
  templateUrl: string;
  s3Url: string;
  filename: string;
  originalName: string;
  size: number;
  message: string;
}

export interface GetAllTemplatesResponse {
  success: boolean;
  count: number;
  templates: Template[];
}

export interface GetTemplateByIdResponse {
  success: boolean;
  template: Template;
}


// Add this interface
export interface TemplateField {
  id?: string;
  fieldName: string;
  fieldLabel: string;
  x: number;
  y: number;
  fontSize: number;
  fontColor: string;
  alignment: string;
  isRequired?: boolean;
  order?: number;
}

export interface UpdateTemplateFieldsResponse {
  success: boolean;
  message: string;
  template: Template;
}


// ✅ Use environment variable for API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// ✅ Client for template CRUD operations (GET, DELETE)
const templateClient = axios.create({
  baseURL: `${API_BASE_URL}/template`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Client for file UPLOADS (uses /upload endpoint for S3)
const uploadClient = axios.create({
  baseURL: `${API_BASE_URL}/upload`,  // ← CHANGE THIS: /upload not /template
  withCredentials: true,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Query keys
export const templateKeys = {
  all: ['templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: () => [...templateKeys.lists()] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
};

// ========== QUERIES ==========

// Get all templates
export function useGetAllTemplates() {
  return useQuery({
    queryKey: templateKeys.list(),
    queryFn: async () => {
      const { data } = await templateClient.get<GetAllTemplatesResponse>('/');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Get template by ID
export function useGetTemplateById(id: string) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: async () => {
      const { data } = await templateClient.get<GetTemplateByIdResponse>(`/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Get template file URL (for downloading)
export function useGetTemplateFile(filename: string) {
  return useQuery({
    queryKey: ['template-file', filename],
    queryFn: async () => {
      const { data } = await templateClient.get(`/file/${filename}`, {
        responseType: 'blob',
      });
      return data;
    },
    enabled: !!filename,
  });
}

// Get S3 URL for template
export function useGetTemplateS3Url(filename: string) {
  return useQuery({
    queryKey: ['template-s3', filename],
    queryFn: async () => {
      const { data } = await templateClient.get(`/s3/${filename}`);
      return data;
    },
    enabled: !!filename,
  });
}

// Add this mutation to the end of the file
export function useUpdateTemplateFields() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: TemplateField[] }): Promise<UpdateTemplateFieldsResponse> => {
      const { data } = await templateClient.put(`/${id}/fields`, { fields });
      return data;
    },
    onSuccess: (data, { id }) => {
      // Invalidate both the list and the specific template
      queryClient.invalidateQueries({ queryKey: templateKeys.list() });
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(id) });
      
      notifications.show({
        title: "Success",
        message: "Template fields saved successfully!",
        color: "green",
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: "Error",
        message: error.response?.data?.error || "Failed to save template fields",
        color: "red",
      });
    },
  });
}

// ========== MUTATIONS ==========

// Upload template (uses S3 upload endpoint)
export function useUploadTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File): Promise<UploadTemplateResponse> => {
      const formData = new FormData();
      formData.append("template", file);
      
      // ✅ Now this calls POST /api/upload/template (S3 upload)
      const { data } = await uploadClient.post('/template', formData);
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.list() });
      
      notifications.show({
        title: "Success",
        message: `Template "${data.originalName}" uploaded successfully to S3!`,
        color: "green",
      });
      
      console.log("Uploaded template:", data);
      console.log("S3 URL:", data.s3Url);
    },
    onError: (error: any) => {
      notifications.show({
        title: "Error",
        message: error.response?.data?.error || "Failed to upload template",
        color: "red",
      });
    },
  });
}

// Delete template
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean; message: string }> => {
      const { data } = await templateClient.delete(`/${id}`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.list() });
      queryClient.removeQueries({ queryKey: templateKeys.detail(id) });
      
      notifications.show({
        title: "Success",
        message: "Template deleted successfully",
        color: "green",
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: "Error",
        message: error.response?.data?.error || "Failed to delete template",
        color: "red",
      });
    },
  });
}

// Download template file
export function useDownloadTemplate() {
  return useMutation({
    mutationFn: async ({ filename, originalName }: { filename: string; originalName: string }) => {
      const response = await templateClient.get(`/file/${filename}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName || filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    },
    onError: (error: any) => {
      notifications.show({
        title: "Error",
        message: error.response?.data?.error || "Failed to download template",
        color: "red",
      });
    },
  });
}


// Add this mutation to the end of the file
// export function useUpdateClaimUrl() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async ({ id, claimUrl, isPublic }: { id: string; claimUrl: string; isPublic: boolean }): Promise<UpdateClaimUrlResponse> => {
//       const { data } = await templateClient.put(`/${id}/claim-url`, { claimUrl, isPublic });
//       return data;
//     },
//     onSuccess: (data, { id }) => {
//       queryClient.invalidateQueries({ queryKey: templateKeys.list() });
//       queryClient.invalidateQueries({ queryKey: templateKeys.detail(id) });
      
//       notifications.show({
//         title: "Success",
//         message: `Claim URL generated! Share: ${data.claimFormUrl}`,
//         color: "green",
//       });
      
//       // Copy to clipboard
//       navigator.clipboard.writeText(data.claimFormUrl);
//       notifications.show({
//         title: "Link Copied!",
//         message: "Claim form URL copied to clipboard",
//         color: "blue",
//       });
//     },
//     onError: (error: any) => {
//       notifications.show({
//         title: "Error",
//         message: error.response?.data?.error || "Failed to update claim URL",
//         color: "red",
//       });
//     },
//   });
// }

// Add this interface at the top with other interfaces
export interface CustomField {
  id?: string;
  name: string;
  label: string;
  type: string;
  isRequired: boolean;
}

export interface UpdateClaimUrlResponse {
  success: boolean;
  message: string;
  template: {
    id: string;
    name: string;
    claimUrl: string;
    isPublic: boolean;
    requireUrn: boolean;
    defaultFields?: Array<{
      name: string;
      label: string;
      isRequired: boolean;
    }>;
    customFields?: CustomField[];
  };
  claimFormUrl: string;
}

// Add this mutation to the end of the file
export function useUpdateClaimUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      claimUrl, 
      isPublic, 
      requireUrn,
      customFields 
    }: { 
      id: string; 
      claimUrl: string; 
      isPublic: boolean;
      requireUrn?: boolean;
      customFields?: CustomField[];
    }): Promise<UpdateClaimUrlResponse> => {
      const { data } = await templateClient.put(`/${id}/claim-url`, { 
        claimUrl, 
        isPublic,
        requireUrn,
        customFields 
      });
      return data;
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.list() });
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(id) });
      
      notifications.show({
        title: "Success",
        message: `Claim URL generated! Share: ${data.claimFormUrl}`,
        color: "green",
      });
      
      // Copy to clipboard
      navigator.clipboard.writeText(data.claimFormUrl);
      notifications.show({
        title: "Link Copied!",
        message: "Claim form URL copied to clipboard",
        color: "blue",
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: "Error",
        message: error.response?.data?.error || "Failed to update claim URL",
        color: "red",
      });
    },
  });
}

// Add query to get public templates
export function useGetPublicTemplates() {
  return useQuery({
    queryKey: ['public-templates'],
    queryFn: async () => {
      const { data } = await templateClient.get('/public/list');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}