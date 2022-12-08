export default interface ModelDate {
    getDate(): Date;
    getForQuery(): ForQuery;
}

export type ForQuery = Date | 'current_time' | null;
