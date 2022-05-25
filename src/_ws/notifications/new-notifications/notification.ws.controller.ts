import { SendFn } from "nist-fastify-adapter/injectables/interface/ws.param.decorator.interface";
import { WsController, setWsConfig } from "nist-fastify-adapter/injectables/ws-controller";
import * as WsMethods from "nist-fastify-adapter/injectables/ws.method.decorators";
import * as WsParams from "nist-fastify-adapter/injectables/ws.param.decorators";
import { redis } from "../../../user/get-ws-ticket/get-ws-ticket.db";
import WebSocket from "ws";
import { NewNotificationService } from "./notification.service";
import { NEW_NOTIFICATION } from "../constants/event";

@WsController()
export class NewNotificationController {
  constructor(private service: NewNotificationService) {}

  // TODO: Inside of decorator parameters use class instance
  @WsMethods.Type(NEW_NOTIFICATION)
  notify(
    @WsParams.Send() send: SendFn,
    @WsParams.Ws() ws: WebSocket,
    @WsParams.UserData() data: { userId: string }
  ) {
    this.service.attach(data.userId, [ws, send]);
  }
}

// TODO: Use a class here to
setWsConfig(
  {
    path: "/",
    authAndGetUserDetails: async (req) => {
      const ip = req.socket.remoteAddress;
      if (!ip) return undefined;
      const userId = await redis.get("ws:ticket:" + ip);
      console.log("ws userId", userId);
      if (userId == null) return undefined;

      return { userId };
    },
    heartbeat: 4000,
  },
  [NewNotificationController]
);
