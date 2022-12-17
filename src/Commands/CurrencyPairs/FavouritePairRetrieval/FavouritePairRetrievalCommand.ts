export interface FavouritePairRetrievalCommandRequest {
    authToken: string;
    pairs: { base: string; quota: string }[];
}

// TODO: Use the iterator and async iterator pattern
export type FavouritePairRetrievalCommandResponse = boolean[];
