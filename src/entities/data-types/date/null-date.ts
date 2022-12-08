import ModelDate, { ForQuery } from './date';

export default class NullModelDate implements ModelDate {
    private static date: Date = new Date('0000-01-01T00:00:00.000Z');

    constructor() {}

    getDate(): Date {
        return NullModelDate.date;
    }

    getForQuery(): ForQuery {
        return null;
    }
}
