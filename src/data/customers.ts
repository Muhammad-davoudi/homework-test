import { Customer } from '../types';

const FIRST_NAMES = [
  'Elena', 'Marcus', 'Sophia', 'Liam', 'Aria', 'Noah', 'Chloe', 'Ethan', 'Maya', 'Lucas',
  'Zoe', 'Mason', 'Lily', 'Logan', 'Grace', 'Jacob', 'Hannah', 'Jackson', 'Evelyn', 'Aiden',
  'Abigail', 'Samuel', 'Nora', 'David', 'Scarlett', 'Joseph', 'Victoria', 'Carter', 'Madison', 'Owen',
  'Eleanor', 'Wyatt', 'Penelope', 'John', 'Layla', 'Jack', 'Riley', 'Luke', 'Zoey', 'Jayden',
  'Nadia', 'Dylan', 'hazel', 'Grayson', 'Violet', 'Levi', 'Aurora', 'Isaac', 'Savannah', 'Gabriel',
  'Audrey', 'Julian', 'Brooklyn', 'Mateo', 'Bella', 'Anthony', 'Claire', 'Jaxon', 'Skylar', 'Lincoln',
];

const LAST_NAMES = [
  'Rostova', 'Vance', 'Chen', 'OConnor', 'Patel', 'Takahashi', 'Lindqvist', 'Moreau', 'Kowalski', 'Silva',
  'Alvarez', 'novak', 'Fischer', 'Dubois', 'Bergman', 'Mercer', 'Sato', 'Keller', 'kim', 'Santoro',
  'Thorne', 'Gallagher', 'Sinclair', 'Vermeer', 'Bauer', 'Harrington', 'choi', 'Delgado', 'Svensson', 'cross',
];

const COMPANIES = [
  'Vertex Systems', 'Aether Labs', 'Kinetix Digital', 'Stratos Cloud', 'Lumina Studio',
  'Pulse Robotics', 'quantive AI', 'Horizon Media', 'Cobalt Security', 'NexaFlow Inc',
  'Vanguard Capital', 'Meridian Design', 'Vector Dynamics', 'Obsidian Tech', 'Helios Energy',
  'Apex BioLabs', 'Synapse Analytics', 'Boreal Architecture', 'Catalyst Ventures', 'Hyperion Dev',
  'solaris Networks', 'Prism Forge', 'Zenith Freight', 'Ionic Instruments', 'Atlas Advisory',
];

const REGIONS: Customer['region'][] = [
  'North America',
  'Europe',
  'Asia Pacific',
  'Latin America',
];

const CHANNELS: Customer['channel'][] = [
  'Direct Enterprise',
  'Organic Search',
  'Partner Referral',
  'Paid Social',
];

function formatCap(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Generate 115 deterministic customers
export const CUSTOMERS: Customer[] = Array.from({ length: 115 }, (_, idx) => {
  const idNum = idx + 1;
  const id = `CUS-${String(idNum).padStart(3, '0')}`;
  const firstName = formatCap(FIRST_NAMES[idx % FIRST_NAMES.length]);
  const lastName = formatCap(LAST_NAMES[(idx * 7 + 3) % LAST_NAMES.length]);
  const company = COMPANIES[(idx * 5 + 2) % COMPANIES.length];
  const region = REGIONS[(idx * 3) % REGIONS.length];
  const channel = CHANNELS[(idx * 11 + 1) % CHANNELS.length];

  // Join dates distributed between 2025-11-01 and 2026-10-28
  const monthOffset = idx % 11; // 0 to 10
  const year = monthOffset < 2 ? 2025 : 2026;
  const month = monthOffset < 2 ? 11 + monthOffset : monthOffset - 1;
  const day = ((idx * 13) % 27) + 1;
  const joinedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const cleanCompanyDomain = company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.io';

  return {
    id,
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${cleanCompanyDomain}`,
    company,
    region,
    channel,
    joinedDate,
  };
});
