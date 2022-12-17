export default interface EntityDate {
    getDate(): Date | null;
    getForRepository(): ForRepository;
}

export type ForRepository = Date | 'current_time' | null;
