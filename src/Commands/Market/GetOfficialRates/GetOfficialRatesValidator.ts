import { Request } from '../../Common/Interfaces/Request';
import {
    GetOfficialRatesCommandRequest,
    GetOfficialRatesCommandResponse,
} from './GetOfficialRatesCommand';

import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class GetOfficialRatesCommandValidator
    implements CommandHandler<GetOfficialRatesCommandRequest, GetOfficialRatesCommandResponse>
{
    constructor(
        private decorated: CommandHandler<
            GetOfficialRatesCommandRequest,
            GetOfficialRatesCommandResponse
        >,
    ) {}

    handle(
        _commandRequest: Request<GetOfficialRatesCommandRequest>,
    ): Promise<GetOfficialRatesCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(
        commandRequest: Request<GetOfficialRatesCommandRequest>,
    ): GetOfficialRatesCommandRequest {
        // TODO: Validate
        return commandRequest as GetOfficialRatesCommandRequest;
    }
}
