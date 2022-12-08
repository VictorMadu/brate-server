import EratePostgresDbAccessor from '../../databases/postgres/erate/erate-db-accessor';
import NotificationRepository, { Filter, NotificationModel } from './notification-repository';
import Auth from '../auth/jwt-token-manager';
import PostgresDb from '../../databases/postgres/postgres-db';
import { Manager, Runner } from '../../databases/db';
import { QueryResult } from 'pg';

export interface InData extends Filter {
    token: string;
}

interface ServiceData extends InData {}

interface UserModel {
    id: string;
}

export interface OutData {
    notificationModels: NotificationModel[];
}

// TODO: Remove the overhead of always obtaining and releasing dataAccessor
export default class NotificationService {
    private eratePostgresDbAccessor = new EratePostgresDbAccessor();
    private auth = new Auth();

    private serviceData = {} as InData;

    private userModel = {} as UserModel;
    private notificationModels = [] as NotificationModel[];

    private db!: Manager & Runner<string, QueryResult<any>>;
    private notificationRepository!: NotificationRepository;

    async obtain(inData: InData): Promise<OutData> {
        this.serviceData = inData;
        this.db = new PostgresDb(await this.eratePostgresDbAccessor.getAccessor());
        this.notificationRepository = new NotificationRepository(this.db);

        await this.db.manage(
            () => this.setUserModel(),
            () => this.setNotificationModel(),
        );
        return {
            notificationModels: this.notificationModels,
        };
    }

    private async setUserModel() {
        const tokenDetails = this.auth.obtainFromToken(this.serviceData);
        this.userModel = tokenDetails.userModel;
    }

    private async setNotificationModel() {
        this.notificationModels = await this.notificationRepository.obtain({
            userModel: this.userModel,
            filter: this.serviceData,
        });
    }
}
