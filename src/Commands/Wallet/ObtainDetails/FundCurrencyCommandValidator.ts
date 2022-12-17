import { Request } from '../../Common/Interfaces/Request';
import {
    ObtainDetailsCurrencyCommandRequest,
    ObtainDetailsCurrencyCommandResponse,
} from './ObtainDetailsCurrencyCommand';

import _ from 'lodash';
import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class ObtainDetailsCurrencyCommandValidator
    implements
        CommandHandler<ObtainDetailsCurrencyCommandRequest, ObtainDetailsCurrencyCommandResponse>
{
    constructor(
        private decorated: CommandHandler<
            ObtainDetailsCurrencyCommandRequest,
            ObtainDetailsCurrencyCommandResponse
        >,
    ) {}

    handle(
        _commandRequest: Request<ObtainDetailsCurrencyCommandRequest>,
    ): Promise<ObtainDetailsCurrencyCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(
        commandRequest: Request<ObtainDetailsCurrencyCommandRequest>,
    ): ObtainDetailsCurrencyCommandRequest {
        // TODO: Validate
        return commandRequest as ObtainDetailsCurrencyCommandRequest;
    }
}
