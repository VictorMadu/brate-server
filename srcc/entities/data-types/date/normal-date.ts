import EntityDate, { ForQuery } from './date';

export default class NormalEntityDate implements EntityDate {
    constructor(private date: Date) {}

    getDate(): Date {
        return this.date;
    }

    getForQuery(): ForQuery {
        return this.date;
    }
}
