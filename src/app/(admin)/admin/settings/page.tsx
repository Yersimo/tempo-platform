'use client'

import { useState } from 'react'
import { Settings, Globe, Mail, Shield, Database, Bell, Palette, Key } from 'lucide-react'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general')

  const tabs = [
    { id: 'general', label: 'General', icon: <Settings size={16} /> },
    { id: 'branding', label: 'Branding', icon: <Palette size={16} /> },
    { id: 'auth', label: 'Authentication', icon: <Key size={16} /> },
    { id: 'email', label: 'Email & Notifications', icon: <Mail size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    { id: 'integrations', label: 'Integrations', icon: <Database size={16} /> },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-t1">Platform Settings</h1>
        <p className="text-sm text-t3 mt-1">Configure global platform settings and defaults</p>
      </div>

      <div className="flex gap-6">
        {/* Tab Navigation */}
        <div className="w-48 space-y-1 flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-amber-50 text-amber-700 font-medium'
                  : 'text-t3 hover:text-t1 hover:bg-surface'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'branding' && <BrandingSettings />}
          {activeTab === 'auth' && <AuthSettings />}
          {activeTab === 'email' && <EmailSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'integrations' && <IntegrationSettings />}
        </div>
      </div>
    </div>
  )
}

function SettingsCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-border p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-t1">{title}</h3>
        {description && <p className="text-xs text-t3 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function GeneralSettings() {
  return (
    <div className="space-y-4">
      <SettingsCard title="Platform Name" description="The name displayed across the platform">
        <input
          type="text"
          defaultValue="Tempo"
          className="w-full max-w-sm px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-t1 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
      </SettingsCard>

      <SettingsCard title="Platform URL" description="The base URL for the platform">
        <input
          type="text"
          defaultValue="https://app.tempo.dev"
          className="w-full max-w-sm px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-t1 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
      </SettingsCard>

      <SettingsCard title="Default Language" description="Default language for new organizations">
        <select className="px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-t1 focus:outline-none focus:ring-2 focus:ring-amber-500/30">
          <option>English</option>
          <option>French</option>
          <option>Spanish</option>
          <option>Portuguese</option>
          <option>Arabic</option>
        </select>
      </SettingsCard>

      <SettingsCard title="Default Timezone" description="Default timezone for new organizations">
        <select className="px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-t1 focus:outline-none focus:ring-2 focus:ring-amber-500/30">
          <option>Africa/Lagos (WAT)</option>
          <option>Africa/Johannesburg (SAST)</option>
          <option>Africa/Nairobi (EAT)</option>
          <option>Europe/London (GMT)</option>
          <option>America/New_York (EST)</option>
        </select>
      </SettingsCard>

      <SettingsCard title="Default Plan for New Organizations">
        <select className="px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-t1 focus:outline-none focus:ring-2 focus:ring-amber-500/30">
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </SettingsCard>

      <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors">
        Save Changes
      </button>
    </div>
  )
}

function BrandingSettings() {
  return (
    <div className="space-y-4">
      <SettingsCard title="Logo" description="Platform logo displayed in navigation and login">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-surface flex items-center justify-center text-t3 border border-border">
            <Palette size={24} />
          </div>
          <button className="px-3 py-2 text-sm text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors">
            Upload Logo
          </button>
        </div>
      </SettingsCard>

      <SettingsCard title="Primary Color" description="Main brand color used across the platform">
        <div className="flex items-center gap-3">
          <input type="color" defaultValue="#e67e22" className="w-10 h-10 rounded cursor-pointer" />
          <input
            type="text"
            defaultValue="#e67e22"
            className="px-3 py-2 rounded-lg border border-border bg-white text-sm text-t1 w-32"
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Login Page Message" description="Custom message shown on the login page">
        <textarea
          defaultValue="Welcome to Tempo — People & Performance Platform"
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-t1 focus:outline-none focus:ring-2 focus:ring-amber-500/30 h-20 resize-none"
        />
      </SettingsCard>

      <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors">
        Save Changes
      </button>
    </div>
  )
}

