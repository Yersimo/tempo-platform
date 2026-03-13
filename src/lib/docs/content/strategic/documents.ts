import type { ModuleDoc } from '../../types'

const documents: ModuleDoc = {
  slug: 'documents',
  title: 'Documents & E-Signature',
  subtitle: 'Create, send, and track legally binding documents with built-in e-signature workflows and a full audit trail',
  icon: 'FileSignature',
  group: 'strategic',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Documents module centralizes document creation, distribution, and electronic signing within Tempo. HR teams can build reusable templates for offer letters, NDAs, policy acknowledgments, and any other document that requires a signature. Every document passes through a structured signing workflow with real-time status tracking, automated reminders, and a tamper-evident audit trail that satisfies SOC 2 and eIDAS compliance requirements. Completed documents are stored securely and linked to the relevant employee record for instant retrieval.',
    keyFeatures: [
      'Drag-and-drop template builder with merge fields for employee data',
      'Multi-party signing workflows with sequential or parallel routing',
      'Legally binding e-signatures with certificate-based verification',
      'Real-time status dashboard showing pending, viewed, signed, and expired documents',
      'Automated reminders and escalation rules for unsigned documents',
      'Tamper-evident audit trail recording every view, sign, and download event',
      'Bulk send capability for distributing policies to entire departments',
      'Integration with People module for automatic employee record attachment',
    ],
    screenshotKey: 'documents/overview',
  },

  workflows: [
    {
      id: 'create-template',
      title: 'Creating a Document Template',
      description:
        'Build a reusable document template with merge fields that automatically populate employee data when the document is generated.',
      estimatedTime: '10 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Open the template builder',
          description:
            'Navigate to Documents > Templates and click "+ New Template". Choose between starting from a blank canvas or uploading an existing PDF or Word document as the base.',
          screenshotKey: 'documents/create-template-step-1',
        },
        {
          number: 2,
          title: 'Design the document layout',
          description:
            'Use the rich text editor to compose your document content. Format text with headings, bold, italics, and lists. Add your company logo and letterhead from the brand assets library.',
          screenshotKey: 'documents/create-template-step-2',
          tip: 'Enable "Page Break Preview" to see exactly how the document will appear when exported to PDF.',
        },
        {
          number: 3,
          title: 'Insert merge fields',
          description:
            'Click "Insert Field" to add dynamic placeholders such as {{employee.full_name}}, {{employee.job_title}}, {{employee.start_date}}, or {{company.name}}. These fields auto-populate with real data when the document is generated for a specific employee.',
          screenshotKey: 'documents/create-template-step-3',
        },
        {
          number: 4,
          title: 'Add signature and date fields',
          description:
            'Drag signature blocks onto the document where each party needs to sign. Assign each signature block to a role: Employee, Manager, HR, or a custom signer. Add date fields that auto-fill when the signature is captured.',
          screenshotKey: 'documents/create-template-step-4',
        },
        {
          number: 5,
          title: 'Configure template settings',
          description:
            'Set the template name, category (e.g., Offer Letters, Policies, Agreements), default expiration period, and reminder schedule. Choose whether the template requires sequential or parallel signing.',
          screenshotKey: 'documents/create-template-step-5',
        },
        {
          number: 6,
          title: 'Save and publish',
          description:
            'Click "Save as Draft" to continue editing later, or "Publish" to make the template available for use. Published templates appear in the template library and can be used by anyone with send permissions.',
          screenshotKey: 'documents/create-template-step-6',
        },
      ],
    },
    {
      id: 'send-for-signature',
      title: 'Sending a Document for Signature',
      description:
        'Generate a document from a template and send it to one or more signers with tracking and reminders.',
      estimatedTime: '5 minutes',
      roles: ['owner', 'admin', 'hrbp', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Select a template',
          description:
            'Navigate to Documents > Send New and choose a template from the library. Use the search bar or category filters to find the right template quickly.',
          screenshotKey: 'documents/send-step-1',
        },
        {
          number: 2,
          title: 'Choose recipients',
          description:
            'Search for employees by name or department. For bulk sends, select an entire department or use a saved group. The merge fields automatically populate with each recipient\'s data.',
          screenshotKey: 'documents/send-step-2',
        },
        {
          number: 3,
          title: 'Review the generated document',
          description:
            'Preview the fully merged document to verify that all fields populated correctly. Edit any text that needs customization for this specific send. The preview shows the exact document each signer will receive.',
          screenshotKey: 'documents/send-step-3',
          tip: 'Use the "Preview as Signer" toggle to see the document from each signer\'s perspective.',
        },
        {
          number: 4,
          title: 'Set signing options',
          description:
            'Configure the signing order (sequential or parallel), expiration date, and reminder frequency. Optionally add a personal message that appears in the signing invitation email.',
          screenshotKey: 'documents/send-step-4',
        },
        {
          number: 5,
          title: 'Send the document',
          description:
            'Click "Send for Signature". Each signer receives an email with a secure link to view and sign the document. The document status changes to "Pending" on your dashboard.',
          screenshotKey: 'documents/send-step-5',
        },
      ],
    },
    {
      id: 'sign-document',
      title: 'Signing a Document',
      description:
        'Complete the signing process as a recipient, including reviewing the document, applying your signature, and downloading the final copy.',
      estimatedTime: '3 minutes',
      roles: ['owner', 'admin', 'hrbp', 'manager', 'employee'],
      steps: [
        {
          number: 1,
          title: 'Open the signing invitation',
          description:
            'Click the "Review & Sign" link in the email notification or navigate to Documents > Inbox in Tempo. Documents awaiting your signature display a yellow "Action Required" badge.',
          screenshotKey: 'documents/sign-step-1',
        },
        {
          number: 2,
          title: 'Read the document',
          description:
            'The document opens in a full-screen reader. Scroll through the entire document to review its contents. Required fields are highlighted with a pulsing orange border to guide you through each section.',
          screenshotKey: 'documents/sign-step-2',
        },
        {
          number: 3,
          title: 'Fill in required fields',
          description:
            'Complete any required text fields, checkboxes, or date fields embedded in the document. Fields marked with an asterisk are mandatory and must be completed before you can sign.',
          screenshotKey: 'documents/sign-step-3',
          tip: 'You can save your progress and return later. The document remains in your inbox until the expiration date.',
        },
        {
          number: 4,
          title: 'Apply your signature',
          description:
            'Click the signature field to open the signing modal. Choose to type your name, draw your signature with a mouse or touchscreen, or upload a signature image. Your signature is saved for future use.',
          screenshotKey: 'documents/sign-step-4',
        },
        {
          number: 5,
          title: 'Confirm and submit',
          description:
            'Review the "I agree" checkbox confirming your intent to sign, then click "Complete Signing". A certificate of completion is generated and attached to the document. You receive a confirmation email with a download link.',
          screenshotKey: 'documents/sign-step-5',
        },
      ],
    },
    {
      id: 'audit-trail',
      title: 'Reviewing the Audit Trail',
      description:
        'Access the complete history of every action taken on a document for compliance and dispute resolution.',
      estimatedTime: '3 minutes',
      roles: ['owner', 'admin', 'hrbp'],
      steps: [
        {
          number: 1,
          title: 'Open a completed document',
          description:
            'Navigate to Documents > Completed and click on any document. The document detail view opens with tabs for Content, Signers, and Audit Trail.',
          screenshotKey: 'documents/audit-step-1',
        },
        {
          number: 2,
          title: 'Switch to the Audit Trail tab',
          description:
            'Click the "Audit Trail" tab. A chronological list of every event is displayed, including document creation, each view event, field completions, signature applications, and downloads.',
          screenshotKey: 'documents/audit-step-2',
        },
        {
          number: 3,
          title: 'Review event details',
          description:
            'Each audit entry shows the timestamp (UTC), the actor\'s name and email, the action performed, the IP address, and the browser user agent. Click any entry to see additional metadata.',
          screenshotKey: 'documents/audit-step-3',
          tip: 'The audit trail is cryptographically sealed. Any tampering with the document after signing invalidates the certificate.',
        },
        {
          number: 4,
          title: 'Export the audit report',
          description:
            'Click "Export Audit Report" to download a PDF that includes the signed document, the certificate of completion, and the full audit trail. This report is suitable for legal proceedings and compliance audits.',
          screenshotKey: 'documents/audit-step-4',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'Are e-signatures created in Tempo legally binding?',
      answer:
        'Yes. Tempo e-signatures comply with the US ESIGN Act, EU eIDAS Regulation, and UK Electronic Communications Act. Each signature includes a certificate of completion with a unique hash, timestamp, and signer identification that establishes legal validity.',
    },
    {
      question: 'Can I send a document to someone outside of my organization?',
      answer:
        'Yes. When adding signers, toggle "External Signer" and enter their email address. External signers receive a secure link to sign without needing a Tempo account. Their identity is verified via email authentication and optional SMS verification.',
    },
    {
      question: 'What happens when a document expires before all parties sign?',
      answer:
        'Expired documents are moved to the "Expired" tab with a status of "Incomplete". You can either extend the expiration date to reactivate the signing workflow or void the document and create a new one from the same template.',
    },
    {
      question: 'How do I void or cancel a document that has already been sent?',
      answer:
        'Open the document from your Sent tab and click "Void Document". You must provide a reason for voiding. All signers are notified by email that the document has been cancelled. Voided documents are retained in the audit trail but cannot be signed.',
    },
    {
      question: 'Can I use my own PDF templates instead of the built-in editor?',
      answer:
        'Yes. Upload any PDF file as a template, then use the field overlay tool to place signature blocks, text fields, checkboxes, and date fields on top of your existing layout. Merge fields can be mapped to specific positions on the PDF.',
    },
    {
      question: 'How long are completed documents stored?',
      answer:
        'Completed documents are retained indefinitely by default. Admins can configure a retention policy in Settings > Documents to set automatic archival after a specified period. Archived documents remain accessible but are moved to cold storage.',
    },
  ],

  tips: [
    'Create template categories (Hiring, Policies, Legal) to keep your template library organized as it grows.',
    'Use conditional sections in templates to show or hide content based on the employee\'s country or department.',
    'Set up automatic reminders at 3, 7, and 14 days for unsigned documents to improve completion rates.',
    'Enable SMS verification for external signers to add an extra layer of identity assurance.',
    'Link document templates to onboarding checklists so new hire paperwork is sent automatically on day one.',
    'Use bulk send with department filters to distribute annual policy updates to the entire organization efficiently.',
  ],

  relatedModules: ['people', 'onboarding', 'compliance', 'workflow-studio'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create, edit, and delete document templates',
        'Send documents for signature to any employee or external party',
        'View all documents and audit trails across the organization',
        'Configure document retention policies and compliance settings',
        'Void or cancel any in-progress document',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create, edit, and delete document templates',
        'Send documents for signature to any employee or external party',
        'View all documents and audit trails across the organization',
        'Void or cancel any in-progress document',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'Create and edit document templates for assigned departments',
        'Send documents for signature to employees in assigned scope',
        'View documents and audit trails for assigned departments',
        'Export audit reports for compliance reviews',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'Send documents from published templates to direct reports',
        'View status of documents sent to direct reports',
        'Sign documents assigned to them',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'View and sign documents assigned to them',
        'Download completed documents they have signed',
        'View their own signing history',
      ],
    },
  ],
}

export default documents
