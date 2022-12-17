import EntityDate from './data-types/date/date';
import NullEntityDate from './data-types/date/null-date';

export default interface UserModel {
    id: string;
    email: string;
    name: string;
    hashedPwd: string;
    phone: string;
    createdAt: EntityDate;
}

enum ErrorCode {
    FAILED_SAVE,
    EMAIL_EXISTS,
    FAILED_UPDATE,
    NOT_FOUND,
}

export class NullUserModel implements UserModel {
    id = '';
    email = '';
    name = '';
    hashedPwd = '';
    phone = '';
    createdAt = new NullEntityDate();

    constructor(private errorCode: ErrorCode) {}

    getErrorCode() {
        return this.errorCode;
    }
}
