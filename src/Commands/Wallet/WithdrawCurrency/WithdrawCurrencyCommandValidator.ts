import { Request } from '../../Common/Interfaces/Request';
import {
    WithdrawCurrencyCommandRequest,
    WithdrawCurrencyCommandResponse,
} from './WithdrawCurrencyCommand';

import _ from 'lodash';
import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class WithdrawCurrencyCommandValidator
    implements CommandHandler<WithdrawCurrencyCommandRequest, WithdrawCurrencyCommandResponse>
{
    constructor(
        private decorated: CommandHandler<
            WithdrawCurrencyCommandRequest,
            WithdrawCurrencyCommandResponse
        >,
    ) {}

    handle(
        _commandRequest: Request<WithdrawCurrencyCommandRequest>,
    ): Promise<WithdrawCurrencyCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(
        commandRequest: Request<WithdrawCurrencyCommandRequest>,
    ): WithdrawCurrencyCommandRequest {
        // TODO: Validate
        return commandRequest as WithdrawCurrencyCommandRequest;
    }
}
