import { Business, DataSource, HospitalityCategory } from './types';

// Simulated location resolution
const knownLocations: Record<string, { display: string; city: string; state: string }> = {
  'bengaluru': { display: 'Bengaluru, Karnataka, India', city: 'Bengaluru', state: 'Karnataka' },
  'mysuru': { display: 'Mysuru, Karnataka, India', city: 'Mysuru', state: 'Karnataka' },
  'hubballi': { display: 'Hubballi, Karnataka, India', city: 'Hubballi', state: 'Karnataka' },
  'laxmeshwar': { display: 'Laxmeshwar, Karnataka, India', city: 'Laxmeshwar', state: 'Karnataka' },
  'koramangala': { display: 'Koramangala, Bengaluru, Karnataka, India', city: 'Bengaluru', state: 'Karnataka' },
  'dharwad': { display: 'Dharwad, Karnataka, India', city: 'Dharwad', state: 'Karnataka' },
  'ranibennur': { display: 'Ranibennur, Karnataka, India', city: 'Ranibennur', state: 'Karnataka' },
};

export interface LocationResolution {
  query: string;
  display: string;
  city: string;
  state: string;
  candidates?: Array<{ display: string; city: string; state: string }>;
  resolved: boolean;
}

export async function resolveLocation(query: string): Promise<LocationResolution> {
  const normalized = query.toLowerCase().trim();
  
  // Check exact match
  if (knownLocations[normalized]) {
    const location = knownLocations[normalized];
    return {
      query,
      display: location.display,
      city: location.city,
      state: location.state,
      resolved: true,
    };
  }

  // Check partial matches for disambiguation
  const partialMatches = Object.entries(knownLocations)
    .filter(([key]) => key.includes(normalized) || normalized.includes(key))
    .map(([_, location]) => location);

  if (partialMatches.length > 1) {
    return {
      query,
      display: '',
      city: '',
      state: '',
      candidates: partialMatches,
      resolved: false,
    };
  }

  if (partialMatches.length === 1) {
    const location = partialMatches[0];
    return {
      query,
      display: location.display,
      city: location.city,
      state: location.state,
      resolved: true,
    };
  }

  return {
    query,
    display: `${query} (assumed)`,
    city: query,
    state: 'Unknown',
    resolved: false,
  };
}

export async function searchBusinesses(
  location: string,
  category: HospitalityCategory,
  source: DataSource = 'TomTom'
): Promise<Business[]> {
  const response = await fetch(`/api/search?location=${encodeURIComponent(location)}&category=${encodeURIComponent(category)}&source=${encodeURIComponent(source)}`);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Could not load live businesses');
  return payload.businesses as Business[];
}
