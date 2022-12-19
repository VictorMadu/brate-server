export interface BankProfileRetrievalCommandRequest {
    offset: number;
    limit: number;
}

export type BankProfileRetrievalCommandResponse = {
    userId: string;
    name: string;
}[];
