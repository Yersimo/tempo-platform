/**
 * Country Data Helper
 *
 * Provides country metadata for the tax calculator:
 * - Full country names
 * - Region groupings
 * - Flag emojis
 * - Lookup utilities
 */

import type { SupportedCountry } from './tax-calculator'

// ============================================================
// COUNTRY NAMES (ISO code -> full name)
// ============================================================

export const COUNTRY_NAMES: Record<string, string> = {
  // Original 6
  US: 'United States',
  UK: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  CA: 'Canada',
  AU: 'Australia',

  // EU countries
  NL: 'Netherlands',
  BE: 'Belgium',
  ES: 'Spain',
  IT: 'Italy',
  PT: 'Portugal',
  IE: 'Ireland',
  AT: 'Austria',
  PL: 'Poland',
  SE: 'Sweden',
  DK: 'Denmark',
  FI: 'Finland',
  GR: 'Greece',
  CZ: 'Czech Republic',
  RO: 'Romania',
  HU: 'Hungary',
  BG: 'Bulgaria',
  HR: 'Croatia',
  SK: 'Slovakia',
  LU: 'Luxembourg',
  EE: 'Estonia',
  LV: 'Latvia',
  LT: 'Lithuania',
  SI: 'Slovenia',
  CY: 'Cyprus',
  MT: 'Malta',

  // African countries
  NG: 'Nigeria',
  GH: 'Ghana',
  KE: 'Kenya',
  ZA: 'South Africa',
  EG: 'Egypt',
  MA: 'Morocco',
  TN: 'Tunisia',
  SN: 'Senegal',
  CI: 'Ivory Coast',
  TZ: 'Tanzania',
  ET: 'Ethiopia',
  RW: 'Rwanda',
  UG: 'Uganda',
  CM: 'Cameroon',
  CD: 'Democratic Republic of the Congo',
  DZ: 'Algeria',
  AO: 'Angola',
  MZ: 'Mozambique',
  ZM: 'Zambia',
  ZW: 'Zimbabwe',
  BW: 'Botswana',
  MU: 'Mauritius',
  NA: 'Namibia',
  ML: 'Mali',
  BF: 'Burkina Faso',
  NE: 'Niger',
  TD: 'Chad',
  GN: 'Guinea',
  BJ: 'Benin',
  TG: 'Togo',
  SL: 'Sierra Leone',
  LR: 'Liberia',
  CF: 'Central African Republic',
  CG: 'Republic of the Congo',
  GA: 'Gabon',
  GQ: 'Equatorial Guinea',
  MR: 'Mauritania',
  DJ: 'Djibouti',
  ER: 'Eritrea',
  SO: 'Somalia',
  SS: 'South Sudan',
  SD: 'Sudan',
  LY: 'Libya',
  MW: 'Malawi',
  MG: 'Madagascar',
  SZ: 'Eswatini',
  LS: 'Lesotho',
  SC: 'Seychelles',
  CV: 'Cape Verde',
  ST: 'Sao Tome and Principe',
  KM: 'Comoros',
  GM: 'Gambia',
  GW: 'Guinea-Bissau',
  BI: 'Burundi',

  // Other major markets
  JP: 'Japan',
  KR: 'South Korea',
  SG: 'Singapore',
  HK: 'Hong Kong',
  IN: 'India',
  BR: 'Brazil',
  MX: 'Mexico',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  IL: 'Israel',
  NZ: 'New Zealand',
  CH: 'Switzerland',
  NO: 'Norway',
  IS: 'Iceland',
}

// ============================================================
// COUNTRY REGIONS
// ============================================================

