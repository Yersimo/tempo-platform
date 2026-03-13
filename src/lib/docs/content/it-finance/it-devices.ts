import type { ModuleDoc } from '../../types'

const itDevices: ModuleDoc = {
  slug: 'it/devices',
  title: 'Devices',
  subtitle: 'Track hardware inventory, manage device assignments, enforce MDM policies, and oversee the full device lifecycle',
  icon: 'Laptop',
  group: 'it-finance',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Devices module provides comprehensive management of your organization\'s hardware fleet, from laptops and desktops to mobile devices and peripherals. It maintains a real-time inventory of all company-owned and BYOD devices, tracks assignments to employees, enforces security policies through MDM integration, and manages the full lifecycle from procurement to retirement. Automated compliance checks ensure every device meets encryption, OS version, and security patch requirements before connecting to corporate resources.',
    keyFeatures: [
      'Real-time device inventory with automatic discovery via MDM integration',
      'Employee device assignment tracking with full assignment history',
      'MDM policy enforcement for encryption, passcode, and OS version requirements',
      'Device lifecycle management from procurement to decommissioning',
      'Automated compliance scoring with remediation guidance',
      'Remote lock and wipe capabilities for lost or stolen devices',
      'Hardware asset depreciation tracking and reporting',
      'BYOD enrollment and policy management',
      'Peripheral and accessory tracking linked to primary devices',
      'Integration with onboarding and offboarding workflows',
    ],
    screenshotKey: 'it-devices/overview',
  },

  workflows: [
    {
      id: 'assign-device-new-hire',
      title: 'Assigning a Device to a New Hire',
      description:
        'Prepare and assign a device from available inventory to a new employee as part of the onboarding process.',
      estimatedTime: '10 minutes',
      roles: ['admin'],
      prerequisites: [
        'The employee must have an active profile in the People module',
        'Available devices must exist in inventory with status "In Stock"',
        'MDM enrollment profiles must be configured for the device platform',
      ],
      steps: [
        {
          number: 1,
          title: 'Navigate to Devices',
          description:
            'Click "Devices" in the left sidebar under IT & Finance. The Devices dashboard shows total device count, assignment status breakdown, and compliance summary.',
          screenshotKey: 'it-devices/assign-step-1',
        },
        {
          number: 2,
          title: 'Select an available device',
          description:
            'Click "Inventory" and filter by status "In Stock". Browse available devices by type (laptop, desktop, mobile), model, and specifications. Click a device to view its full details including serial number, warranty status, and configuration.',
          screenshotKey: 'it-devices/assign-step-2',
          tip: 'Use the "Match" button to see devices that meet the hardware specifications recommended for the employee\'s role and department.',
        },
        {
          number: 3,
          title: 'Initiate assignment',
          description:
            'Click "Assign" on the selected device. Search for and select the employee from the directory. Set the assignment date, expected return date (if applicable), and add any notes about the configuration or accessories included.',
          screenshotKey: 'it-devices/assign-step-3',
        },
        {
          number: 4,
          title: 'Configure MDM enrollment',
          description:
            'Tempo automatically pushes the MDM enrollment profile to the device. The enrollment installs security policies, configures Wi-Fi and VPN profiles, and enables remote management. Monitor the enrollment progress in the device detail view.',
          screenshotKey: 'it-devices/assign-step-4',
        },
        {
          number: 5,
          title: 'Record acknowledgment',
          description:
            'The employee receives a notification to acknowledge receipt of the device. They review the acceptable use policy and confirm receipt digitally. The assignment record is updated with the acknowledgment timestamp.',
          screenshotKey: 'it-devices/assign-step-5',
          tip: 'Print a physical acknowledgment form for employees who will be working in locations with limited connectivity.',
        },
      ],
    },
    {
      id: 'offboard-device-retrieval',
      title: 'Retrieving a Device During Offboarding',
      description:
        'Recover company devices from departing employees, wipe corporate data, and return devices to available inventory.',
      estimatedTime: '15 minutes',
      roles: ['admin'],
      prerequisites: [
        'An offboarding ticket must be created in the People module',
        'The employee must have at least one device assigned',
      ],
      steps: [
        {
          number: 1,
          title: 'Review assigned devices',
          description:
            'When an offboarding ticket is created, Tempo automatically generates a device retrieval task. Navigate to Devices > Retrievals to see pending retrieval tasks. Click the task to see all devices assigned to the departing employee.',
          screenshotKey: 'it-devices/offboard-step-1',
        },
        {
          number: 2,
          title: 'Initiate remote data wipe',
          description:
            'For each device, click "Remote Wipe" to queue a corporate data wipe. On fully managed devices, this removes all corporate apps, profiles, and data. On BYOD devices, only the managed container is wiped, preserving personal data.',
          screenshotKey: 'it-devices/offboard-step-2',
          tip: 'Schedule the remote wipe to execute on the employee\'s last day to avoid disrupting their work before departure.',
        },
        {
          number: 3,
          title: 'Confirm physical return',
          description:
            'When the device is physically returned, click "Confirm Return" and inspect the device condition. Select a condition rating (Excellent, Good, Fair, Damaged) and note any damage or missing accessories.',
          screenshotKey: 'it-devices/offboard-step-3',
        },
        {
          number: 4,
          title: 'Re-image and return to inventory',
          description:
            'Click "Re-image" to reset the device to factory settings and apply the standard corporate image. Once re-imaging is complete, the device status changes to "In Stock" and it becomes available for reassignment.',
          screenshotKey: 'it-devices/offboard-step-4',
        },
        {
          number: 5,
          title: 'Close the retrieval task',
          description:
            'Once all devices are accounted for, mark the retrieval task as complete. If any devices are not returned, mark them as "Missing" and escalate to the employee\'s manager. The offboarding ticket in People is updated automatically.',
          screenshotKey: 'it-devices/offboard-step-5',
        },
      ],
    },
    {
      id: 'compliance-audit',
      title: 'Running a Device Compliance Audit',
      description:
        'Review the compliance status of all enrolled devices, identify policy violations, and take remediation actions.',
      estimatedTime: '20 minutes',
      roles: ['owner', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Open the Compliance Dashboard',
          description:
            'Navigate to Devices > Compliance. The dashboard shows the overall compliance rate, a breakdown by policy category (encryption, OS version, passcode, firewall), and a trend chart of compliance over the past 90 days.',
          screenshotKey: 'it-devices/compliance-step-1',
        },
        {
          number: 2,
          title: 'Review non-compliant devices',
          description:
            'Click "Non-Compliant" to filter to devices that fail one or more policies. Each device row shows the specific violations, the assigned employee, the last check-in time, and the device platform.',
          screenshotKey: 'it-devices/compliance-step-2',
        },
        {
          number: 3,
          title: 'Send remediation notifications',
          description:
            'Select non-compliant devices and click "Notify Users". Tempo sends each affected employee a notification explaining which policies their device violates and provides step-by-step instructions to remediate (e.g., update the operating system, enable encryption).',
          screenshotKey: 'it-devices/compliance-step-3',
          tip: 'Configure automatic remediation notifications in Settings to send daily reminders to non-compliant device owners until they resolve the issue.',
        },
        {
          number: 4,
          title: 'Enforce quarantine for persistent violations',
          description:
            'Devices that remain non-compliant after the grace period can be quarantined. Click "Quarantine" to restrict the device\'s access to corporate resources until it comes into compliance. The employee is notified immediately with instructions.',
          screenshotKey: 'it-devices/compliance-step-4',
        },
        {
          number: 5,
          title: 'Export the compliance report',
          description:
            'Click "Export Report" to generate a PDF or CSV compliance report. The report includes device details, compliance status, violation history, and remediation actions taken. Reports are commonly used for ISO 27001 and SOC 2 audits.',
          screenshotKey: 'it-devices/compliance-step-5',
        },
      ],
    },
    {
      id: 'register-new-device',
      title: 'Registering a Newly Purchased Device',
      description:
        'Add a newly procured device to the inventory, configure its profile, and prepare it for assignment.',
      estimatedTime: '5 minutes',
      roles: ['admin'],
      steps: [
        {
          number: 1,
          title: 'Open inventory management',
          description:
            'Navigate to Devices > Inventory and click "Add Device". Select whether you are adding a single device or bulk-importing from a CSV file.',
          screenshotKey: 'it-devices/register-step-1',
        },
        {
          number: 2,
          title: 'Enter device details',
          description:
            'Fill in the device form: device type, manufacturer, model, serial number, purchase date, purchase price, warranty expiration, and asset tag number. For Apple devices, entering the serial number auto-populates the model and specifications.',
          screenshotKey: 'it-devices/register-step-2',
          tip: 'Use the barcode scanner integration to quickly populate serial numbers during bulk intake.',
        },
        {
          number: 3,
          title: 'Assign a device profile',
          description:
            'Select a device profile that determines which MDM policies, software packages, and network configurations will be applied when the device is enrolled. Profiles are pre-configured by platform (macOS, Windows, iOS, Android).',
          screenshotKey: 'it-devices/register-step-3',
        },
        {
          number: 4,
          title: 'Save and verify',
          description:
            'Click "Save" to add the device to inventory with status "In Stock". The device appears in the inventory list and is available for assignment. If MDM auto-enrollment is enabled, the device will automatically enroll when it first connects to the corporate network.',
          screenshotKey: 'it-devices/register-step-4',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'Which MDM providers does Tempo integrate with?',
      answer:
        'Tempo integrates with Jamf Pro (macOS/iOS), Microsoft Intune (Windows/Android), VMware Workspace ONE, and Mosyle. The integration syncs device inventory, compliance status, and supports remote actions like lock and wipe. Configuration is done in Devices > Settings > MDM Integration.',
    },
    {
      question: 'Can employees register their personal devices (BYOD)?',
      answer:
        'Yes. Employees can enroll BYOD devices through the self-service portal. BYOD devices are enrolled with a separate MDM profile that creates a managed container for corporate data without affecting personal apps and data. BYOD policies are configured separately from corporate device policies.',
    },
    {
      question: 'How does Tempo handle device depreciation?',
      answer:
        'Tempo calculates straight-line depreciation based on the purchase price and a configurable useful life period (default 3 years for laptops, 5 years for desktops). Current book value is displayed on each device record and included in asset reports. Depreciation schedules can be exported for accounting purposes.',
    },
    {
      question: 'What happens when a device is reported lost or stolen?',
      answer:
        'Click "Report Lost/Stolen" on the device record. Tempo immediately sends a remote lock command via MDM, creates an incident ticket, notifies the IT security team, and logs the event for compliance records. A remote wipe can be triggered after confirmation. The device status changes to "Lost/Stolen" and is excluded from compliance calculations.',
    },
    {
      question: 'Can I track peripherals like monitors, keyboards, and headsets?',
      answer:
        'Yes. Peripherals can be added to inventory as accessory items and linked to a primary device or directly to an employee. They follow the same assignment and retrieval workflows. Peripheral tracking is useful for managing remote work equipment and office hoteling setups.',
    },
    {
      question: 'How does the device lifecycle workflow function?',
      answer:
        'Devices progress through defined lifecycle stages: Ordered, In Stock, Assigned, In Repair, Decommissioned, and Disposed. Each stage transition is logged with timestamps and responsible parties. Automated alerts notify IT when devices approach warranty expiration or reach their end-of-life date.',
    },
    {
      question: 'Does Tempo support automated software deployment to devices?',
      answer:
        'Software deployment is managed through the MDM integration. When an app is assigned to a device profile in Tempo, the MDM provider handles the actual installation. Tempo tracks which software should be present on each device class and flags devices missing required applications.',
    },
    {
      question: 'How are device costs allocated to departments?',
      answer:
        'When a device is assigned to an employee, its depreciation costs are automatically allocated to the employee\'s department cost center. If the device is reassigned, cost allocation shifts to the new department from the transfer date. Cost allocation reports are available in Devices > Reports.',
    },
  ],

  tips: [
    'Set up automated notifications for warranty expirations 90 days in advance to allow time for renewal decisions or replacement planning.',
    'Use bulk CSV import when receiving large hardware shipments to avoid manual entry of each device.',
    'Configure the BYOD enrollment portal with clear instructions and screenshots for each platform to minimize support tickets.',
    'Enable automatic compliance scanning daily rather than weekly to catch policy violations before they become audit findings.',
    'Link device retrieval tasks to offboarding workflows so IT is automatically notified when an employee departure is scheduled.',
    'Tag devices with their physical location (office, remote, warehouse) to simplify inventory audits and asset tracking.',
    'Review the device age report quarterly to proactively plan hardware refresh cycles before performance issues affect productivity.',
  ],

  relatedModules: ['it/apps', 'identity', 'it-cloud', 'people', 'password-manager'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Full access to device inventory, settings, and integrations',
        'Configure MDM policies and device profiles',
        'Execute remote lock and wipe commands',
        'Approve device purchases and assignments',
        'Access all audit logs and compliance reports',
        'Decommission and dispose of devices',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Add, edit, and assign devices in inventory',
        'Execute remote lock and wipe commands',
        'Run compliance audits and send remediation notifications',
        'Generate device reports and export data',
        'Manage device lifecycle transitions',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'View devices assigned to direct reports',
        'Submit device requests for team members',
        'View compliance status for team devices',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'View own assigned devices and their details',
        'Report a device as lost or stolen',
        'Enroll BYOD devices through self-service portal',
        'Acknowledge device receipt and acceptable use policy',
      ],
    },
  ],
}

export default itDevices
