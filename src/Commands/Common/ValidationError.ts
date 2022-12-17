abstract class ValidationError extends Error {}

export class InvalidName extends ValidationError {}

export class InvalidPhone extends ValidationError {}

export class InvalidEmail extends ValidationError {}

export class InvalidPassword extends ValidationError {}

export class InvalidOTP extends ValidationError {}

export class InvalidToken extends ValidationError {}

export class InvalidIsBank extends ValidationError {}
