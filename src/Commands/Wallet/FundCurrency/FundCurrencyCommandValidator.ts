import { Request } from '../../Common/Interfaces/Request';
import { FundCurrencyCommandRequest, FundCurrencyCommandResponse } from './FundCurrencyCommand';

import _ from 'lodash';
import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class FundCurrencyCommandValidator
    implements CommandHandler<FundCurrencyCommandRequest, FundCurrencyCommandResponse>
{
    constructor(
        private decorated: CommandHandler<FundCurrencyCommandRequest, FundCurrencyCommandResponse>,
    ) {}

    handle(
        _commandRequest: Request<FundCurrencyCommandRequest>,
    ): Promise<FundCurrencyCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(
        commandRequest: Request<FundCurrencyCommandRequest>,
    ): FundCurrencyCommandRequest {
        // TODO: Validate
        return commandRequest as FundCurrencyCommandRequest;
    }
}
