'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import {
  Building, Users, Shield, Bell, Palette, Globe, Search, Clock, Plug,
  ShieldCheck, Mail, Banknote, Building2, MessageSquare, Video,
  CheckCircle, XCircle, RefreshCw, Loader2, AlertCircle, Wifi, WifiOff,
  CreditCard, ExternalLink, Check, Sparkles, Crown, Zap, AlertTriangle,
  Download, FileText, BarChart3, Activity, ArrowUpRight, Receipt,
  TrendingUp, CalendarDays, CircleDot, Minus, Landmark, Plus, Pencil, Trash2, Save,
  Upload, RotateCcw, Eye, BookOpen, Tag, FileUp
} from 'lucide-react'
import { useTempo, useOrgCurrency } from '@/lib/store'
import { formatCurrency } from '@/lib/utils/format-currency'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { INTEGRATION_CATALOG, type ConfigField } from '@/lib/integrations'
import { MFASettings } from '@/components/settings/mfa-settings'

// Icon map for integration cards
const ICON_MAP: Record<string, React.ReactNode> = {
  Shield: <ShieldCheck size={24} />,
  Mail: <Mail size={24} />,
  Banknote: <Banknote size={24} />,
  Building2: <Building2 size={24} />,
  MessageSquare: <MessageSquare size={24} />,
  Video: <Video size={24} />,
}

const CATEGORY_COLORS: Record<string, string> = {
  identity: 'bg-gray-100 text-gray-600',
  productivity: 'bg-gray-100 text-gray-600',
  payroll: 'bg-gray-100 text-gray-600',
  communication: 'bg-gray-100 text-gray-600',
  storage: 'bg-gray-100 text-gray-600',
}

interface ConnectedIntegration {
  id: string
  provider: string
  name: string
  status: string
  lastSyncAt: string | null
  lastSyncStatus: string | null
  syncDirection: string
}

interface IntegrationLog {
  id: string
  action: string
  status: string
  recordsProcessed: number
  recordsFailed: number
  details: string | null
  errorMessage: string | null
  duration: number | null
  createdAt: string
}

interface BillingPlan {
  id: string
  name: string
  pricePerEmployee: number
  features: string[]
  maxEmployees: number | null
  tier: string
}

interface BillingSubscription {
  plan: string
  status: string
  currentPeriodEnd: string
  employeeCount: number
  monthlyAmount: number
  currency: string
  cancelAtPeriodEnd: boolean
  trialEnd: string | null
}

// Billing invoices are loaded from the store (storeInvoices)

// Mock usage metrics
const MOCK_USAGE = {
  apiCalls: { used: 12847, limit: 50000 },
  storage: { used: 2.4, limit: 10, unit: 'GB' },
  modules: [
    { name: 'Core HR', active: true },
    { name: 'Payroll', active: true },
    { name: 'Performance', active: true },
    { name: 'Time & Attendance', active: true },
    { name: 'Recruiting', active: false },
    { name: 'Learning (LMS)', active: true },
    { name: 'Expenses', active: true },
    { name: 'Engagement', active: false },
  ],
}

