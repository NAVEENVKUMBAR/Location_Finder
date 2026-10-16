export type DataSource = 'TomTom' | 'Geoapify' | 'Google Maps';

export type HospitalityCategory = 
  | 'All Hospitality'
  | 'Hotels'
  | 'Restaurants'
  | 'PGs'
  | 'Hostels'
  | 'Resorts'
  | 'Lodges'
  | 'Homestays'
  | 'Guest Houses'
  | 'Cafés'
  | 'Other Hospitality';

export type WebsiteStatus = 'ACTIVE' | 'INACTIVE' | 'NO_WEBSITE';
export type WebsiteCheckStatus = 'Confirmed' | 'Temporary failure' | 'Unknown';

export type ProspectPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type ContactStatus = 
  | 'NOT_CONTACTED'
  | 'CONTACT_ATTEMPTED'
  | 'CONTACTED'
  | 'INTERESTED'
  | 'NOT_INTERESTED'
  | 'FOLLOW_UP'
  | 'PREVIEW_SENT'
  | 'FEEDBACK_RECEIVED'
  | 'REVISION_IN_PROGRESS'
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'DELIVERED'
  | 'CLOSED';

export interface OpeningHours {
  [key: string]: { open: string; close: string };
}

export interface Business {
  id: string;
  name: string;
  category: HospitalityCategory;
  address: string | null;
  phone: string | null;
  website: string | null;
  websiteStatus: WebsiteStatus;
  websiteCheckStatus: WebsiteCheckStatus;
  rating: number | null;
  openingHours: OpeningHours | null;
  mapUrl: string | null;
  photoName?: string | null;
  photoNames?: string[];
  latitude: number | null;
  longitude: number | null;
  source: string;
  dataCompleteness: number;
  lastVerifiedAt: string;
}

export interface ProspectRecord {
  id: string;
  businessId: string;
  businessName: string;
  category: HospitalityCategory;
  region: string;
  phone: string | null;
  website: string | null;
  websiteStatus: WebsiteStatus;
  assignedMember: string | null;
  priority: ProspectPriority;
  contactStatus: ContactStatus;
  contactDate: string | null;
  contactMethod: string | null;
  ownerResponse: string | null;
  previewUrl: string | null;
  feedback: string | null;
  revisionStatus: string | null;
  approvalStatus: string | null;
  agreedCharge: number | null;
  outcome: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  location: string;
  category: HospitalityCategory;
  businesses: Business[];
  totalCount: number;
  searchedAt: string;
}
