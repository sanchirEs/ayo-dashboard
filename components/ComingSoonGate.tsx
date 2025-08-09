'use client'

import React, { PropsWithChildren, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'

type ComingSoonGateProps = PropsWithChildren<{
  allowedPathPrefixes?: string[]
  enabled?: boolean
}>

export default function ComingSoonGate(props: ComingSoonGateProps) {
  const pathname = usePathname() || '/'

  const enableOverlay = props.enabled ?? (process.env.NEXT_PUBLIC_ENABLE_COMING_SOON_OVERLAY !== 'false')

  const allowedPrefixes = useMemo(() => {
    const defaults = [
      // Only allow core product management routes
      '/categories', // if present
      '/tags', // if present
      '/products', // if present
      '/category-list',
      '/new-category',
      '/product-list',
      '/add-product',
      '/add-tags',
      // Auth-related pages should remain usable
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
      // Also tolerate deployments where the app is mounted at /dashboard
      const withDashboard = '/dashboard' + prefix
      return pathname === withDashboard || pathname.startsWith(withDashboard + '/')
    })
  }, [allowedPrefixes, pathname])

  const showOverlay = enableOverlay && !isAllowed

  useEffect(() => {
    const root = document.documentElement
    if (showOverlay) {
      root.classList.add('coming-soon-no-scroll')
      return () => root.classList.remove('coming-soon-no-scroll')
    }
  }, [showOverlay])

  return (
    <>
      <div className={showOverlay ? 'comingSoonContentHidden' : undefined} aria-hidden={showOverlay ? 'true' : undefined}>
        {props.children}
      </div>
      {showOverlay && (
        <div className="comingSoonOverlay" role="dialog" aria-modal="true" aria-label="Feature coming soon">
          <div className="comingSoonCard">
            <div className="comingSoonEmoji" role="img" aria-label="construction">
              🚧
            </div>
            <div className="comingSoonText">Not Yet Available</div>
            <div className="comingSoonSub">Coming Soon</div>
          </div>
        </div>
      )}
    </>
  )
}


