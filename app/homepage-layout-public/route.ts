import { NextResponse } from 'next/server'
import { getHomepageLayout } from '@/lib/homepageLayoutStore'
import { API_BASE_URL } from '@/lib/apiConfig'

const CONFIG_BANNER_TITLE = '[HOMEPAGE_LAYOUT_CONFIG]'
const CONFIG_BANNER_BADGE = '[SYSTEM_LAYOUT]'

export async function GET() {
  try {
    // 1. Check if database has saved layout config
    try {
      const publicRes = await fetch(`${API_BASE_URL}/api/public/banners`, {
        cache: 'no-store',
      })
      if (publicRes.ok) {
        const json = await publicRes.json()
        const banners = json?.data || []
        const configBanner = banners.find(
          (b: any) =>
            b.title === CONFIG_BANNER_TITLE ||
            (b.badgeText && b.badgeText.includes(CONFIG_BANNER_BADGE))
        )
        if (configBanner?.subtitle) {
          try {
            const parsed = JSON.parse(configBanner.subtitle)
            if (Array.isArray(parsed) && parsed.length > 0) {
              const enabled = parsed.filter((s: any) => s.enabled)
              return NextResponse.json({
                success: true,
                message: 'Active homepage layout retrieved from database',
                data: enabled,
              })
            }
          } catch {}
        }
      }
    } catch {}

    // 2. Fall back to local store
    const sections = getHomepageLayout()
    const enabledSections = sections.filter((s) => s.enabled)
    return NextResponse.json({
      success: true,
      message: 'Active homepage layout retrieved successfully',
      data: enabledSections,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to fetch homepage layout' },
      { status: 500 }
    )
  }
}
