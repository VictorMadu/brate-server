import { Injectable } from "nist-core/injectables";
import { DbService } from "./sign-up.db";
import v from "validator";
import { cloneDeep } from "lodash";
import { generateOneTimePwd } from "../../utils/funcs";

interface ServiceInData {
  name: string;
  password: string;
  email: string;
  phone: string;
}

@Injectable()
export class Service {
  constructor(private dbService: DbService) {}

  async handle(inData: ServiceInData): Promise<[number, string]> {
    const errMsg = this.validateData(inData);
    const cleanedInData = this.sanitizeData(inData);

    if (errMsg) return [400, errMsg];

    // TODO: Test whether this method is more performant than checking if email have been created before
    try {
      return await this.createUser(cleanedInData);
    } catch (error) {
      return [400, "User with email already exists"];
    }
  }

  private async createUser(inData: ServiceInData): Promise<[number, string]> {
    const userData = await this.dbService.query(await this.addOneTimePwd(inData));
    if (!userData) return [400, "Unknown error. Contact team immediately"];

    // TODO: Get user email and token from userData and send to user mail for verification
    return [
      200,
      "User successfully created. Enter the one time password sent to your email for verification",
    ];
  }

  private validateData(inData: ServiceInData): string | void {
    if (!v.isEmail(inData.email)) return "Email is not valid";
    if (!v.isMobilePhone(inData.phone)) return "Phone is not valid";
    if (!v.isAlphanumeric(inData.name)) return "Name is not valid";
  }

  // TODO: Santiize
  private sanitizeData(inData: ServiceInData): ServiceInData {
    const sanitizedData = cloneDeep(inData);
    return sanitizedData;
  }

  private async addOneTimePwd(inData: ServiceInData) {
    return {
      ...inData,
      one_time_pwd: await generateOneTimePwd(),
    };
  }
}
