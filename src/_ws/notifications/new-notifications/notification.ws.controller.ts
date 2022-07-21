import {
    SendData,
    WsController,
    setWsConfig,
    Ws,
    UserData,
    Type,
} from "victormadu-nist-fastify-adapter";
import { redis } from "../../../user/get-ws-ticket/get-ws-ticket.db";
import WebSocket from "ws";
import { NewNotificationService } from "./notification.service";
import { NEW_NOTIFICATION } from "../constants/event";

@WsController()
export class NewNotificationController {
    constructor(private service: NewNotificationService) {}

    // TODO: Inside of decorator parameters use class instance
    @Type(NEW_NOTIFICATION)
    notify(
        @SendData() send: (type: string, data: any) => void,
        @Ws() ws: WebSocket,
        @UserData() data: { userId: string }
    ) {
        console.log("Here with you");
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
