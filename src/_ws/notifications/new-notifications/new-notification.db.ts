import { filter } from "lodash";
import { Injectable } from "nist-core/injectables";
import { Notification, PoolClient } from "pg";
import { notifications } from "../../../utils/postgres-db-types/erate";
import { PostgresHeplper } from "../../../utils/postgres-helper";
import { PostgresDbManager } from "../db-manager.db";

type Channels = "new_notification";

export interface Observable {
  subscribe: (channel: Channels, handler: (payload?: string) => any) => Observable;
  unsubscribe: (channel: Channels, handler: (payload?: string) => any) => Observable;
}

interface Emitter {
  emit: (channel: Channels, payload?: string) => Emitter;
}

interface Listener {
  notify: (userId: string, notificationId: string) => any;
}

@Injectable()
export class NewNotificationDbService {
  private psql!: PoolClient;
  private listeners: Set<Listener> = new Set();
  constructor(private db: PostgresDbManager, private helper: PostgresHeplper) {}

  private async onReady() {
    this.psql = this.db.getPsql();
    await this.listenToNewNotification();
  }

  async getNotificationOfUser(userId: string, notificationId: string) {
    const result = await this.psql.query<{
      id: string;
      created_at: number;
      msg: string;
      type: "P" | "T" | "F";
    }>(`
      SELECT 
        ${notifications.notification_id} as id,
        EXTRACT(EPOCH FROM ${notifications.created_at}) as created_at,
        ${notifications.msg} as msg,
        ${notifications.type} as type
      FROM 
        ${notifications.$$NAME}
      WHERE
        ${notifications.user_id} = ${this.helper.sanitize(userId)} AND
        ${notifications.notification_id} = ${this.helper.sanitize(notificationId)}
    `);

    return this.helper.getFirstRow(result);
  }

  listen(listener: Listener) {
    this.listeners.add(listener);
  }

  unlisten(listener: Listener) {
    this.listeners.delete(listener);
  }

  private async listenToNewNotification() {
    this.psql.on("notification", (message) => {
      if (message.channel !== "new_notification") return;
      this.handleNewNotification(message);
    });
    await this.psql.query("LISTEN new_notification");
  }

  private handleNewNotification(message: Notification) {
    const [userId, notificationId] = this.getPayload(message);
    const listenerIterator = this.listeners.values();
    let listener: Listener;
    while ((listener = listenerIterator.next().value)) {
      listener.notify(userId, notificationId);
    }
  }

  private getPayload(message: Notification) {
    const payload = message.payload as string;
    return payload.split(" ") as [string, string];
  }
}
