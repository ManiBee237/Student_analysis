// src/utils/search.js
export function normalize(v) {
  if (v === null || v === undefined) return ''
  return String(v).toLowerCase().trim()
}

export function filterByQuery(rows, query, keys) {
  const q = normalize(query)
  if (!q) return rows
  return rows.filter(r => keys.some(k => normalize(r[k]).includes(q)))
}
