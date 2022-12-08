import ModelDate, { ForQuery } from './date';

export default class CurrentModelDate implements ModelDate {
    private date = new Date();

    getDate(): Date {
        return this.date;
    }

    getForQuery(): ForQuery {
        return 'current_time';
    }
}
