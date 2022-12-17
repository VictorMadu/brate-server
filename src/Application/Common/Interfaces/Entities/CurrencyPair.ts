export default interface PairFavourite {
    userId: string;
    base: string;
    quota: string;
    createdAt: Date;
    deletedAt: Date | null;
}
