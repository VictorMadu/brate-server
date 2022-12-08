import * as bcrypt from 'bcrypt';
import EratePostgresDbAccessor from '../../../databases/postgres/erate/erate-db-accessor';
import Repository, { UserModel, UserVerificationModel } from './repository';
import _ from 'lodash';
import { QueryResult } from 'pg';
import { Manager, Runner } from '../../../databases/db';
import PostgresDb from '../../../databases/postgres/postgres-db';
import Auth from '../../auth/jwt-token-manager';

export interface InData {
    email: string;
    password: string;
}

export interface ServiceData extends InData {
    auth: {
        token: string;
        expiryDate: Date;
    };
    isAuthed: boolean;
}

export interface OutData {
    serviceData: ServiceData;
    userModel: UserModel;
    userVerificationModel: UserVerificationModel;
}

export default class SignIn {
    private eratePostgresDbAccessor = new EratePostgresDbAccessor();
    private auth = new Auth();

    private serviceData = {} as ServiceData;
    private userModel = {} as UserModel;
    private userVerificationModel = {} as UserVerificationModel;

    private db!: Manager & Runner<string, QueryResult<any>>;
    private repository!: Repository;

    async handle(inData: InData): Promise<OutData> {
        this.db = new PostgresDb(await this.eratePostgresDbAccessor.getAccessor());
        this.repository = new Repository(this.db);

        await this.populateServiceData(inData);
        await this.db.manage(
            () => this.setUserModel(),
            () => this.authorizeUser(),
            async () => {
                if (this.serviceData.isAuthed) {
                    await this.setUserVerificationModel();
                    await this.setAuthTokenDetails();
                }
            },
        );

        return {
            serviceData: this.serviceData,
            userModel: this.userModel,
            userVerificationModel: this.userVerificationModel,
        };
    }

    private async populateServiceData(inData: InData) {
        this.serviceData.email = inData.email;
        this.serviceData.password = inData.password;
    }

    private async setUserModel() {
        this.userModel = await this.repository.getUser(this.serviceData);
    }

    private async authorizeUser() {
        this.serviceData.isAuthed = await bcrypt.compare(
            this.serviceData.password,
            this.userModel.hashedPwd,
        );
    }

    private async setUserVerificationModel() {
        this.userVerificationModel = await this.repository.getUserVerification(this.userModel);
    }

    private async setAuthTokenDetails() {
        this.serviceData.auth = this.auth.generateToken({
            userModel: this.userModel,
            userVerificationModel: this.userVerificationModel,
        });
    }

    private isVerified() {
        return this.userVerificationModel.verifiedAt != null;
    }
}
