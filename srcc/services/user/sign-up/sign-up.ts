import * as crypto from 'node:crypto';
import * as bcrypt from 'bcrypt';
import Config from '../../../config';
import EratePostgresDbAccessor from '../../../databases/postgres/erate/erate-db-accessor';
import Repository from './repository';
import _ from 'lodash';
import { QueryResult } from 'pg';
import { Manager, Runner } from '../../../databases/db';
import PostgresDb from '../../../databases/postgres/postgres-db';

interface InData {
    name: string;
    email: string;
    phone: string;
    password: string;
}

interface ServiceData extends InData {
    otp: string;
    hashedPassword: string;
    hashedOTP: string;
}

interface UserModel {
    id: string;
}

export default class SignUp {
    private eratePostgresDbAccessor = new EratePostgresDbAccessor();
    private config = new Config();

    private serviceData = {} as ServiceData;
    private userModel = {} as UserModel;

    private db!: Manager & Runner<string, QueryResult<any>>;
    private repository!: Repository;

    async handle(inData: InData) {
        this.db = new PostgresDb(await this.eratePostgresDbAccessor.getAccessor());
        this.repository = new Repository(this.db);

        await this.populateServiceData(inData);
        await this.db.manage(
            () => this.saveUser(),
            () => this.saveUserVerificationDetails(),
        );
        this.startSendingOfVerificationMail();

        return {
            serviceData: this.serviceData,
            userModel: this.userModel,
        };
    }

    private async populateServiceData(inData: InData) {
        this.serviceData.email = inData.email;
        this.serviceData.name = inData.name;
        this.serviceData.phone = inData.phone;
        this.serviceData.password = inData.password;
    }

    private async obtainHashed(value: string) {
        const saltRounds = this.config.get('bcryptSaltRounds');
        return bcrypt.hash(value, saltRounds);
    }

    private async saveUser() {
        this.serviceData.hashedPassword = await this.obtainHashed(this.serviceData.password);
        this.userModel = await this.repository.saveUser(this.serviceData);
    }

    private async saveUserVerificationDetails() {
        this.serviceData.otp = this.generateOTP();
        this.serviceData.hashedOTP = await this.obtainHashed(this.serviceData.otp);
        await this.repository.saveVerificationForUser(this.serviceData, this.userModel);
    }

    private generateOTP() {
        const length = this.config.get('otp.emailVerification.length');
        return crypto
            .randomBytes(length)
            .toString('hex')
            .split('')
            .map((d) => d.charCodeAt(0))
            .map((d) => '' + d)
            .reduce((d, s) => d + s)
            .slice(-length);
    }

    private async startSendingOfVerificationMail() {
        // TODO:
    }
}
