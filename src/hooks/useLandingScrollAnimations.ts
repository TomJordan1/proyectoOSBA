import { useLayoutEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

type LandingScope = RefObject<HTMLElement>

type MatchConditions = {
  isDesktop: boolean
  reduceMotion: boolean
}

function directionFor(element: HTMLElement) {
  return Number(element.dataset.direction ?? 1) || 1
}

export function useLandingScrollAnimations(scopeRef: LandingScope, enabled: boolean) {
  useLayoutEffect(() => {
    const scope = scopeRef.current
    if (!scope || !enabled) return

    const media = gsap.matchMedia()
    const context = gsap.context(() => {
      media.add(
        {
          isDesktop: '(min-width: 768px)',
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        (matchContext) => {
          const { isDesktop, reduceMotion } = matchContext.conditions as MatchConditions
          const reveals = gsap.utils.toArray<HTMLElement>('[data-scroll-reveal]', scope)
          const items = gsap.utils.toArray<HTMLElement>('[data-scroll-item]', scope)
          const pricingCards = gsap.utils.toArray<HTMLElement>('[data-gsap-pricing-card]', scope)
          const faqItems = gsap.utils.toArray<HTMLElement>('[data-gsap-faq-item]', scope)
          const layers = gsap.utils.toArray<HTMLElement>('[data-scroll-layer]', scope)
          const allTargets = [...reveals, ...items, ...pricingCards, ...faqItems]

          if (reduceMotion) {
            gsap.set(allTargets, { clearProps: 'transform,opacity,visibility,filter' })
            gsap.set(layers, { clearProps: 'transform' })
            return
          }

          reveals.forEach((element) => {
            const axis = element.dataset.axis ?? 'y'
            const direction = directionFor(element)
            const distance = isDesktop ? 72 : 38
            const from = axis === 'x'
              ? { x: distance * direction, y: 0 }
              : { x: 0, y: distance * direction }

            gsap.fromTo(
              element,
              { ...from, autoAlpha: 0, scale: 0.975 },
              {
                x: 0,
                y: 0,
                autoAlpha: 1,
                scale: 1,
                ease: 'none',
                scrollTrigger: {
                  trigger: element,
                  start: 'top 94%',
                  end: 'top 56%',
                  scrub: 0.9,
                  invalidateOnRefresh: true,
                },
              },
            )
          })

          items.forEach((element, index) => {
            gsap.fromTo(
              element,
              { y: isDesktop ? 52 : 30, autoAlpha: 0, scale: 0.94, rotateX: isDesktop ? 7 : 0 },
              {
                y: 0,
                autoAlpha: 1,
                scale: 1,
                rotateX: 0,
                ease: 'none',
                scrollTrigger: {
                  trigger: element,
                  start: `top ${94 - Math.min(index % 4, 3) * 2}%`,
                  end: 'top 62%',
                  scrub: 0.75,
                  invalidateOnRefresh: true,
                },
              },
            )
          })

          pricingCards.forEach((element, index) => {
            const spread = isDesktop ? (index - 1) * 58 : 0
            const rotation = isDesktop ? (index - 1) * 8 : 0
            gsap.fromTo(
              element,
              { x: spread, y: 70 + Math.abs(index - 1) * 12, autoAlpha: 0, scale: 0.9, rotateY: rotation },
              {
                x: 0,
                y: 0,
                autoAlpha: 1,
                scale: 1,
                rotateY: 0,
                ease: 'none',
                scrollTrigger: {
                  trigger: element,
                  start: `top ${96 - index * 3}%`,
                  end: 'top 55%',
                  scrub: 0.7,
                  invalidateOnRefresh: true,
                },
              },
            )
          })

          faqItems.forEach((element, index) => {
            gsap.fromTo(
              element,
              { x: isDesktop ? 70 : 28, y: 18, autoAlpha: 0, scale: 0.97 },
              {
                x: 0,
                y: 0,
                autoAlpha: 1,
                scale: 1,
                ease: 'none',
                scrollTrigger: {
                  trigger: element,
                  start: `top ${94 - Math.min(index, 3) * 2}%`,
                  end: 'top 64%',
                  scrub: 0.75,
                  invalidateOnRefresh: true,
                },
              },
            )
          })

          layers.forEach((element) => {
            const speed = Number(element.dataset.speed ?? 0.12)
            gsap.fromTo(
              element,
              { yPercent: -speed * 40 },
              {
                yPercent: speed * 40,
                ease: 'none',
                scrollTrigger: {
                  trigger: element.closest('[data-scroll-section]') ?? element,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 1.1,
                  invalidateOnRefresh: true,
                },
              },
            )
          })
        },
      )
    }, scope)

    const refresh = window.requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => {
      window.cancelAnimationFrame(refresh)
      media.revert()
      context.revert()
    }
  }, [enabled, scopeRef])
}
