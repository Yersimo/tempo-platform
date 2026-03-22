// ─── Data Residency Service ──────────────────────────────────────────────
// Manages data region assignments, cross-border compliance checks,
// and regulatory framework mapping for multi-region deployments.

export interface DataRegion {
  name: string
  provider: string
  location: string
  regulations: string[]
}

export const DATA_REGIONS: Record<string, DataRegion> = {
  'us-east': { name: 'United States (East)', provider: 'Neon', location: 'Virginia', regulations: ['SOX', 'CCPA'] },
  'us-west': { name: 'United States (West)', provider: 'Neon', location: 'Oregon', regulations: ['SOX', 'CCPA'] },
  'eu-west': { name: 'European Union (West)', provider: 'Neon', location: 'Frankfurt', regulations: ['GDPR'] },
  'eu-north': { name: 'European Union (North)', provider: 'Neon', location: 'Stockholm', regulations: ['GDPR'] },
  'af-south': { name: 'Africa (South)', provider: 'Neon', location: 'Johannesburg', regulations: ['POPIA'] },
  'af-west': { name: 'Africa (West)', provider: 'Neon', location: 'Lagos', regulations: ['NDPR'] },
  'ap-southeast': { name: 'Asia Pacific', provider: 'Neon', location: 'Singapore', regulations: ['PDPA'] },
  'me-central': { name: 'Middle East', provider: 'Neon', location: 'Bahrain', regulations: ['DIFC'] },
}

const COUNTRY_TO_REGION: Record<string, string> = {
  'US': 'us-east', 'CA': 'us-east',
  'GB': 'eu-west', 'DE': 'eu-west', 'FR': 'eu-west', 'NL': 'eu-west',
  'SE': 'eu-north', 'NO': 'eu-north', 'FI': 'eu-north',
  'ZA': 'af-south',
  'GH': 'af-west', 'NG': 'af-west', 'SN': 'af-west', 'CI': 'af-west',
  'KE': 'af-south', 'TZ': 'af-south', 'UG': 'af-south',
  'SG': 'ap-southeast', 'MY': 'ap-southeast', 'IN': 'ap-southeast',
  'AE': 'me-central', 'SA': 'me-central', 'BH': 'me-central',
}

export function getRegionForCountry(country: string): string {
  return COUNTRY_TO_REGION[country] || 'us-east'
}

export function getRegionDetails(regionKey: string): DataRegion | null {
  return DATA_REGIONS[regionKey] || null
}

export function getAllRegions(): Array<{ key: string } & DataRegion> {
  return Object.entries(DATA_REGIONS).map(([key, region]) => ({ key, ...region }))
}

export interface CrossBorderComplianceResult {
  allowed: boolean
  requirements: string[]
  frameworks: string[]
}

export function checkCrossBorderCompliance(
  sourceRegion: string,
  targetRegion: string
): CrossBorderComplianceResult {
  // Same region — always allowed, no requirements
  if (sourceRegion === targetRegion) {
    return { allowed: true, requirements: [], frameworks: [] }
  }

  // GDPR: requires Standard Contractual Clauses for transfers outside EU
  if (sourceRegion.startsWith('eu-') && !targetRegion.startsWith('eu-')) {
    return {
      allowed: true,
      requirements: [
        'Standard Contractual Clauses (SCCs) required',
        'Data Protection Impact Assessment recommended',
        'Transfer Impact Assessment required per Schrems II',
      ],
      frameworks: ['GDPR Article 46', 'GDPR Article 49'],
    }
  }

  // NDPR: requires adequacy assessment for transfers outside Nigeria
  if (sourceRegion === 'af-west' && targetRegion !== 'af-west') {
    return {
      allowed: true,
      requirements: [
        'NDPR adequacy assessment required',
        'Data transfer agreement needed',
        'NITDA notification may be required',
      ],
      frameworks: ['NDPR Regulation 2.11'],
    }
  }

  // POPIA: transfers outside South Africa need adequate protection
  if (sourceRegion === 'af-south' && targetRegion !== 'af-south') {
    return {
      allowed: true,
      requirements: [
        'Recipient must have adequate data protection laws or binding agreements',
        'Consent of data subject or contractual necessity required',
      ],
      frameworks: ['POPIA Section 72'],
    }
  }

  // PDPA: Singapore cross-border transfers
  if (sourceRegion === 'ap-southeast' && targetRegion !== 'ap-southeast') {
    return {
      allowed: true,
      requirements: [
        'Recipient must provide comparable standard of protection',
        'Binding corporate rules or contractual arrangements required',
      ],
      frameworks: ['PDPA Transfer Limitation Obligation'],
    }
  }

  // Default: allowed with no special requirements
  return { allowed: true, requirements: [], frameworks: [] }
}

export function getRecommendedRegion(country: string): {
  region: string
  details: DataRegion
  regulatoryFramework: string
} {
  const regionKey = getRegionForCountry(country)
  const details = DATA_REGIONS[regionKey]
  return {
    region: regionKey,
    details,
    regulatoryFramework: details.regulations[0] || 'None',
  }
}

export function getDataClassificationOptions(): Array<{ value: string; label: string; description: string }> {
  return [
    { value: 'standard', label: 'Standard', description: 'General business data with standard protection' },
    { value: 'sensitive', label: 'Sensitive', description: 'PII, financial data, or health records requiring enhanced protection' },
    { value: 'restricted', label: 'Restricted', description: 'Highly confidential data with strict access controls and encryption' },
  ]
}
