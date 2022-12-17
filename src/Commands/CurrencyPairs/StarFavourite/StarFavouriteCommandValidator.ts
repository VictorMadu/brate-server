import { Request } from '../../Common/Interfaces/Request';
import { StarFavouriteCommandRequest, StarFavouriteCommandResponse } from './StarFavouriteCommand';

import _, { after } from 'lodash';
import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class CurrencyModificationCommandValidator
    implements CommandHandler<StarFavouriteCommandRequest, StarFavouriteCommandResponse>
{
    constructor(
        private decorated: CommandHandler<
            StarFavouriteCommandRequest,
            StarFavouriteCommandResponse
        >,
    ) {}

    handle(
        _commandRequest: Request<StarFavouriteCommandRequest>,
    ): Promise<StarFavouriteCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(
        commandRequest: Request<StarFavouriteCommandRequest>,
    ): StarFavouriteCommandRequest {
        // TODO: Validate
        return commandRequest as StarFavouriteCommandRequest;
    }
}
