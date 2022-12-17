export interface Notification {
    notificationId: string;
    userId: string;
    msg: string;
    type: 'P' | 'F' | 'T';
    createdAt: Date;
}
