export default interface EntityDate {
    getDate(): Date;
    getForQuery(): ForQuery;
}

export type ForQuery = Date | 'current_time' | null;
