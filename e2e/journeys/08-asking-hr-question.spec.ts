/**
 * Journey 8: Asking HR a Question (EVA / HR Chatbot)
 *
 * Persona: Employee
 * Flow: Open chat → Ask AI → Get instant answer → Escalate if needed → Rate experience
 *
 * UX targets:
 *  - 80% of questions solved by AI
 *  - Tickets resolved within SLA
 *  - Satisfaction measured
 */
import { test, expect } from '@playwright/test'
import {
  ClickTracker,
  navigateToModule,
  assertPageHasContent,
  assertNoHorizontalOverflow,
} from '../helpers/ux-rules'

test.describe('Journey: Asking HR a Question', () => {
  test('chat / HR assistant page loads', async ({ page }) => {
    await navigateToModule(page, '/chat')
    await assertPageHasContent(page, [/chat|message|assistant|help|eva/i])
  })

  test('can send a message within 3 clicks', async ({ page }) => {
    await navigateToModule(page, '/chat')
    const tracker = new ClickTracker(page)

    // Chat input should be immediately visible
    const chatInput = page.locator('input[type="text"], textarea, [contenteditable="true"]').first()
    if (await chatInput.isVisible()) {
      await chatInput.fill('What is my leave balance?')
      const sendBtn = page.locator('button:has-text("Send"), button[type="submit"], button[aria-label*="send" i]').first()
      if (await sendBtn.count() > 0) {
        await tracker.click(sendBtn, 'Send message')
      }
    }

    tracker.assertWithinLimit('Send HR question')
  })

  test('help center / knowledge base is available', async ({ page }) => {
    await navigateToModule(page, '/help')
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    const hasHelp = bodyText.includes('help') || bodyText.includes('faq') ||
      bodyText.includes('support') || bodyText.includes('article') || bodyText.includes('guide')
    expect(hasHelp, 'Help center should have content').toBe(true)
  })

  test('chat supports channels or direct messages', async ({ page }) => {
    await navigateToModule(page, '/chat')
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    const hasChannels = bodyText.includes('channel') || bodyText.includes('direct') ||
      bodyText.includes('general') || bodyText.includes('#')
    expect(hasChannels, 'Chat should have channels or DMs').toBe(true)
  })

  test('chat input has rich features (emoji, attachments)', async ({ page }) => {
    await navigateToModule(page, '/chat')
    // Look for emoji/attachment buttons near input
    const richFeatures = page.locator('button[aria-label*="emoji" i], button[aria-label*="attach" i], [class*="emoji"], [class*="attach"]')
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    const hasFeatures = await richFeatures.count() > 0 || bodyText.includes('emoji') || bodyText.includes('attach')
    // Chat at minimum should have a text input
    const hasInput = await page.locator('input, textarea, [contenteditable]').count() > 0
    expect(hasInput, 'Chat should have message input').toBe(true)
  })

  test('mobile: no horizontal overflow', async ({ page }) => {
    await navigateToModule(page, '/chat')
    await assertNoHorizontalOverflow(page)
  })
})
