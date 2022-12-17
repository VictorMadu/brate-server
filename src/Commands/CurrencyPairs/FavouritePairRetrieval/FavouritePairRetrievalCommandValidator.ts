import { Request } from '../../Common/Interfaces/Request';
import {
    FavouritePairRetrievalCommandRequest,
    FavouritePairRetrievalCommandResponse,
} from './FavouritePairRetrievalCommand';

import _ from 'lodash';
import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';

export class FavouritePairModificationCommandValidator
    implements
        CommandHandler<FavouritePairRetrievalCommandRequest, FavouritePairRetrievalCommandResponse>
{
    constructor(
        private decorated: CommandHandler<
            FavouritePairRetrievalCommandRequest,
            FavouritePairRetrievalCommandResponse
        >,
    ) {}

    handle(
        _commandRequest: Request<FavouritePairRetrievalCommandRequest>,
    ): Promise<FavouritePairRetrievalCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    // TODO: Validate
    private validate(
        commandRequest: Request<FavouritePairRetrievalCommandRequest>,
    ): FavouritePairRetrievalCommandRequest {
        return commandRequest as FavouritePairRetrievalCommandRequest;
    }
}
