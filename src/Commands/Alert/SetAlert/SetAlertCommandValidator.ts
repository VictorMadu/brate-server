import { Request } from '../../Common/Interfaces/Request';
import { SetAlertCommandRequest, SetAlertCommandResponse } from './SetAlertCommand';

import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class CurrencyModificationCommandValidator
    implements CommandHandler<SetAlertCommandRequest, SetAlertCommandResponse>
{
    constructor(
        private decorated: CommandHandler<SetAlertCommandRequest, SetAlertCommandResponse>,
    ) {}

    handle(_commandRequest: Request<SetAlertCommandRequest>): Promise<SetAlertCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(commandRequest: Request<SetAlertCommandRequest>): SetAlertCommandRequest {
        // TODO: Validate
        return commandRequest as SetAlertCommandRequest;
    }
}
