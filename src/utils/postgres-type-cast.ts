export function toFloat(query: string) {
  return `(${query})::FLOAT`;
}

export function toString(query: string) {
  return `(${query})::TEXT`;
}

export function toBoolean(query: string) {
  return `(${query})::BOOL`;
}

export function timestampToFloat(query: string) {
  return `EXTRACT (EPOCH FROM (${query}))::FLOAT`;
}

export function timestampToInt(query: string) {
  return `EXTRACT (EPOCH FROM (${query}))::INT`;
}
