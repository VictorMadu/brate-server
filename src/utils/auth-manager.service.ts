import { Inject, Injectable } from "nist-core/injectables";
import { ConfigService } from "./config-factory.service";
import { IAuthHeader, UserData } from "./interfaces/auth-manager.inteface";
import * as jwt from "jsonwebtoken";

type PartialUserData = Partial<UserData>;

const JWT_SECRET_KEY = "jwt.secretKey";
const DEFAULT_PARSED_TOKEN: PartialUserData = {};
const EXPIRE_IN = 15 * 60 * 60; // 15 mins;

@Injectable()
export class AuthManagerService {
  private jwtSecretKey: string;
  constructor(private config: ConfigService) {
    this.jwtSecretKey = config.get(JWT_SECRET_KEY);
  }

  parse(authToken: string): PartialUserData {
    return this.parseToken(authToken);
  }

  sign(userData: UserData) {
    return jwt.sign(userData, this.jwtSecretKey, {
      expiresIn: EXPIRE_IN,
    });
  }

  private parseToken(token: string | undefined): PartialUserData {
    try {
      const parsedToken = this.verifyAndParseToken(token);
      return this.isParsedTokenExpired(parsedToken) ? DEFAULT_PARSED_TOKEN : parsedToken;
    } catch (error) {
      return DEFAULT_PARSED_TOKEN;
    }
  }

  private verifyAndParseToken(token: string | undefined) {
    return this.parseJwtToken(token ?? "") as jwt.JwtPayload & PartialUserData;
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
