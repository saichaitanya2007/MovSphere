export const SITE_COMMISSION_RATE = 0.085

export const BUYER_AGE_GROUPS = ['18-24', '25-34', '35-44', '45-54', '55+']

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

export function formatCompactCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value || 0)
}

export function formatDateTime(value) {
  if (!value) {
    return 'No timestamp yet'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'No timestamp yet'
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function extractAreaLabel(value) {
  if (!value) {
    return 'Unknown area'
  }

  const rawLabel = typeof value === 'string' ? value : value.label

  if (!rawLabel) {
    return 'Unknown area'
  }

  const parts = rawLabel
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0]}, ${parts[1]}`
  }

  return parts[0] || rawLabel
}

export function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max)
}
