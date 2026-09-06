const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function reminders() {
  const res = await fetch(`${BASE_URL}/reminders`, { cache: 'no-store' })
  return res.json()
}

export async function cash() {
  const res = await fetch(`${BASE_URL}/cash`, { cache: 'no-store' })
  return res.json()
}

export async function payments() {
  const res = await fetch(`${BASE_URL}/payments`, { cache: 'no-store' })
  return res.json()
}

export async function notes() {
  const res = await fetch(`${BASE_URL}/notes`, { cache: 'no-store' })
  return res.json()
}

export async function goals() {
  const res = await fetch(`${BASE_URL}/goals`, { cache: 'no-store' })
  return res.json()
}

export async function customerReviews() {
  const res = await fetch(`${BASE_URL}/customer-reviews`, { cache: 'no-store' })
  return res.json()
}

export async function recipes() {
  const res = await fetch(`${BASE_URL}/recipes`, { cache: 'no-store' })
  return res.json()
}