export default function SettingsPage() {
  const t = useTranslations('settings')
  const ti = useTranslations('integrations')
  const tc = useTranslations('common')
  const searchParams = useSearchParams()
  const { org, employees, departments, auditLog, updateOrg, addDepartment, addToast, getEmployeeName, getDepartmentName, currencyAccounts, addCurrencyAccount, updateCurrencyAccount, deleteCurrencyAccount, taxConfigs, addTaxConfig, updateTaxConfig, countryBenefitConfigs, addCountryBenefitConfig, ensureModulesLoaded, invoices: storeInvoices, knowledgeBaseArticles, addKnowledgeBaseArticle, updateKnowledgeBaseArticle, deleteKnowledgeBaseArticle } = useTempo()
  const defaultCurrency = useOrgCurrency()
  const initialTab = searchParams.get('tab') || 'general'
  const [pageLoading, setPageLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => { setPageLoading(false) }, [])

  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 2000); return () => clearTimeout(t) }, [])
  const [showOrgModal, setShowOrgModal] = useState(false)
  const [showDeptModal, setShowDeptModal] = useState(false)
  const [orgForm, setOrgForm] = useState({ name: org.name, industry: org.industry, size: org.size, country: org.country })
  const [deptForm, setDeptForm] = useState({ name: '', parent_id: null as string | null, head_id: '' })
  const [auditSearch, setAuditSearch] = useState('')
  const [notifPrefs, setNotifPrefs] = useState<Record<string, string>>({})

  // Knowledge Base state
  const [kbSearch, setKbSearch] = useState('')
  const [kbCategoryFilter, setKbCategoryFilter] = useState('all')
  const [showKBModal, setShowKBModal] = useState(false)
  const [editingArticle, setEditingArticle] = useState<any>(null)
  const [kbForm, setKbForm] = useState({ title: '', category: 'general', content: '', tags: '', source: 'manual' as string, fileName: '' })
  const [showTemplates, setShowTemplates] = useState(false)

  // Branding state
  const [branding, setBranding] = useState({
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#004D40',
    secondaryColor: '#1a1a2e',
    sidebarTheme: 'dark' as 'dark' | 'light' | 'brand',
    loginWelcomeMessage: '',
    loginBackground: 'gradient' as 'gradient' | 'solid' | 'custom',
    loginBackgroundUrl: '',
    showLoginLogo: true,
    showPoweredBy: true,
    emailHeaderColor: '#004D40',
    emailFooterText: '',
    includeLogoInEmails: true,
  })

  // Load saved branding on mount
  useEffect(() => {
    if (org.id) {
      try {
        const saved = localStorage.getItem(`tempo_branding_${org.id}`)
        if (saved) setBranding(JSON.parse(saved))
      } catch { /* ignore */ }
    }
  }, [org.id])

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      addToast('File too large. Max 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setBranding(prev => ({ ...prev, logoUrl: ev.target?.result as string }))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [addToast])

  const handleFaviconUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      addToast('File too large. Max 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setBranding(prev => ({ ...prev, faviconUrl: ev.target?.result as string }))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [addToast])

  const handleLoginBgUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      addToast('File too large. Max 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setBranding(prev => ({ ...prev, loginBackgroundUrl: ev.target?.result as string }))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [addToast])

  const saveBranding = useCallback(() => {
    localStorage.setItem(`tempo_branding_${org.id}`, JSON.stringify(branding))
    addToast('Branding saved — your branding changes have been applied.')
  }, [org.id, branding, addToast])

  const resetBranding = useCallback(() => {
    const defaults = {
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#004D40',
      secondaryColor: '#1a1a2e',
      sidebarTheme: 'dark' as const,
      loginWelcomeMessage: '',
      loginBackground: 'gradient' as const,
      loginBackgroundUrl: '',
      showLoginLogo: true,
      showPoweredBy: true,
      emailHeaderColor: '#004D40',
      emailFooterText: '',
      includeLogoInEmails: true,
    }
    setBranding(defaults)
    localStorage.removeItem(`tempo_branding_${org.id}`)
    addToast('Branding reset to defaults.')
  }, [org.id, addToast])

  // Integration state
  const [connectedIntegrations, setConnectedIntegrations] = useState<ConnectedIntegration[]>([])
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [connectForm, setConnectForm] = useState<Record<string, string>>({})
  const [connecting, setConnecting] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<boolean | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [integrationLogs, setIntegrationLogs] = useState<IntegrationLog[]>([])
  const [integrationsLoaded, setIntegrationsLoaded] = useState(false)

  // Country Wizard state
  const [wizardStep, setWizardStep] = useState(1)
  const COUNTRY_PRESETS: Record<string, { currency: string; currencyCode: string; taxes: { type: string; rate: number; employerRate: number; employeeRate: number }[]; benefits: string[] }> = {
    'Ghana': { currency: 'GHS', currencyCode: 'GH', taxes: [{ type: 'PAYE (Income Tax)', rate: 0, employerRate: 0, employeeRate: 25 }, { type: 'SSNIT (Pension)', rate: 18.5, employerRate: 13, employeeRate: 5.5 }, { type: 'Tier 2 Pension', rate: 5, employerRate: 0, employeeRate: 5 }, { type: 'GETFund Levy', rate: 2.5, employerRate: 2.5, employeeRate: 0 }], benefits: ['SSNIT Pension', 'NHIS Health Insurance', 'Tier 2 Mandatory Pension', 'Maternity Leave (12 weeks)'] },
    'Nigeria': { currency: 'NGN', currencyCode: 'NG', taxes: [{ type: 'PAYE (Income Tax)', rate: 0, employerRate: 0, employeeRate: 24 }, { type: 'Pension Fund', rate: 18, employerRate: 10, employeeRate: 8 }, { type: 'NHF (Housing)', rate: 2.5, employerRate: 0, employeeRate: 2.5 }, { type: 'NHIS (Health)', rate: 15, employerRate: 10, employeeRate: 5 }], benefits: ['Pension Fund Administration', 'NHIS Health Insurance', 'National Housing Fund', 'Maternity Leave (12 weeks)'] },
    'Kenya': { currency: 'KES', currencyCode: 'KE', taxes: [{ type: 'PAYE (Income Tax)', rate: 0, employerRate: 0, employeeRate: 30 }, { type: 'NSSF (Pension)', rate: 12, employerRate: 6, employeeRate: 6 }, { type: 'NHIF (Health)', rate: 0, employerRate: 0, employeeRate: 1.5 }, { type: 'Housing Levy', rate: 3, employerRate: 1.5, employeeRate: 1.5 }], benefits: ['NSSF Pension', 'NHIF Health Insurance', 'Affordable Housing Levy', 'Maternity Leave (3 months)'] },
    'South Africa': { currency: 'ZAR', currencyCode: 'ZA', taxes: [{ type: 'PAYE (Income Tax)', rate: 0, employerRate: 0, employeeRate: 45 }, { type: 'UIF (Unemployment)', rate: 2, employerRate: 1, employeeRate: 1 }, { type: 'SDL (Skills Levy)', rate: 1, employerRate: 1, employeeRate: 0 }, { type: 'COIDA (Workers Comp)', rate: 0.5, employerRate: 0.5, employeeRate: 0 }], benefits: ['UIF Unemployment Insurance', 'COIDA Workers Compensation', 'Skills Development Levy', 'Maternity Leave (4 months)'] },
    'Senegal': { currency: 'XOF', currencyCode: 'SN', taxes: [{ type: 'IRPP (Income Tax)', rate: 0, employerRate: 0, employeeRate: 40 }, { type: 'CSS (Social Security)', rate: 22, employerRate: 15, employeeRate: 7 }, { type: 'IPRES (Pension)', rate: 14, employerRate: 8.4, employeeRate: 5.6 }, { type: 'Health Insurance', rate: 6, employerRate: 4, employeeRate: 2 }], benefits: ['IPRES Pension', 'CSS Social Security', 'AMO Health Insurance', 'Maternity Leave (14 weeks)'] },
    'Côte d\'Ivoire': { currency: 'XOF', currencyCode: 'CI', taxes: [{ type: 'ITS (Income Tax)', rate: 0, employerRate: 0, employeeRate: 36 }, { type: 'CNPS (Social Security)', rate: 21.75, employerRate: 15.75, employeeRate: 6 }, { type: 'CMU (Health Insurance)', rate: 5.5, employerRate: 3.5, employeeRate: 2 }, { type: 'Housing Contribution', rate: 2, employerRate: 2, employeeRate: 0 }], benefits: ['CNPS Retirement Pension', 'CMU Universal Health Coverage', 'Family Allowances', 'Maternity Leave (14 weeks)'] },
    'Tanzania': { currency: 'TZS', currencyCode: 'TZ', taxes: [{ type: 'PAYE (Income Tax)', rate: 0, employerRate: 0, employeeRate: 30 }, { type: 'NSSF (Pension)', rate: 20, employerRate: 10, employeeRate: 10 }, { type: 'WCF (Workers Comp)', rate: 1, employerRate: 1, employeeRate: 0 }, { type: 'SDL (Skills Levy)', rate: 4.5, employerRate: 4.5, employeeRate: 0 }], benefits: ['NSSF Pension', 'NHIF Health Insurance', 'Workers Compensation Fund', 'Maternity Leave (84 days)'] },
    'Uganda': { currency: 'UGX', currencyCode: 'UG', taxes: [{ type: 'PAYE (Income Tax)', rate: 0, employerRate: 0, employeeRate: 30 }, { type: 'NSSF (Pension)', rate: 15, employerRate: 10, employeeRate: 5 }, { type: 'Local Service Tax', rate: 0, employerRate: 0, employeeRate: 1 }, { type: 'NHIS (Health Insurance)', rate: 2, employerRate: 1, employeeRate: 1 }], benefits: ['NSSF Pension', 'NHIS Health Insurance', 'Workers Compensation', 'Maternity Leave (60 days)'] },
  }
  const [wizardCountry, setWizardCountry] = useState('')
  const [wizardTaxes, setWizardTaxes] = useState<{ type: string; rate: number; employerRate: number; employeeRate: number }[]>([])
  const [wizardCurrency, setWizardCurrency] = useState({ code: '', bankName: '', accountName: '' })
  const [wizardCompleted, setWizardCompleted] = useState(false)

  function selectWizardCountry(country: string) {
    setWizardCountry(country)
    const preset = COUNTRY_PRESETS[country]
    if (preset) {
      setWizardTaxes(preset.taxes)
      setWizardCurrency(prev => ({ ...prev, code: preset.currency }))
    }
    setWizardStep(2)
  }

  function completeCountryWizard() {
    if (!wizardCountry) return
    const preset = COUNTRY_PRESETS[wizardCountry]
    // Create tax configs
    wizardTaxes.forEach(tax => {
      addTaxConfig({ country: wizardCountry, tax_type: tax.type, rate: tax.employeeRate, employer_contribution: tax.employerRate, employee_contribution: tax.employeeRate, status: 'active', effective_date: new Date().toISOString().split('T')[0] })
    })
    // Create currency account
    if (wizardCurrency.code) {
      addCurrencyAccount({ currency: wizardCurrency.code, account_name: `${wizardCountry} Payroll Account`, bank_name: wizardCurrency.bankName || `${wizardCountry} National Bank`, balance: 0, is_default: currencyAccounts.length === 0, is_active: true })
    }
    // Create country benefit config
    if (preset) {
      addCountryBenefitConfig({ country: wizardCountry, country_code: preset.currencyCode, mandatory_benefits: preset.benefits.map(b => ({ name: b, category: 'statutory', description: b })), compliance_notes: `Statutory benefits for ${wizardCountry}` })
    }
    setWizardCompleted(true)
    addToast(`${wizardCountry} configured successfully!`)
  }

  // Billing state
  const [billingSubscription, setBillingSubscription] = useState<BillingSubscription | null>(null)
  const [billingPlans, setBillingPlans] = useState<BillingPlan[]>([])
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingActionLoading, setBillingActionLoading] = useState<string | null>(null)
  const [billingDemo, setBillingDemo] = useState(false)
  const [billingLoaded, setBillingLoaded] = useState(false)

  // Bank accounts state
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'bank-account' | 'integration'; id: string; label: string } | null>(null)
  const [showBankAccountModal, setShowBankAccountModal] = useState(false)
  const [editingBankAccount, setEditingBankAccount] = useState<string | null>(null)
  const [bankAccountForm, setBankAccountForm] = useState({
    account_name: '', bank_name: '', routing_number: '', bank_account_number: '',
    iban: '', swift_code: '', currency: defaultCurrency, is_default: false,
  })
  const [bankAccountsLoaded, setBankAccountsLoaded] = useState(false)

  // Load billing data
  const loadBilling = useCallback(async () => {
    setBillingLoading(true)
    try {
      const res = await fetch('/api/billing')
      if (res.ok) {
        const data = await res.json()
        setBillingSubscription(data.subscription || null)
        setBillingPlans(data.plans || [])
        setBillingDemo(!!data.demo)
      }
    } catch {
      // Use empty state on error
    }
    setBillingLoading(false)
    setBillingLoaded(true)
  }, [])

  // Handle billing query params (success / canceled)
  useEffect(() => {
    const billingSuccess = searchParams.get('billing') || searchParams.get('success')
    const billingCanceled = searchParams.get('canceled')
    if (billingSuccess === 'true' || billingSuccess === 'success') {
      addToast('Subscription updated successfully!', 'success')
    }
    if (billingCanceled === 'true' || billingCanceled === 'canceled') {
      addToast('Checkout was canceled.', 'info')
    }
  }, [searchParams, addToast])

  // Load billing when tab is activated
  useEffect(() => {
    if (activeTab === 'billing' && !billingLoaded && !billingLoading) {
      loadBilling()
    }
  }, [activeTab, billingLoaded, billingLoading, loadBilling])

  // Billing actions
  const handleBillingUpgrade = async (planId: string) => {
    setBillingActionLoading(planId)
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout', planId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.demo) {
        addToast('Stripe is not configured. This is a demo environment.', 'info')
      } else {
        addToast(data.error || 'Failed to start checkout', 'error')
      }
    } catch {
      addToast('Failed to start checkout', 'error')
    }
    setBillingActionLoading(null)
  }

  const handleManageSubscription = async () => {
    setBillingActionLoading('portal')
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'portal' }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.demo) {
        addToast('Stripe is not configured. This is a demo environment.', 'info')
      } else {
        addToast(data.error || 'Failed to open billing portal', 'error')
      }
    } catch {
      addToast('Failed to open billing portal', 'error')
    }
    setBillingActionLoading(null)
  }

  // Load integrations from API
  const loadIntegrations = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
      })
      if (res.ok) {
        const data = await res.json()
        setConnectedIntegrations(data.connected || [])
      }
    } catch {
      // Use empty state on error
    }
    setIntegrationsLoaded(true)
  }, [])

  // Load integrations on mount if tab is integrations
  useEffect(() => {
    if (initialTab === 'integrations' && !integrationsLoaded) {
      loadIntegrations()
    }
  }, [initialTab, integrationsLoaded, loadIntegrations])

  // Load bank accounts on mount if tab is bank-accounts
  useEffect(() => {
    if (initialTab === 'bank-accounts' && !bankAccountsLoaded) {
      ensureModulesLoaded?.(['currencyAccounts']).then(() => setBankAccountsLoaded(true))
    }
  }, [initialTab, bankAccountsLoaded, ensureModulesLoaded])

  // Load KB articles on mount if tab is knowledge-base
  useEffect(() => {
    if (initialTab === 'knowledge-base') {
      ensureModulesLoaded?.(['knowledgeBaseArticles'])
    }
  }, [initialTab, ensureModulesLoaded])

  // Load integrations when tab is activated
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
    if (tab === 'integrations' && !integrationsLoaded) {
      loadIntegrations()
    }
    if (tab === 'billing' && !billingLoaded && !billingLoading) {
      loadBilling()
    }
    if (tab === 'bank-accounts' && !bankAccountsLoaded) {
      ensureModulesLoaded?.(['currencyAccounts']).then(() => setBankAccountsLoaded(true))
    }
    if (tab === 'knowledge-base') {
      ensureModulesLoaded?.(['knowledgeBaseArticles'])
    }
  }, [integrationsLoaded, loadIntegrations, billingLoaded, billingLoading, loadBilling, bankAccountsLoaded, ensureModulesLoaded])

  // Get connector config schema
  const getConfigSchema = (providerId: string): ConfigField[] => {
    // Import config schemas from connectors
    const schemas: Record<string, ConfigField[]> = {
      'active-directory': [
        { key: 'tenant_id', label: ti('tenantId'), type: 'text', required: true, placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
        { key: 'client_id', label: ti('clientId'), type: 'text', required: true, placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
        { key: 'client_secret', label: ti('clientSecret'), type: 'password', required: true, placeholder: ti('enterClientSecret') },
        { key: 'domain', label: ti('domain'), type: 'text', required: false, placeholder: 'ecobank.com' },
        { key: 'sync_mode', label: ti('syncMode'), type: 'select', required: true, options: [
          { label: ti('usersOnly'), value: 'users' },
          { label: ti('usersAndGroups'), value: 'users_groups' },
          { label: ti('fullDirectory'), value: 'full' },
        ] },
      ],
      'google-workspace': [
        { key: 'service_account_email', label: ti('serviceAccountEmail'), type: 'text', required: true, placeholder: 'service-account@project.iam.gserviceaccount.com' },
        { key: 'admin_email', label: ti('adminEmail'), type: 'text', required: true, placeholder: 'admin@company.com' },
        { key: 'private_key', label: ti('privateKey'), type: 'password', required: true, placeholder: '-----BEGIN PRIVATE KEY-----...' },
        { key: 'domain', label: ti('domain'), type: 'text', required: true, placeholder: 'company.com' },
        { key: 'customer_id', label: ti('customerId'), type: 'text', required: false, placeholder: 'Cxxxxxxx' },
      ],
      'payroll-api': [
        { key: 'api_url', label: ti('apiUrl'), type: 'url', required: true, placeholder: 'https://payroll.example.com/api/v1' },
        { key: 'api_key', label: ti('apiKey'), type: 'password', required: true, placeholder: ti('enterApiKey') },
        { key: 'api_secret', label: ti('apiSecret'), type: 'password', required: false, placeholder: ti('optionalForBasicAuth') },
        { key: 'auth_type', label: ti('authType'), type: 'select', required: true, options: [
          { label: ti('bearerToken'), value: 'bearer' },
          { label: ti('basicAuth'), value: 'basic' },
          { label: ti('apiKeyHeader'), value: 'api_key' },
        ] },
        { key: 'employees_endpoint', label: ti('employeesEndpoint'), type: 'text', required: false, placeholder: '/employees' },
        { key: 'payroll_endpoint', label: ti('payrollEndpoint'), type: 'text', required: false, placeholder: '/payroll' },
      ],
    }
    return schemas[providerId] || []
  }

  // Connect integration
  const handleConnect = async () => {
    if (!selectedProvider) return
    setConnecting(true)
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', provider: selectedProvider, config: connectForm }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        addToast(ti('connectionSuccess'), 'success')
        setShowConnectModal(false)
        setConnectForm({})
        setSelectedProvider(null)
        setTestResult(null)
        loadIntegrations()
      } else {
        addToast(data.error || ti('connectionFailed'), 'error')
      }
    } catch {
      addToast(ti('connectionFailed'), 'error')
    }
    setConnecting(false)
  }

  // Test connection
  const handleTestConnection = async () => {
    if (!selectedProvider) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', provider: selectedProvider, config: connectForm }),
      })
      const data = await res.json()
      setTestResult(data.success)
    } catch {
      setTestResult(false)
    }
    setTesting(false)
  }

  // Disconnect integration
  const handleDisconnect = async (integrationId: string) => {
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect', integrationId }),
      })
      if (res.ok) {
        addToast(ti('disconnected'), 'success')
        loadIntegrations()
      }
    } catch {
      addToast(ti('disconnectFailed'), 'error')
    }
  }

  // Sync integration
  const handleSync = async (integrationId: string) => {
    setSyncing(integrationId)
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', integrationId }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        addToast(ti('syncSuccess'), 'success')
      } else {
        addToast(ti('syncFailed'), 'error')
      }
      loadIntegrations()
    } catch {
      addToast(ti('syncFailed'), 'error')
    }
    setSyncing(null)
  }

  // Load sync logs
  const handleViewLogs = async (integrationId: string) => {
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logs', integrationId }),
      })
      if (res.ok) {
        const data = await res.json()
        setIntegrationLogs(data.logs || [])
      }
    } catch {
      setIntegrationLogs([])
    }
    setShowLogsModal(true)
  }

  const openConnectModal = (providerId: string) => {
    setSelectedProvider(providerId)
    setConnectForm({})
    setTestResult(null)
    setShowConnectModal(true)
  }

  const isConnected = (providerId: string) => {
    return connectedIntegrations.some(c => c.provider === providerId && c.status === 'connected')
  }

  const getConnection = (providerId: string) => {
    return connectedIntegrations.find(c => c.provider === providerId)
  }

  const tabs = [
    { id: 'general', label: t('tabGeneral') },
    { id: 'team', label: t('tabTeam'), count: employees.length },
    { id: 'departments', label: t('tabDepartments'), count: departments.length },
    { id: 'billing', label: 'Billing' },
    { id: 'bank-accounts', label: 'Bank Accounts' },
    { id: 'integrations', label: ti('title') },
    { id: 'audit', label: t('tabAuditLog'), count: auditLog.length },
    { id: 'security', label: t('tabSecurity') },
    { id: 'country-wizard', label: 'Add Country' },
    { id: 'knowledge-base', label: 'Knowledge Base' },
  ]

  const admins = employees.filter(e => e.role === 'admin' || e.role === 'owner')
  const managers = employees.filter(e => e.role === 'manager')
  const regularEmployees = employees.filter(e => e.role === 'employee')

  const filteredAudit = auditLog.filter(entry =>
    !auditSearch ||
    entry.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
    entry.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
    entry.entity_type.toLowerCase().includes(auditSearch.toLowerCase())
  )

  async function submitOrg() {
    if (!orgForm.name) {
      addToast('Company name is required', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'organizations',
          action: 'update',
          id: org.id,
          data: orgForm,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save')
      }
      updateOrg(orgForm)
      setShowOrgModal(false)
    } catch (err: any) {
      // Still update locally even if API fails
      updateOrg(orgForm)
      setShowOrgModal(false)
    } finally {
      setSaving(false)
    }
  }

  async function submitDept() {
    if (!deptForm.name) {
      addToast('Department name is required', 'error')
      return
    }
    setSaving(true)
    try {
      addDepartment({ name: deptForm.name, parent_id: deptForm.parent_id, head_id: deptForm.head_id || null })
      setShowDeptModal(false)
      setDeptForm({ name: '', parent_id: null, head_id: '' })
    } finally {
      setSaving(false)
    }
  }

  // Bank account helpers
  function openAddBankAccount() {
    setEditingBankAccount(null)
    setBankAccountForm({ account_name: '', bank_name: '', routing_number: '', bank_account_number: '', iban: '', swift_code: '', currency: defaultCurrency, is_default: false })
    setShowBankAccountModal(true)
  }
  function openEditBankAccount(account: any) {
    setEditingBankAccount(account.id)
    setBankAccountForm({
      account_name: account.account_name || account.accountName || '',
      bank_name: account.bank_name || account.bankName || '',
      routing_number: account.routing_number || account.routingNumber || '',
      bank_account_number: account.bank_account_number || account.bankAccountNumber || '',
      iban: account.iban || '', swift_code: account.swift_code || account.swiftCode || '',
      currency: account.currency || 'USD', is_default: account.is_default ?? account.isDefault ?? false,
    })
    setShowBankAccountModal(true)
  }
  async function submitBankAccount() {
    if (!bankAccountForm.account_name || !bankAccountForm.bank_name) {
      addToast('Account name and bank name are required', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        account_name: bankAccountForm.account_name, bank_name: bankAccountForm.bank_name,
        routing_number: bankAccountForm.routing_number, bank_account_number: bankAccountForm.bank_account_number,
        iban: bankAccountForm.iban, swift_code: bankAccountForm.swift_code,
        currency: bankAccountForm.currency, is_default: bankAccountForm.is_default, is_active: true,
      }
      if (editingBankAccount) {
        updateCurrencyAccount(editingBankAccount, payload)
      } else {
        addCurrencyAccount(payload)
      }
      setShowBankAccountModal(false)
    } finally {
      setSaving(false)
    }
  }
  function handleDeleteBankAccount(account: any) {
    const isDefault = account.is_default ?? account.isDefault
    if (isDefault) { addToast('Cannot delete the default account'); return }
    setDeleteConfirm({ type: 'bank-account', id: account.id, label: account.account_name || account.accountName || 'this account' })
  }

  function confirmDeleteAction() {
    if (!deleteConfirm) return
    if (deleteConfirm.type === 'bank-account') {
      deleteCurrencyAccount(deleteConfirm.id)
    } else if (deleteConfirm.type === 'integration') {
      handleDisconnect(deleteConfirm.id)
    }
    setDeleteConfirm(null)
  }

  // Billing helpers
  const currentPlanTier = billingSubscription?.plan?.toLowerCase() || 'free'
  const employeeCount = billingSubscription?.employeeCount || employees.length
  const currentPlanData = (billingPlans.length > 0 ? billingPlans : [
    { id: 'free', name: 'Free', pricePerEmployee: 0, maxEmployees: 10, tier: 'free', features: [] },
    { id: 'starter', name: 'Starter', pricePerEmployee: 800, maxEmployees: 100, tier: 'starter', features: [] },
    { id: 'professional', name: 'Professional', pricePerEmployee: 1500, maxEmployees: 5000, tier: 'professional', features: [] },
    { id: 'enterprise', name: 'Enterprise', pricePerEmployee: 2500, maxEmployees: null, tier: 'enterprise', features: [] },
  ]).find(p => p.name.toLowerCase() === currentPlanTier || p.tier === currentPlanTier)
  const planMaxEmployees = currentPlanData?.maxEmployees || 5000
  const employeeUsagePercent = Math.min(100, Math.round((employeeCount / planMaxEmployees) * 100))

  // Trial calculation
  const trialDaysRemaining = billingSubscription?.trialEnd
    ? Math.max(0, Math.ceil((new Date(billingSubscription.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0
  const trialTotalDays = 14
  const trialProgressPercent = billingSubscription?.trialEnd
    ? Math.max(0, Math.min(100, Math.round(((trialTotalDays - trialDaysRemaining) / trialTotalDays) * 100)))
    : 0

  if (pageLoading) {
    return (
      <>
        <Header title={t('title')} subtitle={t('subtitle')} />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header title={t('title')} subtitle={t('subtitle')} />

      <Tabs tabs={tabs} active={activeTab} onChange={handleTabChange} className="mb-6" />

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600"><Building size={20} /></div>
              <div>
                <h3 className="text-sm font-semibold text-t1">{t('organization')}</h3>
                <p className="text-xs text-t3">{t('manageCompanyDetails')}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-xs text-t2">{t('companyName')}</span><span className="text-sm font-medium text-t1">{org.name}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs text-t2">{t('industry')}</span><span className="text-sm text-t1">{org.industry}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs text-t2">{t('plan')}</span><Badge variant="orange">{org.plan}</Badge></div>
              <div className="flex justify-between items-center"><span className="text-xs text-t2">{t('size')}</span><span className="text-sm text-t1">{org.size}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs text-t2">{tc('country')}</span><span className="text-sm text-t1">{org.country}</span></div>
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => { setOrgForm({ name: org.name, industry: org.industry, size: org.size, country: org.country }); setShowOrgModal(true) }}>{t('editOrganization')}</Button>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600"><Globe size={20} /></div>
              <div>
                <h3 className="text-sm font-semibold text-t1">{t('regionsCountries')}</h3>
                <p className="text-xs text-t3">{t('multiCountryConfig')}</p>
              </div>
            </div>
            <div className="space-y-2">
              {[{ region: 'UEMOA', countries: 8 }, { region: 'CESA', countries: 10 }, { region: 'AWA', countries: 7 }, { region: 'Nigeria', countries: 1 }].map(item => (
                <div key={item.region} className="flex items-center justify-between bg-canvas rounded-lg px-3 py-2">
                  <div><p className="text-xs font-medium text-t1">{item.region}</p><p className="text-[0.6rem] text-t3">{t('countriesCount', { count: item.countries })}</p></div>
                  <Badge variant="success">{tc('active')}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600"><Bell size={20} /></div>
              <div><h3 className="text-sm font-semibold text-t1">{t('notifications')}</h3><p className="text-xs text-t3">{t('notifPreferences')}</p></div>
            </div>
            <div className="space-y-2">
              {[t('notifLeaveApprovals'), t('notifExpenseSubmissions'), t('notifPerformanceReviews'), t('notifPayrollProcessing'), t('notifItRequests')].map(item => {
                const prefs = ['Email & Push', 'Email Only', 'Push Only', 'Off']
                const currentPref = notifPrefs[item] || 'Email & Push'
                return (
                  <div key={item} className="flex items-center justify-between bg-canvas rounded-lg px-3 py-2 cursor-pointer hover:bg-canvas/80 transition-colors"
                    onClick={() => {
                      const currentIndex = prefs.indexOf(currentPref)
                      const nextPref = prefs[(currentIndex + 1) % prefs.length]
                      setNotifPrefs(prev => ({ ...prev, [item]: nextPref }))
                    }}>
                    <span className="text-xs text-t1">{item}</span>
                    <Badge variant={currentPref === 'Off' ? 'default' : 'info'}>{currentPref}</Badge>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600"><Palette size={20} /></div>
              <div><h3 className="text-sm font-semibold text-t1">Company Branding</h3><p className="text-xs text-t3">Customize your organization&apos;s visual identity</p></div>
            </div>

            <div className="space-y-8">
              {/* Logo Upload */}
              <div>
                <label className="text-xs font-semibold text-t1 mb-3 block">Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-48 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-canvas overflow-hidden">
                    {branding.logoUrl ? (
                      <img src={branding.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-t3 text-sm">No logo uploaded</span>
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-tempo-500 text-white text-sm font-medium hover:bg-tempo-600 transition-colors">
                      <Upload className="w-4 h-4" />
                      Upload Logo
                      <input type="file" accept="image/png,image/svg+xml,image/jpeg" className="hidden" onChange={handleLogoUpload} />
                    </label>
                    {branding.logoUrl && (
                      <button onClick={() => setBranding(prev => ({ ...prev, logoUrl: '' }))} className="ml-2 text-sm text-red-500 hover:underline">
                        Remove
                      </button>
                    )}
                    <p className="text-xs text-t3 mt-1">PNG, SVG, or JPG. Max 2MB. Recommended: 200x60px</p>
                  </div>
                </div>
              </div>

              {/* Favicon Upload */}
              <div>
                <label className="text-xs font-semibold text-t1 mb-3 block">Favicon</label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-canvas overflow-hidden">
                    {branding.faviconUrl ? (
                      <img src={branding.faviconUrl} alt="Favicon" className="w-8 h-8 object-contain" />
                    ) : (
                      <span className="text-t3 text-[10px]">32px</span>
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm font-medium hover:bg-canvas transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                      <input type="file" accept="image/png" className="hidden" onChange={handleFaviconUpload} />
                    </label>
                    {branding.faviconUrl && (
                      <button onClick={() => setBranding(prev => ({ ...prev, faviconUrl: '' }))} className="ml-2 text-sm text-red-500 hover:underline">
                        Remove
                      </button>
                    )}
                    <p className="text-xs text-t3 mt-1">32x32px PNG</p>
                  </div>
                </div>
              </div>

              {/* Primary Brand Color */}
              <div>
                <label className="text-xs font-semibold text-t1 mb-3 block">Primary Brand Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={branding.primaryColor}
                    onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="font-mono text-sm px-3 py-2 rounded-lg border border-border bg-card w-28"
                  />
                  <span className="text-xs text-t3">Used for buttons, links, accents</span>
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <label className="text-xs font-semibold text-t1 mb-3 block">Secondary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={branding.secondaryColor}
                    onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={branding.secondaryColor}
                    onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="font-mono text-sm px-3 py-2 rounded-lg border border-border bg-card w-28"
                  />
                  <span className="text-xs text-t3">Used for headers, sidebar</span>
                </div>
              </div>

              {/* Sidebar Theme */}
              <div>
                <label className="text-xs font-semibold text-t1 mb-3 block">Sidebar Theme</label>
                <div className="flex gap-4">
                  {(['dark', 'light', 'brand'] as const).map(theme => (
                    <label key={theme} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sidebarTheme"
                        checked={branding.sidebarTheme === theme}
                        onChange={() => setBranding(prev => ({ ...prev, sidebarTheme: theme }))}
                        className="accent-tempo-500"
                      />
                      <span className="text-sm text-t1 capitalize">{theme === 'brand' ? 'Match brand color' : theme}{theme === 'dark' ? ' (default)' : ''}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Login Page Customization */}
              <div>
                <label className="text-xs font-semibold text-t1 mb-3 block">Login Page Customization</label>
                <div className="rounded-xl border border-border p-4 space-y-4 bg-canvas/50">
                  <div>
                    <label className="text-xs text-t2 mb-1.5 block">Welcome Message</label>
                    <input
                      type="text"
                      value={branding.loginWelcomeMessage}
                      onChange={(e) => setBranding(prev => ({ ...prev, loginWelcomeMessage: e.target.value }))}
                      placeholder={`Welcome to ${org.name}`}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-t2 mb-1.5 block">Login Background</label>
                    <div className="flex flex-col gap-2">
                      {(['gradient', 'solid', 'custom'] as const).map(bg => (
                        <label key={bg} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="loginBackground"
                            checked={branding.loginBackground === bg}
                            onChange={() => setBranding(prev => ({ ...prev, loginBackground: bg }))}
                            className="accent-tempo-500"
                          />
                          <span className="text-sm text-t1">
                            {bg === 'gradient' ? 'Default gradient' : bg === 'solid' ? 'Solid brand color' : 'Custom image'}
                          </span>
                          {bg === 'custom' && branding.loginBackground === 'custom' && (
                            <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded border border-border text-xs hover:bg-canvas transition-colors ml-2">
                              <Upload className="w-3 h-3" />
                              Upload
                              <input type="file" accept="image/*" className="hidden" onChange={handleLoginBgUpload} />
                            </label>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={branding.showLoginLogo}
                        onChange={(e) => setBranding(prev => ({ ...prev, showLoginLogo: e.target.checked }))}
                        className="accent-tempo-500 rounded"
                      />
                      <span className="text-sm text-t1">Show company logo on login</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={branding.showPoweredBy}
                        onChange={(e) => setBranding(prev => ({ ...prev, showPoweredBy: e.target.checked }))}
                        className="accent-tempo-500 rounded"
                      />
                      <span className="text-sm text-t1">Show &quot;Powered by Tempo&quot;</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Email Template Branding */}
              <div>
                <label className="text-xs font-semibold text-t1 mb-3 block">Email Template Branding</label>
                <div className="rounded-xl border border-border p-4 space-y-4 bg-canvas/50">
                  <div>
                    <label className="text-xs text-t2 mb-1.5 block">Email Header Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={branding.emailHeaderColor}
                        onChange={(e) => setBranding(prev => ({ ...prev, emailHeaderColor: e.target.value }))}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-border bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={branding.emailHeaderColor}
                        onChange={(e) => setBranding(prev => ({ ...prev, emailHeaderColor: e.target.value }))}
                        className="font-mono text-sm px-3 py-2 rounded-lg border border-border bg-card w-28"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-t2 mb-1.5 block">Email Footer Text</label>
                    <textarea
                      value={branding.emailFooterText}
                      onChange={(e) => setBranding(prev => ({ ...prev, emailFooterText: e.target.value }))}
                      placeholder={`\u00a9 2026 ${org.name}. All rights reserved.`}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm resize-none"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={branding.includeLogoInEmails}
                      onChange={(e) => setBranding(prev => ({ ...prev, includeLogoInEmails: e.target.checked }))}
                      className="accent-tempo-500 rounded"
                    />
                    <span className="text-sm text-t1">Include company logo in emails</span>
                  </label>
                </div>
              </div>

              {/* Live Preview */}
              <div>
                <label className="text-xs font-semibold text-t1 mb-3 flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </label>
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="text-xs font-medium text-t3 px-3 py-1.5 bg-canvas border-b border-border">Live Preview</div>
                  <div className="flex h-40">
                    {/* Sidebar preview */}
                    <div
                      className="w-16 transition-colors"
                      style={{
                        backgroundColor:
                          branding.sidebarTheme === 'dark' ? branding.secondaryColor :
                          branding.sidebarTheme === 'brand' ? branding.primaryColor :
                          '#ffffff',
                      }}
                    >
                      <div className="p-2 flex flex-col items-center gap-2 pt-3">
                        {branding.logoUrl ? (
                          <img src={branding.logoUrl} alt="" className="w-8 h-8 rounded object-contain" />
                        ) : (
                          <div className="w-8 h-8 rounded" style={{ backgroundColor: branding.primaryColor }} />
                        )}
                        {[1,2,3,4].map(i => (
                          <div
                            key={i}
                            className="w-8 h-2 rounded opacity-30"
                            style={{ backgroundColor: branding.sidebarTheme === 'light' ? '#000000' : '#ffffff' }}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Content preview */}
                    <div className="flex-1 bg-canvas p-3">
                      <div className="h-3 w-24 rounded mb-3" style={{ backgroundColor: branding.secondaryColor }} />
                      <div className="flex gap-2 mb-3">
                        <div
                          className="h-8 w-20 rounded text-white text-[8px] flex items-center justify-center font-medium"
                          style={{ backgroundColor: branding.primaryColor }}
                        >
                          Button
                        </div>
                        <div className="h-8 w-20 rounded border border-border text-[8px] flex items-center justify-center">
                          Outline
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {[1,2,3].map(i => (
                          <div key={i} className="h-2 rounded bg-border" style={{ width: `${100 - i * 20}%` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <Button onClick={saveBranding}>
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Branding
                </Button>
                <Button variant="outline" onClick={resetBranding}>
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  Reset to Default
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'team' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('teamMembers', { count: employees.length })}</CardTitle>
              <div className="flex gap-2">
                <Badge variant="orange">{t('admins', { count: admins.length })}</Badge>
                <Badge variant="info">{t('managers', { count: managers.length })}</Badge>
                <Badge>{t('employeesCount', { count: regularEmployees.length })}</Badge>
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-divider bg-canvas">
                <th className="tempo-th text-left px-6 py-3">{t('tableMember')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableDepartment')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableTitle')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableRole')}</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {employees.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-16 text-center">
                    <Users size={32} className="mx-auto text-t3 mb-3" />
                    <p className="text-sm font-medium text-t2">No team members yet</p>
                    <p className="text-xs text-t3 mt-1">Invite employees to get started with your team</p>
                  </td></tr>
                ) : employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3"><div className="flex items-center gap-3"><Avatar name={emp.profile?.full_name || ''} size="sm" /><div><p className="text-xs font-medium text-t1">{emp.profile?.full_name}</p><p className="text-xs text-t3">{emp.profile?.email}</p></div></div></td>
                    <td className="px-4 py-3 text-xs text-t2">{getDepartmentName(emp.department_id)}</td>
                    <td className="px-4 py-3 text-xs text-t2">{emp.job_title}</td>
                    <td className="px-4 py-3"><Badge variant={emp.role === 'admin' || emp.role === 'owner' ? 'orange' : emp.role === 'manager' ? 'info' : 'default'}>{emp.role}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'departments' && (
        <div>
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => setShowDeptModal(true)}>{t('addDepartment')}</Button>
          </div>
          {departments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Building size={32} className="text-t3 mb-3" />
              <p className="text-sm font-medium text-t2">No departments created</p>
              <p className="text-xs text-t3 mt-1">Create your first department to organize your team</p>
              <Button size="sm" className="mt-4" onClick={() => setShowDeptModal(true)}><Plus size={14} /> {t('addDepartment')}</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map(dept => {
                const empCount = employees.filter(e => e.department_id === dept.id).length
                const head = dept.head_id ? getEmployeeName(dept.head_id) : t('unassigned')
                return (
                  <Card key={dept.id}>
                    <h3 className="text-sm font-semibold text-t1 mb-1">{dept.name}</h3>
                    <p className="text-xs text-t3 mb-3">{t('head', { name: head })}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-t2">{t('employeesCount', { count: empCount })}</span>
                      <Badge variant="success">{tc('active')}</Badge>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'billing' && (
        <div>
          {billingLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-tempo-600" />
              <span className="ml-2 text-sm text-t3">Loading billing information...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Demo Mode Banner */}
              {billingDemo && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-[14px] p-4 flex items-center gap-3">
                  <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Billing is in demo mode</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Connect your Stripe account to enable real billing and subscriptions.</p>
                  </div>
                </div>
              )}

              {/* Trial Banner */}
              {billingSubscription?.status === 'trialing' && billingSubscription.trialEnd && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-[14px] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <Sparkles size={20} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Free Trial Active</h3>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'} remaining in your trial
                        </p>
                      </div>
                    </div>
                    <Badge variant="info">{trialDaysRemaining} days left</Badge>
                  </div>
                  <div className="w-full bg-blue-100 dark:bg-blue-900/50 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${trialProgressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[0.65rem] text-blue-500 dark:text-blue-400">
                    <span>Trial started</span>
                    <span>
                      Ends {new Date(billingSubscription.trialEnd).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              )}

              {/* Current Plan Card */}
              {billingSubscription && (
                <Card>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-tempo-50 dark:bg-tempo-950/30 flex items-center justify-center text-tempo-600">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-t1">Current Plan</h3>
                        <p className="text-xs text-t3">Manage your subscription and billing</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        billingSubscription.status === 'active' ? 'success' :
                        billingSubscription.status === 'trialing' ? 'info' :
                        billingSubscription.status === 'past_due' ? 'warning' :
                        'error'
                      }>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          billingSubscription.status === 'active' ? 'bg-green-500' :
                          billingSubscription.status === 'trialing' ? 'bg-blue-500' :
                          billingSubscription.status === 'past_due' ? 'bg-amber-500' :
                          'bg-red-500'
                        }`} />
                        {billingSubscription.status.charAt(0).toUpperCase() + billingSubscription.status.slice(1)}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleManageSubscription}
                        disabled={billingActionLoading === 'portal'}
                      >
                        {billingActionLoading === 'portal' ? (
                          <Loader2 size={14} className="animate-spin mr-1.5" />
                        ) : (
                          <ExternalLink size={14} className="mr-1.5" />
                        )}
                        Manage in Stripe
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5">
                    <div className="bg-canvas rounded-lg px-4 py-3">
                      <p className="text-xs text-t3 mb-1">Plan</p>
                      <p className="text-lg font-bold text-t1">{billingSubscription.plan}</p>
                    </div>
                    <div className="bg-canvas rounded-lg px-4 py-3">
                      <p className="text-xs text-t3 mb-1">Monthly Cost</p>
                      <p className="text-lg font-bold text-t1">
                        ${(billingSubscription.monthlyAmount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-canvas rounded-lg px-4 py-3">
                      <p className="text-xs text-t3 mb-1">Employees</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-lg font-bold text-t1">{employeeCount}</p>
                        <span className="text-xs text-t3">/ {currentPlanData?.maxEmployees ?? 'Unlimited'}</span>
                      </div>
                    </div>
                    <div className="bg-canvas rounded-lg px-4 py-3">
                      <p className="text-xs text-t3 mb-1">Renewal Date</p>
                      <div className="flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-t3" />
                        <p className="text-sm font-semibold text-t1">
                          {billingSubscription.currentPeriodEnd
                            ? new Date(billingSubscription.currentPeriodEnd).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                              })
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Employee Usage Bar */}
                  {currentPlanData?.maxEmployees && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-t2">Employee Usage</span>
                        <span className="text-xs font-medium text-t1">{employeeUsagePercent}%</span>
                      </div>
                      <div className="w-full bg-canvas rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            employeeUsagePercent >= 90 ? 'bg-red-500' :
                            employeeUsagePercent >= 70 ? 'bg-amber-500' :
                            'bg-tempo-600'
                          }`}
                          style={{ width: `${employeeUsagePercent}%` }}
                        />
                      </div>
                      {employeeUsagePercent >= 90 && (
                        <p className="text-[0.65rem] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                          <AlertCircle size={11} />
                          Approaching plan limit. Consider upgrading for more capacity.
                        </p>
                      )}
                    </div>
                  )}

                  {billingSubscription.cancelAtPeriodEnd && (
                    <div className="mt-3 flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded-lg px-3 py-2 text-xs">
                      <AlertCircle size={14} />
                      <span>Your subscription will cancel at the end of the current billing period.</span>
                    </div>
                  )}
                </Card>
              )}

              {/* Usage Metrics */}
              <div>
                <h3 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
                  <BarChart3 size={16} className="text-tempo-600" />
                  Usage Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Employees */}
                  <Card>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                        <Users size={18} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-t3">Active Employees</p>
                        <p className="text-xl font-bold text-t1 tracking-tight">{employeeCount}</p>
                      </div>
                      <div className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                        <ArrowUpRight size={14} />
                        <span className="text-xs font-medium">+3</span>
                      </div>
                    </div>
                    <div className="w-full bg-canvas rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${employeeUsagePercent}%` }} />
                    </div>
                    <p className="text-[0.65rem] text-t3 mt-1.5">{employeeCount} of {currentPlanData?.maxEmployees ?? 'unlimited'} seats used</p>
                  </Card>

                  {/* API Calls */}
                  <Card>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
                        <Activity size={18} className="text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-t3">API Calls (this month)</p>
                        <p className="text-xl font-bold text-t1 tracking-tight">{MOCK_USAGE.apiCalls.used.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                        <TrendingUp size={14} />
                        <span className="text-xs font-medium">12%</span>
                      </div>
                    </div>
                    <div className="w-full bg-canvas rounded-full h-1.5">
                      <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${Math.round((MOCK_USAGE.apiCalls.used / MOCK_USAGE.apiCalls.limit) * 100)}%` }} />
                    </div>
                    <p className="text-[0.65rem] text-t3 mt-1.5">{MOCK_USAGE.apiCalls.used.toLocaleString()} of {MOCK_USAGE.apiCalls.limit.toLocaleString()} calls used</p>
                  </Card>

                  {/* Storage */}
                  <Card>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                        <FileText size={18} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-t3">Storage Used</p>
                        <p className="text-xl font-bold text-t1 tracking-tight">{MOCK_USAGE.storage.used} {MOCK_USAGE.storage.unit}</p>
                      </div>
                    </div>
                    <div className="w-full bg-canvas rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.round((MOCK_USAGE.storage.used / MOCK_USAGE.storage.limit) * 100)}%` }} />
                    </div>
                    <p className="text-[0.65rem] text-t3 mt-1.5">{MOCK_USAGE.storage.used} of {MOCK_USAGE.storage.limit} {MOCK_USAGE.storage.unit} used</p>
                  </Card>
                </div>

                {/* Module Usage */}
                <Card className="mt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-tempo-50 dark:bg-tempo-950/30 flex items-center justify-center text-tempo-600">
                      <CircleDot size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-t1">Module Activation</h4>
                      <p className="text-xs text-t3">{MOCK_USAGE.modules.filter(m => m.active).length} of {MOCK_USAGE.modules.length} modules active</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {MOCK_USAGE.modules.map(mod => (
                      <div key={mod.name} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                        mod.active
                          ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400'
                          : 'bg-canvas text-t3'
                      }`}>
                        {mod.active ? <Check size={12} className="shrink-0" /> : <Minus size={12} className="shrink-0" />}
                        <span className="truncate">{mod.name}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Plan Comparison Grid */}
              <div>
                <h3 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
                  <Crown size={16} className="text-tempo-600" />
                  Available Plans
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(billingPlans.length > 0 ? billingPlans : [
                    { id: 'free', name: 'Free', pricePerEmployee: 0, maxEmployees: 10, tier: 'free', features: ['Up to 10 employees', 'Core HR', 'Basic Analytics'] },
                    { id: 'starter', name: 'Starter', pricePerEmployee: 800, maxEmployees: 100, tier: 'starter', features: ['Up to 100 employees', 'Core HR & People', 'Performance Management', 'Time & Attendance', 'Email Support'] },
                    { id: 'professional', name: 'Professional', pricePerEmployee: 1500, maxEmployees: 5000, tier: 'professional', features: ['Up to 5,000 employees', 'All Starter features', 'Payroll & Benefits', 'Recruiting & Expense', 'Learning & Engagement', 'API Access', 'Priority Support'] },
                    { id: 'enterprise', name: 'Enterprise', pricePerEmployee: 2500, maxEmployees: null, tier: 'enterprise', features: ['Unlimited employees', 'All Professional features', 'Multi-country Payroll', 'Advanced Analytics & AI', 'SSO & SCIM', 'Dedicated CSM', 'SLA Guarantee'] },
                  ]).map((plan) => {
                    const isCurrentPlan = billingSubscription?.plan?.toLowerCase() === plan.name.toLowerCase()
                    const priceDisplay = plan.pricePerEmployee === 0
                      ? formatCurrency(0, defaultCurrency)
                      : plan.tier === 'enterprise'
                        ? 'Custom'
                        : formatCurrency(plan.pricePerEmployee, defaultCurrency, { cents: true })

                    const tierIcons: Record<string, React.ReactNode> = {
                      free: <Zap size={20} />,
                      starter: <CreditCard size={20} />,
                      professional: <Sparkles size={20} />,
                      enterprise: <Crown size={20} />,
                    }

                    const tierColors: Record<string, string> = {
                      free: 'from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30',
                      starter: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
                      professional: 'from-tempo-50 to-teal-50 dark:from-tempo-950/30 dark:to-teal-950/30',
                      enterprise: 'from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30',
                    }

                    // Determine if this is an upgrade or downgrade
                    const tierOrder = ['free', 'starter', 'professional', 'enterprise']
                    const currentTierIndex = tierOrder.indexOf(currentPlanTier)
                    const planTierIndex = tierOrder.indexOf(plan.tier)
                    const isUpgrade = planTierIndex > currentTierIndex
                    const isDowngrade = planTierIndex < currentTierIndex

                    return (
                      <div
                        key={plan.id}
                        className={`relative bg-card rounded-[14px] border p-5 flex flex-col ${
                          isCurrentPlan
                            ? 'border-tempo-600 ring-2 ring-tempo-600/20'
                            : 'border-border hover:border-tempo-300 dark:hover:border-tempo-700'
                        } transition-all duration-200`}
                      >
                        {/* Popular badge */}
                        {plan.tier === 'professional' && !isCurrentPlan && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                            <span className="bg-tempo-600 text-white text-[0.6rem] font-semibold px-2.5 py-0.5 rounded-full">
                              Most Popular
                            </span>
                          </div>
                        )}

                        <div className={`rounded-lg p-3 mb-3 bg-gradient-to-br ${tierColors[plan.tier] || tierColors.free}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isCurrentPlan
                                ? 'bg-tempo-600 text-white'
                                : 'bg-white/80 dark:bg-gray-800/80 text-t1'
                            }`}>
                              {tierIcons[plan.tier] || <CreditCard size={20} />}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-t1">{plan.name}</h4>
                              {isCurrentPlan && (
                                <span className="text-[0.6rem] font-medium text-tempo-600">Current Plan</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <span className="text-2xl font-bold text-t1">{priceDisplay}</span>
                          {plan.pricePerEmployee > 0 && plan.tier !== 'enterprise' && (
                            <span className="text-xs text-t3 ml-1">/employee/mo</span>
                          )}
                          {plan.tier === 'enterprise' && (
                            <span className="text-xs text-t3 ml-1">pricing</span>
                          )}
                          {plan.maxEmployees && (
                            <p className="text-[0.65rem] text-t3 mt-0.5">Up to {plan.maxEmployees.toLocaleString()} employees</p>
                          )}
                          {!plan.maxEmployees && plan.tier === 'enterprise' && (
                            <p className="text-[0.65rem] text-t3 mt-0.5">Unlimited employees</p>
                          )}
                        </div>

                        <ul className="space-y-2 mb-5 flex-1">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-xs text-t2">
                              <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {isCurrentPlan ? (
                          <Button variant="outline" size="sm" className="w-full" disabled>
                            <Check size={14} className="mr-1.5" />
                            Current Plan
                          </Button>
                        ) : plan.tier === 'free' ? (
                          isDowngrade ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                              onClick={() => handleBillingUpgrade(plan.id)}
                              disabled={billingActionLoading === plan.id}
                            >
                              {billingActionLoading === plan.id ? (
                                <Loader2 size={14} className="animate-spin mr-1.5" />
                              ) : null}
                              Downgrade
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" className="w-full" disabled>
                              Free Forever
                            </Button>
                          )
                        ) : plan.tier === 'enterprise' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleBillingUpgrade(plan.id)}
                            disabled={billingActionLoading === plan.id}
                          >
                            {billingActionLoading === plan.id ? (
                              <Loader2 size={14} className="animate-spin mr-1.5" />
                            ) : null}
                            Contact Sales
                          </Button>
                        ) : isDowngrade ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                            onClick={() => handleBillingUpgrade(plan.id)}
                            disabled={billingActionLoading === plan.id}
                          >
                            {billingActionLoading === plan.id ? (
                              <Loader2 size={14} className="animate-spin mr-1.5" />
                            ) : null}
                            Downgrade
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full bg-tempo-600 hover:bg-tempo-700 text-white"
                            onClick={() => handleBillingUpgrade(plan.id)}
                            disabled={billingActionLoading === plan.id}
                          >
                            {billingActionLoading === plan.id ? (
                              <Loader2 size={14} className="animate-spin mr-1.5" />
                            ) : (
                              <ArrowUpRight size={14} className="mr-1.5" />
                            )}
                            Upgrade
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Payment Method */}
              <Card>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-canvas flex items-center justify-center text-t1">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-t1">Payment Method</h3>
                      <p className="text-xs text-t3">Your card on file for recurring charges</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManageSubscription}
                    disabled={billingActionLoading === 'portal'}
                  >
                    {billingActionLoading === 'portal' ? (
                      <Loader2 size={14} className="animate-spin mr-1.5" />
                    ) : (
                      <ExternalLink size={14} className="mr-1.5" />
                    )}
                    Manage in Stripe
                  </Button>
                </div>
                <div className="mt-4 flex items-center gap-4 bg-canvas rounded-lg px-4 py-3">
                  <div className="w-12 h-8 rounded bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                    <span className="text-[0.55rem] font-bold text-white tracking-wider">VISA</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-t1">Visa ending in 4242</p>
                    <p className="text-xs text-t3">Expires 12/2027</p>
                  </div>
                  <Badge variant="success">Default</Badge>
                </div>
              </Card>

              {/* Billing History */}
              <div>
                <h3 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
                  <Receipt size={16} className="text-tempo-600" />
                  Billing History
                </h3>
                <Card padding="none">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-divider bg-canvas">
                          <th className="tempo-th text-left px-6 py-3">Invoice</th>
                          <th className="tempo-th text-left px-4 py-3">Date</th>
                          <th className="tempo-th text-left px-4 py-3">Description</th>
                          <th className="tempo-th text-right px-4 py-3">Amount</th>
                          <th className="tempo-th text-center px-4 py-3">Status</th>
                          <th className="tempo-th text-center px-4 py-3">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {storeInvoices.length > 0 ? storeInvoices.map((invoice: Record<string, unknown>) => (
                          <tr key={invoice.id as string} className="hover:bg-canvas/50 transition-colors">
                            <td className="px-6 py-3">
                              <span className="text-xs font-medium text-t1">{(invoice.invoice_number || invoice.id) as string}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-t2">
                              {new Date((invoice.issued_date || invoice.created_at || '') as string).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                              })}
                            </td>
                            <td className="px-4 py-3 text-xs text-t2">{(invoice.description || '') as string}</td>
                            <td className="px-4 py-3 text-xs font-medium text-t1 text-right">
                              ${((invoice.amount as number) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant={(invoice.status as string) === 'paid' ? 'success' : (invoice.status as string) === 'pending' || (invoice.status as string) === 'sent' ? 'warning' : 'error'}>
                                {((invoice.status as string) || '').charAt(0).toUpperCase() + ((invoice.status as string) || '').slice(1)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                className="inline-flex items-center gap-1 text-xs text-tempo-600 hover:text-tempo-700 dark:text-tempo-400 dark:hover:text-tempo-300 font-medium"
                                onClick={() => addToast(`Downloading receipt for ${(invoice.invoice_number || invoice.id) as string}...`, 'info')}
                              >
                                <Download size={12} />
                                PDF
                              </button>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-10 text-center">
                              <Receipt size={24} className="mx-auto text-t3 mb-2" />
                              <p className="text-xs font-medium text-t2">No invoices yet</p>
                              <p className="text-[0.65rem] text-t3 mt-1">Billing invoices will appear here once generated.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-3 border-t border-divider bg-canvas flex items-center justify-between">
                    <p className="text-xs text-t3">{storeInvoices.length > 0 ? `Showing ${storeInvoices.length} most recent invoices` : 'No invoices'}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleManageSubscription}
                      disabled={billingActionLoading === 'portal'}
                    >
                      View All in Stripe
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'bank-accounts' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600"><Landmark size={20} /></div>
                <div>
                  <h3 className="text-sm font-semibold text-t1">Company Bank Accounts</h3>
                  <p className="text-xs text-t3">Manage bank accounts used for payroll and payments</p>
                </div>
              </div>
              <Button size="sm" onClick={openAddBankAccount}><Plus size={14} /> Add Account</Button>
            </div>
            {currencyAccounts.length === 0 ? (
              <div className="text-center py-8">
                <Landmark size={32} className="mx-auto text-t3 mb-3" />
                <p className="text-sm text-t3">No bank accounts configured</p>
                <p className="text-xs text-t3 mt-1">Add a bank account to enable payroll file generation</p>
                <Button size="sm" className="mt-4" onClick={openAddBankAccount}><Plus size={14} /> Add Bank Account</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {currencyAccounts.filter((a: any) => (a.is_active ?? a.isActive) !== false).map((account: any) => {
                  const isDefault = account.is_default ?? account.isDefault
                  const acctNum = account.bank_account_number || account.bankAccountNumber || ''
                  const routing = account.routing_number || account.routingNumber || ''
                  const name = account.account_name || account.accountName || 'Unnamed'
                  const bank = account.bank_name || account.bankName || '—'
                  const ibanVal = account.iban || ''
                  return (
                    <div key={account.id} className="flex items-center justify-between bg-canvas rounded-lg px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Landmark size={16} className="text-tempo-500" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-t1">{name}</span>
                            {isDefault && <Badge variant="success">Default</Badge>}
                            <Badge>{account.currency}</Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-t3">{bank}</span>
                            {routing && <span className="text-xs text-t3">Routing: {routing}</span>}
                            {acctNum && <span className="text-xs text-t3">Acct: ****{acctNum.slice(-4)}</span>}
                            {ibanVal && <span className="text-xs text-t3">IBAN: ****{ibanVal.slice(-4)}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openEditBankAccount(account)}><Pencil size={12} /></Button>
                        {!isDefault && <Button size="sm" variant="secondary" onClick={() => handleDeleteBankAccount(account)}><Trash2 size={12} /></Button>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div>
          {/* Integration Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600"><Plug size={20} /></div>
                <div>
                  <p className="text-xs text-t3">{ti('available')}</p>
                  <p className="text-xl font-bold text-t1 tracking-tight">{INTEGRATION_CATALOG.filter(c => c.status === 'available').length}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500"><Wifi size={18} /></div>
                <div>
                  <p className="text-xs text-t3">{ti('connected')}</p>
                  <p className="text-xl font-bold text-t1 tracking-tight">{connectedIntegrations.filter(c => c.status === 'connected').length}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400"><Clock size={18} /></div>
                <div>
                  <p className="text-xs text-t3">{ti('comingSoon')}</p>
                  <p className="text-xl font-bold text-t1 tracking-tight">{INTEGRATION_CATALOG.filter(c => c.status === 'coming_soon').length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Available Integrations */}
          <h3 className="text-sm font-semibold text-t1 mb-3">{ti('availableIntegrations')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {INTEGRATION_CATALOG.filter(c => c.status === 'available').map(integration => {
              const connected = isConnected(integration.id)
              const connection = getConnection(integration.id)
              return (
                <Card key={integration.id}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-canvas flex items-center justify-center text-t1 shrink-0">
                      {ICON_MAP[integration.icon] || <Plug size={24} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-semibold text-t1 truncate">{integration.name}</h4>
                        {connected && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-t3 line-clamp-2">{integration.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className={`text-[0.6rem] font-medium px-1.5 py-0.5 rounded ${CATEGORY_COLORS[integration.category] || 'bg-gray-50 text-gray-700'}`}>
                      {ti(`category_${integration.category}`)}
                    </span>
                    {integration.capabilities.slice(0, 3).map(cap => (
                      <span key={cap} className="text-[0.6rem] px-1.5 py-0.5 rounded bg-canvas text-t2">{cap}</span>
                    ))}
                  </div>

                  {connected && connection ? (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <CheckCircle size={12} className="text-green-600" />
                        <span className="text-xs text-green-700 font-medium">{ti('connected')}</span>
                        {connection.lastSyncAt && (
                          <span className="text-[0.6rem] text-t3 ml-auto">
                            {ti('lastSync')}: {new Date(connection.lastSyncAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleSync(connection.id)}
                          disabled={syncing === connection.id}
                        >
                          {syncing === connection.id ? <Loader2 size={12} className="animate-spin mr-1" /> : <RefreshCw size={12} className="mr-1" />}
                          {ti('syncNow')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleViewLogs(connection.id)}
                        >
                          <Clock size={12} className="mr-1" />
                          {ti('syncHistory')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteConfirm({ type: 'integration', id: connection.id, label: integration.name })}
                        >
                          <WifiOff size={12} />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" className="w-full" onClick={() => openConnectModal(integration.id)}>
                      <Plug size={12} className="mr-1.5" />
                      {ti('connect')}
                    </Button>
                  )}
                </Card>
              )
            })}
          </div>

          {/* Coming Soon */}
          <h3 className="text-sm font-semibold text-t1 mb-3">{ti('comingSoon')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTEGRATION_CATALOG.filter(c => c.status === 'coming_soon').map(integration => (
              <Card key={integration.id} className="opacity-60">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-canvas flex items-center justify-center text-t3 shrink-0">
                    {ICON_MAP[integration.icon] || <Plug size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-semibold text-t1 truncate">{integration.name}</h4>
                      <Badge>{ti('comingSoon')}</Badge>
                    </div>
                    <p className="text-xs text-t3 line-clamp-2">{integration.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`text-[0.6rem] font-medium px-1.5 py-0.5 rounded ${CATEGORY_COLORS[integration.category] || 'bg-gray-50 text-gray-700'}`}>
                    {ti(`category_${integration.category}`)}
                  </span>
                  {integration.capabilities.slice(0, 3).map(cap => (
                    <span key={cap} className="text-[0.6rem] px-1.5 py-0.5 rounded bg-canvas text-t3">{cap}</span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div>
          <div className="relative mb-4 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
            <input type="text" placeholder={t('searchAuditLog')} className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20" value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)} />
          </div>
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">{t('tableTimestamp')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tableUser')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tableAction')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tableEntity')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tableDetails')}</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {filteredAudit.length > 0 ? filteredAudit.slice(0, 50).map(entry => (
                    <tr key={entry.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs text-t3 whitespace-nowrap">
                        <div className="flex items-center gap-1"><Clock size={12} />{new Date(entry.timestamp).toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-t1">{entry.user}</td>
                      <td className="px-4 py-3">
                        <Badge variant={entry.action === 'create' ? 'success' : entry.action === 'update' ? 'default' : 'error'}>{entry.action}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{entry.entity_type}</td>
                      <td className="px-4 py-3 text-xs text-t2 max-w-[300px] truncate">{entry.details}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-xs text-t3">
                      {auditLog.length === 0 ? t('noAuditEntries') : t('noMatchingEntries')}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-4">
          {/* MFA Settings */}
          <Card>
            <MFASettings />
          </Card>

          {/* Other Security Features */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600"><Shield size={20} /></div>
              <div><h3 className="text-sm font-semibold text-t1">Security & Access</h3><p className="text-xs text-t3">Roles, permissions, and audit</p></div>
            </div>
            <div className="space-y-2">
              {['Role-Based Access Control (RBAC)', 'Audit Logging', 'Session Management', 'IP Allowlisting'].map(item => (
                <div key={item} className="flex items-center justify-between bg-canvas rounded-lg px-3 py-2 cursor-pointer hover:bg-canvas/80 transition-colors" onClick={() => addToast('Security configuration coming soon')}>
                  <span className="text-xs text-t1">{item}</span><Badge variant="success">Enabled</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Country Onboarding Wizard */}
      {activeTab === 'country-wizard' && (
        <div className="space-y-6">
          {/* Step indicator */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              {[
                { step: 1, label: 'Select Country' },
                { step: 2, label: 'Statutory Taxes' },
                { step: 3, label: 'Confirm Rates' },
                { step: 4, label: 'Currency Account' },
                { step: 5, label: 'Complete' },
              ].map(({ step, label }) => (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    wizardCompleted || wizardStep > step ? 'bg-green-500 text-white' :
                    wizardStep === step ? 'bg-tempo-600 text-white' : 'bg-gray-200 text-t3'
                  }`}>
                    {wizardCompleted || wizardStep > step ? <Check size={14} /> : step}
                  </div>
                  <span className={`text-xs truncate ${wizardStep === step ? 'text-t1 font-medium' : 'text-t3'}`}>{label}</span>
                  {step < 5 && <div className={`h-px flex-1 ${wizardStep > step ? 'bg-green-400' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
          </Card>

          {/* Step 1: Select Country */}
          {wizardStep === 1 && !wizardCompleted && (
            <Card>
              <CardHeader><CardTitle>Select Country to Onboard</CardTitle></CardHeader>
              <p className="text-sm text-t3 mb-6">Choose a country to configure statutory taxes, pension, social security, and currency.</p>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(COUNTRY_PRESETS).map(([country, preset]) => (
                  <div key={country} className="border border-border rounded-xl p-5 cursor-pointer hover:border-tempo-400 hover:bg-tempo-50/30 transition-all" onClick={() => selectWizardCountry(country)}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-semibold text-t1">{country}</h3>
                      <Badge>{preset.currency}</Badge>
                    </div>
                    <p className="text-xs text-t3 mb-2">{preset.taxes.length} statutory taxes &middot; {preset.benefits.length} mandatory benefits</p>
                    <div className="flex flex-wrap gap-1">
                      {preset.taxes.map(t => (
                        <span key={t.type} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded">{t.type}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Step 2-3: Review & Confirm Tax Rates */}
          {(wizardStep === 2 || wizardStep === 3) && !wizardCompleted && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{wizardStep === 2 ? 'Statutory Tax Configuration' : 'Confirm Tax Rates'} — {wizardCountry}</CardTitle>
                  <Badge variant="info">{COUNTRY_PRESETS[wizardCountry]?.currency}</Badge>
                </div>
              </CardHeader>
              <p className="text-sm text-t3 mb-4">
                {wizardStep === 2 ? 'Review the pre-populated statutory tax rates below. Click Next to confirm or edit rates.' : 'Adjust rates if needed, then proceed to currency setup.'}
              </p>
              <table className="w-full mb-6">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="text-left px-4 py-2 text-xs font-medium text-t3">Tax / Contribution</th>
                    <th className="text-center px-4 py-2 text-xs font-medium text-t3">Employer Rate (%)</th>
                    <th className="text-center px-4 py-2 text-xs font-medium text-t3">Employee Rate (%)</th>
                    <th className="text-center px-4 py-2 text-xs font-medium text-t3">Total (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {wizardTaxes.map((tax, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 text-sm font-medium text-t1">{tax.type}</td>
                      <td className="px-4 py-3 text-center">
                        {wizardStep === 3 ? (
                          <input type="number" className="w-20 text-center text-sm border border-border rounded px-2 py-1" value={tax.employerRate}
                            onChange={e => setWizardTaxes(prev => prev.map((t, j) => j === i ? { ...t, employerRate: Number(e.target.value) } : t))} />
                        ) : (
                          <span className="text-sm">{tax.employerRate}%</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {wizardStep === 3 ? (
                          <input type="number" className="w-20 text-center text-sm border border-border rounded px-2 py-1" value={tax.employeeRate}
                            onChange={e => setWizardTaxes(prev => prev.map((t, j) => j === i ? { ...t, employeeRate: Number(e.target.value) } : t))} />
                        ) : (
                          <span className="text-sm">{tax.employeeRate}%</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-tempo-600">{(tax.employerRate + tax.employeeRate).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h4 className="text-sm font-semibold text-t1 mb-2">Mandatory Benefits</h4>
              <div className="flex flex-wrap gap-2 mb-6">
                {COUNTRY_PRESETS[wizardCountry]?.benefits.map(b => (
                  <Badge key={b} variant="success">{b}</Badge>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => { setWizardStep(1); setWizardCountry(''); setWizardTaxes([]) }}>Back</Button>
                <Button onClick={() => setWizardStep(wizardStep === 2 ? 3 : 4)}>{wizardStep === 2 ? 'Next: Confirm Rates' : 'Next: Currency Setup'}</Button>
              </div>
            </Card>
          )}

          {/* Step 4: Currency Account */}
          {wizardStep === 4 && !wizardCompleted && (
            <Card>
              <CardHeader><CardTitle>Currency Account — {wizardCountry}</CardTitle></CardHeader>
              <p className="text-sm text-t3 mb-4">Set up a payroll currency account for {COUNTRY_PRESETS[wizardCountry]?.currency} transactions.</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Input label="Currency Code" value={wizardCurrency.code} onChange={e => setWizardCurrency(prev => ({ ...prev, code: e.target.value }))} />
                <Input label="Account Name" value={wizardCurrency.accountName || `${wizardCountry} Payroll Account`}
                  onChange={e => setWizardCurrency(prev => ({ ...prev, accountName: e.target.value }))} />
                <Input label="Bank Name" value={wizardCurrency.bankName} onChange={e => setWizardCurrency(prev => ({ ...prev, bankName: e.target.value }))} placeholder={`${wizardCountry} National Bank`} />
              </div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setWizardStep(3)}>Back</Button>
                <Button onClick={() => { completeCountryWizard(); setWizardStep(5) }}>Activate Country</Button>
              </div>
            </Card>
          )}

          {/* Step 5: Complete */}
          {(wizardStep === 5 || wizardCompleted) && (
            <Card>
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-t1 mb-2">{wizardCountry} Successfully Configured</h3>
                <p className="text-sm text-t3 mb-6">All statutory taxes, benefits, and currency account have been set up.</p>
                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
                  <div className="bg-canvas rounded-lg p-3">
                    <div className="text-lg font-bold text-tempo-600">{wizardTaxes.length}</div>
                    <div className="text-xs text-t3">Tax Configs</div>
                  </div>
                  <div className="bg-canvas rounded-lg p-3">
                    <div className="text-lg font-bold text-tempo-600">{COUNTRY_PRESETS[wizardCountry]?.benefits.length || 0}</div>
                    <div className="text-xs text-t3">Benefits</div>
                  </div>
                  <div className="bg-canvas rounded-lg p-3">
                    <div className="text-lg font-bold text-tempo-600">1</div>
                    <div className="text-xs text-t3">Currency Acct</div>
                  </div>
                </div>
                <Button onClick={() => { setWizardStep(1); setWizardCountry(''); setWizardTaxes([]); setWizardCompleted(false) }}>
                  Add Another Country
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Knowledge Base Tab */}
      {activeTab === 'knowledge-base' && (() => {
        const KB_CATEGORIES = [
          { value: 'general', label: 'General' },
          { value: 'policy', label: 'Policy' },
          { value: 'procedure', label: 'Procedure' },
          { value: 'handbook', label: 'Handbook' },
          { value: 'faq', label: 'FAQ' },
          { value: 'benefit', label: 'Benefits' },
          { value: 'leave', label: 'Leave' },
          { value: 'payroll', label: 'Payroll' },
          { value: 'compliance', label: 'Compliance' },
          { value: 'it', label: 'IT' },
          { value: 'security', label: 'Security' },
          { value: 'onboarding', label: 'Onboarding' },
          { value: 'custom', label: 'Custom' },
        ]

        const POLICY_TEMPLATES = [
          {
            title: 'Annual Leave Policy',
            category: 'leave',
            tags: 'leave, annual, vacation, pto, time off, holiday',
            content: `Annual Leave Policy\n\n1. Entitlement\nAll full-time employees are entitled to [20] working days of paid annual leave per calendar year.\n\n2. Accrual\nLeave accrues at [1.67] days per month from the date of joining.\n\n3. Carry Forward\nA maximum of [5] unused leave days may be carried forward to the following year. Carried-forward leave must be used by [March 31].\n\n4. Application Process\nLeave requests must be submitted through Tempo at least [5] working days in advance.\nManager approval is required for all leave requests.\n\n5. Public Holidays\nPublic holidays are separate from annual leave and follow the national calendar.\n\n6. Probation Period\nDuring the probation period, employees accrue leave but may only take it with prior manager approval.`
          },
          {
            title: 'Work From Home Policy',
            category: 'policy',
            tags: 'wfh, remote, work from home, flexible, hybrid',
            content: `Work From Home Policy\n\n1. Eligibility\nEmployees who have completed their probation period may request to work from home up to [2] days per week.\n\n2. Core Hours\nAll remote workers must be available between [9:00 AM and 3:00 PM] local time.\n\n3. Equipment\nThe company will provide a laptop for remote work. Employees are responsible for ensuring adequate internet connectivity.\n\n4. Approval\nWFH arrangements must be approved by the employee's direct manager.\n\n5. Communication\nEmployees must be reachable via Tempo Chat and email during core hours.\n\n6. Revocation\nWFH privileges may be revoked if performance issues arise.`
          },
          {
            title: 'Expense Reimbursement Policy',
            category: 'procedure',
            tags: 'expense, reimbursement, claim, receipt, travel, meals',
            content: `Expense Reimbursement Policy\n\n1. Eligible Expenses\n- Business travel (flights, hotels, transport)\n- Client entertainment (pre-approved)\n- Office supplies (pre-approved)\n- Professional development (pre-approved)\n\n2. Limits\n- Domestic flights: Economy class only\n- Hotels: Up to [GHS 500] per night\n- Meals: Up to [GHS 100] per day\n- Client entertainment: Up to [GHS 300] per event (requires VP approval)\n\n3. Receipts\nOriginal receipts are required for all claims over [GHS 50].\nReceipts must be uploaded via Tempo Expense within [30] days.\n\n4. Approval Process\nExpenses under [GHS 500]: Manager approval\nExpenses [GHS 500-2,000]: Director approval\nExpenses over [GHS 2,000]: VP/CFO approval\n\n5. Reimbursement Timeline\nApproved expenses are reimbursed within [14] business days via payroll.`
          },
          {
            title: 'Code of Conduct',
            category: 'policy',
            tags: 'conduct, ethics, behavior, integrity, values, misconduct',
            content: `Code of Conduct\n\n1. Purpose\nThis code establishes the standards of behavior expected of all employees.\n\n2. Core Values\n- Integrity: Act honestly and ethically in all business dealings\n- Respect: Treat all colleagues, clients, and partners with dignity\n- Excellence: Strive for the highest standards of work quality\n- Accountability: Take responsibility for your actions\n\n3. Prohibited Conduct\n- Harassment or discrimination of any kind\n- Fraud, theft, or misuse of company assets\n- Conflicts of interest without disclosure\n- Breach of confidentiality\n- Substance abuse in the workplace\n\n4. Reporting\nViolations should be reported to HR or through the whistleblower channel.\nAll reports are treated confidentially.\n\n5. Consequences\nViolations may result in disciplinary action up to and including termination.`
          },
          {
            title: 'Disciplinary Procedure',
            category: 'procedure',
            tags: 'disciplinary, misconduct, warning, suspension, termination, appeal',
            content: `Disciplinary Procedure\n\n1. Stages\nStage 1: Verbal Warning (documented)\nStage 2: Written Warning (valid for 6 months)\nStage 3: Final Written Warning (valid for 12 months)\nStage 4: Dismissal\n\n2. Gross Misconduct\nThe following may result in immediate dismissal without prior warnings:\n- Theft or fraud\n- Violence or threats\n- Serious breach of safety rules\n- Being under the influence of drugs/alcohol at work\n\n3. Investigation\nAll allegations will be investigated fairly before any action is taken.\n\n4. Right to Representation\nEmployees may be accompanied by a colleague or union representative at disciplinary hearings.\n\n5. Appeal\nEmployees may appeal any disciplinary decision within [5] working days by writing to the HR Director.`
          },
          {
            title: 'Maternity & Paternity Leave',
            category: 'leave',
            tags: 'maternity, paternity, parental, pregnancy, childbirth, adoption, baby',
            content: `Maternity & Paternity Leave Policy\n\n1. Maternity Leave\n- Duration: [12] weeks (as per Ghana Labour Act)\n- Pay: Full pay for the first [12] weeks\n- Notice: Notify HR at least [8] weeks before expected delivery\n- Return: Guaranteed return to same or equivalent position\n\n2. Paternity Leave\n- Duration: [5] working days\n- Pay: Full pay\n- Notice: Notify HR at least [2] weeks in advance\n\n3. Adoption Leave\n- Same entitlements as maternity/paternity leave\n- Commences from the date of formal adoption\n\n4. Antenatal Appointments\nReasonable time off for antenatal appointments is granted with manager approval.\n\n5. Return to Work\nFlexible return arrangements (part-time, WFH) may be discussed with your manager.`
          },
          {
            title: 'IT Acceptable Use Policy',
            category: 'it',
            tags: 'it, computer, internet, email, password, security, device, software',
            content: `IT Acceptable Use Policy\n\n1. Company Equipment\nCompany-provided equipment (laptops, phones) is for business use.\nLimited personal use is permitted outside working hours.\n\n2. Passwords\n- Minimum 12 characters with mixed case, numbers, and symbols\n- Never share passwords or write them down\n- Change passwords every 90 days\n- Use the company password manager\n\n3. Email\n- Do not open suspicious attachments or links\n- Do not send confidential information to personal email accounts\n- Company email is monitored for security purposes\n\n4. Internet\n- Streaming, gambling, and adult content sites are blocked\n- Social media use should be limited during working hours\n\n5. Software\n- Only approved software may be installed on company devices\n- Report any unauthorized software to IT immediately\n\n6. Data Protection\n- Client and company data must not be stored on personal devices\n- Use company-approved cloud storage only\n- Report data breaches to IT immediately`
          },
          {
            title: 'Anti-Harassment Policy',
            category: 'compliance',
            tags: 'harassment, bullying, discrimination, sexual harassment, reporting, complaint',
            content: `Anti-Harassment & Anti-Discrimination Policy\n\n1. Zero Tolerance\nThe company has a zero-tolerance policy towards harassment and discrimination of any form.\n\n2. Scope\nThis policy applies to all employees, contractors, and visitors in any work-related context.\n\n3. Definition\nHarassment includes but is not limited to:\n- Unwanted physical contact\n- Verbal abuse or intimidation\n- Sexual comments or advances\n- Discrimination based on gender, race, religion, disability, age, or sexual orientation\n- Cyber-bullying or online harassment\n\n4. Reporting\n- Report to your line manager, HR, or the confidential whistleblower channel\n- All reports will be investigated promptly and confidentially\n- Retaliation against reporters is strictly prohibited\n\n5. Consequences\nSubstantiated complaints may result in disciplinary action up to and including immediate dismissal.\n\n6. Support\nCounseling services are available through the Employee Assistance Program (EAP).`
          },
        ]

        const filteredArticles = knowledgeBaseArticles.filter((a: any) => {
          const matchesSearch = !kbSearch || a.title?.toLowerCase().includes(kbSearch.toLowerCase()) || a.tags?.toLowerCase().includes(kbSearch.toLowerCase()) || a.content?.toLowerCase().includes(kbSearch.toLowerCase())
          const matchesCategory = kbCategoryFilter === 'all' || a.category === kbCategoryFilter
          return matchesSearch && matchesCategory
        })

        const categories = [...new Set(knowledgeBaseArticles.map((a: any) => a.category).filter(Boolean))]

        const openArticleModal = (article?: any) => {
          if (article) {
            setEditingArticle(article)
            setKbForm({ title: article.title || '', category: article.category || 'general', content: article.content || '', tags: article.tags || '', source: article.source || 'manual', fileName: article.file_name || article.fileName || '' })
          } else {
            setEditingArticle(null)
            setKbForm({ title: '', category: 'general', content: '', tags: '', source: 'manual', fileName: '' })
          }
          setShowKBModal(true)
        }

        const saveArticle = () => {
          if (!kbForm.title.trim() || !kbForm.content.trim()) {
            addToast('Title and content are required', 'error')
            return
          }
          if (editingArticle) {
            updateKnowledgeBaseArticle(editingArticle.id, kbForm)
            addToast('Article updated')
          } else {
            addKnowledgeBaseArticle(kbForm)
          }
          setShowKBModal(false)
          setEditingArticle(null)
        }

        const useTemplate = (template: typeof POLICY_TEMPLATES[0]) => {
          setKbForm({ title: template.title, category: template.category, content: template.content, tags: template.tags, source: 'template', fileName: '' })
          setShowTemplates(false)
          setShowKBModal(true)
          setEditingArticle(null)
        }

        const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0]
          if (!file) return
          if (!file.name.endsWith('.txt')) {
            addToast('Only .txt files are supported', 'error')
            return
          }
          const reader = new FileReader()
          reader.onload = (ev) => {
            const text = ev.target?.result as string
            setKbForm(prev => ({ ...prev, content: text, fileName: file.name, source: 'upload' }))
            addToast('File content loaded')
          }
          reader.readAsText(file)
        }

        return (
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <div className="text-center">
                  <p className="text-2xl font-bold text-t1">{knowledgeBaseArticles.length}</p>
                  <p className="text-xs text-t3">Total Articles</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-2xl font-bold text-t1">{categories.length}</p>
                  <p className="text-xs text-t3">Categories</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-2xl font-bold text-t1">{knowledgeBaseArticles.filter((a: any) => a.is_published !== false && a.isPublished !== false).length}</p>
                  <p className="text-xs text-t3">Published</p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-2xl font-bold text-t1">{knowledgeBaseArticles.reduce((s: number, a: any) => s + (a.view_count || a.viewCount || 0), 0)}</p>
                  <p className="text-xs text-t3">Total Views</p>
                </div>
              </Card>
            </div>

            {/* Actions Bar */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-t1">Company Knowledge Base</h3>
                    <p className="text-xs text-t3">Policies, procedures, and FAQs searchable by Tempo AI</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)}>
                    <FileText size={14} className="mr-1.5" />
                    Templates
                  </Button>
                  <Button size="sm" onClick={() => openArticleModal()}>
                    <Plus size={14} className="mr-1.5" />
                    Add Article
                  </Button>
                </div>
              </div>

              {/* Search & Filter */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
                  <input
                    className="w-full pl-9 pr-3 py-2 text-sm bg-canvas border border-border rounded-lg outline-none focus:border-blue-500 text-t1 placeholder:text-t3"
                    placeholder="Search articles..."
                    value={kbSearch}
                    onChange={(e) => setKbSearch(e.target.value)}
                  />
                </div>
                <select
                  className="px-3 py-2 text-sm bg-canvas border border-border rounded-lg outline-none text-t1"
                  value={kbCategoryFilter}
                  onChange={(e) => setKbCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {KB_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Article List */}
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen size={40} className="mx-auto text-t3 mb-3" />
                  <p className="text-sm text-t2 mb-1">No articles yet</p>
                  <p className="text-xs text-t3 mb-4">Add company policies and procedures so Tempo AI can answer employee questions.</p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)}>
                      <FileText size={14} className="mr-1.5" />
                      Start from Template
                    </Button>
                    <Button size="sm" onClick={() => openArticleModal()}>
                      <Plus size={14} className="mr-1.5" />
                      Create Article
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredArticles.map((article: any) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between bg-canvas rounded-lg px-4 py-3 hover:bg-hover transition-colors cursor-pointer"
                      onClick={() => openArticleModal(article)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-t1 truncate">{article.title}</span>
                          {(article.is_published === false || article.isPublished === false) && (
                            <Badge variant="warning">Draft</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-t3">
                          <span className="flex items-center gap-1">
                            <Tag size={10} />
                            {article.category}
                          </span>
                          {article.tags && <span className="truncate max-w-[200px]">{article.tags}</span>}
                          <span>{article.view_count || article.viewCount || 0} views</span>
                          <span>{new Date(article.updated_at || article.updatedAt || article.created_at || article.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); openArticleModal(article) }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 text-t3 hover:text-blue-600 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteKnowledgeBaseArticle(article.id) }}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-t3 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Add/Edit Article Modal */}
            <Modal open={showKBModal} onClose={() => { setShowKBModal(false); setEditingArticle(null) }} title={editingArticle ? 'Edit Article' : 'Add Article'} size="lg">
              <div className="space-y-4">
                <Input label="Title *" placeholder="e.g. Annual Leave Policy" value={kbForm.title} onChange={(e) => setKbForm({ ...kbForm, title: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-t2 mb-1">Category *</label>
                    <select
                      className="w-full px-3 py-2 text-sm bg-canvas border border-border rounded-lg outline-none text-t1"
                      value={kbForm.category}
                      onChange={(e) => setKbForm({ ...kbForm, category: e.target.value })}
                    >
                      {KB_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <Input label="Tags (comma-separated)" placeholder="e.g. leave, vacation, pto" value={kbForm.tags} onChange={(e) => setKbForm({ ...kbForm, tags: e.target.value })} />
                </div>

                {/* Upload Document */}
                <div>
                  <label className="block text-xs font-medium text-t2 mb-1">Upload Document</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-blue-400 cursor-pointer transition-colors">
                      <FileUp size={14} className="text-t3" />
                      <span className="text-xs text-t2">Upload .txt file</span>
                      <input type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
                    </label>
                    {kbForm.fileName && <span className="text-xs text-t3">{kbForm.fileName}</span>}
                  </div>
                  <p className="text-[10px] text-t3 mt-1">Upload a text file with your policy content. PDF/DOCX support coming soon.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-t2 mb-1">Content *</label>
                  <textarea
                    className="w-full px-3 py-2 text-sm bg-canvas border border-border rounded-lg outline-none focus:border-blue-500 text-t1 placeholder:text-t3 min-h-[250px]"
                    rows={12}
                    placeholder="Enter your policy or procedure content here..."
                    value={kbForm.content}
                    onChange={(e) => setKbForm({ ...kbForm, content: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secondary" onClick={() => { setShowKBModal(false); setEditingArticle(null) }}>Cancel</Button>
                  <Button onClick={saveArticle}>
                    <Save size={14} className="mr-1.5" />
                    {editingArticle ? 'Update Article' : 'Save Article'}
                  </Button>
                </div>
              </div>
            </Modal>

            {/* Templates Modal */}
            <Modal open={showTemplates} onClose={() => setShowTemplates(false)} title="Policy Templates" size="lg">
              <p className="text-xs text-t3 mb-4">Start with a pre-built template and customize the bracketed values for your company.</p>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {POLICY_TEMPLATES.map((template, i) => (
                  <div key={i} className="flex items-center justify-between bg-canvas rounded-lg px-4 py-3 hover:bg-hover transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-t1">{template.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="default">{template.category}</Badge>
                        <span className="text-xs text-t3 truncate">{template.tags}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => useTemplate(template)}>
                      Use Template
                    </Button>
                  </div>
                ))}
              </div>
            </Modal>
          </div>
        )
      })()}

      {/* Edit Org Modal */}
      <Modal open={showOrgModal} onClose={() => setShowOrgModal(false)} title="Edit Organization">
        <div className="space-y-4">
          <Input label="Company Name" value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} />
          <Input label="Industry" value={orgForm.industry || ''} onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Size" value={orgForm.size || ''} onChange={(e) => setOrgForm({ ...orgForm, size: e.target.value })} />
            <Input label="Country" value={orgForm.country || ''} onChange={(e) => setOrgForm({ ...orgForm, country: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowOrgModal(false)}>Cancel</Button>
            <Button onClick={submitOrg} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Department Modal */}
      <Modal open={showDeptModal} onClose={() => setShowDeptModal(false)} title="Add Department">
        <div className="space-y-4">
          <Input label="Department Name" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} />
          <Select label="Department Head" value={deptForm.head_id} onChange={(e) => setDeptForm({ ...deptForm, head_id: e.target.value })} options={[{ value: '', label: 'Select head...' }, ...employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))]} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowDeptModal(false)}>Cancel</Button>
            <Button onClick={submitDept} disabled={saving}>{saving ? 'Adding...' : 'Add Department'}</Button>
          </div>
        </div>
      </Modal>

      {/* Connect Integration Modal */}
      <Modal
        open={showConnectModal}
        onClose={() => { setShowConnectModal(false); setSelectedProvider(null); setConnectForm({}); setTestResult(null) }}
        title={`${ti('connect')}: ${INTEGRATION_CATALOG.find(c => c.id === selectedProvider)?.name || ''}`}
      >
        {selectedProvider && (
          <div className="space-y-4">
            <p className="text-xs text-t3 mb-2">
              {INTEGRATION_CATALOG.find(c => c.id === selectedProvider)?.description}
            </p>

            {getConfigSchema(selectedProvider).map(field => (
              <div key={field.key}>
                {field.type === 'select' ? (
                  <Select
                    label={`${field.label}${field.required ? ' *' : ''}`}
                    value={connectForm[field.key] || ''}
                    onChange={(e) => setConnectForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    options={[
                      { value: '', label: `${ti('select')}...` },
                      ...(field.options || []),
                    ]}
                  />
                ) : (
                  <Input
                    label={`${field.label}${field.required ? ' *' : ''}`}
                    type={field.type === 'password' ? 'password' : 'text'}
                    value={connectForm[field.key] || ''}
                    onChange={(e) => setConnectForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}

            {testResult !== null && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${testResult ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {testResult ? <CheckCircle size={14} /> : <XCircle size={14} />}
                {testResult ? ti('testSuccess') : ti('testFailed')}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={testing}
              >
                {testing ? <Loader2 size={12} className="animate-spin mr-1.5" /> : <AlertCircle size={12} className="mr-1.5" />}
                {ti('testConnection')}
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => { setShowConnectModal(false); setSelectedProvider(null); setConnectForm({}); setTestResult(null) }}>
                  {tc('cancel')}
                </Button>
                <Button onClick={handleConnect} disabled={connecting}>
                  {connecting ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Plug size={14} className="mr-1.5" />}
                  {ti('connect')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Sync Logs Modal */}
      <Modal
        open={showLogsModal}
        onClose={() => { setShowLogsModal(false); setIntegrationLogs([]) }}
        title={ti('syncHistory')}
      >
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {integrationLogs.length === 0 ? (
            <p className="text-sm text-t3 text-center py-8">{ti('noLogs')}</p>
          ) : (
            integrationLogs.map(log => (
              <div key={log.id} className="flex items-start gap-3 bg-canvas rounded-lg px-3 py-2">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-t1 capitalize">{log.action}</span>
                    <Badge variant={log.status === 'success' ? 'success' : 'error'}>{log.status}</Badge>
                    {log.duration && <span className="text-[0.6rem] text-t3">{log.duration}ms</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[0.6rem] text-t3">
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                    {(log.recordsProcessed || 0) > 0 && (
                      <span>{ti('recordsProcessed')}: {log.recordsProcessed}</span>
                    )}
                    {(log.recordsFailed || 0) > 0 && (
                      <span className="text-red-600">{ti('recordsFailed')}: {log.recordsFailed}</span>
                    )}
                  </div>
                  {log.errorMessage && (
                    <p className="text-[0.6rem] text-red-600 mt-1 truncate">{log.errorMessage}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Bank Account Modal */}
      <Modal open={showBankAccountModal} onClose={() => setShowBankAccountModal(false)} title={editingBankAccount ? 'Edit Bank Account' : 'Add Bank Account'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Account Name *" placeholder="e.g. Operating Account" value={bankAccountForm.account_name}
              onChange={(e) => setBankAccountForm({ ...bankAccountForm, account_name: e.target.value })} />
            <Input label="Bank Name *" placeholder="e.g. Chase Bank" value={bankAccountForm.bank_name}
              onChange={(e) => setBankAccountForm({ ...bankAccountForm, bank_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Routing Number" placeholder="e.g. 021000021" value={bankAccountForm.routing_number}
              onChange={(e) => setBankAccountForm({ ...bankAccountForm, routing_number: e.target.value })} />
            <Input label="Account Number" placeholder="e.g. 987654321" value={bankAccountForm.bank_account_number}
              onChange={(e) => setBankAccountForm({ ...bankAccountForm, bank_account_number: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="IBAN" placeholder="e.g. GB82WEST12345698765432" value={bankAccountForm.iban}
              onChange={(e) => setBankAccountForm({ ...bankAccountForm, iban: e.target.value })} />
            <Input label="SWIFT Code" placeholder="e.g. CHASUS33" value={bankAccountForm.swift_code}
              onChange={(e) => setBankAccountForm({ ...bankAccountForm, swift_code: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Currency" value={bankAccountForm.currency}
              onChange={(e) => setBankAccountForm({ ...bankAccountForm, currency: e.target.value })}
              options={[
                { value: 'USD', label: 'USD - US Dollar' }, { value: 'EUR', label: 'EUR - Euro' },
                { value: 'GBP', label: 'GBP - British Pound' }, { value: 'NGN', label: 'NGN - Nigerian Naira' },
                { value: 'GHS', label: 'GHS - Ghanaian Cedi' }, { value: 'KES', label: 'KES - Kenyan Shilling' },
              ]}
            />
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="bank_is_default" checked={bankAccountForm.is_default}
                onChange={(e) => setBankAccountForm({ ...bankAccountForm, is_default: e.target.checked })}
                className="rounded border-divider" />
              <label htmlFor="bank_is_default" className="text-xs font-medium text-t1">Set as default account</label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowBankAccountModal(false)}>Cancel</Button>
            <Button onClick={submitBankAccount} disabled={saving}><Save size={14} /> {saving ? 'Saving...' : editingBankAccount ? 'Update Account' : 'Add Account'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete / Disconnect Confirmation Modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={deleteConfirm?.type === 'integration' ? 'Disconnect Integration' : 'Delete Bank Account'} size="sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-error" />
          </div>
          <div>
            <p className="text-sm font-medium text-t1 mb-1">
              {deleteConfirm?.type === 'integration'
                ? `Disconnect ${deleteConfirm?.label}?`
                : `Delete ${deleteConfirm?.label}?`}
            </p>
            <p className="text-xs text-t2">
              {deleteConfirm?.type === 'integration'
                ? 'This will remove the integration connection and stop all syncing. You can reconnect later.'
                : 'This action cannot be undone. The bank account will be permanently removed.'}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>{tc('cancel')}</Button>
          <Button variant="danger" onClick={confirmDeleteAction}>
            {deleteConfirm?.type === 'integration' ? 'Disconnect' : tc('delete')}
          </Button>
        </div>
      </Modal>
    </>
  )
}
