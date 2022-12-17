import HashManager from '../../Application/Common/Interfaces/HashManager';
import UserVerifcation from '../Entities/UserVerification';
import EntityDate from '../ValueObjects/AppDates/EntityDate';

type InData = Partial<{
    userId: string;
    verificationId: string;
    name: string;
    email: string;
    password: string;
    hashPwd: string;
    phone: string;
    createdAt: EntityDate;
    isNull: boolean;
}>;

class NullUserError extends Error {}

export default class User {
    private _userId: string;
    private _verificationId: string;
    private _name: string;
    private _email: string;
    private _hashPwd: string;
    private _phone: string;
    private _createdAt: EntityDate;
    private _password: string;

    private constructor(inData: InData) {
        this._userId = inData.userId as string;
        this._verificationId = inData.verificationId as string;
        this._name = inData.name as string;
        this._email = inData.email as string;
        this._hashPwd = inData.hashPwd as string;
        this._phone = inData.phone as string;
        this._password = inData.password as string;
        this._createdAt = inData.createdAt as EntityDate;
    }

    static create(inData: InData) {
        return User.createFromStore(inData);
    }

    static createFromStore(inData: InData): User {
        return new User(inData);
    }

    static createNull(): User {
        return new NullUser() as User;
    }

    static isNull(user: User): boolean {
        return user.constructor instanceof NullUser;
    }

    static NullError = NullUserError;

    public get userId(): string {
        return this._userId;
    }

    public set userId(userId: string) {
        this._userId = userId;
    }

    public get verificationId(): string {
        return this._verificationId;
    }

    public set verificationId(verificationId: string) {
        this._verificationId = verificationId;
    }

    public get name(): string {
        return this._name;
    }

    public set name(name: string) {
        this._name = name;
    }

    public get email(): string {
        return this._email;
    }

    public set email(email: string) {
        this._email = email;
    }

    public get hashPwd(): string {
        return this._hashPwd;
    }

    public set hashPwd(hashPwd: string) {
        this._hashPwd = hashPwd;
    }

    public get phone(): string {
        return this._phone;
    }

    public set phone(phone: string) {
        this._phone = phone;
    }

    public get createdAt(): EntityDate {
        return this._createdAt;
    }

    public set createdAt(createdAt: EntityDate) {
        this._createdAt = createdAt;
    }

    public async isUserPassword(hashManager: HashManager, password: string) {
        return await hashManager.isMatch(password, this.hashPwd);
    }

    async hashPassword(hasher: HashManager) {
        this._hashPwd = await hasher.hashAsync(this._password);
    }
}

class NullUser {
    public get userId(): string {
        throw new NullUserError();
    }

    public set userId(userId: string) {
        throw new NullUserError();
    }

    public get verificationId(): string {
        throw new NullUserError();
    }

    public set verificationId(verificationId: string) {
        throw new NullUserError();
    }

    public get name(): string {
        throw new NullUserError();
    }

    public set name(name: string) {
        throw new NullUserError();
    }

    public get email(): string {
        throw new NullUserError();
    }

    public set email(email: string) {
        throw new NullUserError();
    }

    public get hashPwd(): string {
        throw new NullUserError();
    }

    public set hashPwd(hashPwd: string) {
        throw new NullUserError();
    }

    public get phone(): string {
        throw new NullUserError();
    }

    public set phone(phone: string) {
        throw new NullUserError();
    }

    public get createdAt(): EntityDate {
        throw new NullUserError();
    }

    public set createdAt(createdAt: EntityDate) {
        throw new NullUserError();
    }

    public async isUserPassword(hashManager: HashManager, password: string): Promise<boolean> {
        throw new NullUserError();
    }

    async hashPassword(hasher: HashManager) {
        throw new NullUserError();
    }
}
