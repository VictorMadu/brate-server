import { Injectable } from "nist-core/injectables";
import { AuthManagerService } from "../../../utils/auth-manager.service";
import { DbService } from "./delete-alert-list.db";
import { Response } from "./interface";

interface ServiceInData {
  authorization: string;
  ids: string[];
}

@Injectable()
export class Service {
  constructor(private dbService: DbService, private authManager: AuthManagerService) {}

  async handle(inData: ServiceInData): Promise<[number, string, Response["data"] | undefined]> {
    const userId = this.authManager.parse(inData.authorization).userId;
    if (!userId) return [401, "", undefined];

    const result: number = await this.dbService.query({
      ids: inData.ids,
    });

    return [
      200,
      "",
      {
        delete_count: result,
      },
    ];
  }
}
