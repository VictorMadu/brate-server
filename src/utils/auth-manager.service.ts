import { Inject, Injectable } from "nist-core/injectables";
import { ConfigService } from "./config-factory.service";
import { IAuthHeader, IParsedToken } from "./interfaces/auth-manager.inteface";
import * as jwt from "jsonwebtoken";

const AUTH_HEADER_KEY = "authorization";
const JWT_SECRET_KEY = "jwt.secretKey";
const DEFAULT_PARSED_TOKEN: IParsedToken = {};

@Injectable()
export class AuthParserService {
  private jwtSecretKey: string;
  constructor(private config: ConfigService) {
    this.jwtSecretKey = config.get(JWT_SECRET_KEY);
  }

  parseFromHeader(header: IAuthHeader): IParsedToken {
    const token = this.getToken(header);
    return this.parseToken(token);
  }

  private getToken(header: IAuthHeader) {
    return header[AUTH_HEADER_KEY];
  }

  private parseToken(token: string | undefined): IParsedToken {
    try {
      const parsedToken = this.verifyAndParseToken(token);
      return this.isParsedTokenExpired(parsedToken) ? DEFAULT_PARSED_TOKEN : parsedToken;
    } catch (error) {
      return DEFAULT_PARSED_TOKEN;
    }
  }

  private verifyAndParseToken(token: string | undefined) {
    return this.parseJwtToken(token ?? "") as jwt.JwtPayload & IParsedToken;
  }

  private parseJwtToken(token: string) {
    return jwt.verify(token ?? "", this.jwtSecretKey);
  }

  private isParsedTokenExpired(parsedToken: jwt.JwtPayload) {
    return new Date().getTime() > this.getParsedTokenExpireTime(parsedToken) ? true : false;
  }

  private getParsedTokenExpireTime(parsedToken: jwt.JwtPayload) {
    return parsedToken.exp ?? 0 * 1000;
  }
}
