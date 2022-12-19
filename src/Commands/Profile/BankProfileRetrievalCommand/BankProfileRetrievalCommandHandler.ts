import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import UserRepository from '../../../Application/Common/Interfaces/Repositories/UserRepository';
import {
    BankProfileRetrievalCommandRequest,
    BankProfileRetrievalCommandResponse,
} from './BankProfileRetrievalCommand';
import AuthTokenManager from '../../../Application/Common/Interfaces/Services/AuthTokenManager';
import BankProfileRetrievalManager from './BankProfileRetrievalManager';

export default class BankProfileRetrievalCommandHandler
    implements
        CommandHandler<BankProfileRetrievalCommandRequest, BankProfileRetrievalCommandResponse>
{
    constructor(private userRepository: UserRepository) {}

    async handle(
        commandRequest: BankProfileRetrievalCommandRequest,
    ): Promise<BankProfileRetrievalCommandResponse> {
        const profileRetrievalManager = new BankProfileRetrievalManager(commandRequest);
        await profileRetrievalManager.populateBankDetails(this.userRepository);
        return profileRetrievalManager.getResponse();
    }
}
