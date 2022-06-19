import { Inject, Injectable } from "nist-core/injectables";
import { ConfigService } from "./config-service";
import { IAuthHeader, UserData } from "./interfaces/auth-manager.inteface";
import * as jwt from "jsonwebtoken";

type PartialUserData = Partial<UserData>;

const JWT_SECRET_KEY = "jwt.secretKey";
const DEFAULT_PARSED_TOKEN: PartialUserData = {};
const BCRYPT_EXPIRE_IN_key = "bcrypt.expiryAfter";

@Injectable()
export class AuthManagerService {
  private jwtSecretKey: string;
  private bcryptExipreIn: number;
  constructor(private config: ConfigService) {
    this.jwtSecretKey = config.get(JWT_SECRET_KEY);
    this.bcryptExipreIn = config.get(BCRYPT_EXPIRE_IN_key);
  }

  parse(authToken: string): PartialUserData {
    return this.parseToken(authToken);
  }

  sign(userData: UserData) {
    return {
      expiresIn: Date.now() / 1000 + this.bcryptExipreIn,
      token: jwt.sign(userData, this.jwtSecretKey, {
        expiresIn: this.bcryptExipreIn,
      }),
    };
  }

  private parseToken(token: string | undefined): PartialUserData {
    try {
      if (!token) return DEFAULT_PARSED_TOKEN;
      const parsedToken = this.verifyAndParseToken(token);
      return this.isParsedTokenExpired(parsedToken) ? DEFAULT_PARSED_TOKEN : parsedToken;
    } catch (error) {
      return DEFAULT_PARSED_TOKEN;
    }
  }

  private verifyAndParseToken(token: string) {
    const [bearer, mainToken] = token.split(" ") as [string, string];
    return jwt.verify(mainToken, this.jwtSecretKey) as jwt.JwtPayload & PartialUserData;
  }

  private isParsedTokenExpired(parsedToken: jwt.JwtPayload) {
    return Date.now() >= this.getParsedTokenExpireTime(parsedToken);
  }

  private getParsedTokenExpireTime(parsedToken: jwt.JwtPayload) {
    return (parsedToken.exp ?? 0) * 1000;
  }
}
