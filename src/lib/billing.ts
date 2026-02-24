// Stripe Billing Integration
// Manages subscriptions, usage metering, customer portal, and webhooks

import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PricingPlan {
  id: string
  name: string
  stripePriceId: string
  pricePerEmployee: number // cents
  features: string[]
  maxEmployees: number | null
  tier: 'free' | 'starter' | 'professional' | 'enterprise'
}

export interface SubscriptionStatus {
  plan: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'
  currentPeriodEnd: string
  employeeCount: number
  monthlyAmount: number
  currency: string
  cancelAtPeriodEnd: boolean
  trialEnd: string | null
}

export interface UsageRecord {
  quantity: number
  timestamp: number
  action: 'set' | 'increment'
}

// ---------------------------------------------------------------------------
// Pricing Plans (mirrors marketing page)
// ---------------------------------------------------------------------------

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    stripePriceId: '',
    pricePerEmployee: 0,
    maxEmployees: 10,
    tier: 'free',
    features: ['Up to 10 employees', 'Core HR', 'Basic Analytics'],
  },
  {
    id: 'starter',
    name: 'Starter',
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
    pricePerEmployee: 800, // $8.00
    maxEmployees: 100,
    tier: 'starter',
    features: [
      'Up to 100 employees', 'Core HR & People', 'Performance Management',
      'Time & Attendance', 'Basic Analytics', 'Email Support',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || 'price_professional',
    pricePerEmployee: 1800, // $18.00
    maxEmployees: 5000,
    tier: 'professional',
    features: [
      'Up to 5,000 employees', 'All Starter features', 'Payroll & Benefits',
      'Recruiting & Expense', 'Learning & Engagement', 'Compensation Management',
      'IT & Device Management', 'API Access', 'Priority Support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    pricePerEmployee: 0, // custom pricing
    maxEmployees: null,
    tier: 'enterprise',
    features: [
      'Unlimited employees', 'All Professional features', 'Multi-country Payroll',
      'Advanced Analytics & AI', 'Workflow Studio', 'SSO & SCIM',
      'Custom Integrations', 'Dedicated CSM', 'SLA Guarantee',
    ],
  },
]

// ---------------------------------------------------------------------------
// Stripe Client (lazy initialized)
// ---------------------------------------------------------------------------

let stripeInstance: any = null

async function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  if (!stripeInstance) {
    // Dynamic import to avoid loading Stripe when not needed
    const Stripe = (await import('stripe')).default
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia' as any,
      typescript: true,
    })
  }
  return stripeInstance
}

// ---------------------------------------------------------------------------
// Customer Management
// ---------------------------------------------------------------------------

export async function createOrGetCustomer(orgId: string, orgName: string, email: string): Promise<string> {
  const stripe = await getStripe()

  // Check if org already has a Stripe customer ID stored
  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, orgId))
  if (!org) throw new Error('Organization not found')

  // Check metadata for existing customer ID (stored in org name prefix convention or a separate lookup)
  // For now, search Stripe by metadata
  const existing = await stripe.customers.list({
    limit: 1,
    query: `metadata['orgId']:'${orgId}'`,
  })

  if (existing.data.length > 0) {
    return existing.data[0].id
  }

  // Create new customer
  const customer = await stripe.customers.create({
    name: orgName,
    email,
    metadata: { orgId, plan: org.plan },
  })

  return customer.id
}

// ---------------------------------------------------------------------------
// Subscription Management
// ---------------------------------------------------------------------------

export async function createSubscription(
  orgId: string,
  planId: string,
  email: string
): Promise<{ subscriptionId: string; clientSecret: string | null }> {
  const stripe = await getStripe()
  const plan = PRICING_PLANS.find(p => p.id === planId)
  if (!plan) throw new Error(`Unknown plan: ${planId}`)
  if (plan.tier === 'free') throw new Error('Free plan does not require subscription')

  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, orgId))
  if (!org) throw new Error('Organization not found')

  const customerId = await createOrGetCustomer(orgId, org.name, email)

  // Create subscription with usage-based billing (per employee per month)
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: plan.stripePriceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    trial_period_days: 14,
    metadata: { orgId, planId },
    expand: ['latest_invoice.payment_intent'],
  })

  // Update org plan
  await db.update(schema.organizations)
    .set({ plan: plan.tier, updatedAt: new Date() })
    .where(eq(schema.organizations.id, orgId))

  const invoice = subscription.latest_invoice as any
  const clientSecret = invoice?.payment_intent?.client_secret || null

  return { subscriptionId: subscription.id, clientSecret }
}

