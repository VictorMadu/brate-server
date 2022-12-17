import EntityDate, { ForQuery } from './date';

export default class CurrentEntityDate implements EntityDate {
    private date = new Date();

    getDate(): Date {
        return this.date;
    }

    getForQuery(): ForQuery {
        return 'current_time';
    }
}
