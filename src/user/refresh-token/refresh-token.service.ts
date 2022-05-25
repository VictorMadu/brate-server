import { Injectable } from "nist-core/injectables";
import v from "validator";
import { AuthManagerService } from "../../utils/auth-manager.service";

interface ServiceInData {
  authToken: string;
}

interface OutData {
  token: string;
  expires_in: number;
}

@Injectable()
export class Service {
  constructor(private authManager: AuthManagerService) {}

  async handle(
    inData: ServiceInData
  ): Promise<[number, string, OutData | undefined]> {
    const userId = this.authManager.parse(inData.authToken).userId;
    if (!userId) return [401, "Unsuccessful", undefined];

    const tokenData = this.authManager.sign({ userId });
    return [
      200,
      "Successful",
      { token: tokenData.token, expires_in: tokenData.expiresIn },
    ];
  }
}
