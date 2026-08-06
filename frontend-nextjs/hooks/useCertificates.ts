// import { useMutation } from "@tanstack/react-query";
// import axios from "axios";
// import { notifications } from "@mantine/notifications";

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// const generateClient = axios.create({
//   baseURL: `${API_BASE_URL}/generate`,
//   withCredentials: true,
// });

// export function useGenerateCertificates() {
//   return useMutation({
//     mutationFn: async (formData: FormData): Promise<Blob> => {
//       const response = await generateClient.post('/', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//         responseType: 'blob',
//       });
//       return response.data;
//     },
//     onSuccess: (data) => {
//       const url = window.URL.createObjectURL(new Blob([data]));
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', `certificates-${Date.now()}.zip`);
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);
      
//       notifications.show({
//         title: "Success",
//         message: "Certificates generated successfully!",
//         color: "green",
//       });
//     },
//     onError: (error: any) => {
//       console.error('Generation error:', error);
//       notifications.show({
//         title: "Error",
//         message: error.response?.data?.error || "Failed to generate certificates",
//         color: "red",
//       });
//     },
//   });
// }


import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import { apiClient } from "@/lib/api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Create axios instances
const generateClient = axios.create({
    baseURL: `${API_BASE_URL}/generate`,
    withCredentials: true,
});

const certificatesClient = axios.create({
    baseURL: `${API_BASE_URL}/certificates`,
    withCredentials: true,
});

// Types
export interface CertificateItem {
    id: string;
    recipientName: string;
    recipientEmail: string | null;
    uniqueCode: string;
    downloadUrl: string;
    isIssued: boolean;
    issuedAt: string;
    createdAt: string;
}

export interface CertificateBatch {
    id: string;
    title: string;
    template: {
        id: string;
        name: string;
        filePath: string;
    };
    totalCount: number;
    status: string;
    downloadUrl: string | null;
    createdAt: string;
    completedAt: string | null;
    certificates: CertificateItem[];
}

export interface CertificatesResponse {
    success: boolean;
    count: number;
    certificates: CertificateBatch[];
}

export interface CertificateItemsResponse {
    success: boolean;
    count: number;
    certificates: CertificateItem[];
}

// Add this to your useCertificates.ts file

export interface PendingRequestsResponse {
  success: boolean;
  count: number;
  requests: CertificateRequest[];
}

export interface CertificateRequest {
  id: string;
  requestId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  studentId?: string;
  courseName: string;
  completionDate?: string;
  department?: string;
  additionalInfo?: string;
  status: string;
  templateId?: string;
  createdAt: string;
}

// Query Keys
export const certificateKeys = {
    all: ['certificates'] as const,
    batches: () => [...certificateKeys.all, 'batches'] as const,
    batchList: () => [...certificateKeys.batches(), 'list'] as const,
    batchDetail: (id: string) => [...certificateKeys.batches(), id] as const,
    items: () => [...certificateKeys.all, 'items'] as const,
    itemDetail: (id: string) => [...certificateKeys.items(), id] as const,
};

// ========== MUTATIONS ==========

// Generate certificates (upload Excel, map fields, create PDFs)
export function useGenerateCertificates() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData: FormData): Promise<Blob> => {
            const response = await generateClient.post('/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                responseType: 'blob',
            });
            return response.data;
        },
        onSuccess: (data) => {
            // Invalidate certificates queries to refresh the list
            queryClient.invalidateQueries({ queryKey: certificateKeys.all });
            
            // Create download link for ZIP
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `certificates-${Date.now()}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            notifications.show({
                title: "Success",
                message: "Certificates generated successfully!",
                color: "green",
            });
        },
        onError: (error: any) => {
            console.error('Generation error:', error);
            notifications.show({
                title: "Error",
                message: error.response?.data?.error || "Failed to generate certificates",
                color: "red",
            });
        },
    });
}

export function useBulkDownloadCertificates() {
    return useMutation({
        mutationFn: async (certificateIds: string[]) => {
            const response = await apiClient.post('/certificates/download-multiple', {
                certificateIds
            }, {
                responseType: 'blob',
            });
            return response.data;
        },
        onSuccess: (data) => {
            // Create download link for ZIP
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `certificates-${Date.now()}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            notifications.show({
                title: "Success",
                message: "Certificates downloaded successfully!",
                color: "green",
            });
        },
        onError: (error: any) => {
            console.error('Download error:', error);
            notifications.show({
                title: "Error",
                message: error.response?.data?.message || "Failed to download certificates",
                color: "red",
            });
        },
    });
}

// ========== QUERIES ==========

// Get all certificate batches (grouped by generation action)
export function useGetAllBatches() {
    return useQuery({
        queryKey: certificateKeys.batchList(),
        queryFn: async () => {
            const { data } = await certificatesClient.get<CertificatesResponse>('/');
            return data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

// Get ALL individual certificates (flattened list)
export function useGetAllCertificateItems() {
    return useQuery({
        queryKey: certificateKeys.items(),
        queryFn: async () => {
            const { data } = await certificatesClient.get<CertificateItemsResponse>('/items');
            return data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

// Get single certificate batch by ID
export function useGetBatchById(id: string) {
    return useQuery({
        queryKey: certificateKeys.batchDetail(id),
        queryFn: async () => {
            const { data } = await certificatesClient.get(`/batch/${id}`);
            return data;
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}

// Get single individual certificate item by ID
export function useGetCertificateItemById(id: string) {
    return useQuery({
        queryKey: certificateKeys.itemDetail(id),
        queryFn: async () => {
            const { data } = await certificatesClient.get(`/item/${id}`);
            return data;
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}

// ========== MUTATIONS for Downloads ==========

// Download individual certificate
export function useDownloadCertificate() {
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await certificatesClient.get(`/item/${id}/download`, {
                responseType: 'blob',
            });
            return response.data;
        },
        onSuccess: (data, id) => {
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `certificate-${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            notifications.show({
                title: "Success",
                message: "Certificate downloaded successfully!",
                color: "green",
            });
        },
        onError: (error: any) => {
            notifications.show({
                title: "Error",
                message: error.response?.data?.error || "Failed to download certificate",
                color: "red",
            });
        },
    });
}

// Download batch ZIP
export function useDownloadBatchZip() {
    return useMutation({
        mutationFn: async (batchId: string) => {
            const response = await certificatesClient.get(`/batch/${batchId}/download`, {
                responseType: 'blob',
            });
            return response.data;
        },
        onSuccess: (data, batchId) => {
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `batch-${batchId}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            notifications.show({
                title: "Success",
                message: "Batch ZIP downloaded successfully!",
                color: "green",
            });
        },
        onError: (error: any) => {
            notifications.show({
                title: "Error",
                message: error.response?.data?.error || "Failed to download batch",
                color: "red",
            });
        },
    });
}

// Public verification (no auth required)
export function useVerifyCertificate(uniqueCode: string) {
    return useQuery({
        queryKey: ['verify', uniqueCode],
        queryFn: async () => {
            const { data } = await axios.get(`${API_BASE_URL}/verify/${uniqueCode}`);
            return data;
        },
        enabled: !!uniqueCode,
        retry: false,
        staleTime: 0,
    });
}


// Add this query
export function useGetPendingRequests() {
  return useQuery({
    queryKey: ['pending-requests'],
    queryFn: async () => {
      const { data } = await apiClient.get<PendingRequestsResponse>('/admin/requests/pending');
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}