export const COUNTRY_REGIONS: Record<string, string[]> = {
  'North America': ['US', 'CA', 'MX'],
  'South America': ['BR'],
  'European Union': [
    'DE', 'FR', 'NL', 'BE', 'ES', 'IT', 'PT', 'IE', 'AT', 'PL',
    'SE', 'DK', 'FI', 'GR', 'CZ', 'RO', 'HU', 'BG', 'HR', 'SK',
    'LU', 'EE', 'LV', 'LT', 'SI', 'CY', 'MT',
  ],
  'Europe (Non-EU)': ['UK', 'CH', 'NO', 'IS'],
  'East Africa': ['KE', 'TZ', 'ET', 'RW', 'UG', 'DJ', 'ER', 'SO', 'SS', 'SD', 'BI', 'KM', 'SC', 'MG', 'MU', 'MW'],
  'West Africa': ['NG', 'GH', 'SN', 'CI', 'ML', 'BF', 'NE', 'GN', 'BJ', 'TG', 'SL', 'LR', 'GM', 'GW', 'CV', 'MR', 'ST'],
  'Central Africa': ['CM', 'CD', 'CF', 'CG', 'GA', 'GQ', 'TD'],
  'North Africa': ['EG', 'MA', 'TN', 'DZ', 'LY'],
  'Southern Africa': ['ZA', 'AO', 'MZ', 'ZM', 'ZW', 'BW', 'NA', 'SZ', 'LS'],
  'East Asia': ['JP', 'KR', 'HK'],
  'Southeast Asia': ['SG'],
  'South Asia': ['IN'],
  'Middle East': ['AE', 'SA', 'IL'],
  'Oceania': ['AU', 'NZ'],
}

// ============================================================
// COUNTRY FLAGS (ISO code -> emoji flag)
// ============================================================

