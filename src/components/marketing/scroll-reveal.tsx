'use client'

import { useEffect } from 'react'

export function ScrollRevealInit() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll(
      '.l-reveal,.l-reveal-left,.l-reveal-right,.l-reveal-scale,.l-stagger-children'
    ).forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return null
}
