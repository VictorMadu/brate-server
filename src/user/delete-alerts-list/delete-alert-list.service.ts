import { Injectable } from "nist-core/injectables";
import { InnerValue } from "ts-util-types";
import { AuthParserService } from "../../../utils/auth-manager.service";
import { DbService } from "./delete-alert-list.db";
import { Headers, Query, Response } from "./interface";

@Injectable()
export class Service {
  constructor(private dbService: DbService, private authParser: AuthParserService) {}

  async handle(
    headers: Headers,
    query: Query
  ): Promise<[number, string, Response["data"] | undefined]> {
    const userId = this.authParser.parseFromHeader(headers).userId;
    if (!userId) return [401, "", undefined];

    const ids = this.getIds(query);
    const result: number = await this.dbService.query({
      ids,
    });

    return [
      200,
      "",
      {
        delete_count: result,
      },
    ];
  }

  getIds(query: Query) {
    if (query.ids) return query.ids;
    if (query.id) return [query.id];
    return [];
  }
}
