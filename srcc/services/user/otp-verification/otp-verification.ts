import * as bcrypt from 'bcrypt';
import EratePostgresDbAccessor from '../../../databases/postgres/erate/erate-db-accessor';
import Repository from './repository';
import Auth from '../../auth/jwt-token-manager';
import PostgresDb from '../../../databases/postgres/postgres-db';
import { Manager, Runner } from '../../../databases/db';
import { QueryResult } from 'pg';

export interface InData {
    email: string;
    otp: string;
}

export interface ServiceData {
    userId: string;
    hashedOTP: string;
    isVerified: boolean;
    noOfTries: number;
}

export interface AuthData {
    authToken: string;
    expiryDate: Date;
}

// TODO: Remove the overhead of always obtaining and releasing dataAccessor
export default class OTPVerification {
    private eratePostgresDbAccessor = new EratePostgresDbAccessor();
    private auth = new Auth();

    private inData = {} as InData;
    private serviceData = {} as ServiceData;

    private db!: Manager & Runner<string, QueryResult<any>>;
    private repository!: Repository;

    private verifiedAt: Date | null = null;

    async handle(inData: InData) {
        return this._handle(inData);
    }

    async handleAndAddAuthToken(inData: InData) {
        const serviceData = await this._handle(inData);
        return this.addAuthToken(serviceData);
    }

    private async _handle(inData: InData) {
        this.inData = inData;
        this.db = new PostgresDb(await this.eratePostgresDbAccessor.getAccessor());
        this.repository = new Repository(this.db);

        await this.db.manage(
            () => this.obtainVerificationDetails(),
            () => this.setWhetherVerified(),
            () => this.saveIsVerified(),
        );
        return this.serviceData;
    }

    addAuthToken<T extends ServiceData>(serviceData: T & Partial<AuthData>): T & AuthData {
        const tokenDetails = this.auth.generateToken({
            userModel: {
                id: this.serviceData.userId,
            },
            userVerificationModel: {
                verifiedAt: this.verifiedAt,
            },
        });

        serviceData.authToken = tokenDetails.token;
        serviceData.expiryDate = tokenDetails.expiryDate;

        return serviceData as T & AuthData;
    }

    private async obtainVerificationDetails() {
        const verificationData = await this.repository.getUserVerificationModel(this.inData);

        this.serviceData.userId = verificationData.userId;
        this.serviceData.hashedOTP = verificationData.hashedOTP;
        this.serviceData.noOfTries = verificationData.noOfTries;
    }

    private async setWhetherVerified() {
        this.serviceData.isVerified = await bcrypt.compare(
            this.inData.otp,
            this.serviceData.hashedOTP,
        );
    }

    private async saveIsVerified() {
        if (this.serviceData.isVerified) {
            await this.repository.flagVerified(this.serviceData);
            this.verifiedAt = new Date();
        } else {
            await this.repository.flagUnVerified(this.serviceData);
        }
    }
}
