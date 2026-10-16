import { Business, ProspectRecord, HospitalityCategory } from './types';

const restaurantNames = [
  'The Golden Fork', 'Spice Route', 'Urban Kitchen', 'The Cozy Corner', 'Masala Dreams',
  'Mediterranean Haven', 'The Grillhouse', 'Cafe Luna', 'Flavor Palace', 'The Bistro',
];

const hotelNames = [
  'Royal Grand Hotel', 'Comfort Stay Inn', 'Valley View Resort', 'Heritage Hotel', 'Sunrise Lodge',
  'Riverside Retreat', 'Mountain Peak Hotel', 'City Central Inn', 'Seaside Paradise', 'Urban Elegance',
];

const pgNames = [
  'Cozy Rooms PG', 'Student Haven', 'Budget Stay Plus', 'Home Away Home', 'Modern Comfort PG',
  'Safe Haven Hostel', 'Urban Living Space', 'Affordable Comfort', 'Prime Location PG', 'The Residency',
];

const addresses = [
  '123 MG Road', '456 Brigade Road', '789 Koramangala', '321 Indiranagar', '654 Whitefield',
  '987 HSR Layout', '147 Domlur', '258 Banaswadi', '369 Vasanth Nagar', '741 RT Nagar',
];

const categories: HospitalityCategory[] = ['Restaurants', 'Hotels', 'PGs', 'Hostels', 'Cafés'];
const sources = ['Google Maps', 'Business Directory', 'Local Search', 'Community Listed'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBoolean(probability = 0.5): boolean {
  return Math.random() < probability;
}

function randomRating(): number | null {
  return randomBoolean(0.7) ? Math.round((Math.random() * 1.5 + 3.5) * 10) / 10 : null;
}

function randomWebsiteUrl(): string | null {
  if (randomBoolean(0.4)) {
    return `https://business-${Math.floor(Math.random() * 10000)}.com`;
  }
  return null;
}

function getWebsiteStatus(website: string | null) {
  if (!website) return 'NO_WEBSITE' as const;
  return randomBoolean(0.6) ? 'ACTIVE' as const : 'INACTIVE' as const;
}

function getDataCompleteness(): number {
  return Math.floor(Math.random() * 40) + 60;
}

export function generateMockBusinesses(location: string, category: HospitalityCategory, count: number = 25): Business[] {
  let names = restaurantNames;
  
  if (category === 'Hotels' || category === 'Resorts' || category === 'Lodges' || category === 'Homestays' || category === 'Guest Houses') {
    names = hotelNames;
  } else if (category === 'PGs' || category === 'Hostels') {
    names = pgNames;
  }

  return Array.from({ length: count }, (_, i) => {
    const website = randomWebsiteUrl();
    return {
      id: `bus-${location.toLowerCase()}-${i}`,
      name: names[i % names.length],
      category,
      address: randomItem(addresses),
      phone: randomBoolean(0.8) ? `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}` : null,
      website,
      websiteStatus: getWebsiteStatus(website),
      websiteCheckStatus: randomBoolean(0.9) ? 'Confirmed' : 'Temporary failure',
      rating: randomRating(),
      openingHours: randomBoolean(0.7) ? {
        monday: { open: '10:00', close: '22:00' },
        tuesday: { open: '10:00', close: '22:00' },
        wednesday: { open: '10:00', close: '22:00' },
        thursday: { open: '10:00', close: '22:00' },
        friday: { open: '10:00', close: '23:00' },
        saturday: { open: '11:00', close: '23:00' },
        sunday: { open: '11:00', close: '22:00' },
      } : null,
      mapUrl: `https://maps.google.com/maps?q=${encodeURIComponent(randomItem(addresses))}`,
      latitude: 12.9 + (Math.random() - 0.5) * 0.2,
      longitude: 77.6 + (Math.random() - 0.5) * 0.2,
      source: randomItem(sources),
      dataCompleteness: getDataCompleteness(),
      lastVerifiedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  });
}

export function generateMockProspectRecords(businesses: Business[], location: string): ProspectRecord[] {
  const contactStatuses: ProspectRecord['contactStatus'][] = [
    'NOT_CONTACTED', 'CONTACT_ATTEMPTED', 'INTERESTED', 'PREVIEW_SENT', 'APPROVAL_PENDING', 'APPROVED', 'DELIVERED'
  ];

  return businesses.map((bus, i) => ({
    id: `prospect-${bus.id}`,
    businessId: bus.id,
    businessName: bus.name,
    category: bus.category,
    region: location,
    phone: bus.phone,
    website: bus.website,
    websiteStatus: bus.websiteStatus,
    assignedMember: randomBoolean(0.6) ? `Team Member ${Math.floor(Math.random() * 5) + 1}` : null,
    priority: bus.websiteStatus === 'NO_WEBSITE' ? 'HIGH' : bus.websiteStatus === 'INACTIVE' ? 'MEDIUM' : 'LOW',
    contactStatus: randomItem(contactStatuses),
    contactDate: randomBoolean(0.5) ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
    contactMethod: randomItem(['Phone', 'WhatsApp', 'Email', 'In-person']),
    ownerResponse: randomBoolean(0.3) ? 'Positive' : null,
    previewUrl: randomBoolean(0.2) ? `https://preview.example.com/business-${bus.id}` : null,
    feedback: null,
    revisionStatus: null,
    approvalStatus: null,
    agreedCharge: randomBoolean(0.15) ? Math.floor(Math.random() * 30000) + 5000 : null,
    outcome: null,
    notes: null,
    createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}
