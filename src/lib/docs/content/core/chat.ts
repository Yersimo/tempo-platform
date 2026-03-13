import type { ModuleDoc } from '../../types'

const chat: ModuleDoc = {
  slug: 'chat',
  title: 'Chat',
  subtitle: 'Real-time team messaging with channels, threads, reactions, direct messages, and full-text search',
  icon: 'MessageSquare',
  group: 'core',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Chat module is Tempo\'s built-in team communication hub, designed to keep conversations organized and searchable without leaving your HR platform. Create public or private channels for teams, projects, or topics. Use threads to keep discussions focused. Send direct messages to individuals or groups. Share files, mention colleagues, and react to messages — all within a familiar, modern messaging interface backed by a full database with message history and search.',
    keyFeatures: [
      'Public and private channels with topic descriptions and pinned messages',
      'Threaded replies to keep channel conversations organized',
      'Direct messages for one-on-one and small group conversations',
      'Emoji reactions for quick, lightweight responses',
      'Full-text search across all messages, channels, and threads',
      'File sharing with drag-and-drop upload and inline preview',
      'Mention notifications with @user, @channel, and @here support',
      'Message editing and deletion with audit trail',
    ],
    screenshotKey: 'chat/overview',
  },

  workflows: [
    {
      id: 'create-channel',
      title: 'Creating a Channel',
      description:
        'Set up a new channel for a team, project, or discussion topic to keep conversations organized and discoverable.',
      estimatedTime: '2 minutes',
      roles: ['owner', 'admin', 'hrbp', 'manager'],
      steps: [
        {
          number: 1,
          title: 'Open the Chat module',
          description:
            'Click "Chat" in the left sidebar. The chat interface loads with your channel list on the left, the active conversation in the center, and a member/details panel on the right.',
          screenshotKey: 'chat/create-channel-step-1',
        },
        {
          number: 2,
          title: 'Click the new channel button',
          description:
            'Click the "+" icon next to the "Channels" heading in the sidebar. A creation dialog opens with fields for channel name, description, and visibility.',
          screenshotKey: 'chat/create-channel-step-2',
        },
        {
          number: 3,
          title: 'Configure channel settings',
          description:
            'Enter a channel name (lowercase, no spaces — use hyphens). Add an optional description and topic. Choose visibility: Public (discoverable by all employees) or Private (invite-only).',
          screenshotKey: 'chat/create-channel-step-3',
          tip: 'Use a clear naming convention like #team-engineering or #proj-launch-2026 so channels are easy to find.',
        },
        {
          number: 4,
          title: 'Add initial members',
          description:
            'Search and select team members to invite. For public channels, anyone can join later. For private channels, members must be explicitly invited by a channel admin.',
          screenshotKey: 'chat/create-channel-step-4',
        },
        {
          number: 5,
          title: 'Create and start messaging',
          description:
            'Click "Create Channel." You are taken directly to the new channel where you can post an introductory message, pin important resources, and begin collaborating.',
          screenshotKey: 'chat/create-channel-step-5',
        },
      ],
    },
    {
      id: 'send-direct-message',
      title: 'Sending Direct Messages',
      description:
        'Start a private conversation with one or more colleagues for quick coordination or sensitive discussions.',
      estimatedTime: '1 minute',
      roles: ['owner', 'admin', 'hrbp', 'manager', 'employee'],
      steps: [
        {
          number: 1,
          title: 'Open direct messages',
          description:
            'In the chat sidebar, click "Direct Messages" to expand the DM section. Your recent conversations are listed in reverse chronological order.',
          screenshotKey: 'chat/dm-step-1',
        },
        {
          number: 2,
          title: 'Start a new conversation',
          description:
            'Click the compose icon next to "Direct Messages." A search field appears where you can type the name of one or more colleagues. Select recipients to create the conversation.',
          screenshotKey: 'chat/dm-step-2',
          tip: 'Add multiple people to create a group DM — ideal for small working groups that do not need a full channel.',
        },
        {
          number: 3,
          title: 'Compose and send your message',
          description:
            'Type your message in the composer at the bottom. Use the toolbar to format text, attach files, or add emoji. Press Enter to send, or Shift+Enter for a new line.',
          screenshotKey: 'chat/dm-step-3',
        },
        {
          number: 4,
          title: 'Continue the conversation',
          description:
            'The recipient receives an in-app notification and optional push notification. Your DM conversation persists and is fully searchable, just like channel messages.',
          screenshotKey: 'chat/dm-step-4',
        },
      ],
    },
    {
      id: 'use-threads',
      title: 'Using Threads',
      description:
        'Reply to messages in threads to keep channel conversations focused and reduce noise for members who are not following a specific discussion.',
      estimatedTime: '2 minutes',
      roles: ['owner', 'admin', 'hrbp', 'manager', 'employee'],
      steps: [
        {
          number: 1,
          title: 'Hover over a message to reveal actions',
          description:
            'Move your cursor over any message in a channel. A floating action bar appears with options for reactions, threading, sharing, and more.',
          screenshotKey: 'chat/threads-step-1',
        },
        {
          number: 2,
          title: 'Click "Reply in Thread"',
          description:
            'Click the thread icon (speech bubble) in the action bar. A thread panel opens on the right side of the screen showing the original message and space for replies.',
          screenshotKey: 'chat/threads-step-2',
        },
        {
          number: 3,
          title: 'Post your reply',
          description:
            'Type your reply in the thread composer and press Enter. Your reply appears in the thread panel. Optionally check "Also send to channel" to post the reply in the main channel conversation as well.',
          screenshotKey: 'chat/threads-step-3',
          tip: 'Use "Also send to channel" sparingly — only for replies that the entire channel needs to see.',
        },
        {
          number: 4,
          title: 'Follow thread updates',
          description:
            'You automatically follow any thread you participate in. New replies trigger a notification badge on the thread. Click "Following" to unfollow or mute a thread.',
          screenshotKey: 'chat/threads-step-4',
        },
      ],
    },
    {
      id: 'search-messages',
      title: 'Searching Messages',
      description:
        'Use full-text search to find past messages, files, and conversations across all channels and direct messages you have access to.',
      estimatedTime: '2 minutes',
      roles: ['owner', 'admin', 'hrbp', 'manager', 'employee'],
      steps: [
        {
          number: 1,
          title: 'Open the search bar',
          description:
            'Click the search icon at the top of the chat interface, or press Cmd+K (Ctrl+K on Windows). The search overlay appears with a text input and filter options.',
          screenshotKey: 'chat/search-step-1',
        },
        {
          number: 2,
          title: 'Enter your search query',
          description:
            'Type keywords, phrases, or a person\'s name. Results appear in real time, grouped by channels and direct messages. Each result shows the message snippet with highlighted matches and the timestamp.',
          screenshotKey: 'chat/search-step-2',
        },
        {
          number: 3,
          title: 'Apply filters to narrow results',
          description:
            'Use filter chips to narrow by: sender (from:@name), channel (in:#channel), date range (before:/after:), and content type (has:file, has:link). Combine multiple filters for precision.',
          screenshotKey: 'chat/search-step-3',
          tip: 'The filter syntax supports natural date references like "after:last week" or "before:2026-01-01."',
        },
        {
          number: 4,
          title: 'Jump to the message in context',
          description:
            'Click any search result to navigate directly to that message in its original channel or DM, scrolled to the exact position with the matched message highlighted.',
          screenshotKey: 'chat/search-step-4',
        },
      ],
    },
    {
      id: 'manage-notifications',
      title: 'Managing Chat Notifications',
      description:
        'Configure notification preferences per channel to control when and how you are alerted about new messages.',
      estimatedTime: '3 minutes',
      roles: ['owner', 'admin', 'hrbp', 'manager', 'employee'],
      steps: [
        {
          number: 1,
          title: 'Access notification settings',
          description:
            'Click the gear icon at the top of the chat sidebar, or navigate to Settings > Notifications > Chat. The notification preferences panel shows your global defaults and per-channel overrides.',
          screenshotKey: 'chat/notifications-step-1',
        },
        {
          number: 2,
          title: 'Set global defaults',
          description:
            'Choose your default notification level: All Messages, Mentions Only, or Nothing. This applies to all channels unless overridden. Configure whether to receive desktop push notifications, sounds, and email fallback.',
          screenshotKey: 'chat/notifications-step-2',
        },
        {
          number: 3,
          title: 'Override per channel',
          description:
            'Right-click any channel in the sidebar and select "Notification Preferences." Override the global setting for that specific channel — for example, mute a noisy channel or enable all-message alerts for a critical project channel.',
          screenshotKey: 'chat/notifications-step-3',
        },
        {
          number: 4,
          title: 'Set a Do Not Disturb schedule',
          description:
            'In notification settings, enable "Do Not Disturb" and set your quiet hours (e.g., 6 PM to 8 AM). During DND, notifications are suppressed and batched for delivery when DND ends.',
          screenshotKey: 'chat/notifications-step-4',
          tip: 'Your DND schedule syncs with your Tempo work schedule — if you set working hours in your profile, DND is automatically configured to match.',
        },
        {
          number: 5,
          title: 'Manage keyword alerts',
          description:
            'Add custom keywords to receive notifications whenever those words appear in any channel you belong to. Useful for tracking mentions of project names, product codenames, or urgent terms.',
          screenshotKey: 'chat/notifications-step-5',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'Is there a message history limit?',
      answer:
        'No. Tempo Chat stores all messages indefinitely with no archive cutoff. All messages are fully searchable regardless of age. Organization admins can configure data retention policies in Settings > Compliance to auto-delete messages after a specified period if required by company policy.',
    },
    {
      question: 'Can I edit or delete a message after sending it?',
      answer:
        'Yes. Hover over your message and click the three-dot menu to edit or delete it. Edited messages display an "(edited)" label. Deleted messages are removed from the conversation but logged in the audit trail. Admins can configure a time window (e.g., 15 minutes) after which editing is no longer permitted.',
    },
    {
      question: 'What file types can I share in chat?',
      answer:
        'You can share any file type up to 50 MB per file. Images, PDFs, and common document formats display inline previews. Files are stored securely and scanned for malware before being made available to recipients.',
    },
    {
      question: 'Can I create a channel that only HR can see?',
      answer:
        'Yes. Create a private channel and invite only HR team members. Private channels do not appear in the channel directory for non-members and their messages are excluded from organization-wide searches by unauthorized users.',
    },
    {
      question: 'How do I leave a channel?',
      answer:
        'Right-click the channel name in your sidebar and select "Leave Channel." You will no longer receive notifications or see new messages, but you can rejoin public channels at any time. For private channels, you must be re-invited by a channel admin.',
    },
    {
      question: 'Does chat support message formatting?',
      answer:
        'Yes. The composer supports Markdown-style formatting including bold, italic, strikethrough, code blocks, bullet lists, numbered lists, and block quotes. You can also use the formatting toolbar for a visual editing experience.',
    },
    {
      question: 'Can I integrate external tools with chat?',
      answer:
        'Chat supports incoming webhook integrations for tools like GitHub, Jira, and CI/CD pipelines. These post automated updates to designated channels. Configure integrations in Settings > Chat > Integrations.',
    },
    {
      question: 'How do @mentions work?',
      answer:
        'Type @ followed by a colleague\'s name to mention them — they receive a notification regardless of their channel notification settings. Use @channel to notify all members of a channel, or @here to notify only members who are currently online.',
    },
  ],

  tips: [
    'Pin important messages in a channel (click the pin icon) so new members can quickly find key decisions and resources.',
    'Use threads for all follow-up discussions to keep the main channel timeline clean and scannable.',
    'Star your most important channels to pin them at the top of your sidebar for quick access.',
    'Set your status message (e.g., "In meetings until 2 PM") so colleagues know when to expect a response.',
    'Use the /remind slash command to set message-based reminders — e.g., "/remind me to follow up in 2 hours."',
    'Archive inactive channels rather than deleting them to preserve searchable history while reducing sidebar clutter.',
  ],

  relatedModules: ['dashboard', 'people', 'notifications'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Create, archive, and delete any channel (public or private)',
        'Access all public channels and view message audit logs',
        'Configure organization-wide chat policies and retention settings',
        'Manage chat integrations and webhook configurations',
        'Remove any message from any channel',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Create, archive, and delete public and private channels',
        'Manage channel membership and promote channel admins',
        'Configure chat notification defaults and integration webhooks',
        'Access message audit logs for compliance review',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'Create public and private channels for their team',
        'Manage membership of channels they created or administer',
        'Pin, edit, and delete their own messages',
        'Use @channel and @here mentions in channels they manage',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'Join public channels and participate in private channels they are invited to',
        'Send direct messages to any colleague',
        'Use reactions, threads, file sharing, and search',
        'Edit and delete their own messages within the allowed time window',
      ],
    },
  ],
}

export default chat
