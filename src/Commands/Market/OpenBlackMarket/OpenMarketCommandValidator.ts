import { Request } from '../../Common/Interfaces/Request';
import { openBlackMarketCommandRequest, openBlackMarketCommandResponse } from './OpenMarketCommand';

import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class OpenBlackMarketCommandValidator
    implements CommandHandler<openBlackMarketCommandRequest, openBlackMarketCommandResponse>
{
    constructor(
        private decorated: CommandHandler<
            openBlackMarketCommandRequest,
            openBlackMarketCommandResponse
        >,
    ) {}

    handle(
        _commandRequest: Request<openBlackMarketCommandRequest>,
    ): Promise<openBlackMarketCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(
        commandRequest: Request<openBlackMarketCommandRequest>,
    ): openBlackMarketCommandRequest {
        // TODO: Validate
        return commandRequest as openBlackMarketCommandRequest;
    }
}
