import { Request } from '../../Common/Interfaces/Request';
import { GetAlertCommandRequest, GetAlertCommandResponse } from './GetAlertsCommand';

import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class CurrencyModificationCommandValidator
    implements CommandHandler<GetAlertCommandRequest, GetAlertCommandResponse>
{
    constructor(
        private decorated: CommandHandler<GetAlertCommandRequest, GetAlertCommandResponse>,
    ) {}

    handle(_commandRequest: Request<GetAlertCommandRequest>): Promise<GetAlertCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(commandRequest: Request<GetAlertCommandRequest>): GetAlertCommandRequest {
        // TODO: Validate
        return commandRequest as GetAlertCommandRequest;
    }
}
