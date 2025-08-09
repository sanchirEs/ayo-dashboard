'use client'

import React, { PropsWithChildren, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'

type ComingSoonBlockProps = PropsWithChildren<{
  enabled?: boolean
  allowedPathPrefixes?: string[]
  title?: string
  subtitle?: string
}>

/**
 * ComingSoonBlock overlays ONLY the wrapped content area (not the sidebar),
 * blurring and blocking interaction underneath while showing a professional notice card.
 */
export default function ComingSoonBlock(props: ComingSoonBlockProps) {
  const pathname = usePathname() || '/'

  const globallyEnabled = props.enabled ?? (process.env.NEXT_PUBLIC_ENABLE_COMING_SOON_OVERLAY !== 'false')

  const allowedPrefixes = useMemo(() => {
    const defaults = [
      // Core sections generally available
      '/category-list',
      '/new-category',
      '/product-list',
      '/add-product',
      '/add-tags',
      '/tags',
      '/oder-list',
      '/oder-detail',
      '/oder-tracking',
      '/coupons',
      '/new-coupon',
      '/discounts',
      '/all-user',
      '/add-new-user',
      '/report',
      '/setting',
      // Auth pages
      '/login',
      '/sign-up',
      '/unauthorized',
    ]
    const extra = props.allowedPathPrefixes ?? []
    return Array.from(new Set([...defaults, ...extra]))
  }, [props.allowedPathPrefixes])

  const isAllowed = useMemo(() => {
    return allowedPrefixes.some((prefix) => {
      if (pathname === prefix) return true
      if (pathname.startsWith(prefix + '/')) return true
      const withDashboard = '/dashboard' + prefix
      return pathname === withDashboard || pathname.startsWith(withDashboard + '/')
    })
  }, [allowedPrefixes, pathname])

  const showOverlay = globallyEnabled && !isAllowed

  useEffect(() => {
    const root = document.documentElement
    if (showOverlay) {
      root.classList.add('coming-soon-no-scroll-partial')
      return () => root.classList.remove('coming-soon-no-scroll-partial')
    }
  }, [showOverlay])

  const title = props.title ?? 'Coming Soon'
  const subtitle = props.subtitle ?? 'This section is under active development. You can continue using the sidebar to navigate to available features.'

  return (
    <div className={`csb_container`}>
      <div className={showOverlay ? 'csb_obscured' : undefined} aria-hidden={showOverlay ? 'true' : undefined}>
        {props.children}
      </div>
      {showOverlay && (
        <div className="csb_overlay" role="dialog" aria-modal="true" aria-label="Feature coming soon">
          <div className="csb_card">
            <div className="csb_label">🚧</div>
            <div className="csb_title">{title}</div>
            <div className="csb_subtitle">{subtitle}</div>
          </div>
        </div>
      )}
    </div>
  )
}


