import ModelDate, { ForQuery } from './date';

export default class NormalModelDate implements ModelDate {
    constructor(private date: Date) {}

    getDate(): Date {
        return this.date;
    }

    getForQuery(): ForQuery {
        return this.date;
    }
}
