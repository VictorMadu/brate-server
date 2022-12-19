import Profile from '../../../Application/Common/Errors/Domain/Profile';
import { User } from '../../../Application/Common/Interfaces/Entities/User';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import {
    BankProfileRetrievalCommandRequest,
    BankProfileRetrievalCommandResponse,
} from './BankProfileRetrievalCommand';

export default class ProfileRetrievalManager {
    private resData: { userId: string; name: string }[] = [];

    constructor(private commandRequest: BankProfileRetrievalCommandRequest) {}

    async populateBankDetails(userRepository: UserRepository) {
        this.resData = await userRepository.getBankUserList(this.commandRequest);
    }

    getResponse(): BankProfileRetrievalCommandResponse {
        return this.resData;
    }
}
