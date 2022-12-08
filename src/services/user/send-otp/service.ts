import * as crypto from 'node:crypto';
import * as bcrypt from 'bcrypt';
import EratePostgresDbAccessor from '../../../databases/postgres/erate/erate-db-accessor';
import Config from '../../../config';
import Repository from './repository';
import { QueryResult } from 'pg';
import { Manager, Runner } from '../../../databases/db';
import PostgresDb from '../../../databases/postgres/postgres-db';

interface InData {
    email: string;
}

interface ServiceData {
    email: string;
    otp: string;
    hashedOTP: string;
}

export default class Service {
    private eratePostgresDbAccessor = new EratePostgresDbAccessor();
    private config = new Config();

    private serviceData = {} as ServiceData;

    private db!: Manager & Runner<string, QueryResult<any>>;
    private repository!: Repository;

    async sendOTP(inData: InData) {
        this.db = new PostgresDb(await this.eratePostgresDbAccessor.getAccessor());
        this.repository = new Repository(this.db);

        await this.populateServiceData(inData);
        this.db.manage(() => this.repository.saveVerificationForUser(this.serviceData));

        this.startSendingOfVerificationMail();
    }

    private async populateServiceData(inData: InData) {
        this.serviceData.email = inData.email;
        this.serviceData.otp = this.generateOTP();
        this.serviceData.hashedOTP = await this.obtainHashed(this.serviceData.otp);
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

    private async obtainHashed(value: string) {
        const saltRounds = this.config.get('bcryptSaltRounds');
        return bcrypt.hash(value, saltRounds);
    }

    private async startSendingOfVerificationMail() {
        // TODO:
        console.log('otp', this.serviceData.otp);
    }
}
