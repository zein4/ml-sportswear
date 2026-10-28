// Shared client-safe status labels. No server-only crypto is imported here.
export const PRODUCTION_STATUSES = ['not_started','in_production','ready'] as const;
export const SHIPPING_STATUSES = ['not_ready','ready_for_pickup','shipped','delivered'] as const;
