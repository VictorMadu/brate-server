import { Injectable } from "victormadu-nist-core";
import { DbService } from "./send-one-time-pwd.db";
import v from "validator";
import { generateOneTimePwd } from "../../utils/funcs";

interface ServiceInData {
    email: string;
}

interface OutData {
    oneTimePwd: string;
    email: string;
}

@Injectable()
export class Service {
    constructor(private dbService: DbService) {}

    async handle(inData: ServiceInData): Promise<[number, string]> {
        const validator = new InDataHelper(inData);
        const errMsg = validator.validate();

        if (errMsg) return [400, errMsg];
        const inDataWithOTP = await validator.addOneTimePwd();
        const otpAndEmail: OutData | undefined = await this.dbService.saveAndReturnOTPAndEmail(
            inDataWithOTP
        );
        return this.returnAction(otpAndEmail);
    }

    private async returnAction(outData?: OutData) {
        if (outData) return this.actionIfSuccess(outData);
        else return this.actionIfUnsuccess();
    }

    private async actionIfSuccess(outData: OutData): Promise<[number, string]> {
        await this.sendOTPtoUserEmail(outData);
        return [200, "Token was successfully generated. Check your email"];
    }

    private actionIfUnsuccess(): [number, string] {
        return [400, "Token was not successfully generated. Try again"];
    }

    private async sendOTPtoUserEmail(outData: OutData) {
        console.log("OTP data details", outData);
        // TODO: Send one_time_pwd to use
    }
}

class InDataHelper {
    constructor(private inData: ServiceInData) {}

    validate() {
        if (!v.isEmail(this.inData.email)) return "Email is invalid";
        return undefined;
    }

    async addOneTimePwd() {
        return { ...this.inData, one_time_pwd: await generateOneTimePwd() };
    }
}
