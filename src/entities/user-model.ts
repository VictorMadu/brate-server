import ModelDate from './data-types/date/date';
import NullModelDate from './data-types/date/null-date';

export default interface UserModel {
    id: string;
    email: string;
    name: string;
    hashedPwd: string;
    phone: string;
    createdAt: ModelDate;
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
    createdAt = new NullModelDate();

    constructor(private errorCode: ErrorCode) {}

    getErrorCode() {
        return this.errorCode;
    }
}
