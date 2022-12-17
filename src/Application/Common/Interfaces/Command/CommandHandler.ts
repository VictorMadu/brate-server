export interface CommandHandler<CommandRequest extends unknown, CommandResponse extends unknown> {
    handle(_commandRequest: CommandRequest): Promise<CommandResponse>;
}
