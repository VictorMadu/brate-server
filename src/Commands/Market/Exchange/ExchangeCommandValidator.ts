import { Request } from '../../Common/Interfaces/Request';
import { ExchangeCommandRequest, ExchangeCommandResponse } from './ExchangeCommand';

import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class ExchangeCommandValidator
    implements CommandHandler<ExchangeCommandRequest, ExchangeCommandResponse>
{
    constructor(
        private decorated: CommandHandler<ExchangeCommandRequest, ExchangeCommandResponse>,
    ) {}

    handle(_commandRequest: Request<ExchangeCommandRequest>): Promise<ExchangeCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(commandRequest: Request<ExchangeCommandRequest>): ExchangeCommandRequest {
        // TODO: Validate
        return commandRequest as ExchangeCommandRequest;
    }
}