export async function cancelSubscription(orgId: string): Promise<void> {
  const stripe = await getStripe()

  const subscriptions = await stripe.subscriptions.list({
    limit: 1,
    query: `metadata['orgId']:'${orgId}'`,
    status: 'active',
  })

  if (subscriptions.data.length > 0) {
    await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    })
  }
}

export async function getSubscriptionStatus(orgId: string): Promise<SubscriptionStatus | null> {
  const stripe = await getStripe()

  const subscriptions = await stripe.subscriptions.list({
    limit: 1,
    query: `metadata['orgId']:'${orgId}'`,
  })

  if (subscriptions.data.length === 0) {
    // Free plan
    const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, orgId))
    return {
      plan: org?.plan || 'free',
      status: 'active',
      currentPeriodEnd: '',
      employeeCount: 0,
      monthlyAmount: 0,
      currency: 'usd',
      cancelAtPeriodEnd: false,
      trialEnd: null,
    }
  }

  const sub = subscriptions.data[0]
  const plan = PRICING_PLANS.find(p => p.id === sub.metadata.planId) || PRICING_PLANS[0]

  return {
    plan: plan.name,
    status: sub.status as SubscriptionStatus['status'],
    currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
    employeeCount: sub.items.data[0]?.quantity || 0,
    monthlyAmount: (sub.items.data[0]?.price?.unit_amount || 0) * (sub.items.data[0]?.quantity || 0),
    currency: sub.currency,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
  }
}

// ---------------------------------------------------------------------------
// Usage Metering (employee count sync)
// ---------------------------------------------------------------------------

export async function reportUsage(orgId: string, employeeCount: number): Promise<void> {
  const stripe = await getStripe()

  const subscriptions = await stripe.subscriptions.list({
    limit: 1,
    query: `metadata['orgId']:'${orgId}'`,
    status: 'active',
  })

  if (subscriptions.data.length === 0) return

  const subscriptionItem = subscriptions.data[0].items.data[0]
  if (!subscriptionItem) return

  // Update quantity to reflect current employee count
  await stripe.subscriptionItems.update(subscriptionItem.id, {
    quantity: employeeCount,
  })
}

// ---------------------------------------------------------------------------
// Customer Portal
// ---------------------------------------------------------------------------

export async function createPortalSession(orgId: string, returnUrl: string): Promise<string> {
  const stripe = await getStripe()

  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, orgId))
  if (!org) throw new Error('Organization not found')

  const customerId = await createOrGetCustomer(orgId, org.name, '')

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session.url
}

// ---------------------------------------------------------------------------
// Checkout Session (for new subscriptions)
// ---------------------------------------------------------------------------

export async function createCheckoutSession(
  orgId: string,
  planId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  const stripe = await getStripe()
  const plan = PRICING_PLANS.find(p => p.id === planId)
  if (!plan || plan.tier === 'free') throw new Error('Invalid plan for checkout')

  const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, orgId))
  if (!org) throw new Error('Organization not found')

  const customerId = await createOrGetCustomer(orgId, org.name, '')

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: 14,
      metadata: { orgId, planId },
    },
    metadata: { orgId, planId },
  })

  return session.url!
}

// ---------------------------------------------------------------------------
// Webhook Handler
// ---------------------------------------------------------------------------

export async function handleWebhookEvent(event: any): Promise<void> {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object
      const orgId = subscription.metadata?.orgId
      if (!orgId) break

      const planId = subscription.metadata?.planId || 'free'
      const plan = PRICING_PLANS.find(p => p.id === planId)
      const tier = plan?.tier || 'free'

      if (subscription.status === 'active' || subscription.status === 'trialing') {
        await db.update(schema.organizations)
          .set({ plan: tier, updatedAt: new Date() })
          .where(eq(schema.organizations.id, orgId))
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      const orgId = subscription.metadata?.orgId
      if (!orgId) break

      // Downgrade to free plan
      await db.update(schema.organizations)
        .set({ plan: 'free', updatedAt: new Date() })
        .where(eq(schema.organizations.id, orgId))
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const orgId = invoice.subscription_details?.metadata?.orgId
      if (!orgId) break
      console.error(`[Billing] Payment failed for org ${orgId}, invoice ${invoice.id}`)
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object
      console.log(`[Billing] Invoice paid: ${invoice.id}`)
      break
    }
  }
}
