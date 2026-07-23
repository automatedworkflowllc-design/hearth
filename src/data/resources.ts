import type { Resource } from '../types/index.ts';

export const mockResources: Resource[] = [
  // San Francisco
  {
    id: 'res-1',
    name: 'Downtown Community Food Pantry',
    category: 'food',
    description: 'Provides free fresh groceries, canned goods, and hot meals daily to individuals and families in need.',
    address: '123 Main Street, San Francisco, CA 94105',
    location: { city: 'San Francisco', state: 'CA', zipCode: '94105', lat: 37.7892, lng: -122.4014 },
    hours: 'Mon-Fri 8:00 AM - 4:00 PM',
    phone: '415-555-0101',
    email: 'contact@downtownfood.org',
    website: 'https://downtownfood.org',
    eligibility: 'Open to all residents in need of food assistance. No ID required.',
    availability: 'Open Now',
    tags: ['food', 'pantry', 'free', 'groceries', 'emergency', 'san francisco', 'ca']
  },
  {
    id: 'res-2',
    name: 'Hope Emergency Shelter',
    category: 'shelter',
    description: 'Overnight shelter offering safe beds, hot showers, warm meals, and housing transition case management.',
    address: '456 Mission Street, San Francisco, CA 94103',
    location: { city: 'San Francisco', state: 'CA', zipCode: '94103', lat: 37.7850, lng: -122.4060 },
    hours: '24/7 Operations',
    phone: '415-555-0102',
    email: 'info@hopeshelter.org',
    website: 'https://hopeshelter.org',
    eligibility: 'Adults 18+ seeking temporary emergency shelter.',
    availability: '12 Beds Available',
    tags: ['shelter', 'overnight', 'beds', 'emergency', 'housing', 'san francisco', 'ca']
  },
  {
    id: 'res-3',
    name: 'St. Jude Free Health Clinic',
    category: 'health',
    description: 'Community clinic offering free medical checkups, urgent care, vaccinations, and prescription assistance.',
    address: '789 Valencia Street, San Francisco, CA 94110',
    location: { city: 'San Francisco', state: 'CA', zipCode: '94110', lat: 37.7595, lng: -122.4215 },
    hours: 'Tue-Sat 9:00 AM - 5:00 PM',
    phone: '415-555-0103',
    email: 'clinic@stjudehealth.org',
    website: 'https://stjudehealth.org',
    eligibility: 'Uninsured and low-income individuals.',
    availability: 'Walk-ins Welcome',
    tags: ['health', 'clinic', 'medical', 'free', 'vaccines', 'doctor', 'san francisco', 'ca']
  },

  // New York City
  {
    id: 'res-ny-1',
    name: 'Manhattan Metropolitan Food Bank',
    category: 'food',
    description: 'Distributes emergency food packages, fresh produce, and infant formula to families across NYC boroughs.',
    address: '350 5th Avenue, New York, NY 10118',
    location: { city: 'New York', state: 'NY', zipCode: '10118', lat: 40.7484, lng: -73.9857 },
    hours: 'Mon-Sat 7:00 AM - 6:00 PM',
    phone: '212-555-0199',
    email: 'help@nycfoodbank.org',
    website: 'https://nycfoodbank.org',
    eligibility: 'All NY residents in need.',
    availability: 'Open Now',
    tags: ['food', 'pantry', 'groceries', 'new york', 'nyc', 'ny', 'manhattan']
  },
  {
    id: 'res-ny-2',
    name: 'Empire State Youth & Family Shelter',
    category: 'shelter',
    description: 'Safe haven providing emergency housing, warm beds, crisis counseling, and youth empowerment programs.',
    address: '120 W 14th St, New York, NY 10011',
    location: { city: 'New York', state: 'NY', zipCode: '10011', lat: 40.7375, lng: -73.9972 },
    hours: '24/7 Operations',
    phone: '212-555-0144',
    email: 'intake@empireshelter.org',
    website: 'https://empireshelter.org',
    eligibility: 'Families and youth in housing crisis.',
    availability: '8 Beds Available',
    tags: ['shelter', 'housing', 'youth', 'emergency', 'new york', 'nyc', 'ny']
  },
  {
    id: 'res-ny-3',
    name: 'Lower East Side Community Health Center',
    category: 'health',
    description: 'Free primary healthcare, dental care, mental health counseling, and prescription assistance for low-income New Yorkers.',
    address: '240 E Houston St, New York, NY 10002',
    location: { city: 'New York', state: 'NY', zipCode: '10002', lat: 40.7220, lng: -73.9860 },
    hours: 'Mon-Fri 8:30 AM - 5:30 PM',
    phone: '212-555-0188',
    email: 'care@leshealth.org',
    website: 'https://leshealth.org',
    eligibility: 'Uninsured and Medicaid patients welcome.',
    availability: 'Walk-ins Welcome',
    tags: ['health', 'clinic', 'medical', 'dental', 'new york', 'nyc', 'ny']
  },

  // Chicago
  {
    id: 'res-chi-1',
    name: 'Windy City Food Pantry & Kitchen',
    category: 'food',
    description: 'Serves hot daily lunches and provides essential grocery boxes to families across Chicago West Side.',
    address: '1500 W Monroe St, Chicago, IL 60607',
    location: { city: 'Chicago', state: 'IL', zipCode: '60607', lat: 41.8803, lng: -87.6650 },
    hours: 'Daily 9:00 AM - 3:00 PM',
    phone: '312-555-0130',
    email: 'info@windycityfood.org',
    website: 'https://windycityfood.org',
    eligibility: 'Open to everyone. No income proof required.',
    availability: 'Open Daily',
    tags: ['food', 'soup kitchen', 'pantry', 'chicago', 'il', 'illinois']
  },
  {
    id: 'res-chi-2',
    name: 'Loop Legal Aid & Housing Defense',
    category: 'legal',
    description: 'Pro bono legal assistance for tenants, eviction defense, workers rights, and public assistance advocacy.',
    address: '200 S Michigan Ave, Chicago, IL 60604',
    location: { city: 'Chicago', state: 'IL', zipCode: '60604', lat: 41.8781, lng: -87.6247 },
    hours: 'Mon-Fri 9:00 AM - 5:00 PM',
    phone: '312-555-0177',
    email: 'help@chicagolegal.org',
    website: 'https://chicagolegal.org',
    eligibility: 'Low-income Chicago residents.',
    availability: 'Appointments Available',
    tags: ['legal', 'eviction', 'housing', 'chicago', 'il', 'illinois']
  },

  // Los Angeles
  {
    id: 'res-la-1',
    name: 'Angel City Emergency Mission',
    category: 'shelter',
    description: 'Providing clean beds, warm meals, showers, and medical triage for individuals on Skid Row and greater LA.',
    address: '540 S San Pedro St, Los Angeles, CA 90013',
    location: { city: 'Los Angeles', state: 'CA', zipCode: '90013', lat: 34.0435, lng: -118.2458 },
    hours: '24/7 Operations',
    phone: '213-555-0160',
    email: 'intake@angelcitymission.org',
    website: 'https://angelcitymission.org',
    eligibility: 'Anyone in immediate need of shelter or shelter services.',
    availability: '25 Beds Available',
    tags: ['shelter', 'housing', 'beds', 'los angeles', 'la', 'ca', 'california']
  },
  {
    id: 'res-la-2',
    name: 'Sunset Community Health Clinic',
    category: 'health',
    description: 'Comprehensive free health services, pediatric care, women health services, and mental health counseling.',
    address: '6250 Sunset Blvd, Los Angeles, CA 90028',
    location: { city: 'Los Angeles', state: 'CA', zipCode: '90028', lat: 34.0980, lng: -118.3255 },
    hours: 'Mon-Sat 8:00 AM - 6:00 PM',
    phone: '323-555-0122',
    email: 'appointments@sunsethealth.org',
    website: 'https://sunsethealth.org',
    eligibility: 'Free and low-cost care for uninsured community members.',
    availability: 'Walk-ins Welcome',
    tags: ['health', 'medical', 'clinic', 'los angeles', 'la', 'ca', 'california']
  },

  // Houston
  {
    id: 'res-hou-1',
    name: 'Lone Star Food Relief & Community Pantry',
    category: 'food',
    description: 'Mobile food distribution and emergency grocery assistance for families across Houston metro area.',
    address: '2500 Main St, Houston, TX 77002',
    location: { city: 'Houston', state: 'TX', zipCode: '77002', lat: 29.7490, lng: -95.3700 },
    hours: 'Mon-Fri 8:00 AM - 4:30 PM',
    phone: '713-555-0155',
    email: 'contact@lonestarfood.org',
    website: 'https://lonestarfood.org',
    eligibility: 'All Texas residents needing food support.',
    availability: 'Open Now',
    tags: ['food', 'pantry', 'groceries', 'houston', 'tx', 'texas']
  },

  // Seattle
  {
    id: 'res-sea-1',
    name: 'Emerald City Crisis & Housing Resource Center',
    category: 'support',
    description: 'Navigational assistance connecting unhoused and low-income residents to shelter beds, food benefits, and job training.',
    address: '1000 2nd Ave, Seattle, WA 98104',
    location: { city: 'Seattle', state: 'WA', zipCode: '98104', lat: 47.6050, lng: -122.3350 },
    hours: 'Mon-Fri 8:00 AM - 5:00 PM',
    phone: '206-555-0140',
    email: 'support@emeraldcityhelp.org',
    website: 'https://emeraldcityhelp.org',
    eligibility: 'Open to all Seattle & King County residents.',
    availability: 'Walk-ins Welcome',
    tags: ['support', 'community', 'housing', 'job training', 'seattle', 'wa', 'washington']
  },

  // Austin
  {
    id: 'res-aus-1',
    name: 'Capital Area Community Health & Food Hub',
    category: 'health',
    description: 'Free healthcare triage, wellness exams, and daily community meal distribution in downtown Austin.',
    address: '600 E 7th St, Austin, TX 78701',
    location: { city: 'Austin', state: 'TX', zipCode: '78701', lat: 30.2680, lng: -97.7380 },
    hours: 'Mon-Sat 9:00 AM - 4:00 PM',
    phone: '512-555-0190',
    email: 'info@austinhealthhub.org',
    website: 'https://austinhealthhub.org',
    eligibility: 'Open to all Central Texas community members.',
    availability: 'Open Now',
    tags: ['health', 'food', 'clinic', 'austin', 'tx', 'texas']
  }
];
