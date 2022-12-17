import HashManager from '../../Application/Common/Interfaces/HashManager';
import NumPasswordGenerator from '../../Application/Common/Interfaces/NumPasswordGenerator';
import EntityDate from '../ValueObjects/AppDates/EntityDate';

type InData = Partial<{
    verificationId: string;
    hashedOTP: string;
    otp: number;
    noOfTries: number;
    createdAt: EntityDate;
    verifiedAt: EntityDate;
}>;

class NullUserVerificationError extends Error {}

export default class UserVerifcation {
    private _verificationId: string;
    private _hashedOTP: string;
    private _otp: number;
    private _noOfTries: number;
    private _createdAt: EntityDate;
    private _verifiedAt: EntityDate;

    private constructor(inData: InData) {
        this._verificationId = inData.verificationId as string;
        this._hashedOTP = inData.hashedOTP as string;
        this._otp = inData.otp as number;
        this._noOfTries = inData.noOfTries as number;
        this._createdAt = inData.createdAt as EntityDate;
        this._verifiedAt = inData.verifiedAt as EntityDate;
    }

    static create(inData: InData) {
        return UserVerifcation.createFromStore(inData);
    }

    static createFromStore(inData: InData): UserVerifcation {
        return new UserVerifcation(inData);
    }

    static createNull(): UserVerifcation {
        return new NullUserVerifcation() as UserVerifcation;
    }

    static isNull(user: UserVerifcation): boolean {
        return user.constructor instanceof UserVerifcation;
    }

    public get verificationId(): string {
        return this._verificationId;
    }

    public set verificationId(verificationId: string) {
        this._verificationId = verificationId;
    }

    public get hashedOTP(): string {
        return this._hashedOTP;
    }

    public set hashedOTP(hashedOTP: string) {
        this._hashedOTP = hashedOTP;
    }

    public set otp(otp: number) {
        this._otp = otp;
    }

    public get noOfTries(): number {
        return this._noOfTries;
    }

    public set noOfTries(noOfTries: number) {
        this._noOfTries = noOfTries;
    }

    public get createdAt(): EntityDate {
        return this._createdAt;
    }

    public set createdAt(createdAt: EntityDate) {
        this._createdAt = createdAt;
    }

    public get verifiedAt(): EntityDate {
        return this._verifiedAt;
    }

    public set verifiedAt(verifiedAt: EntityDate) {
        this._verifiedAt = verifiedAt;
    }

    generateOTP(generator: NumPasswordGenerator): void {
        this._otp = generator.generate(6);
    }

    async hashOTP(hasher: HashManager) {
        this._hashedOTP = await hasher.hashAsync(this._otp.toString());
    }

    async isVerificationOTP(hashManager: HashManager, otp: string) {
        return await hashManager.isMatch(otp, this.hashedOTP);
    }
}

export class NullUserVerifcation {
    public get verificationId(): string {
        throw new NullUserVerificationError();
    }

    public set verificationId(verificationId: string) {
        throw new NullUserVerificationError();
    }

    public get hashedOTP(): string {
        throw new NullUserVerificationError();
    }

    public set hashedOTP(hashedOTP: string) {
        throw new NullUserVerificationError();
    }

    public get otp(): number {
        throw new NullUserVerificationError();
    }

    public set otp(otp: number) {
        throw new NullUserVerificationError();
    }

    public get noOfTries(): number {
        throw new NullUserVerificationError();
    }

    public set noOfTries(noOfTries: number) {
        throw new NullUserVerificationError();
    }

    public get createdAt(): EntityDate {
        throw new NullUserVerificationError();
    }

    public set createdAt(createdAt: EntityDate) {
        throw new NullUserVerificationError();
    }

    public get verifiedAt(): EntityDate {
        throw new NullUserVerificationError();
    }

    public set verifiedAt(verifiedAt: EntityDate) {
        throw new NullUserVerificationError();
    }

    generateOTP(generator: NumPasswordGenerator): void {
        throw new NullUserVerificationError();
    }

    async hashOTP(hasher: HashManager) {
        throw new NullUserVerificationError();
    }
}
