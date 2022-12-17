import { Request } from '../../Common/Interfaces/Request';
import {
    GetSpecificBlackRatesCommandRequest,
    GetSpecificBlackRatesCommandResponse,
} from './GetSpecificRatesCommand';

import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class GetSpecificRatesCommandValidator
    implements
        CommandHandler<GetSpecificBlackRatesCommandRequest, GetSpecificBlackRatesCommandResponse>
{
    constructor(
        private decorated: CommandHandler<
            GetSpecificBlackRatesCommandRequest,
            GetSpecificBlackRatesCommandResponse
        >,
    ) {}

    handle(
        _commandRequest: Request<GetSpecificBlackRatesCommandRequest>,
    ): Promise<GetSpecificBlackRatesCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(
        commandRequest: Request<GetSpecificBlackRatesCommandRequest>,
    ): GetSpecificBlackRatesCommandRequest {
        // TODO: Validate
        return commandRequest as GetSpecificBlackRatesCommandRequest;
    }
}
