export type VariantFieldType = 'text' | 'number' | 'select' | 'multiselect' | 'boolean'

export interface VariantTemplateField {
  id: string
  name: string
  label: string
  type: VariantFieldType
  options?: string[]
  required?: boolean
  sortOrder?: number
  placeholder?: string
  defaultValue?: string
  helperText?: string
}

export interface VariantTemplate {
  id: string
  name: string
  description?: string
  isSystem: boolean
  fields: VariantTemplateField[]
  createdAt?: string
  updatedAt?: string
}

export interface CategoryProductConfig {
  categoryId: string
  variantTemplateId?: string
  specTemplateId?: string
  updatedAt?: string
}

/**
 * The 18 standard Variant Templates specified by Manoj Mobiles (+ 1 backward-compatible Audio & Wearables)
 */
export const PREDEFINED_VARIANT_TEMPLATES: VariantTemplate[] = [
  // 1. Mobiles
  {
    id: 'mobiles',
    name: 'Mobiles',
    description: 'Variant template for Smartphones and Mobile Phones',
    isSystem: true,
    fields: [
      {
        id: 'f_mob_ram',
        name: 'RAM',
        label: 'RAM',
        type: 'select',
        options: ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '24GB'],
        required: true,
        sortOrder: 1,
        placeholder: 'Select RAM'
      },
      {
        id: 'f_mob_storage',
        name: 'Storage',
        label: 'Storage',
        type: 'select',
        options: ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'],
        required: true,
        sortOrder: 2,
        placeholder: 'Select Storage'
      }
    ]
  },

  // 2. Tablets
  {
    id: 'tablets',
    name: 'Tablets',
    description: 'Variant template for Tablets and iPads',
    isSystem: true,
    fields: [
      {
        id: 'f_tab_ram',
        name: 'RAM',
        label: 'RAM',
        type: 'select',
        options: ['3GB', '4GB', '6GB', '8GB', '12GB', '16GB'],
        required: true,
        sortOrder: 1,
        placeholder: 'Select RAM'
      },
      {
        id: 'f_tab_storage',
        name: 'Storage',
        label: 'Storage',
        type: 'select',
        options: ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB'],
        required: true,
        sortOrder: 2,
        placeholder: 'Select Storage'
      },
      {
        id: 'f_tab_conn',
        name: 'Connectivity',
        label: 'Connectivity',
        type: 'select',
        options: ['Wi-Fi', '4G', '5G', 'Wi-Fi + Cellular'],
        required: true,
        sortOrder: 3,
        placeholder: 'Select Connectivity'
      }
    ]
  },

  // 3. Laptops
  {
    id: 'laptops',
    name: 'Laptops',
    description: 'Variant template for Laptops and Notebooks',
    isSystem: true,
    fields: [
      {
        id: 'f_lap_ram',
        name: 'RAM',
        label: 'RAM',
        type: 'select',
        options: ['4GB', '8GB', '16GB', '32GB', '64GB'],
        required: true,
        sortOrder: 1,
        placeholder: 'Select RAM'
      },
      {
        id: 'f_lap_storage',
        name: 'Storage / SSD',
        label: 'Storage / SSD',
        type: 'select',
        options: ['128GB', '256GB', '512GB', '1TB', '2TB'],
        required: true,
        sortOrder: 2,
        placeholder: 'Select Storage / SSD'
      },
      {
        id: 'f_lap_proc',
        name: 'Processor',
        label: 'Processor',
        type: 'text',
        required: false,
        sortOrder: 3,
        placeholder: 'e.g. Intel Core i5 / Apple M3 / AMD Ryzen 7'
      },
      {
        id: 'f_lap_os',
        name: 'Operating System',
        label: 'Operating System',
        type: 'select',
        options: ['Windows', 'macOS', 'Linux', 'ChromeOS', 'Other'],
        required: false,
        sortOrder: 4,
        placeholder: 'Select OS'
      }
    ]
  },

  // 4. Smartwatches
  {
    id: 'smartwatches',
    name: 'Smartwatches',
    description: 'Variant template for Smartwatches and Wearables',
    isSystem: true,
    fields: [
      {
        id: 'f_sw_strap_color',
        name: 'Strap Colour',
        label: 'Strap Colour',
        type: 'text',
        required: false,
        sortOrder: 1,
        placeholder: 'e.g. Midnight Black, Ocean Blue'
      },
      {
        id: 'f_sw_strap_size',
        name: 'Strap Size',
        label: 'Strap Size',
        type: 'text',
        required: false,
        sortOrder: 2,
        placeholder: 'e.g. 40mm, 44mm, 45mm, S/M, M/L'
      },
      {
        id: 'f_sw_conn',
        name: 'Connectivity',
        label: 'Connectivity',
        type: 'select',
        options: ['Bluetooth', 'Cellular', 'Bluetooth + Cellular'],
        required: true,
        sortOrder: 3,
        placeholder: 'Select Connectivity'
      }
    ]
  },

  // 5. Earbuds / TWS
  {
    id: 'earbuds-tws',
    name: 'Earbuds / TWS',
    description: 'Variant template for True Wireless Earbuds',
    isSystem: true,
    fields: []
  },

  // 6. Headphones
  {
    id: 'headphones',
    name: 'Headphones',
    description: 'Variant template for Over-Ear and On-Ear Headphones',
    isSystem: true,
    fields: []
  },

  // 7. Speakers
  {
    id: 'speakers',
    name: 'Speakers',
    description: 'Variant template for Bluetooth Speakers and Soundbars',
    isSystem: true,
    fields: []
  },

  // 8. Chargers & Adapters
  {
    id: 'chargers-adapters',
    name: 'Chargers & Adapters',
    description: 'Variant template for Wall Chargers, Adapters, and Cables',
    isSystem: true,
    fields: [
      {
        id: 'f_chg_wattage',
        name: 'Wattage',
        label: 'Wattage',
        type: 'select',
        options: ['10W', '18W', '20W', '25W', '30W', '33W', '45W', '65W', '67W', '80W', '100W', '120W', '140W'],
        required: true,
        sortOrder: 1,
        placeholder: 'Select Wattage'
      },
      {
        id: 'f_chg_connector',
        name: 'Connector Type',
        label: 'Connector Type',
        type: 'select',
        options: ['USB-A', 'USB-C', 'USB-A + USB-C', 'Lightning', 'Micro USB'],
        required: true,
        sortOrder: 2,
        placeholder: 'Select Connector Type'
      }
    ]
  },

  // 9. Power Banks
  {
    id: 'power-banks',
    name: 'Power Banks',
    description: 'Variant template for Portable Power Banks',
    isSystem: true,
    fields: [
      {
        id: 'f_pb_capacity',
        name: 'Capacity',
        label: 'Capacity',
        type: 'select',
        options: ['5,000mAh', '10,000mAh', '20,000mAh', '30,000mAh'],
        required: true,
        sortOrder: 1,
        placeholder: 'Select Battery Capacity'
      }
    ]
  },

  // 10. Mobile Accessories
  {
    id: 'mobile-accessories',
    name: 'Mobile Accessories',
    description: 'Variant template for General Mobile Accessories',
    isSystem: true,
    fields: [
      {
        id: 'f_acc_compat',
        name: 'Compatible Model',
        label: 'Compatible Model',
        type: 'text',
        required: false,
        sortOrder: 1,
        placeholder: 'e.g. iPhone 15 Pro, Galaxy S24 Ultra'
      }
    ]
  },

  // 11. Televisions
  {
    id: 'televisions',
    name: 'Televisions',
    description: 'Variant template for Smart TVs and Televisions',
    isSystem: true,
    fields: [
      {
        id: 'f_tv_size',
        name: 'Screen Size',
        label: 'Screen Size',
        type: 'select',
        options: ['24"', '32"', '40"', '43"', '50"', '55"', '65"', '75"', '85"', '98"'],
        required: true,
        sortOrder: 1,
        placeholder: 'Select Screen Size'
      },
      {
        id: 'f_tv_res',
        name: 'Resolution',
        label: 'Resolution',
        type: 'select',
        options: ['HD', 'Full HD', '4K', '8K'],
        required: true,
        sortOrder: 2,
        placeholder: 'Select Resolution'
      },
      {
        id: 'f_tv_disp',
        name: 'Display Type',
        label: 'Display Type',
        type: 'select',
        options: ['LED', 'QLED', 'OLED', 'Mini LED'],
        required: true,
        sortOrder: 3,
        placeholder: 'Select Display Technology'
      }
    ]
  },

  // 12. Gaming / Consoles
  {
    id: 'gaming-consoles',
    name: 'Gaming / Consoles',
    description: 'Variant template for Gaming Consoles and Bundles',
    isSystem: true,
    fields: [
      {
        id: 'f_game_storage',
        name: 'Storage',
        label: 'Storage',
        type: 'select',
        options: ['512GB', '1TB', '2TB'],
        required: true,
        sortOrder: 1,
        placeholder: 'Select Storage'
      },
      {
        id: 'f_game_edition',
        name: 'Edition',
        label: 'Edition',
        type: 'text',
        required: false,
        sortOrder: 2,
        placeholder: 'e.g. Digital Edition, Disc Edition, Slim'
      }
    ]
  },

  // 13. Cameras
  {
    id: 'cameras',
    name: 'Cameras',
    description: 'Variant template for DSLR, Mirrorless, and Action Cameras',
    isSystem: true,
    fields: [
      {
        id: 'f_cam_lens',
        name: 'Lens / Kit Variant',
        label: 'Lens / Kit Variant',
        type: 'text',
        required: false,
        sortOrder: 1,
        placeholder: 'e.g. Body Only, 18-55mm Kit Lens, 24-70mm f/2.8'
      }
    ]
  },

  // 14. Monitors
  {
    id: 'monitors',
    name: 'Monitors',
    description: 'Variant template for Desktop and Gaming Monitors',
    isSystem: true,
    fields: [
      {
        id: 'f_mon_size',
        name: 'Screen Size',
        label: 'Screen Size',
        type: 'select',
        options: ['21.5"', '24"', '27"', '32"', '34"', '43"'],
        required: true,
        sortOrder: 1,
        placeholder: 'Select Screen Size'
      },
      {
        id: 'f_mon_res',
        name: 'Resolution',
        label: 'Resolution',
        type: 'select',
        options: ['Full HD', 'QHD', '4K', '5K'],
        required: true,
        sortOrder: 2,
        placeholder: 'Select Resolution'
      },
      {
        id: 'f_mon_refresh',
        name: 'Refresh Rate',
        label: 'Refresh Rate',
        type: 'select',
        options: ['60Hz', '75Hz', '100Hz', '120Hz', '144Hz', '165Hz', '240Hz', '360Hz'],
        required: true,
        sortOrder: 3,
        placeholder: 'Select Refresh Rate'
      }
    ]
  },

  // 15. Printers
  {
    id: 'printers',
    name: 'Printers',
    description: 'Variant template for Inkjet, Laser, and All-in-One Printers',
    isSystem: true,
    fields: [
      {
        id: 'f_print_model',
        name: 'Model / Variant',
        label: 'Model / Variant',
        type: 'text',
        required: false,
        sortOrder: 1,
        placeholder: 'e.g. Standard, Duplex, WiFi Edition'
      },
      {
        id: 'f_print_conn',
        name: 'Connectivity',
        label: 'Connectivity',
        type: 'select',
        options: ['USB', 'Wi-Fi', 'Ethernet', 'USB + Wi-Fi', 'USB + Ethernet'],
        required: true,
        sortOrder: 2,
        placeholder: 'Select Connectivity'
      }
    ]
  },

  // 16. Computer Accessories
  {
    id: 'computer-accessories',
    name: 'Computer Accessories',
    description: 'Variant template for Keyboards, Mice, Cables, and PC Peripherals',
    isSystem: true,
    fields: [
      {
        id: 'f_comp_compat',
        name: 'Compatibility',
        label: 'Compatibility',
        type: 'text',
        required: false,
        sortOrder: 1,
        placeholder: 'e.g. Windows & Mac, Type-C Devices'
      }
    ]
  },

  // 17. Cases & Covers
  {
    id: 'cases-covers',
    name: 'Cases & Covers',
    description: 'Variant template for Mobile Cases, Sleeves, and Screen Protectors',
    isSystem: true,
    fields: [
      {
        id: 'f_case_model',
        name: 'Compatible Model',
        label: 'Compatible Model',
        type: 'text',
        required: true,
        sortOrder: 1,
        placeholder: 'e.g. iPhone 16 Pro Max, Pixel 9'
      }
    ]
  },

  // 18. Other Accessories
  {
    id: 'other-accessories',
    name: 'Other Accessories',
    description: 'General template using common variant fields (Colour, Price, Stock)',
    isSystem: true,
    fields: []
  },

  // 19. Audio & Wearables (Preserved for existing database category)
  {
    id: 'audio-wearables',
    name: 'Audio & Wearables',
    description: 'Variant template for Audio & Wearable devices',
    isSystem: true,
    fields: [
      {
        id: 'f_aud_type',
        name: 'Type',
        label: 'Type',
        type: 'select',
        options: ['In-Ear', 'Over-Ear', 'On-Ear', 'Neckband', 'TWS', 'Speaker'],
        required: true,
        sortOrder: 1,
        placeholder: 'Select Type'
      },
      {
        id: 'f_aud_playtime',
        name: 'Playtime',
        label: 'Playtime',
        type: 'text',
        required: false,
        sortOrder: 2,
        placeholder: 'e.g. Up to 40 Hours'
      },
      {
        id: 'f_aud_mic',
        name: 'Microphone',
        label: 'Microphone',
        type: 'select',
        options: ['Yes', 'No', 'Dual Mic ENC'],
        required: false,
        sortOrder: 3,
        placeholder: 'Has Mic?'
      }
    ]
  }
]

