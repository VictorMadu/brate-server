import { Request } from '../../Common/Interfaces/Request';
import { DeleteAlertCommandRequest, DeleteAlertCommandResponse } from './DeleteAlertCommand';

import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class DeleteAlertCommandValidator
    implements CommandHandler<DeleteAlertCommandRequest, DeleteAlertCommandResponse>
{
    constructor(
        private decorated: CommandHandler<DeleteAlertCommandRequest, DeleteAlertCommandResponse>,
    ) {}

    handle(
        _commandRequest: Request<DeleteAlertCommandRequest>,
    ): Promise<DeleteAlertCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(
        commandRequest: Request<DeleteAlertCommandRequest>,
    ): DeleteAlertCommandRequest {
        // TODO: Validate
        return commandRequest as DeleteAlertCommandRequest;
    }
}
