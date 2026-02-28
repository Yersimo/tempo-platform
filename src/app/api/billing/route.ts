import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-01-28.clover' })
  : null

// Stripe Price IDs (set via env vars)
const PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
  professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional',
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
}

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })
    }

    const body = await request.json()
    const { action } = body
    const orgId = request.headers.get('x-org-id')

    // ─── Create Checkout Session ──────────────────────────────────
    if (action === 'create-checkout') {
      if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const { plan } = body
      if (!plan || !PRICE_IDS[plan]) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
      }

      const [org] = await db.select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, orgId))
      if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

      // Create or get Stripe customer
      let customerId = org.stripeCustomerId
      if (!customerId) {
        const customer = await stripe.customers.create({
          name: org.name,
          metadata: { orgId: org.id },
        })
        customerId = customer.id
        await db.update(schema.organizations)
          .set({ stripeCustomerId: customerId })
          .where(eq(schema.organizations.id, orgId))
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?billing=success&plan=${plan}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?billing=cancelled`,
        metadata: { orgId, plan },
        subscription_data: {
          metadata: { orgId, plan },
        },
      })

      return NextResponse.json({ url: session.url })
    }

    // ─── Create Customer Portal Session ───────────────────────────
    if (action === 'customer-portal') {
      if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const [org] = await db.select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, orgId))
      
      if (!org?.stripeCustomerId) {
        return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: org.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings`,
      })

      return NextResponse.json({ url: session.url })
    }

    // ─── Get Current Subscription ─────────────────────────────────
    if (action === 'subscription') {
      if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      const [org] = await db.select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, orgId))
      
      if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

      if (!org.stripeCustomerId) {
        return NextResponse.json({
          plan: org.plan,
          status: 'active',
          isFree: true,
        })
      }

      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: org.stripeCustomerId,
          limit: 1,
          status: 'active',
        })

        const sub = subscriptions.data[0]
        if (!sub) {
          return NextResponse.json({
            plan: org.plan,
            status: 'no_subscription',
            isFree: org.plan === 'free',
          })
        }

        // Extract period end from first subscription item
        const periodEnd = sub.items?.data?.[0]?.current_period_end
        return NextResponse.json({
          plan: org.plan,
          status: sub.status,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          isFree: false,
        })
      } catch {
        return NextResponse.json({ plan: org.plan, status: 'unknown', isFree: org.plan === 'free' })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[Billing] Error:', error)
    return NextResponse.json({ error: 'Billing operation failed' }, { status: 500 })
  }
}
