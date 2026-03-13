import type { ModuleDoc } from '../../types'

const travel: ModuleDoc = {
  slug: 'travel',
  title: 'Travel',
  subtitle: 'Travel requests, booking management, itinerary tracking, policy enforcement, and travel approval workflows',
  icon: 'Plane',
  group: 'operations',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Travel module manages the complete business travel lifecycle — from trip requests and approvals through booking coordination and post-trip expense reconciliation. Employees submit travel requests with purpose, dates, and estimated costs. Managers approve based on budget and business need. Once approved, travelers can book flights, hotels, and ground transport through integrated booking partners or submit external bookings for tracking. Travel policies are enforced at every step to control costs and ensure compliance.',
    keyFeatures: [
      'Travel request workflow with purpose, itinerary, and cost estimation',
      'Multi-level approval routing based on trip cost and destination',
      'Integrated booking with preferred airline, hotel, and car rental partners',
      'Itinerary management with calendar integration and real-time flight status',
      'Travel policy enforcement with class-of-service and daily rate limits',
      'Duty of care features with traveler location tracking and emergency alerts',
      'Per diem calculation based on destination with GSA/HMRC rate support',
      'Post-trip expense linking for seamless reconciliation',
    ],
    screenshotKey: 'travel/overview',
  },

  workflows: [
    {
      id: 'submit-travel-request',
      title: 'Submitting a Travel Request',
      description:
        'Create and submit a travel request with trip details, estimated costs, and business justification for manager approval.',
      estimatedTime: '5 minutes',
      roles: ['employee'],
      steps: [
        {
          number: 1,
          title: 'Open the Travel module',
          description:
            'Navigate to Travel in the left sidebar. The main view shows your upcoming trips, pending requests, and past travel history.',
          screenshotKey: 'travel/request-step-1',
        },
        {
          number: 2,
          title: 'Create a new travel request',
          description:
            'Click "+ New Trip." Enter the trip purpose, destination city and country, travel dates, and business justification. Select whether this is a solo trip or a group booking.',
          screenshotKey: 'travel/request-step-2',
        },
        {
          number: 3,
          title: 'Add travel segments',
          description:
            'Add each segment of your trip: outbound flight, hotel, ground transport, and return flight. For each segment, enter estimated costs. The system suggests preferred vendors and displays policy limits for each category.',
          screenshotKey: 'travel/request-step-3',
          tip: 'Book at least 14 days in advance to access lower airfares and comply with most advance-booking policies.',
        },
        {
          number: 4,
          title: 'Review the cost estimate',
          description:
            'The request summary shows the total estimated cost broken down by category, the applicable per diem rates for your destination, and any policy flags (e.g., business class selected for a short-haul flight).',
          screenshotKey: 'travel/request-step-4',
        },
        {
          number: 5,
          title: 'Submit for approval',
          description:
            'Click "Submit" to send the request to your approver. The approval chain is determined by the total trip cost and your organization\'s travel policy. You receive notifications as the request progresses through approvals.',
          screenshotKey: 'travel/request-step-5',
        },
      ],
    },
    {
      id: 'approve-travel',
      title: 'Approving Travel Requests',
      description:
        'Review and approve or reject travel requests based on business need, budget, and policy compliance.',
      estimatedTime: '3 minutes',
      roles: ['manager', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Open the travel approval queue',
          description:
            'Navigate to Travel > Approvals. Pending requests are listed with the traveler name, destination, dates, estimated cost, and policy compliance status.',
          screenshotKey: 'travel/approve-step-1',
        },
        {
          number: 2,
          title: 'Review the request details',
          description:
            'Click on a request to see the full itinerary, cost breakdown, business justification, and any policy flags. Compare the estimated costs against the department travel budget.',
          screenshotKey: 'travel/approve-step-2',
        },
        {
          number: 3,
          title: 'Approve or reject',
          description:
            'Click "Approve" to authorize the trip, or "Reject" with a reason (e.g., insufficient justification, budget constraints, or suggest a virtual meeting instead). You can also request modifications before approving.',
          screenshotKey: 'travel/approve-step-3',
          tip: 'Check the team travel calendar before approving to ensure critical coverage is maintained while the employee is away.',
        },
        {
          number: 4,
          title: 'Approval escalation',
          description:
            'If the trip cost exceeds your approval limit, the request automatically escalates to the next approver in the chain. You can add a recommendation note that is visible to the next approver.',
          screenshotKey: 'travel/approve-step-4',
        },
      ],
    },
    {
      id: 'book-travel',
      title: 'Booking Flights, Hotels, and Transport',
      description:
        'After a travel request is approved, book travel segments through integrated partners or submit external bookings.',
      estimatedTime: '10 minutes',
      roles: ['employee'],
      steps: [
        {
          number: 1,
          title: 'Open the approved trip',
          description:
            'Navigate to Travel > My Trips and click on the approved trip. The booking panel shows each segment with "Book Now" buttons next to preferred vendor options.',
          screenshotKey: 'travel/book-step-1',
        },
        {
          number: 2,
          title: 'Search and compare options',
          description:
            'Click "Book Now" on a segment to search integrated booking partners. The system displays available options filtered by your travel policy (e.g., economy class flights, hotels within the nightly rate limit). Compare prices, schedules, and ratings.',
          screenshotKey: 'travel/book-step-2',
        },
        {
          number: 3,
          title: 'Select and confirm booking',
          description:
            'Choose your preferred option and click "Confirm." The booking is processed through the integrated partner and the confirmation details are automatically added to your trip itinerary. Payment is charged to the corporate travel account.',
          screenshotKey: 'travel/book-step-3',
          tip: 'Book refundable or changeable options when possible to avoid fees if your plans change.',
        },
        {
          number: 4,
          title: 'Add external bookings',
          description:
            'If you booked outside the platform, click "Add External Booking" to manually enter the confirmation number, vendor, dates, and cost. Upload the booking confirmation email or PDF.',
          screenshotKey: 'travel/book-step-4',
        },
        {
          number: 5,
          title: 'View your complete itinerary',
          description:
            'The trip detail page shows your full itinerary in chronological order with flight times, hotel check-in/out, and ground transport. A calendar event is created automatically. You can share the itinerary with colleagues.',
          screenshotKey: 'travel/book-step-5',
        },
      ],
    },
    {
      id: 'manage-travel-policy',
      title: 'Managing Travel Policies',
      description:
        'Configure organizational travel policies that control booking classes, spending limits, and approval thresholds.',
      estimatedTime: '10 minutes',
      roles: ['admin', 'owner'],
      steps: [
        {
          number: 1,
          title: 'Open Travel Policy settings',
          description:
            'Navigate to Travel > Settings > Policies. The view lists all active travel policies with their scope and effective dates.',
          screenshotKey: 'travel/policy-step-1',
        },
        {
          number: 2,
          title: 'Configure booking rules',
          description:
            'Define permitted classes of service by segment type (e.g., economy for domestic flights under 6 hours, premium economy for international). Set maximum hotel nightly rates by city tier or use GSA/HMRC per diem rates.',
          screenshotKey: 'travel/policy-step-2',
        },
        {
          number: 3,
          title: 'Set approval thresholds',
          description:
            'Define cost thresholds for approval levels: manager only for trips under $2,000, department head for $2,000-$10,000, VP for trips exceeding $10,000. Configure advance booking requirements.',
          screenshotKey: 'travel/policy-step-3',
        },
        {
          number: 4,
          title: 'Configure preferred vendors',
          description:
            'Add preferred airline, hotel, and car rental partners with negotiated rates. When employees search for bookings, preferred vendor options are highlighted and may offer discounted rates.',
          screenshotKey: 'travel/policy-step-4',
          tip: 'Review preferred vendor agreements annually to ensure you are getting the best negotiated rates.',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'How far in advance should I submit a travel request?',
      answer:
        'Submit requests at least 14 days before the travel date for domestic trips and 21 days for international trips. This allows time for approval processing and gives you access to better booking rates. Last-minute requests require an additional justification and may require higher-level approval.',
    },
    {
      question: 'Can I change my booking after it is confirmed?',
      answer:
        'Yes. Click "Modify" on any booking segment in your trip itinerary. Changes are subject to the vendor\'s change policy and may incur fees. If the change increases the total trip cost, it may require re-approval from your manager.',
    },
    {
      question: 'How are per diem rates determined?',
      answer:
        'Per diem rates are based on your destination city and are sourced from GSA (for US destinations) or HMRC/government rates (for international destinations). Rates cover meals and incidental expenses. Your organization can customize rates or set flat per diem amounts in the travel policy.',
    },
    {
      question: 'What happens to my travel expenses after the trip?',
      answer:
        'After your trip, the system prompts you to create an expense report linked to the trip. Bookings made through the platform are auto-populated as expense line items. You add receipts for out-of-pocket expenses (meals, taxis, etc.) and submit the consolidated expense report for reimbursement.',
    },
    {
      question: 'Does the system track traveler safety?',
      answer:
        'Yes. The duty of care feature tracks which employees are traveling and to which destinations. If a safety event occurs (natural disaster, civil unrest), the system identifies affected travelers and provides their contact details to the designated safety officer. Travelers receive alert notifications.',
    },
    {
      question: 'Can I request travel for someone else?',
      answer:
        'Yes. Administrative assistants and team coordinators can submit travel requests on behalf of others. Select the traveler during request creation. The request still routes to the traveler\'s manager for approval.',
    },
    {
      question: 'Is there a mobile app for managing travel?',
      answer:
        'Yes. The Tempo mobile app provides full travel functionality: view itineraries, receive flight status updates, access boarding passes, and capture receipts on the go. Push notifications alert you to gate changes, delays, and booking confirmations.',
    },
  ],

  tips: [
    'Book flights and hotels as early as possible after approval — prices typically increase closer to travel dates.',
    'Use the itinerary sharing feature to keep your manager and team informed of your travel schedule.',
    'Link your frequent flyer and hotel loyalty accounts in Settings > Travel to ensure points are credited for business travel.',
    'After each trip, submit your expense report within 5 business days while receipts and details are fresh.',
    'Check the duty of care alerts before traveling to a new destination for safety advisories.',
    'Managers should review the quarterly travel spend report to ensure the team stays within the annual travel budget.',
  ],

  relatedModules: ['expense', 'payroll', 'dashboard', 'time-attendance'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Configure all travel policies, vendor integrations, and approval workflows',
        'Access travel data and spending analytics across the organization',
        'Approve travel requests of any cost level',
        'Manage duty of care settings and emergency contact protocols',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Configure travel policies, preferred vendors, and per diem rates',
        'Access travel booking and expense data organization-wide',
        'Manage booking platform integrations',
        'Generate travel analytics and compliance reports',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'View travel requests and bookings for assigned departments',
        'Approve travel requests within delegated approval limits',
        'Run travel spend reports for assigned departments',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'Approve travel requests from direct reports',
        'View team travel calendar and upcoming trips',
        'Monitor team travel spend against budget',
        'Submit their own travel requests',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'Submit travel requests with itinerary and cost estimates',
        'Book flights, hotels, and transport through integrated partners',
        'View and share trip itineraries',
        'Link travel to expense reports for post-trip reconciliation',
      ],
    },
  ],
}

export default travel
