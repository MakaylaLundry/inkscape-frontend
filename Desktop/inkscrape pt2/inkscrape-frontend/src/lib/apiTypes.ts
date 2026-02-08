// Shared API types for frontend-backend communication

// ==================== Artist Types ====================

export interface ArtistPermissions {
  ai_training: 'yes' | 'no' | 'conditional';
  allowed_use_cases: string[];
  attribution: boolean;
  notes?: string;
  other_use_case?: string;
}

export interface ArtistTag {
  id: string;
  tag_id: string;
  file_name: string;
  file_url?: string;
  permissions: ArtistPermissions;
  created_at: string;
  version?: number;
}

export interface ArtworkUploadResponse {
  tags: ArtistTag[];
}

// ==================== Company Types ====================

export interface CompanyProfile {
  company_name: string;
  declared_use_cases: string[];
  description?: string;
}

export interface CompanyProfileUpdate {
  company_name: string;
  declared_use_cases: string[];
  description?: string;
}

export interface ScanSummary {
  totalFilesScanned: number;
  matchedItems: number;
  unmatchedFiles: number;
  allowed: number;
  conditional: number;
  restricted: number;
}

export interface ScanReportItem {
  file_name: string;
  artist_id?: string;
  artist_name?: string;
  tag_id?: string;
  permissions?: ArtistPermissions;
}

export interface SimilarityFinding {
  file_name: string;
  similarity_score?: number;
  artist_name?: string;
  tag_id?: string;
}

export interface ScanResponse {
  summary: ScanSummary;
  report: {
    allowed: ScanReportItem[];
    conditional: ScanReportItem[];
    restricted: ScanReportItem[];
    unmatched: ScanReportItem[];
  };
  similarityFindings?: {
    work_at_risk: SimilarityFinding[];
    may_be_at_risk: SimilarityFinding[];
  };
}

// ==================== Compliance Types ====================

export interface ComplianceEvent {
  id: string;
  company_name: string;
  use_case: string;
  date: string;
  outcome: 'allowed' | 'removed' | 'agreement_accepted';
  artwork_name: string;
  eventType?: 'match' | 'similarity';
  similarity_score?: number;
}

// ==================== Scan History Types ====================

export interface ScanResultItem {
  file_name: string;
  artist_name: string;
  status: 'allowed' | 'conditional' | 'restricted';
}

export interface ScanResult {
  scan_id: string;
  scanned_at: string;
  safe_to_use: number;
  conditional: number;
  restricted: number;
  items: ScanResultItem[];
}
