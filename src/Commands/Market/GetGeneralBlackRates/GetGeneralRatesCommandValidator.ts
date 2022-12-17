import { Request } from '../../Common/Interfaces/Request';
import {
    GetGeneralRatesCommandRequest,
    GetGeneralRatesCommandResponse,
} from './GetGeneralRatesCommand';

import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class CurrencyModificationCommandValidator
    implements CommandHandler<GetGeneralRatesCommandRequest, GetGeneralRatesCommandResponse>
{
    constructor(
        private decorated: CommandHandler<
            GetGeneralRatesCommandRequest,
            GetGeneralRatesCommandResponse
        >,
    ) {}

    handle(
        _commandRequest: Request<GetGeneralRatesCommandRequest>,
    ): Promise<GetGeneralRatesCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(
        commandRequest: Request<GetGeneralRatesCommandRequest>,
    ): GetGeneralRatesCommandRequest {
        // TODO: Validate
        return commandRequest as GetGeneralRatesCommandRequest;
    }
}
