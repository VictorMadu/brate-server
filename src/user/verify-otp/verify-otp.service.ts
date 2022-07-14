import { Injectable } from "victormadu-nist-core";
import { DbService } from "./verify-otp.db";
import v from "validator";
import { AuthManagerService } from "../../utils/auth-manager.service";

interface ServiceInData {
    email: string;
    otp: string;
    includeToken: boolean;
}

interface UserData {
    userId: string;
}

interface OutData {
    token?: string;
    expires_in?: number;
}

@Injectable()
export class Service {
    constructor(private dbService: DbService, private authManager: AuthManagerService) {}

    async handle(inData: ServiceInData): Promise<[number, string, OutData | undefined]> {
        const errRes = this.validateAndReturnErrResIfAny(inData);
        if (errRes) return errRes;

        if (inData.includeToken) return await this.verifyUserAndReturnTokenIfVerifed(inData);
        return await this.verifyUserAndReturnIfVerifed(inData);
    }

    private async verifyUserAndReturnTokenIfVerifed(
        inData: ServiceInData
    ): Promise<[number, string, OutData | undefined]> {
        const userData = await this.dbService.verifyUserAndReturnUserData(inData);
        if (userData) {
            const tokenData = this.authManager.sign({ userId: userData });
            return [
                200,
                "Your email has been successfully verified",
                { token: tokenData.token, expires_in: tokenData.expiresIn },
            ];
        }
        return [400, "Your email was not succesfully verified", undefined];
    }

    private async verifyUserAndReturnIfVerifed(
        inData: ServiceInData
    ): Promise<[number, string, OutData | undefined]> {
        const isVerifed = await this.dbService.verifyUserAndReturnIfVerifed(inData);
        if (isVerifed) return [200, "Your email has been successfully verified", {}];
        return [400, "Your email was not succesfully verified", undefined];
    }

    private validateAndReturnErrResIfAny(
        inData: ServiceInData
    ): [number, string, undefined] | undefined {
        const validator = new InDataValidator(inData);
        const errMsg = validator.validate();
        if (errMsg) return [400, errMsg, undefined];
        return undefined;
    }
}

class InDataValidator {
    constructor(private inData: ServiceInData) {}

    validate() {
        if (!v.isEmail(this.inData.email)) return "Email is invalid";
        if (!v.isAlphanumeric(this.inData.otp)) return "OTP is invalid";
        return undefined;
    }
}
