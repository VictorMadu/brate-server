import EntityDate, { ForRepository } from './EntityDate';

export default class NullEntityDate implements EntityDate {
    private static date: Date = new Date('0000-01-01T00:00:00.000Z');

    constructor() {}

    getDate(): Date {
        return NullEntityDate.date;
    }

    getForRepository(): ForRepository {
        return null;
    }
}
