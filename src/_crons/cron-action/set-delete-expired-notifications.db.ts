import { web_clients, notifications } from "../../utils/postgres-db-types/erate";

export class DeleteExpiredNotificationFnQueryCreator {
  getQuery(funcName: string) {
    return `
      CREATE OR REPLACE FUNCTION ${funcName}() RETURNS VOID AS 
      $${funcName}$
      DECLARE
        q RECORD;
        delete_now_at TIMESTAMPTZ = NOW();
      BEGIN
        FOR q in (
          SELECT 
            ${web_clients.user_id},
            ${web_clients.remove_trade_notification_after},
            ${web_clients.remove_price_alert_notification_after},
            ${web_clients.remove_fund_notification_after}
          FROM
            ${web_clients.$$NAME}
          WHERE 
            ${web_clients.remove_trade_notification_after} IS NOT NULL OR
            ${web_clients.remove_price_alert_notification_after} IS NOT NULL OR
            ${web_clients.remove_fund_notification_after} IS NOT NULL
        )
        LOOP 
          IF q.${web_clients.remove_trade_notification_after} IS NOT NULL THEN
          UPDATE
            ${notifications.$$NAME} AS __n
          SET
            ${notifications.deleted_at} = delete_now_at
          WHERE
            __n.${notifications.user_id} = q.${web_clients.user_id} AND
            __n.${notifications.type} = 'T' AND
            EXTRACT(EPOCH FROM __n.${notifications.created_at}) + q.${web_clients.remove_trade_notification_after} <= EXTRACT(EPOCH FROM delete_now_at);
          END IF;

          IF q.${web_clients.remove_price_alert_notification_after} IS NOT NULL THEN
          UPDATE
            ${notifications.$$NAME} AS __n
          SET
            ${notifications.deleted_at} = delete_now_at
          WHERE
            __n.${notifications.user_id} = q.${web_clients.user_id} AND
            __n.${notifications.type} = 'P' AND
            EXTRACT(EPOCH FROM __n.${notifications.created_at}) + q.${web_clients.remove_price_alert_notification_after} <= EXTRACT(EPOCH FROM delete_now_at);
          END IF;

          IF q.${web_clients.remove_fund_notification_after} IS NOT NULL THEN
          UPDATE
            ${notifications.$$NAME} AS __n
          SET
            ${notifications.deleted_at} = delete_now_at
          WHERE
            __n.${notifications.user_id} = q.${web_clients.user_id} AND
            __n.${notifications.type} = 'F' AND
            EXTRACT(EPOCH FROM __n.${notifications.created_at}) + q.${web_clients.remove_fund_notification_after} <= EXTRACT(EPOCH FROM delete_now_at);
          END IF;
        END LOOP;
        RETURN;
      END;
      $${funcName}$ LANGUAGE PLPGSQL;
    `;
  }
}
