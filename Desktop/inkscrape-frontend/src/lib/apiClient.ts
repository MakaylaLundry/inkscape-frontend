// Centralized API Client - single source of truth for all backend communication
// Handles auth tokens, error normalization, and CORS-safe requests

import { API_BASE_URL } from './apiConfig';
import type {
  ArtistPermissions,
  ArtistTag,
  ArtworkUploadResponse,
  CompanyProfile,
  CompanyProfileUpdate,
  ScanResponse,
  ComplianceEvent,
  ScanResult,
} from './apiTypes';

export interface ApiErrorDetails {
  message: string;
  status: number;
  code?: string;
  raw?: unknown;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  raw?: unknown;

  constructor(details: ApiErrorDetails) {
    super(details.message);
    this.name = 'ApiError';
    this.status = details.status;
    this.code = details.code;
    this.raw = details.raw;
  }

  static fromResponse(status: number, data: unknown): ApiError {
    let message = `Request failed with status ${status}`;
    let code: string | undefined;

    if (data && typeof data === 'object') {
      const errorData = data as Record<string, unknown>;
      if (errorData.error && typeof errorData.error === 'object') {
        const err = errorData.error as Record<string, unknown>;
        message = (err.message as string) || message;
        code = err.code as string;
      } else if (errorData.message) {
        message = errorData.message as string;
      }
    }

    return new ApiError({ message, status, code, raw: data });
  }

  static fromNetworkError(error: Error): ApiError {
    let message = error.message || 'Network request failed';
    
    // Detect CORS errors
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      message = 'Network error - possibly CORS blocked or server unreachable';
    }
    
    return new ApiError({ message, status: 0, code: 'NETWORK_ERROR', raw: error });
  }
}

// ==================== Request Types ====================

interface RequestOptions {
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

// ==================== API Client Class ====================

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  // ==================== Token Management ====================

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  hasToken(): boolean {
    return this.accessToken !== null;
  }

  // ==================== Core Request Method ====================

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const { headers: customHeaders = {}, skipAuth = false } = options;

    const headers: Record<string, string> = { ...customHeaders };

    // Add Authorization header if token exists and auth not skipped
    if (!skipAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Add Content-Type for JSON requests (not for FormData)
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      });

      // Parse response
      const text = await response.text();
      let data: unknown;
      
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }

      if (!response.ok) {
        throw ApiError.fromResponse(response.status, data);
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.fromNetworkError(error as Error);
    }
  }

  // ==================== HTTP Methods ====================

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', endpoint, body, options);
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  // ==================== File Upload Helper ====================

  async upload<T>(
    endpoint: string,
    files: File[],
    fieldName: string = 'files[]',
    additionalData?: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<T> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append(fieldName, file);
    });

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, JSON.stringify(value));
        }
      });
    }

    // Don't set Content-Type for FormData - browser handles multipart boundary
    return this.request<T>('POST', endpoint, formData, options);
  }

  // ==================== Health Check ====================

  async checkHealth(): Promise<{ ok: boolean; data?: Record<string, unknown> }> {
    return this.get('/health', { skipAuth: true });
  }

  // ==================== Auth Endpoints ====================

  async getAuthMe(): Promise<{ ok: boolean; data: { sub: string; role?: string; [key: string]: unknown } }> {
    return this.get('/api/v1/auth/me');
  }

  async getMe(): Promise<{ ok: boolean; user: { id: string; auth0UserId: string; role: string | null } }> {
    return this.get('/api/v1/me');
  }

  async setMyRole(role: 'artist' | 'company'): Promise<{ ok: boolean; data: { id: string; auth0UserId: string; role: string } }> {
    return this.put('/api/v1/me/role', { role });
  }

  // ==================== Artist Endpoints ====================

  async checkArtistAccess(): Promise<{ ok: boolean; data: Record<string, unknown> }> {
    return this.get('/api/v1/artist/stub');
  }

  async getArtistTags(): Promise<ArtistTag[]> {
    const response = await this.get<{ ok: boolean; data: ArtistTag[] }>('/api/v1/artist/tags');
    return response.data || [];
  }

  async uploadArtwork(files: File[], permissions: ArtistPermissions): Promise<ArtworkUploadResponse> {
    return this.upload<ArtworkUploadResponse>(
      '/api/v1/artist/artworks',
      files,
      'files[]',
      { permissions }
    );
  }

  async updateTagPermissions(tagId: string, permissions: ArtistPermissions): Promise<ArtistTag> {
    const response = await this.put<{ ok: boolean; data: ArtistTag }>(`/api/v1/artist/tags/${tagId}/permissions`, permissions);
    return response.data;
  }

  async revokeTag(tagId: string): Promise<void> {
    await this.delete(`/api/v1/artist/tags/${tagId}`);
  }

  async getComplianceEvents(): Promise<ComplianceEvent[]> {
    const response = await this.get<{ ok: boolean; data: ComplianceEvent[] }>('/api/v1/artist/compliance');
    return response.data || [];
  }

  // ==================== Company Endpoints ====================

  async checkCompanyAccess(): Promise<{ ok: boolean; data: Record<string, unknown> }> {
    return this.get('/api/v1/company/stub');
  }

  async getCompanyProfile(): Promise<CompanyProfile> {
    const response = await this.get<{ ok: boolean; data: CompanyProfile }>('/api/v1/company/profile');
    return response.data;
  }

  async updateCompanyProfile(data: CompanyProfileUpdate): Promise<CompanyProfile> {
    const response = await this.put<{ ok: boolean; data: CompanyProfile }>('/api/v1/company/profile', data);
    return response.data;
  }

  async scanDataset(files: File[], zipFile?: File): Promise<ScanResponse> {
    const allFiles = zipFile ? [...files, zipFile] : files;
    const response = await this.upload<{ ok: boolean; data: ScanResponse }>(
      '/api/v1/company/scan',
      allFiles,
      'files[]'
    );
    return response.data;
  }

  async getScanHistory(): Promise<ScanResult[]> {
    const response = await this.get<{ ok: boolean; data: ScanResult[] }>('/api/v1/company/scan/history');
    return response.data || [];
  }
}

// ==================== Singleton Instance ====================

export const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;