/**
 * Maps category name/slug to the best default variant template
 */
export function getDefaultTemplateForCategory(
  categoryName?: string | null,
  categorySlug?: string | null
): VariantTemplate {
  const query = `${categoryName || ''} ${categorySlug || ''}`.toLowerCase()

  if (query.includes('tablet') || query.includes('ipad')) {
    return PREDEFINED_VARIANT_TEMPLATES.find(t => t.id === 'tablets')!
  }
  if (query.includes('laptop') || query.includes('macbook') || query.includes('notebook')) {
    return PREDEFINED_VARIANT_TEMPLATES.find(t => t.id === 'laptops')!
  }
  if (query.includes('watch') || query.includes('smartwatch')) {
    return PREDEFINED_VARIANT_TEMPLATES.find(t => t.id === 'smartwatches')!
  }
  if (query.includes('earbud') || query.includes('tws') || query.includes('airpod')) {
    return PREDEFINED_VARIANT_TEMPLATES.find(t => t.id === 'earbuds-tws')!
  }
  if (query.includes('headphone')) {
    return PREDEFINED_VARIANT_TEMPLATES.find(t => t.id === 'headphones')!
  }
  if (query.includes('speaker') || query.includes('soundbar')) {
    return PREDEFINED_VARIANT_TEMPLATES.find(t => t.id === 'speakers')!
  }
  if (query.includes('tv') || query.includes('television')) {
    return PREDEFINED_VARIANT_TEMPLATES.find(t => t.id === 'televisions')!
  }
  if (query.includes('camera') || query.includes('dslr') || query.includes('gopro')) {
    return PREDEFINED_VARIANT_TEMPLATES.find(t => t.id === 'cameras')!
  }
  if (query.includes('game') || query.includes('console') || query.includes('playstation') || query.includes('xbox')) {
    return PREDEFINED_VARIANT_TEMPLATES.find(t => t.id === 'gaming-consoles')!
  }
  if (query.includes('monitor') || query.includes('display')) {
    return PREDEFINED_VARIANT_TEMPLATES.find(t => t.id === 'monitors')!
  }
  if (query.includes('printer')) {
    return PREDEFINED_VARIANT_TEMPLATES.find(t => t.id === 'printers')!
  }
  if (query.includes('power bank') || query.includes('powerbank')) {
    return PREDEFINED_VARIANT_TEMPLATES.find(t => t.id === 'power-banks')!
  }
  if (query.includes('charger') || query.includes('adapter')) {
    return PREDEFINED_VARIANT_TEMPLATES.find(t => t.id === 'chargers-adapters')!
  }
  if (query.includes('case') || query.includes('cover')) {
    return PREDEFINED_VARIANT_TEMPLATES.find(t => t.id === 'cases-covers')!
  }
  if (query.includes('audio') || query.includes('wearable')) {
    return PREDEFINED_VARIANT_TEMPLATES.find(t => t.id === 'audio-wearables') || PREDEFINED_VARIANT_TEMPLATES.find(t => t.id === 'earbuds-tws')!
  }
  if (query.includes('computer')) {
    return PREDEFINED_VARIANT_TEMPLATES.find(t => t.id === 'computer-accessories')!
  }
  if (query.includes('accessor')) {
    return PREDEFINED_VARIANT_TEMPLATES.find(t => t.id === 'mobile-accessories')!
  }

  // Default to mobiles
  return PREDEFINED_VARIANT_TEMPLATES.find(t => t.id === 'mobiles')!
}

/**
 * Automatically builds a standard variant name from dynamic attributes.
 * Example: Mobiles with RAM="8GB", Storage="256GB" -> "8GB / 256GB"
 */
export function generateVariantNameFromAttributes(
  template: VariantTemplate,
  attributes: Record<string, any>
): string {
  if (!template || !template.fields) return ''

  const parts: string[] = []

  // Sort fields by sortOrder
  const sorted = [...template.fields].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

  for (const field of sorted) {
    const val = attributes[field.name]
    if (val !== undefined && val !== null && String(val).trim()) {
      parts.push(String(val).trim())
    }
  }

  if (parts.length === 0) return ''
  return parts.join(' / ')
}
