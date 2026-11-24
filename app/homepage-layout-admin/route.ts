import { NextRequest, NextResponse } from 'next/server'
import { getHomepageLayout, saveHomepageLayout } from '@/lib/homepageLayoutStore'
import { API_BASE_URL } from '@/lib/apiConfig'
import type { HomepageSectionConfig } from '@/lib/homepageLayoutTypes'

const CONFIG_BANNER_TITLE = '[HOMEPAGE_LAYOUT_CONFIG]'
const CONFIG_BANNER_BADGE = '[SYSTEM_LAYOUT]'
const FALLBACK_IMAGE_URL = 'https://res.cloudinary.com/wgrpodxl/image/upload/v1795493760/ManojMobiles/banners/q9jugev1ryczo1jgxjzs.webp'

/**
 * Extracts bearer token from Authorization header or cookie
 */
function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim()
  }
  const cookie = req.cookies.get('accessToken')
  if (cookie?.value) {
    return cookie.value.trim()
  }
  return null
}

/**
 * GET: Retrieves homepage layout from the database if available, falling back to local storage
 */
export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req)

    // Attempt to read layout configuration record from backend database
    if (token) {
      try {
        const backendRes = await fetch(`${API_BASE_URL}/api/admin/banners`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        })

        if (backendRes.ok) {
          const json = await backendRes.json()
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
                return NextResponse.json({
                  success: true,
                  message: 'Homepage layout retrieved from database',
                  data: parsed,
                })
              }
            } catch {
              // Subtitle was not JSON, fall back to file store
            }
          }
        }
      } catch (dbErr) {
        console.warn('Could not read layout config from database, using local store:', dbErr)
      }
    }

    const sections = getHomepageLayout()
    return NextResponse.json({
      success: true,
      message: 'Homepage layout retrieved successfully',
      data: sections,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to fetch homepage layout' },
      { status: 500 }
    )
  }
}

/**
 * POST: Saves and publishes homepage layout to both the database on api.emistore.in and local store
 */
export async function POST(req: NextRequest) {
  try {
    const token = extractToken(req)
    const body = await req.json()
    const sections: HomepageSectionConfig[] = body?.sections || body

    if (!Array.isArray(sections) || sections.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Valid sections array is required' },
        { status: 400 }
      )
    }

    let databasePersisted = false

    // 1. Persist layout configuration and banner order in the backend database
    if (token) {
      try {
        // Step A: Reorder all banners in the database matching the new layout sequence
        const orderedIds = sections
          .filter((s) => s.bannerId && typeof s.bannerId === 'string')
          .map((s) => s.bannerId as string)

        if (orderedIds.length > 0) {
          try {
            await fetch(`${API_BASE_URL}/api/admin/banners/reorder`, {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ orderedIds }),
            })
          } catch (reorderErr) {
            console.warn('Error syncing banner order with database:', reorderErr)
          }
        }

        // Step B: Save or update the layout configuration record in the database
        const getBannersRes = await fetch(`${API_BASE_URL}/api/admin/banners`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        })

        if (getBannersRes.ok) {
          const json = await getBannersRes.json()
          const existingBanners = json?.data || []
          const existingConfigBanner = existingBanners.find(
            (b: any) =>
              b.title === CONFIG_BANNER_TITLE ||
              (b.badgeText && b.badgeText.includes(CONFIG_BANNER_BADGE))
          )

          const payload = {
            title: CONFIG_BANNER_TITLE,
            subtitle: JSON.stringify(sections),
            badgeText: CONFIG_BANNER_BADGE,
            imageUrl: FALLBACK_IMAGE_URL,
            linkUrl: '/shop',
            bannerType: 'CATEGORY_FEATURE',
            displayOrder: 9999,
            isActive: false, // Never displayed publicly as a banner
          }

          if (existingConfigBanner?.id) {
            const updateRes = await fetch(
              `${API_BASE_URL}/api/admin/banners/${existingConfigBanner.id}`,
              {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
              }
            )
            if (updateRes.ok) databasePersisted = true
          } else {
            const createRes = await fetch(`${API_BASE_URL}/api/admin/banners`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            })
            if (createRes.ok) databasePersisted = true
          }
        }
      } catch (dbErr) {
        console.warn('Database layout persistence warning:', dbErr)
      }
    }

    // 2. Persist to multi-location storage (public/data/homepage-layout.json & data/homepage-layout.json)
    const fileSaved = saveHomepageLayout(sections)
    if (!fileSaved && !databasePersisted) {
      return NextResponse.json(
        { success: false, message: 'Failed to write homepage layout to storage' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: databasePersisted
        ? 'Homepage layout saved and published successfully to database'
        : 'Homepage layout saved and published successfully',
      databasePersisted,
      data: getHomepageLayout(),
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Invalid request body' },
      { status: 400 }
    )
  }
}
