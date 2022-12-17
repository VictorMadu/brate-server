export default interface BlackRate {
    blackRateId: string;
    userId: string;
    userName: string;
    rate: number;
    rates: number[];
    base: string;
    quota: string;
    createdAt: Date;
    createdAts: Date[];
}
