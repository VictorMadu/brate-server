import { Injectable } from "nist-core/injectables";
import { DbService } from "./sign-up.db";
import v from "validator";
import { cloneDeep } from "lodash";
import { generateOneTimePwd } from "../../utils/funcs";
import bcrypt from "bcryptjs";
import { ConfigService } from "../../utils/config-service";

interface ServiceInData {
  name: string;
  password: string;
  email: string;
  phone: string;
}

@Injectable()
export class Service {
  private pwdSaltRound: number;
  constructor(private dbService: DbService, private configService: ConfigService) {
    this.pwdSaltRound = configService.get("bcrypt.saltRounds");
  }

  async handle(inData: ServiceInData): Promise<[number, string]> {
    const errMsg = this.validateData(inData);
    const cleanedInData = await this.sanitizeData(inData);

    if (errMsg) return [400, errMsg];

    // TODO: Test whether this method is more performant than checking if email have been created before
    return await this.createUser(cleanedInData);
  }

  private async createUser(inData: ServiceInData): Promise<[number, string]> {
    const inDataWithOTP = await this.addOneTimePwd(inData);
    const userData = await this.dbService.query(inDataWithOTP);
    if (!userData) return [400, "User with email may already exists"];

    this.sendOTPToUserEmail({ email: userData.email, otp: inDataWithOTP.one_time_pwd });

    // TODO: Send OTP to user through email
    return [
      200,
      "User successfully created. Enter the one time password sent to your email for verification",
    ];
  }

  private async sendOTPToUserEmail(payload: { email: string; otp: string }) {
    // TODO: Send OTP to User Email
    console.log("user email and otp", payload.email, payload.otp);
  }

  private validateData(inData: ServiceInData): string | void {
    if (!v.isEmail(inData.email)) return "Email is not valid";
    if (!v.isMobilePhone(inData.phone)) return "Phone is not valid";
    if (!v.isAlpha(inData.name, undefined, { ignore: " " })) return "Name is not valid";
  }

  private async sanitizeData(inData: ServiceInData) {
    const sanitizedData = cloneDeep(inData);

    sanitizedData.password = await this.getHashedPwd(inData);
    return sanitizedData;
  }

  // TODO: Hash password with the other bcrypt library which is faster
  private async getHashedPwd(inData: ServiceInData) {
    return await bcrypt.hash(inData.password, this.pwdSaltRound);
  }

  private async addOneTimePwd(inData: ServiceInData) {
    return {
      ...inData,
      one_time_pwd: await generateOneTimePwd(),
    };
  }
}
