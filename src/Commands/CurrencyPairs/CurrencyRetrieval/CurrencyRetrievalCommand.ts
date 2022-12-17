export interface CurrencyRetrievalCommandRequest {}

// TODO: Use the iterator and async iterator pattern
export type CurrencyRetrievalCommandResponse = {
    currencyId: number;
    abbrev: string;
    name: string;
}[];
