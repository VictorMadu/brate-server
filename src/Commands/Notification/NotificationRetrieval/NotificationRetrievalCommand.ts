export interface NotificationRetrievalCommandRequest {
    authToken: string;
    dateTimeFrom?: Date;
    dateTimeTo?: Date;
    type?: 'P' | 'F' | 'T';
    pageOffset: number;
    pageCount: number;
}

// TODO: Use the iterator and async iterator pattern
export type NotificationRetrievalCommandResponse = {
    msg: string;
    notificationId: string;
    createdAt: Date;
    type: 'P' | 'F' | 'T';
}[];
