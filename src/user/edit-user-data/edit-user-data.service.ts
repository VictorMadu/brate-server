import { Injectable } from "nist-core/injectables";
import { AuthManagerService } from "../../utils/auth-manager.service";
import { DbService } from "./edit-user-data.db";

interface ServiceInData {
  authToken: string;
  phone?: string;
  email?: string;
  name?: string;
}

@Injectable()
export class Service {
  constructor(private dbService: DbService, private authManager: AuthManagerService) {}

  async handle(inData: ServiceInData): Promise<[number, string]> {
    const userId = this.authManager.parse(inData.authToken).userId;
    if (!userId) return [401, "authentication Failed"];

    const isSuccessful = await this.dbService.editUserData({
      userId,
      ...inData,
    });

    if (isSuccessful) return [200, "Successful"];
    return [400, "Failed"];
  }
}
