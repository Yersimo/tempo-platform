import type { ModuleDoc } from '../../types'

const identity: ModuleDoc = {
  slug: 'identity',
  title: 'Identity & Access',
  subtitle: 'Manage single sign-on, identity providers, multi-factor authentication, and access governance across your organization',
  icon: 'KeyRound',
  group: 'it-finance',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Identity & Access module is the centralized hub for managing how employees authenticate to corporate systems and what resources they can access. It supports SSO configuration with OIDC and SAML protocols, MFA enrollment and enforcement, identity provider management, and access lifecycle governance. The module provides a unified view of all identity providers connected to your organization, real-time authentication event monitoring, and policy controls that ensure only the right people have access to the right resources at the right time.',
    keyFeatures: [
      'SSO configuration for OIDC (Google, Azure AD, Okta) and SAML identity providers',
      'Multi-factor authentication enrollment with support for TOTP, WebAuthn, and push notifications',
      'Centralized identity provider dashboard showing all connected IdPs and their health status',
      'Access governance with periodic access review campaigns',
      'Real-time authentication event log with anomaly detection',
      'Conditional access policies based on device, location, and risk score',
      'Just-in-time provisioning from identity provider claims',
      'Session management with configurable timeout and concurrent session policies',
      'Directory sync with automatic user provisioning and deprovisioning via SCIM',
      'Compliance reporting for SOC 2, ISO 27001, and NIST frameworks',
    ],
    screenshotKey: 'identity/overview',
  },

  workflows: [
    {
      id: 'configure-sso',
      title: 'Configuring a New SSO Provider',
      description:
        'Connect a new identity provider using OIDC or SAML protocols to enable single sign-on for your organization.',
      estimatedTime: '15 minutes',
      roles: ['owner', 'admin'],
      prerequisites: [
        'Administrator access to the external identity provider (Google Workspace, Azure AD, Okta, etc.)',
        'The identity provider must support OIDC or SAML 2.0',
        'A verified domain must be configured in Settings > Domains',
      ],
      steps: [
        {
          number: 1,
          title: 'Navigate to Identity settings',
          description:
            'Click "Identity" in the left sidebar under IT & Finance, then click the "Providers" tab. The providers list shows all configured identity providers with their protocol, status, and connected user count.',
          screenshotKey: 'identity/sso-step-1',
        },
        {
          number: 2,
          title: 'Add a new provider',
          description:
            'Click "Add Provider" and select the identity provider type. Pre-built configurations are available for Google Workspace, Microsoft Azure AD, Okta, and OneLogin. For other providers, select "Custom OIDC" or "Custom SAML".',
          screenshotKey: 'identity/sso-step-2',
          tip: 'Use the pre-built configurations when available -- they include provider-specific defaults and validation that reduce setup errors.',
        },
        {
          number: 3,
          title: 'Configure the connection',
          description:
            'For OIDC: enter the Client ID, Client Secret, and Issuer URL from your identity provider. For SAML: upload the IdP metadata XML or manually enter the SSO URL, Entity ID, and certificate. Tempo generates the callback URL and SP metadata for you to configure on the IdP side.',
          screenshotKey: 'identity/sso-step-3',
        },
        {
          number: 4,
          title: 'Map user attributes',
          description:
            'Configure how identity provider claims map to Tempo user attributes: email, display name, department, and role. Default mappings are provided for standard providers. Custom attribute mappings support transformation expressions for non-standard claim formats.',
          screenshotKey: 'identity/sso-step-4',
        },
        {
          number: 5,
          title: 'Test the connection',
          description:
            'Click "Test Connection" to perform a test authentication flow. A new window opens where you authenticate with the identity provider. Tempo validates the response, displays the received claims, and confirms the attribute mapping is correct.',
          screenshotKey: 'identity/sso-step-5',
          tip: 'Always test with a non-admin account to verify that standard users can authenticate successfully.',
        },
        {
          number: 6,
          title: 'Activate and enforce',
          description:
            'Toggle the provider to "Active". Optionally enable "Enforce SSO" to require all users on the verified domain to authenticate through this provider. When enforced, direct password login is disabled for domain users, with an emergency bypass available for break-glass scenarios.',
          screenshotKey: 'identity/sso-step-6',
        },
      ],
    },
    {
      id: 'enroll-mfa',
      title: 'Enrolling in Multi-Factor Authentication',
      description:
        'Set up multi-factor authentication for your account using a supported second factor method.',
      estimatedTime: '5 minutes',
      roles: ['employee', 'manager', 'admin', 'owner'],
      steps: [
        {
          number: 1,
          title: 'Access MFA settings',
          description:
            'Click your profile avatar in the top-right corner and select "Security Settings". The MFA section shows your current enrollment status and available authentication methods.',
          screenshotKey: 'identity/mfa-step-1',
        },
        {
          number: 2,
          title: 'Select an authentication method',
          description:
            'Choose from available methods: Authenticator App (TOTP via Google Authenticator, Authy, or similar), Security Key (WebAuthn/FIDO2 via YubiKey or built-in biometrics), or Push Notification (via the Tempo mobile app). Multiple methods can be enrolled for backup.',
          screenshotKey: 'identity/mfa-step-2',
          tip: 'Enroll at least two MFA methods to ensure you can still authenticate if your primary method is unavailable.',
        },
        {
          number: 3,
          title: 'Complete enrollment',
          description:
            'For Authenticator App: scan the QR code with your authenticator app and enter the 6-digit verification code. For Security Key: insert your key and touch it when prompted. For Push Notification: install the Tempo mobile app and approve the enrollment request.',
          screenshotKey: 'identity/mfa-step-3',
        },
        {
          number: 4,
          title: 'Save recovery codes',
          description:
            'Tempo generates a set of single-use recovery codes. Download or print these codes and store them in a secure location. Recovery codes allow you to bypass MFA if you lose access to all enrolled methods.',
          screenshotKey: 'identity/mfa-step-4',
          tip: 'Store recovery codes in a physical safe or secure password manager -- never in an email or shared document.',
        },
      ],
    },
    {
      id: 'access-review-campaign',
      title: 'Running an Access Review Campaign',
      description:
        'Conduct a periodic review of user access rights to ensure employees only have access appropriate to their current role.',
      estimatedTime: '30 minutes',
      roles: ['owner', 'admin'],
      prerequisites: [
        'At least one SSO provider must be configured and active',
        'Application access data must be synced from connected identity providers',
      ],
      steps: [
        {
          number: 1,
          title: 'Create a review campaign',
          description:
            'Navigate to Identity > Access Reviews and click "New Campaign". Name the campaign, set the review scope (all users, specific departments, or specific applications), and define the review period and deadline.',
          screenshotKey: 'identity/review-step-1',
        },
        {
          number: 2,
          title: 'Assign reviewers',
          description:
            'Select who will review access. Options include direct managers (each manager reviews their reports), application owners (each owner reviews their app\'s users), or specific individuals. Tempo sends review assignments via email and in-app notification.',
          screenshotKey: 'identity/review-step-2',
        },
        {
          number: 3,
          title: 'Reviewers evaluate access',
          description:
            'Each reviewer sees a list of users and their application access. For each access entry, the reviewer clicks "Approve" to confirm the access is appropriate or "Revoke" to flag it for removal. Context information (last login, role, department) is shown to assist the decision.',
          screenshotKey: 'identity/review-step-3',
          tip: 'Highlight dormant access (no login in 60+ days) to help reviewers quickly identify stale permissions.',
        },
        {
          number: 4,
          title: 'Process revocations',
          description:
            'After the review deadline, click "Process Results". All access flagged for revocation is queued for deprovisioning. For SCIM-integrated applications, access is revoked automatically. For other applications, manual deprovisioning tasks are created for the IT team.',
          screenshotKey: 'identity/review-step-4',
        },
        {
          number: 5,
          title: 'Generate the review report',
          description:
            'Click "Generate Report" to produce a summary of the access review. The report includes total access entries reviewed, approval and revocation counts, reviewer completion rates, and a list of outstanding items. This report serves as evidence for compliance audits.',
          screenshotKey: 'identity/review-step-5',
        },
      ],
    },
    {
      id: 'monitor-auth-events',
      title: 'Monitoring Authentication Events',
      description:
        'Review real-time authentication logs, investigate suspicious activity, and respond to potential security incidents.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Open the authentication log',
          description:
            'Navigate to Identity > Events. The event log shows a chronological list of all authentication attempts with user, IP address, location, device, result (success/failure), and the identity provider used.',
          screenshotKey: 'identity/events-step-1',
        },
        {
          number: 2,
          title: 'Filter and search events',
          description:
            'Use filters to narrow down events by date range, user, result type, IP address, or country. The "Anomalies" filter shows events flagged by Tempo\'s anomaly detection, such as logins from unusual locations, impossible travel, or brute force patterns.',
          screenshotKey: 'identity/events-step-2',
        },
        {
          number: 3,
          title: 'Investigate a suspicious event',
          description:
            'Click on a flagged event to see its full details including the raw authentication payload, device fingerprint, and geolocation data. The "User Timeline" shows the user\'s recent authentication history for context.',
          screenshotKey: 'identity/events-step-3',
          tip: 'Enable real-time Slack or email alerts for failed authentication events exceeding a threshold (e.g., 5 failures in 10 minutes).',
        },
        {
          number: 4,
          title: 'Take remediation action',
          description:
            'If the event is confirmed as suspicious, take immediate action: "Revoke Sessions" terminates all active sessions for the user, "Require MFA Reset" forces the user to re-enroll their second factor, or "Lock Account" temporarily prevents all access until the issue is resolved.',
          screenshotKey: 'identity/events-step-4',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'What SSO protocols does Tempo support?',
      answer:
        'Tempo supports OIDC (OpenID Connect) and SAML 2.0 for single sign-on. Pre-built integrations are available for Google Workspace, Microsoft Azure AD, Okta, and OneLogin. Custom OIDC and SAML configurations can be used for any standards-compliant identity provider.',
    },
    {
      question: 'Can I enforce MFA for all users?',
      answer:
        'Yes. Navigate to Identity > Policies and enable "Require MFA for All Users". You can also create conditional MFA policies that require MFA only for specific conditions, such as accessing sensitive applications, logging in from untrusted devices, or authenticating from outside the corporate network.',
    },
    {
      question: 'What happens if an employee loses their MFA device?',
      answer:
        'The employee can use their recovery codes to authenticate and enroll a new MFA device. If recovery codes are also unavailable, an admin can temporarily disable MFA for the user from Identity > Users > [User] > MFA. A verification process (manager approval and identity confirmation) is required before the admin can reset MFA.',
    },
    {
      question: 'How does Just-In-Time (JIT) provisioning work?',
      answer:
        'When JIT provisioning is enabled, users who authenticate via SSO for the first time are automatically created in Tempo. Their profile is populated from the identity provider claims (email, name, department). The user is assigned a default role and permissions that can be adjusted by an admin after creation.',
    },
    {
      question: 'Can I connect multiple identity providers simultaneously?',
      answer:
        'Yes. Multiple identity providers can be active at the same time. This is useful for organizations with employees across different identity systems (e.g., Google Workspace for engineering, Azure AD for corporate). Each domain or email pattern can be mapped to a specific provider.',
    },
    {
      question: 'How does Tempo detect impossible travel?',
      answer:
        'Tempo compares the geolocation and timestamp of consecutive authentication events for each user. If two logins occur from locations that are geographically impossible to travel between in the elapsed time (e.g., New York and London within 30 minutes), the event is flagged as an anomaly.',
    },
    {
      question: 'What is a break-glass account?',
      answer:
        'A break-glass account is an emergency administrator account that bypasses SSO enforcement. It uses password-based authentication and is intended for situations where the identity provider is unavailable. Break-glass accounts require MFA, are logged separately, and should be tested quarterly to verify they still function.',
    },
    {
      question: 'How often should access reviews be conducted?',
      answer:
        'Best practice is to conduct access reviews quarterly for all users and monthly for privileged accounts. SOC 2 and ISO 27001 typically require at minimum annual access reviews. The frequency can be configured per campaign, and Tempo sends reminders when reviews are overdue.',
    },
  ],

  tips: [
    'Configure SSO enforcement with a break-glass account before making SSO mandatory to avoid lockout scenarios.',
    'Enable impossible travel detection and configure alerts to catch compromised credentials early.',
    'Require MFA for all admin and owner accounts as a non-negotiable security baseline.',
    'Map identity provider groups to Tempo roles to automate role assignment and reduce manual administration.',
    'Run quarterly access review campaigns and archive the reports for compliance audit evidence.',
    'Test SSO configurations with a non-admin user before enforcing organization-wide to ensure standard users can authenticate.',
    'Monitor the authentication events dashboard daily during the first week after any SSO configuration change.',
  ],

  relatedModules: ['password-manager', 'it/apps', 'it/devices', 'it-cloud', 'people'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Configure and manage all identity providers and SSO settings',
        'Create and enforce MFA policies',
        'Run access review campaigns',
        'View and investigate all authentication events',
        'Lock user accounts and revoke sessions',
        'Manage break-glass accounts',
        'Access compliance reports and audit logs',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Configure identity providers and SSO settings',
        'Manage MFA enrollments and reset user MFA',
        'Review authentication events and anomalies',
        'Participate in access review campaigns as a reviewer',
        'Generate identity and access reports',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'Participate in access review campaigns for assigned departments',
        'View user access summaries for assigned employees',
        'Generate access reports for assigned departments',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'Review and approve access for direct reports during access reviews',
        'View MFA enrollment status for direct reports',
        'Approve MFA reset requests for direct reports',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'Enroll in MFA and manage own authentication methods',
        'View own active sessions and revoke individual sessions',
        'Download own recovery codes',
        'View own authentication history',
      ],
    },
  ],
}

export default identity
