import { Request } from '../../Common/Interfaces/Request';
import {
    CurrencyRetrievalCommandRequest,
    CurrencyRetrievalCommandResponse,
} from './CurrencyRetrievalCommand';

import _ from 'lodash';
import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class CurrencyRetrievalCommandValidator
    implements CommandHandler<CurrencyRetrievalCommandRequest, CurrencyRetrievalCommandResponse>
{
    constructor(
        private decorated: CommandHandler<
            CurrencyRetrievalCommandRequest,
            CurrencyRetrievalCommandResponse
        >,
    ) {}

    handle(
        _commandRequest: Request<CurrencyRetrievalCommandRequest>,
    ): Promise<CurrencyRetrievalCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(
        commandRequest: Request<CurrencyRetrievalCommandRequest>,
    ): CurrencyRetrievalCommandRequest {
        return commandRequest as CurrencyRetrievalCommandRequest;
    }
}
