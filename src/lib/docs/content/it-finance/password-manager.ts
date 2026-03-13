import type { ModuleDoc } from '../../types'

const passwordManager: ModuleDoc = {
  slug: 'password-manager',
  title: 'Password Manager',
  subtitle: 'Securely store, share, and manage credentials across teams with zero-knowledge encryption and access controls',
  icon: 'Lock',
  group: 'it-finance',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Password Manager module provides enterprise-grade credential management with zero-knowledge encryption. Teams can securely store passwords, API keys, certificates, and sensitive notes in organized vaults with granular sharing controls. The module integrates with the Identity module for SSO-based vault access and supports browser extensions for seamless autofill. Administrators have full visibility into sharing patterns and can enforce password policies without ever seeing the actual credentials.',
    keyFeatures: [
      'Zero-knowledge encryption ensuring only authorized users can decrypt stored credentials',
      'Team and personal vaults with folder-based organization',
      'Granular sharing controls with view-only and edit permissions',
      'Browser extension for autofill and credential capture',
      'Password health scoring with strength, reuse, and breach detection',
      'Secure credential sharing with expiring links and one-time view options',
      'API key and certificate management with expiration tracking',
      'Emergency access configuration for business continuity',
      'Comprehensive audit log of all vault access and sharing events',
      'Integration with SSO for vault authentication',
    ],
    screenshotKey: 'password-manager/overview',
  },

  workflows: [
    {
      id: 'create-team-vault',
      title: 'Creating and Organizing a Team Vault',
      description:
        'Set up a shared vault for a team, organize credentials into folders, and configure access permissions.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin'],
      prerequisites: [
        'Team members must have active accounts in Tempo',
        'The vault creator must have the password manager admin permission',
      ],
      steps: [
        {
          number: 1,
          title: 'Navigate to Password Manager',
          description:
            'Click "Password Manager" in the left sidebar under IT & Finance. The vault list shows your personal vault and any team vaults you have access to.',
          screenshotKey: 'password-manager/vault-step-1',
        },
        {
          number: 2,
          title: 'Create a new vault',
          description:
            'Click "New Vault" and select "Team Vault". Enter the vault name (e.g., "Engineering - Production", "Marketing Tools"), add a description, and select the owning team or department.',
          screenshotKey: 'password-manager/vault-step-2',
        },
        {
          number: 3,
          title: 'Set up folder structure',
          description:
            'Create folders within the vault to organize credentials logically. Common structures include organizing by environment (Development, Staging, Production), by service category (Databases, APIs, Cloud Consoles), or by project.',
          screenshotKey: 'password-manager/vault-step-3',
          tip: 'Keep the folder structure shallow (2-3 levels max) to make credentials easy to find.',
        },
        {
          number: 4,
          title: 'Add team members',
          description:
            'Click "Members" and add team members individually or by group. Assign permission levels: Viewer (can view and copy credentials), Editor (can add and modify credentials), or Manager (can manage members and folder permissions).',
          screenshotKey: 'password-manager/vault-step-4',
        },
        {
          number: 5,
          title: 'Configure vault policies',
          description:
            'Set vault-level policies including minimum password strength for stored credentials, required rotation intervals, whether external sharing is allowed, and whether clipboard clearing is enforced after copying credentials.',
          screenshotKey: 'password-manager/vault-step-5',
          tip: 'Enable clipboard clearing (auto-clear after 30 seconds) for vaults containing production credentials.',
        },
      ],
    },
    {
      id: 'share-credential-securely',
      title: 'Sharing a Credential Securely',
      description:
        'Share a credential with a colleague or external party using secure, time-limited, and audited sharing methods.',
      estimatedTime: '3 minutes',
      roles: ['employee', 'manager', 'admin', 'owner'],
      steps: [
        {
          number: 1,
          title: 'Locate the credential',
          description:
            'Navigate to the vault and folder containing the credential. Use the search bar for quick access. Click the credential entry to open its detail view.',
          screenshotKey: 'password-manager/share-step-1',
        },
        {
          number: 2,
          title: 'Choose the sharing method',
          description:
            'Click "Share" and select the sharing method. For internal users: share directly within the vault by adding them as a member. For external parties or temporary access: generate a secure link with configurable expiration and view limits.',
          screenshotKey: 'password-manager/share-step-2',
        },
        {
          number: 3,
          title: 'Configure sharing options',
          description:
            'For secure links: set the expiration time (1 hour to 7 days), maximum number of views (1 to unlimited), and whether the recipient must verify their email before viewing. Optionally require a passphrase for an additional layer of security.',
          screenshotKey: 'password-manager/share-step-3',
          tip: 'Use "One-Time View" for credentials shared with contractors or external vendors to ensure they cannot be accessed again after the initial view.',
        },
        {
          number: 4,
          title: 'Send and track',
          description:
            'Copy the secure link and share it through your preferred channel. The sharing event is logged in the audit trail. You can monitor when the link is accessed and revoke it at any time from the credential detail view.',
          screenshotKey: 'password-manager/share-step-4',
        },
      ],
    },
    {
      id: 'password-health-review',
      title: 'Reviewing Password Health',
      description:
        'Assess the security posture of stored credentials, identify weak or compromised passwords, and take remediation actions.',
      estimatedTime: '15 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Open the Health Dashboard',
          description:
            'Navigate to Password Manager > Health. The dashboard shows an overall health score, the number of weak passwords, reused passwords, old passwords (not rotated in the configured interval), and credentials found in known data breaches.',
          screenshotKey: 'password-manager/health-step-1',
        },
        {
          number: 2,
          title: 'Review compromised credentials',
          description:
            'Click "Compromised" to see credentials whose passwords appear in known data breach databases. These represent the highest risk and should be changed immediately. Each entry shows the credential name, the vault it belongs to, and when the breach was detected.',
          screenshotKey: 'password-manager/health-step-2',
          tip: 'Breach detection uses the Have I Been Pwned API with k-anonymity, meaning actual passwords are never transmitted during the check.',
        },
        {
          number: 3,
          title: 'Address weak passwords',
          description:
            'Click "Weak" to see credentials that do not meet the minimum strength requirements. For each credential, click "Generate Strong Password" to create a replacement meeting all policy requirements. Update the credential with the new password.',
          screenshotKey: 'password-manager/health-step-3',
        },
        {
          number: 4,
          title: 'Resolve reused passwords',
          description:
            'Click "Reused" to see groups of credentials sharing the same password. Password reuse means a single compromised credential can expose multiple services. Update each credential in the group with a unique, strong password.',
          screenshotKey: 'password-manager/health-step-4',
        },
        {
          number: 5,
          title: 'Schedule recurring health checks',
          description:
            'Navigate to Health > Settings and enable weekly health scans. Scan results are emailed to vault managers and the security team. Set up automatic notifications to credential owners when their passwords are flagged.',
          screenshotKey: 'password-manager/health-step-5',
        },
      ],
    },
    {
      id: 'configure-emergency-access',
      title: 'Configuring Emergency Access',
      description:
        'Set up emergency access protocols so that designated individuals can access critical credentials during emergencies when the primary owner is unavailable.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Open emergency access settings',
          description:
            'Navigate to Password Manager > Settings > Emergency Access. This section configures who can request emergency access to vaults and the safeguards that protect against unauthorized use.',
          screenshotKey: 'password-manager/emergency-step-1',
        },
        {
          number: 2,
          title: 'Designate emergency contacts',
          description:
            'Add individuals who are authorized to request emergency access. For each contact, specify which vaults they can access, the waiting period before access is granted (typically 24-72 hours), and notification preferences.',
          screenshotKey: 'password-manager/emergency-step-2',
          tip: 'Designate at least two emergency contacts to avoid single points of failure in your access recovery plan.',
        },
        {
          number: 3,
          title: 'Configure the waiting period',
          description:
            'Set the waiting period that must elapse between an emergency access request and when access is granted. During this period, the vault owner receives notifications and can deny the request. A longer waiting period provides more protection but delays access in genuine emergencies.',
          screenshotKey: 'password-manager/emergency-step-3',
        },
        {
          number: 4,
          title: 'Test the emergency access flow',
          description:
            'Conduct a tabletop test by having an emergency contact initiate a test request. Verify that notifications are sent correctly, the waiting period is enforced, and the vault owner can approve or deny the request. Document the test for compliance records.',
          screenshotKey: 'password-manager/emergency-step-4',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'How does zero-knowledge encryption work?',
      answer:
        'All credentials are encrypted on the client side using AES-256 before being transmitted to the server. The encryption key is derived from the user\'s master password or SSO token using PBKDF2. Tempo\'s servers never have access to the plaintext credentials or the encryption key. This means even Tempo cannot read your stored passwords.',
    },
    {
      question: 'What happens to shared vault access when an employee leaves?',
      answer:
        'When an employee is offboarded, their access to all shared vaults is revoked immediately. The offboarding checklist in the People module includes a password rotation reminder for any vaults the departing employee had access to. Personal vault data is retained for 30 days and can be transferred to a designated successor.',
    },
    {
      question: 'Can I import credentials from another password manager?',
      answer:
        'Yes. Tempo supports CSV imports from 1Password, LastPass, Bitwarden, Dashlane, and KeePass. Navigate to Password Manager > Settings > Import and select your previous provider. The import wizard maps fields and lets you choose which vault and folder to import into.',
    },
    {
      question: 'Is there a browser extension for autofill?',
      answer:
        'Yes. The Tempo browser extension is available for Chrome, Firefox, Edge, and Safari. Once installed and authenticated, the extension detects login forms and offers to autofill saved credentials or save new ones. The extension uses the same zero-knowledge encryption as the web interface.',
    },
    {
      question: 'How often should passwords be rotated?',
      answer:
        'Tempo allows configurable rotation policies per vault. Industry best practice recommends rotating shared credentials every 90 days and immediately after any team member change. Service account credentials and API keys should follow the rotation schedule defined in your security policy. Credentials flagged in breach databases should be rotated immediately.',
    },
    {
      question: 'Can I store items other than passwords?',
      answer:
        'Yes. The password manager supports multiple credential types: Logins (username/password), Secure Notes (freeform encrypted text), API Keys (key/secret pairs with environment tags), Certificates (PEM/PFX files with expiration tracking), Credit Cards (for company procurement accounts), and SSH Keys.',
    },
    {
      question: 'What is the password generator capable of?',
      answer:
        'The built-in generator creates passwords meeting configurable criteria: length (8-128 characters), character types (uppercase, lowercase, numbers, symbols), and exclusion rules (ambiguous characters, specific symbols). It can also generate memorable passphrases using word lists. Generated passwords are scored for strength before use.',
    },
  ],

  tips: [
    'Use the browser extension to capture credentials as employees log in rather than manually entering them into vaults.',
    'Organize team vaults by function (e.g., "Engineering - AWS", "Marketing - Social Media") rather than by individual team member.',
    'Enable breach detection scanning weekly to catch compromised passwords before they can be exploited.',
    'Set up emergency access with a 48-hour waiting period as a balanced default between security and accessibility.',
    'Use secure sharing links with one-time view limits when sharing credentials with contractors or external vendors.',
    'Run the password health report monthly and share the results with team leads to drive credential hygiene improvements.',
    'Configure clipboard clearing to 30 seconds for production credential vaults to minimize exposure risk.',
  ],

  relatedModules: ['identity', 'it/apps', 'it/devices', 'marketplace', 'people'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create, edit, and delete team vaults',
        'Configure vault policies and emergency access',
        'View password health reports across all vaults',
        'Access the full audit log of all vault activity',
        'Manage browser extension deployment policies',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create team vaults and manage vault membership',
        'View password health reports for managed vaults',
        'Configure vault-level sharing and rotation policies',
        'Access audit logs for managed vaults',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'Access team vaults they are members of',
        'Add and remove credentials in managed folders',
        'Share credentials within the vault using secure links',
        'View health reports for vaults they manage',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'Access personal vault with full read/write',
        'View and copy credentials in shared vaults (based on vault role)',
        'Use browser extension for autofill',
        'Generate strong passwords',
        'Request emergency access when configured',
      ],
    },
  ],
}

export default passwordManager
