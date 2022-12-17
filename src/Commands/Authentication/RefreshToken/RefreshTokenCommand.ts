export interface RefreshTokenCommandRequest {
    authToken: string;
}

export interface RefreshTokenCommandResponse {
    token: string;
    tokenExpiryAt: Date;
}
