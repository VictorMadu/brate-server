import { Request } from '../../Common/Interfaces/Request';
import {
    NotificationRetrievalCommandRequest,
    NotificationRetrievalCommandResponse,
} from './NotificationRetrievalCommand';

import _ from 'lodash';
import { CommandHandler } from '../../../Application/Common/Interfaces/Command/CommandHandler';
import Notification from '../../../Application/Common/Errors/Domain/Notification';

export class NotificationRetrievalCommandValidator
    implements
        CommandHandler<NotificationRetrievalCommandRequest, NotificationRetrievalCommandResponse>
{
    constructor(
        private decorated: CommandHandler<
            NotificationRetrievalCommandRequest,
            NotificationRetrievalCommandResponse
        >,
    ) {}

    handle(
        _commandRequest: Request<NotificationRetrievalCommandRequest>,
    ): Promise<NotificationRetrievalCommandResponse> {
        return this.decorated.handle(this.validate(_commandRequest));
    }

    private validate(
        commandRequest: Request<NotificationRetrievalCommandRequest>,
    ): NotificationRetrievalCommandRequest {
        if (!_.isString(commandRequest.authToken)) {
            throw new Notification.InvalidToken();
        } else if (!_.isDate(commandRequest.dateTimeFrom)) {
            throw new Notification.InvalidDateTimeFrom();
        } else if (!_.isDate(commandRequest.dateTimeTo)) {
            throw new Notification.InvalidDateTimeTo();
        } else if (!_.isDate(commandRequest.type)) {
            throw new Notification.InvalidType();
        } else if (!_.isDate(commandRequest.pageOffset)) {
            throw new Notification.InvalidPageOffset();
        } else if (!_.isDate(commandRequest.pageCount)) {
            throw new Notification.InvalidPageCount();
        }
        return commandRequest as NotificationRetrievalCommandRequest;
    }
}
