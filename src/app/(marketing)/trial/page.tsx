import { redirect } from 'next/navigation'

export default function TrialPage() {
  // Redirect to signup with trial parameter for a streamlined 14-day trial flow
  redirect('/signup?plan=trial')
}
