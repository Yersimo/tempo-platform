import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-01-28.clover' })
  : null

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })
    }

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature || !WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET)
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle subscription events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const orgId = session.metadata?.orgId
        const plan = session.metadata?.plan

        if (orgId && plan) {
          await db.update(schema.organizations)
            .set({
              plan: plan as 'free' | 'starter' | 'professional' | 'enterprise',
              stripeCustomerId: session.customer as string,
              updatedAt: new Date(),
            })
            .where(eq(schema.organizations.id, orgId))

          console.log(`[Stripe Webhook] Org ${orgId} upgraded to ${plan}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const orgId = subscription.metadata?.orgId
        const plan = subscription.metadata?.plan

        if (orgId && plan) {
          await db.update(schema.organizations)
            .set({
              plan: plan as 'free' | 'starter' | 'professional' | 'enterprise',
              updatedAt: new Date(),
            })
            .where(eq(schema.organizations.id, orgId))
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const orgId = subscription.metadata?.orgId

        if (orgId) {
          // Downgrade to free plan
          await db.update(schema.organizations)
            .set({
              plan: 'free',
              updatedAt: new Date(),
            })
            .where(eq(schema.organizations.id, orgId))

          console.log(`[Stripe Webhook] Org ${orgId} downgraded to free (subscription cancelled)`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Find org by Stripe customer ID
        const [org] = await db.select()
          .from(schema.organizations)
          .where(eq(schema.organizations.stripeCustomerId, customerId))

        if (org) {
          console.warn(`[Stripe Webhook] Payment failed for org ${org.id} (${org.name})`)
          // In production: send payment failed notification email
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
