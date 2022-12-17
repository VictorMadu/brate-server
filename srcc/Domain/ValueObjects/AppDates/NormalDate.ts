import EntityDate, { ForRepository } from './EntityDate';

export default class NormalEntityDate implements EntityDate {
    constructor(private date: Date) {}

    getDate(): Date {
        return this.date;
    }

    getForRepository(): ForRepository {
        return this.date;
    }
}
