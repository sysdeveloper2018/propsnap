export type PropertyType = 'Residential' | 'Commercial' | 'Land' | 'Multi-Family' | 'Other';

export interface Property {
  id: string;
  title: string;
  address: string;
  price: string;
  propertyType: PropertyType;
  description: string;
  status: 'Lead' | 'Analyzing' | 'Offer Made' | 'Under Contract' | 'Closed';
  imageData: string | null; // Base64 string
  latitude: number | null;
  longitude: number | null;
  createdAt: number;
  updatedAt: number;
  // New Fields
  bedrooms?: number;
  bathrooms?: number;
  legalDescription?: string;
  parcelNumber?: string;
  yearBuilt?: string;
  squareFootage?: string;
  hoaDetails?: string;
  zoning?: string;
  utilities?: string[]; // Array of selected utilities
}

export type ViewState = 'LIST' | 'CREATE' | 'EDIT' | 'INSTRUCTIONS';

export interface GeoLocation {
  lat: number;
  lng: number;
}