import { Request } from '../../Common/Interfaces/Request';
import {
    CloseBlackMarketCommandRequest,
    CloseBlackMarketCommandResponse,
} from './CloseMarketCommand';

import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class CloseBlackMarketCommandValidator
    implements CommandHandler<CloseBlackMarketCommandRequest, CloseBlackMarketCommandResponse>
{
    constructor(
        private decorated: CommandHandler<
            CloseBlackMarketCommandRequest,
            CloseBlackMarketCommandResponse
        >,
    ) {}

    handle(
        _commandRequest: Request<CloseBlackMarketCommandRequest>,
    ): Promise<CloseBlackMarketCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(
        commandRequest: Request<CloseBlackMarketCommandRequest>,
    ): CloseBlackMarketCommandRequest {
        // TODO: Validate
        return commandRequest as CloseBlackMarketCommandRequest;
    }
}
