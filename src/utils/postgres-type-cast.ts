export function toFloat(query: string) {
    return `(${query})::FLOAT`;
}

export function toString(query: string) {
    return `(${query})::TEXT`;
}

export function toBoolean(query: string) {
    return `(${query})::BOOL`;
}

export function timestampToNumeric(query: string) {
    return `EXTRACT (EPOCH FROM (${query}))`;
}

export function timestampToInt(query: string) {
    return `EXTRACT (EPOCH FROM (${query}))::INT`;
}

export function removeTrailingZeroesFromNumeric(colName: string) {
    return `(REGEXP_MATCH(${colName}::TEXT, '(\\d*(.\\d)?(\\d*[1-9])?)'))[1]::NUMERIC`;
}
