import EntityDate, { ForRepository } from './EntityDate';

export default class CurrentEntityDate implements EntityDate {
    private date = new Date();

    getDate(): Date {
        return this.date;
    }

    getForRepository(): ForRepository {
        return 'current_time';
    }
}