function AuthSettings() {
  return (
    <div className="space-y-4">
      <SettingsCard title="Authentication Methods" description="Configure how users can sign in">
        <div className="space-y-3">
          {[
            { name: 'Email & Password', desc: 'Traditional email/password login', enabled: true },
            { name: 'Google SSO', desc: 'Sign in with Google Workspace', enabled: false },
            { name: 'Microsoft SSO', desc: 'Sign in with Microsoft 365 / Azure AD', enabled: false },
            { name: 'SAML SSO', desc: 'Enterprise SAML 2.0 integration', enabled: false },
          ].map(method => (
            <div key={method.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium text-t1">{method.name}</p>
                <p className="text-xs text-t3">{method.desc}</p>
              </div>
              <div className={`w-10 h-5 rounded-full relative ${method.enabled ? 'bg-green-500' : 'bg-gray-200'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  method.enabled ? 'left-5' : 'left-0.5'
                }`} />
              </div>
            </div>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard title="MFA Enforcement" description="Require multi-factor authentication">
        <select className="px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-t1">
          <option>Optional — users choose</option>
          <option>Required for admins</option>
          <option>Required for all users</option>
        </select>
      </SettingsCard>

      <SettingsCard title="Session Duration" description="How long before sessions expire">
        <select className="px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-t1">
          <option>1 hour</option>
          <option>8 hours</option>
          <option>24 hours</option>
          <option>7 days</option>
          <option>30 days</option>
        </select>
      </SettingsCard>

      <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors">
        Save Changes
      </button>
    </div>
  )
}

function EmailSettings() {
  return (
    <div className="space-y-4">
      <SettingsCard title="SMTP Configuration" description="Email server for sending notifications">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-t3 mb-1">SMTP Host</label>
            <input type="text" placeholder="smtp.gmail.com" className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-t3 mb-1">SMTP Port</label>
            <input type="text" placeholder="587" className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-t3 mb-1">Username</label>
            <input type="text" placeholder="noreply@tempo.dev" className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-t3 mb-1">Password</label>
            <input type="password" placeholder="••••••••" className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm" />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Notification Channels" description="Global notification settings">
        <div className="space-y-2">
          {['Email notifications', 'In-app notifications', 'Slack integration', 'SMS alerts'].map(ch => (
            <div key={ch} className="flex items-center justify-between p-2">
              <span className="text-sm text-t1">{ch}</span>
              <div className={`w-10 h-5 rounded-full relative ${ch.includes('Email') || ch.includes('In-app') ? 'bg-green-500' : 'bg-gray-200'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow ${
                  ch.includes('Email') || ch.includes('In-app') ? 'left-5' : 'left-0.5'
                }`} />
              </div>
            </div>
          ))}
        </div>
      </SettingsCard>

      <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors">
        Save Changes
      </button>
    </div>
  )
}

function SecuritySettings() {
  return (
    <div className="space-y-4">
      <SettingsCard title="Password Policy" description="Minimum requirements for user passwords">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-t1">Minimum length</span>
            <select className="px-2 py-1 rounded border border-border text-sm">
              <option>6 characters</option>
              <option>8 characters</option>
              <option>10 characters</option>
              <option>12 characters</option>
            </select>
          </div>
          {['Require uppercase letters', 'Require numbers', 'Require special characters', 'Prevent password reuse (last 5)'].map(rule => (
            <div key={rule} className="flex items-center justify-between">
              <span className="text-sm text-t1">{rule}</span>
              <div className="w-10 h-5 rounded-full relative bg-green-500">
                <div className="absolute top-0.5 left-5 w-4 h-4 rounded-full bg-white shadow" />
              </div>
            </div>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard title="IP Allowlist" description="Restrict admin access to specific IP ranges">
        <textarea
          placeholder="Enter IP addresses or CIDR ranges, one per line"
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-t1 h-20 resize-none font-mono"
        />
      </SettingsCard>

      <SettingsCard title="Audit Log Retention" description="How long to keep audit logs">
        <select className="px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-t1">
          <option>30 days</option>
          <option>90 days</option>
          <option>1 year</option>
          <option>3 years</option>
          <option>Indefinite</option>
        </select>
      </SettingsCard>

      <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors">
        Save Changes
      </button>
    </div>
  )
}

function IntegrationSettings() {
  return (
    <div className="space-y-4">
      <SettingsCard title="Connected Services" description="Third-party integrations">
        <div className="space-y-3">
          {[
            { name: 'Slack', desc: 'Notifications and approvals', connected: false },
            { name: 'Google Workspace', desc: 'SSO, calendar sync', connected: false },
            { name: 'Microsoft 365', desc: 'SSO, Teams integration', connected: false },
            { name: 'Stripe', desc: 'Billing and payments', connected: false },
            { name: 'Twilio', desc: 'SMS notifications', connected: false },
            { name: 'SendGrid', desc: 'Transactional email', connected: false },
          ].map(svc => (
            <div key={svc.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium text-t1">{svc.name}</p>
                <p className="text-xs text-t3">{svc.desc}</p>
              </div>
              <button className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                svc.connected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-surface text-t3 hover:bg-amber-50 hover:text-amber-600'
              }`}>
                {svc.connected ? 'Connected' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard title="API Keys" description="Manage API access keys">
        <div className="bg-surface rounded-lg p-3">
          <p className="text-xs text-t3">No API keys generated yet. Create one to enable programmatic access.</p>
        </div>
        <button className="text-sm text-amber-600 font-medium hover:text-amber-700 transition-colors">
          + Generate API Key
        </button>
      </SettingsCard>

      <SettingsCard title="Webhooks" description="Send real-time events to external services">
        <div className="bg-surface rounded-lg p-3">
          <p className="text-xs text-t3">No webhooks configured. Add one to receive event notifications.</p>
        </div>
        <button className="text-sm text-amber-600 font-medium hover:text-amber-700 transition-colors">
          + Add Webhook
        </button>
      </SettingsCard>
    </div>
  )
}
