/**
 * Cache tags shared by the product catalog data layer, the client-side write
 * notifier and the revalidation route handler.
 *
 * Kept in its own module so `productCatalog` (data layer), `productCatalogSync`
 * (client notifier) and the route handler can share it without circular imports.
 */
export const CATALOG_CACHE_TAG = 'product-catalog'