export const COUNTRY_FLAGS: Record<string, string> = {
  // Original 6
  US: '\u{1F1FA}\u{1F1F8}',
  UK: '\u{1F1EC}\u{1F1E7}',
  DE: '\u{1F1E9}\u{1F1EA}',
  FR: '\u{1F1EB}\u{1F1F7}',
  CA: '\u{1F1E8}\u{1F1E6}',
  AU: '\u{1F1E6}\u{1F1FA}',

  // EU countries
  NL: '\u{1F1F3}\u{1F1F1}',
  BE: '\u{1F1E7}\u{1F1EA}',
  ES: '\u{1F1EA}\u{1F1F8}',
  IT: '\u{1F1EE}\u{1F1F9}',
  PT: '\u{1F1F5}\u{1F1F9}',
  IE: '\u{1F1EE}\u{1F1EA}',
  AT: '\u{1F1E6}\u{1F1F9}',
  PL: '\u{1F1F5}\u{1F1F1}',
  SE: '\u{1F1F8}\u{1F1EA}',
  DK: '\u{1F1E9}\u{1F1F0}',
  FI: '\u{1F1EB}\u{1F1EE}',
  GR: '\u{1F1EC}\u{1F1F7}',
  CZ: '\u{1F1E8}\u{1F1FF}',
  RO: '\u{1F1F7}\u{1F1F4}',
  HU: '\u{1F1ED}\u{1F1FA}',
  BG: '\u{1F1E7}\u{1F1EC}',
  HR: '\u{1F1ED}\u{1F1F7}',
  SK: '\u{1F1F8}\u{1F1F0}',
  LU: '\u{1F1F1}\u{1F1FA}',
  EE: '\u{1F1EA}\u{1F1EA}',
  LV: '\u{1F1F1}\u{1F1FB}',
  LT: '\u{1F1F1}\u{1F1F9}',
  SI: '\u{1F1F8}\u{1F1EE}',
  CY: '\u{1F1E8}\u{1F1FE}',
  MT: '\u{1F1F2}\u{1F1F9}',

  // African countries
  NG: '\u{1F1F3}\u{1F1EC}',
  GH: '\u{1F1EC}\u{1F1ED}',
  KE: '\u{1F1F0}\u{1F1EA}',
  ZA: '\u{1F1FF}\u{1F1E6}',
  EG: '\u{1F1EA}\u{1F1EC}',
  MA: '\u{1F1F2}\u{1F1E6}',
  TN: '\u{1F1F9}\u{1F1F3}',
  SN: '\u{1F1F8}\u{1F1F3}',
  CI: '\u{1F1E8}\u{1F1EE}',
  TZ: '\u{1F1F9}\u{1F1FF}',
  ET: '\u{1F1EA}\u{1F1F9}',
  RW: '\u{1F1F7}\u{1F1FC}',
  UG: '\u{1F1FA}\u{1F1EC}',
  CM: '\u{1F1E8}\u{1F1F2}',
  CD: '\u{1F1E8}\u{1F1E9}',
  DZ: '\u{1F1E9}\u{1F1FF}',
  AO: '\u{1F1E6}\u{1F1F4}',
  MZ: '\u{1F1F2}\u{1F1FF}',
  ZM: '\u{1F1FF}\u{1F1F2}',
  ZW: '\u{1F1FF}\u{1F1FC}',
  BW: '\u{1F1E7}\u{1F1FC}',
  MU: '\u{1F1F2}\u{1F1FA}',
  NA: '\u{1F1F3}\u{1F1E6}',
  ML: '\u{1F1F2}\u{1F1F1}',
  BF: '\u{1F1E7}\u{1F1EB}',
  NE: '\u{1F1F3}\u{1F1EA}',
  TD: '\u{1F1F9}\u{1F1E9}',
  GN: '\u{1F1EC}\u{1F1F3}',
  BJ: '\u{1F1E7}\u{1F1EF}',
  TG: '\u{1F1F9}\u{1F1EC}',
  SL: '\u{1F1F8}\u{1F1F1}',
  LR: '\u{1F1F1}\u{1F1F7}',
  CF: '\u{1F1E8}\u{1F1EB}',
  CG: '\u{1F1E8}\u{1F1EC}',
  GA: '\u{1F1EC}\u{1F1E6}',
  GQ: '\u{1F1EC}\u{1F1F6}',
  MR: '\u{1F1F2}\u{1F1F7}',
  DJ: '\u{1F1E9}\u{1F1EF}',
  ER: '\u{1F1EA}\u{1F1F7}',
  SO: '\u{1F1F8}\u{1F1F4}',
  SS: '\u{1F1F8}\u{1F1F8}',
  SD: '\u{1F1F8}\u{1F1E9}',
  LY: '\u{1F1F1}\u{1F1FE}',
  MW: '\u{1F1F2}\u{1F1FC}',
  MG: '\u{1F1F2}\u{1F1EC}',
  SZ: '\u{1F1F8}\u{1F1FF}',
  LS: '\u{1F1F1}\u{1F1F8}',
  SC: '\u{1F1F8}\u{1F1E8}',
  CV: '\u{1F1E8}\u{1F1FB}',
  ST: '\u{1F1F8}\u{1F1F9}',
  KM: '\u{1F1F0}\u{1F1F2}',
  GM: '\u{1F1EC}\u{1F1F2}',
  GW: '\u{1F1EC}\u{1F1FC}',
  BI: '\u{1F1E7}\u{1F1EE}',

  // Other major markets
  JP: '\u{1F1EF}\u{1F1F5}',
  KR: '\u{1F1F0}\u{1F1F7}',
  SG: '\u{1F1F8}\u{1F1EC}',
  HK: '\u{1F1ED}\u{1F1F0}',
  IN: '\u{1F1EE}\u{1F1F3}',
  BR: '\u{1F1E7}\u{1F1F7}',
  MX: '\u{1F1F2}\u{1F1FD}',
  AE: '\u{1F1E6}\u{1F1EA}',
  SA: '\u{1F1F8}\u{1F1E6}',
  IL: '\u{1F1EE}\u{1F1F1}',
  NZ: '\u{1F1F3}\u{1F1FF}',
  CH: '\u{1F1E8}\u{1F1ED}',
  NO: '\u{1F1F3}\u{1F1F4}',
  IS: '\u{1F1EE}\u{1F1F8}',
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get all country ISO codes belonging to a specific region.
 * Returns an empty array if the region is not found.
 */
export function getCountriesByRegion(region: string): string[] {
  return COUNTRY_REGIONS[region] ?? []
}

/**
 * Get a flat array of all supported country ISO codes.
 */
export function getAllSupportedCountries(): string[] {
  return Object.keys(COUNTRY_NAMES)
}

/**
 * Check whether a given ISO code is a supported country.
 */
export function isCountrySupported(code: string): code is SupportedCountry {
  return code in COUNTRY_NAMES
}
