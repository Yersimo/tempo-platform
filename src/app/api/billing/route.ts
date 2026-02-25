import { NextRequest, NextResponse } from 'next/server'
import {
  createCheckoutSession,
  createPortalSession,
  getSubscriptionStatus,
  cancelSubscription,
  reportUsage,
  PRICING_PLANS,
} from '@/lib/billing'

// GET /api/billing - Get subscription status
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = await getSubscriptionStatus(orgId)
    return NextResponse.json({ subscription: status, plans: PRICING_PLANS })
  } catch (error: any) {
    // If Stripe isn't configured, return clear demo mode indicator
    if (error?.message?.includes('STRIPE_SECRET_KEY')) {
      return NextResponse.json({
        subscription: null,
        plans: PRICING_PLANS,
        demo: true,
        message: 'Billing is in demo mode. Configure Stripe keys to enable real billing.',
      })
    }
    console.error('[GET /api/billing] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch billing status' }, { status: 500 })
  }
}

// POST /api/billing - Various billing actions
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    const role = request.headers.get('x-employee-role')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only owner/admin can manage billing
    if (role !== 'owner' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: billing requires owner or admin role' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'checkout': {
        const { planId, successUrl, cancelUrl } = body
        if (!planId) {
          return NextResponse.json({ error: 'planId is required' }, { status: 400 })
        }
        const url = await createCheckoutSession(
          orgId,
          planId,
          successUrl || `${process.env.NEXT_PUBLIC_APP_URL || ''}/settings?tab=billing&success=true`,
          cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || ''}/settings?tab=billing&canceled=true`,
        )
        return NextResponse.json({ url })
      }

      case 'portal': {
        const { returnUrl } = body
        const url = await createPortalSession(
          orgId,
          returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || ''}/settings?tab=billing`,
        )
        return NextResponse.json({ url })
      }

      case 'cancel': {
        await cancelSubscription(orgId)
        return NextResponse.json({ success: true })
      }

      case 'sync-usage': {
        const { employeeCount } = body
        if (typeof employeeCount !== 'number') {
          return NextResponse.json({ error: 'employeeCount is required' }, { status: 400 })
        }
        await reportUsage(orgId, employeeCount)
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    if (error?.message?.includes('STRIPE_SECRET_KEY')) {
      return NextResponse.json({ error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in environment variables.', demo: true }, { status: 503 })
    }
    console.error('[POST /api/billing] Error:', error)
    return NextResponse.json({ error: 'Billing operation failed' }, { status: 500 })
  }
}
