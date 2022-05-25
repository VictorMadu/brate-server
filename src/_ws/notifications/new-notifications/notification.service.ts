import { Injectable } from "nist-core/injectables";
import { SendFn } from "nist-fastify-adapter/injectables/interface/ws.param.decorator.interface";
import { WebSocket } from "ws";
import { NEW_NOTIFICATION } from "../constants/event";
import { NewNotificationDbService } from "./new-notification.db";

type UserId = string;

type Listener = [WebSocket, SendFn];

@Injectable()
export class NewNotificationService {
  private wsListeners: Map<UserId, Listener> = new Map();
  constructor(private dbService: NewNotificationDbService) {}

  private onReady() {
    this.dbService.listen(this);
  }

  private onClose() {
    this.dbService.unlisten(this);
  }

  async notify(userId: string, notificationId: string) {
    const listener = this.wsListeners.get(userId);
    if (!listener) return;

    getSendFn(listener)(
      NEW_NOTIFICATION,
      await this.dbService.getNotificationOfUser(userId, notificationId)
    );
  }

  attach(userId: UserId, listener: Listener) {
    this.wsListeners.set(userId, listener);

    getWs(listener).on("close", () => {
      this.wsListeners.delete(userId);
    });
  }
}

function getWs(listener: Listener) {
  return listener[0];
}

function getSendFn(listener: Listener) {
  return listener[1];
}
