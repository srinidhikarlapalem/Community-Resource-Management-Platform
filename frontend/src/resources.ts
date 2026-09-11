export type DirectoryResource = {
  id: string;
  name: string;
  organization: string;
  category: string;
  location: string;
  serviceArea: string;
  format: string[];
  summary: string;
  services: string[];
  eligibility: string;
  nextStep: string;
  phone?: string;
  address?: string;
  website: string;
  languages?: string;
  featured?: boolean;
};

export const directoryResources: DirectoryResource[] = [
  {
    id: "mass-211",
    name: "Community resource navigation",
    organization: "Massachusetts 211",
    category: "Navigation",
    location: "Greater Boston",
    serviceArea: "Statewide",
    format: ["Phone", "Online"],
    summary:
      "Free connection to local health and human services, including food, housing, utilities, transportation, and crisis support.",
    services: [
      "Personalized resource referrals",
      "Local program information",
      "Disaster and community updates",
    ],
    eligibility: "Available to anyone looking for services in Massachusetts.",
    nextStep: "Call 211 or search the official directory online.",
    phone: "211",
    website: "https://mass211.org/",
    languages: "Multilingual assistance is available",
    featured: true,
  },
  {
    id: "gbfb",
    name: "Find local food assistance",
    organization: "The Greater Boston Food Bank",
    category: "Food",
    location: "Greater Boston",
    serviceArea: "Eastern Massachusetts",
    format: ["Online", "In person"],
    summary:
      "Search for food pantries, community meals, and other food assistance near your ZIP code.",
    services: [
      "Local food-resource search",
      "SNAP application guidance",
      "Food assistance information",
    ],
    eligibility: "Requirements vary by participating pantry or meal program.",
    nextStep:
      "Use the official ZIP-code search to find a nearby food program and confirm its current schedule.",
    phone: "617-427-5200",
    address: "70 South Bay Avenue, Boston, MA 02118",
    website: "https://www.gbfb.org/need-food/",
    featured: true,
  },
  {
    id: "project-bread",
    name: "FoodSource Hotline and SNAP help",
    organization: "Project Bread",
    category: "Food",
    location: "Greater Boston",
    serviceArea: "Statewide",
    format: ["Phone", "Online"],
    summary:
      "Confidential help finding food resources and understanding or applying for SNAP benefits.",
    services: [
      "FoodSource Hotline",
      "SNAP application assistance",
      "Food-resource referrals",
    ],
    eligibility:
      "Massachusetts residents seeking food assistance or SNAP information.",
    nextStep:
      "Call the FoodSource Hotline or begin with the official food-help page.",
    phone: "1-800-645-8333",
    website: "https://projectbread.org/get-help",
    languages: "Support is available in multiple languages",
    featured: true,
  },
  {
    id: "pine-street",
    name: "Emergency shelter and street outreach",
    organization: "Pine Street Inn",
    category: "Housing",
    location: "Boston",
    serviceArea: "Boston",
    format: ["In person", "Phone"],
    summary:
      "Emergency services, street outreach, supportive housing, and workforce development for adults experiencing homelessness.",
    services: [
      "Emergency shelter",
      "Street outreach",
      "Supportive housing",
      "Workforce development",
    ],
    eligibility:
      "Program requirements differ by service. Contact Pine Street Inn for current intake guidance.",
    nextStep:
      "Open the official Find Help page or call the main office for current instructions.",
    phone: "617-892-9100",
    address: "444 Harrison Avenue, Boston, MA 02118",
    website: "https://www.pinestreetinn.org/find-help",
    featured: true,
  },
  {
    id: "metro-housing",
    name: "Housing stability and homelessness prevention",
    organization: "Metro Housing Boston",
    category: "Housing",
    location: "Boston",
    serviceArea: "Greater Boston",
    format: ["Online", "Phone", "In person"],
    summary:
      "Housing assistance for households facing instability, including homelessness prevention, vouchers, and financial assistance programs.",
    services: [
      "RAFT and HomeBASE information",
      "Housing vouchers",
      "Housing stability support",
      "Financial coaching",
    ],
    eligibility:
      "Eligibility depends on the program, household circumstances, income, and location.",
    nextStep:
      "Use the official program finder to identify the correct service before scheduling or applying.",
    website: "https://www.metrohousingboston.org/",
    featured: true,
  },
  {
    id: "cambridge-msc",
    name: "Housing support and homelessness services",
    organization: "Cambridge Multi-Service Center",
    category: "Housing",
    location: "Cambridge",
    serviceArea: "Cambridge",
    format: ["Phone", "In person"],
    summary:
      "City support for Cambridge residents who are homeless, at risk of homelessness, or navigating housing instability.",
    services: [
      "Housing search support",
      "Benefits and service referrals",
      "Homelessness prevention guidance",
    ],
    eligibility:
      "Primarily serves Cambridge residents and people experiencing homelessness in Cambridge.",
    nextStep:
      "Review the City of Cambridge service information and contact the center for intake guidance.",
    website:
      "https://www.cambridgema.gov/Departments/humanserviceprograms/ProgramsForAdults/MultiServiceCenter",
  },
  {
    id: "shc",
    name: "Food and housing support",
    organization: "Somerville Homeless Coalition",
    category: "Housing",
    location: "Somerville",
    serviceArea: "Somerville and nearby communities",
    format: ["Phone", "In person", "Online"],
    summary:
      "Programs addressing homelessness and food insecurity through prevention, shelter, supportive services, and food access.",
    services: [
      "Homelessness prevention",
      "Emergency and supportive housing",
      "Project SOUP food pantry",
      "Case management",
    ],
    eligibility: "Eligibility and service area vary by program.",
    nextStep:
      "Choose a program on the official website and contact the organization for current availability.",
    website: "https://somervillehomelesscoalition.org/",
  },
  {
    id: "gbls",
    name: "Free civil legal assistance",
    organization: "Greater Boston Legal Services",
    category: "Legal",
    location: "Boston",
    serviceArea: "Greater Boston",
    format: ["Online", "Phone", "In person"],
    summary:
      "Free civil legal help for qualifying people facing challenges involving housing, income, employment, immigration, family safety, and other essential needs.",
    services: [
      "Housing law",
      "Public benefits and income",
      "Employment",
      "Immigration",
      "Domestic violence advocacy",
    ],
    eligibility:
      "Serves qualifying Greater Boston residents who cannot afford private legal representation. Requirements vary by legal issue.",
    nextStep:
      "Review the eligibility information and use the official Get Legal Help process.",
    address: "197 Friend Street, Boston, MA 02114",
    website: "https://www.gbls.org/get-legal-help",
    featured: true,
  },
  {
    id: "bhchp",
    name: "Healthcare for people experiencing homelessness",
    organization: "Boston Health Care for the Homeless Program",
    category: "Healthcare",
    location: "Boston",
    serviceArea: "Greater Boston",
    format: ["In person", "Phone"],
    summary:
      "Medical, behavioral-health, dental, and support services delivered at clinics, shelters, and outreach locations.",
    services: [
      "Primary and urgent care",
      "Behavioral health",
      "Dental care",
      "Street and shelter outreach",
    ],
    eligibility:
      "Designed for people experiencing homelessness or housing instability in Greater Boston.",
    nextStep:
      "Use the official locations page to identify the most appropriate clinic and confirm hours.",
    website: "https://www.bhchp.org/patient-services/locations/",
    featured: true,
  },
  {
    id: "rosies-place",
    name: "Support for women experiencing hardship",
    organization: "Rosie's Place",
    category: "Family support",
    location: "Boston",
    serviceArea: "Greater Boston",
    format: ["In person", "Phone"],
    summary:
      "Food, shelter, advocacy, education, and essential services for women facing homelessness or financial hardship.",
    services: [
      "Meals and food access",
      "Overnight shelter",
      "Advocacy",
      "Education and employment support",
    ],
    eligibility:
      "Rosie's Place serves women, including transgender women, who need support.",
    nextStep:
      "Review the official service information and contact Rosie's Place before visiting when possible.",
    address: "889 Harrison Avenue, Boston, MA 02118",
    website: "https://www.rosiesplace.org/how-we-help",
  },
  {
    id: "abcd",
    name: "Neighborhood-based assistance",
    organization: "Action for Boston Community Development",
    category: "Financial support",
    location: "Boston",
    serviceArea: "Boston neighborhoods",
    format: ["In person", "Phone", "Online"],
    summary:
      "A network of neighborhood centers providing assistance with food, fuel, housing, taxes, employment, education, and family needs.",
    services: [
      "Fuel assistance",
      "Food access",
      "Housing services",
      "Tax preparation",
      "Workforce and family programs",
    ],
    eligibility:
      "Eligibility depends on the specific program and household circumstances.",
    nextStep:
      "Use the official location finder to connect with the ABCD neighborhood center serving your area.",
    website: "https://bostonabcd.org/service-categories/",
  },
  {
    id: "la-colaborativa",
    name: "Food, housing, and immigrant-family support",
    organization: "La Colaborativa",
    category: "Family support",
    location: "Chelsea",
    serviceArea: "Chelsea and Greater Boston",
    format: ["In person", "Online"],
    summary:
      "Community-led support focused on food access, housing stability, workers' rights, immigrant families, and emergency response.",
    services: [
      "Food assistance",
      "Housing support",
      "Workers' rights",
      "Immigrant-family navigation",
    ],
    eligibility:
      "Services focus on Chelsea residents and immigrant and working families; requirements vary by program.",
    nextStep:
      "Visit the official website for current programs and contact information.",
    website: "https://la-colaborativa.org/",
    languages: "Community support includes Spanish-language access",
  },
  {
    id: "atask",
    name: "Domestic violence support for Asian families",
    organization: "Asian Task Force Against Domestic Violence",
    category: "Safety",
    location: "Greater Boston",
    serviceArea: "Greater Boston and Massachusetts",
    format: ["Phone", "Online"],
    summary:
      "Culturally and linguistically responsive support for Asian survivors of domestic violence and their families.",
    services: [
      "Confidential hotline",
      "Safety planning",
      "Emergency support",
      "Legal and housing advocacy",
    ],
    eligibility:
      "Services are intended for Asian survivors of domestic violence and their families.",
    nextStep:
      "Use the official Get Help page. If immediate danger is present, call 911.",
    website: "https://www.atask.org/get-help",
    languages: "Multilingual and culturally responsive support",
  },
  {
    id: "mbta-income",
    name: "Income-eligible reduced transit fares",
    organization: "MBTA",
    category: "Transportation",
    location: "Greater Boston",
    serviceArea: "MBTA service area",
    format: ["Online", "In person"],
    summary:
      "Reduced bus, subway, commuter rail, and paratransit fares for qualifying Massachusetts residents.",
    services: [
      "Reduced-fare CharlieCard",
      "Online eligibility information",
      "Enrollment support",
    ],
    eligibility:
      "Available to qualifying Massachusetts residents ages 18–64 who participate in an approved assistance program.",
    nextStep:
      "Review the current eligibility list and application steps on the official MBTA page.",
    website: "https://www.mbta.com/fares/reduced/income-eligible",
  },
];
