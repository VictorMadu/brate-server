import { Injectable } from "nist-core/injectables";
import { DbService } from "./sign-in.db";
import v from "validator";
import { AuthManagerService } from "../../utils/auth-manager.service";
import bcrypt from "bcryptjs";

interface ServiceInData {
  email: string;
  password: string;
}

interface OutData {
  token: string;
  expires_in: number;
}

@Injectable()
export class Service {
  constructor(
    private dbService: DbService,
    private authManager: AuthManagerService
  ) {}

  async handle(
    inData: ServiceInData
  ): Promise<[number, string, OutData | undefined]> {
    const validator = new InDataValidator(inData);
    const errMsg = validator.validate();
    if (errMsg) return [400, errMsg, undefined];

    const userData = await this.dbService.getUserDataFromEmail(inData);
    if (!userData) return [400, "Wrong email or password", undefined];

    const isMatched = await this.comparePwd(inData, userData.password);
    if (!isMatched) return [400, "Wrong email or password", undefined];
    const tokenData = this.signUserData(userData.user_id);
    return [
      200,
      "Successful",
      { token: tokenData.token, expires_in: tokenData.expiresIn },
    ];
  }

  private async comparePwd(inData: ServiceInData, userPwd: string | undefined) {
    if (!userPwd) return false;
    return await bcrypt.compare(inData.password, userPwd);
  }

  private signUserData(userId: string) {
    return this.authManager.sign({ userId });
  }
}

class InDataValidator {
  constructor(private inData: ServiceInData) {}

  validate() {
    if (!v.isEmail(this.inData.email)) return "Email is invalid";
    return undefined;
  }
}
