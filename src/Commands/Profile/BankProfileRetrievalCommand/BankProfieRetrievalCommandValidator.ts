import { Request } from '../../Common/Interfaces/Request';
import {
    BankProfileRetrievalCommandRequest,
    BankProfileRetrievalCommandResponse,
} from './BankProfileRetrievalCommand';

import _ from 'lodash';
import * as ValidationError from '../../Common/ValidationError';
import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class BankProfileRetrievalCommandValidator
    implements
        CommandHandler<BankProfileRetrievalCommandRequest, BankProfileRetrievalCommandResponse>
{
    constructor(
        private decorated: CommandHandler<
            BankProfileRetrievalCommandRequest,
            BankProfileRetrievalCommandResponse
        >,
    ) {}

    handle(
        _commandRequest: Request<BankProfileRetrievalCommandRequest>,
    ): Promise<BankProfileRetrievalCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(
        commandRequest: Request<BankProfileRetrievalCommandRequest>,
    ): BankProfileRetrievalCommandRequest {
        return commandRequest as BankProfileRetrievalCommandRequest;
    }
}
