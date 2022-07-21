import { Injectable } from "victormadu-nist-core";
import { PoolClient } from "pg";
import {
    blackRates,
    notifications,
    parallelRates,
    price_alerts,
    users,
    wallet_currency_transactions as transactions,
} from "../../utils/postgres-db-types/erate";
import { DeleteExpiredNotificationFnQueryCreator } from "./set-delete-expired-notifications.db";
import { UpdateParallelRatePostgresDbManager } from "./update-parallel-rate.db.manager";

@Injectable()
export class NotificationTriggerAndFunctionDbService {
    private psql!: PoolClient;

    parallel_trigger_check = "parallel_trigger_check";
    black_trigger_check = "black_trigger_check";
    delete_for_expired_notifications = "delete_for_expired_notifications";
    transactions_notification = "transactions_notification";
    store_notification_for_triggered_at = "store_notification_for_triggered_at";
    notify_new_notification = "notify_new_notification";

    constructor(private dbManager: UpdateParallelRatePostgresDbManager) {}

    private async onReady() {
        this.psql = this.dbManager.getPsql();
        await this.startTriggers();
    }

    private async startTriggers() {
        await this.psql.query(
            new ParallelRateInsertAlertTriggerQueryCreator().getQuery(this.parallel_trigger_check)
        );
        await this.psql.query(
            new BlackRateInsertAlertTriggerQueryCreator().getQuery(this.black_trigger_check)
        );
        await this.psql.query(
            new NotificationStoreForTransactionQueryCreator().getQuery(
                this.transactions_notification
            )
        );
        await this.psql.query(
            new NotificationStoreForPriceTriggeredQueryCreator().getQuery(
                this.store_notification_for_triggered_at
            )
        );
        await this.psql.query(
            new NotifyNewNotificationsQueryCreator().getQuery(this.notify_new_notification)
        );
        await this.psql.query(
            new DeleteExpiredNotificationFnQueryCreator().getQuery(
                this.delete_for_expired_notifications
            )
        );
    }

    async deleteExpiredNotification() {
        const result = await this.psql.query(`
            SELECT ${this.delete_for_expired_notifications}()
        `);
        return result;
    }
}

class ParallelRateInsertAlertTriggerQueryCreator {
    getQuery(funcName: string) {
        return `
    CREATE OR REPLACE FUNCTION ${funcName}() RETURNS TRIGGER AS 
    $${funcName}$
    DECLARE
      q RECORD;
      curr_time TIMESTAMPTZ = NOW();
    BEGIN 
      FOR q IN (
        WITH pr AS (
          SELECT DISTINCT
            ON (${parallelRates.currency_id})
            ${parallelRates.currency_id},
            FIRST_VALUE(${parallelRates.rate}) OVER w AS ${parallelRates.rate},
            FIRST_VALUE(${parallelRates.time}) OVER w AS ${parallelRates.time}
          FROM 
            ${parallelRates.$$NAME}
          WINDOW w AS (
            PARTITION BY ${parallelRates.currency_id} 
            ORDER BY ${parallelRates.time} DESC
          )
        )
        SELECT 
          base_t.${parallelRates.currency_id} AS base, 
          quota_t.${parallelRates.currency_id} AS quota,
          quota_t.${parallelRates.rate} / base_t.${parallelRates.rate} AS rate
        FROM pr AS base_t
        CROSS JOIN pr AS quota_t
      )
      LOOP
        UPDATE 
          ${price_alerts.$$NAME}
        SET
          ${price_alerts.triggered_at} = curr_time
        WHERE 
          ${price_alerts.base} = q.base AND 
          ${price_alerts.quota} = q.quota AND 
          ${price_alerts.market_type} = 'P' AND 
          ${price_alerts.triggered_at} IS NULL AND 
          ${price_alerts.deleted_at} IS NULL AND 
          (
            ((${price_alerts.set_rate} <= ${price_alerts.target_rate}) AND (${price_alerts.target_rate} <= q.rate)) OR 
            ((${price_alerts.set_rate} >= ${price_alerts.target_rate}) AND (${price_alerts.target_rate} >= q.rate))
          );
      END LOOP;
      RETURN NEW;
    END;
    $${funcName}$LANGUAGE PLPGSQL;
    
    CREATE OR REPLACE TRIGGER ${funcName}_trigger AFTER INSERT ON ${parallelRates.$$NAME}
    FOR EACH STATEMENT EXECUTE FUNCTION ${funcName}();
    `;
    }
}

class BlackRateInsertAlertTriggerQueryCreator {
    getQuery(funcName: string) {
        return `
      CREATE OR REPLACE FUNCTION ${funcName}() RETURNS TRIGGER AS 
      $${funcName}$
      BEGIN 
        UPDATE 
          ${price_alerts.$$NAME}
        SET
          ${price_alerts.triggered_at} = NOW()
        WHERE 
          ${price_alerts.base} = NEW.${price_alerts.base} AND 
          ${price_alerts.quota} = NEW.${price_alerts.quota} AND 
          ${price_alerts.market_type} = 'B' AND 
          ${price_alerts.triggered_at} IS NULL AND 
          ${price_alerts.deleted_at} IS NULL AND 
          (
            ((${price_alerts.set_rate} <= ${price_alerts.target_rate}) AND (${price_alerts.target_rate} <= NEW.rate)) OR 
            ((${price_alerts.set_rate} >= ${price_alerts.target_rate}) AND (${price_alerts.target_rate} >= NEW.rate))
          );
        RETURN NEW;
      END;
      $${funcName}$LANGUAGE PLPGSQL;
      
      CREATE OR REPLACE TRIGGER ${funcName}_trigger AFTER INSERT ON ${blackRates.$$NAME}
      FOR EACH ROW EXECUTE FUNCTION ${funcName}();
    `;
    }
}

class NotificationStoreForTransactionQueryCreator {
    getQuery(funcName: string) {
        return `
      CREATE OR REPLACE FUNCTION ${funcName}() RETURNS TRIGGER AS
        $${funcName}$
        DECLARE
          transactionWithUser RECORD;
          lastTransaction RECORD;
          msg TEXT = NULL;
          type CHAR(1) = NULL;
        BEGIN
          SELECT ${users.name} INTO transactionWithUser FROM ${users.$$NAME} WHERE ${users.user_id} = NEW.${transactions.transaction_with_id};
          SELECT 
            ${transactions.amount} 
          INTO 
            lastTransaction
          FROM 
            ${transactions.$$NAME}
          WHERE 
            ${transactions.currency_id} = NEW.${transactions.currency_id} AND 
            ${transactions.user_id} = NEW.${transactions.user_id} AND 
            ${transactions.created_at} <= NEW.${transactions.created_at} AND 
            ${transactions.transaction_id} <> NEW.${transactions.transaction_id}
          ORDER BY 
            ${transactions.created_at} DESC
          FETCH FIRST ROW ONLY;

          DECLARE
            transactionUserId uuid = NEW.${transactions.user_id};
            transactionWithUserId uuid = NEW.${transactions.transaction_with_id};
            transactionAmount NUMERIC(39,18) = NEW.${transactions.amount};
            lastTransactionAmount NUMERIC(39,18) = COALESCE(lastTransaction.${transactions.amount}, 0);
            amountDiff TEXT = REGEXP_REPLACE((ABS(transactionAmount - lastTransactionAmount))::TEXT, '(\\d*?\\.\\d+?)0*$', '\\1', 'g');
            currency TEXT = NEW.${transactions.currency_id};
            transactionWithUserName TEXT = transactionWithUser.${users.name};
          BEGIN
            PERFORM pg_notify('notification', transactionUserId || ' ' || transactionWithUserId || ' ' || (transactionAmount)::TEXT || ' ' || (lastTransactionAmount)::TEXT || ' ' || amountDiff || ' ' || currency || ' ' || transactionWithUserName);
            IF ((amountDiff)::NUMERIC(39,18) = 0) OR (transactionAmount < 0)  THEN 
              RAISE EXCEPTION 'Transaction of more than 0 amount of % should be made', currency;
            ELSIF transactionAmount < 0 THEN 
              RAISE EXCEPTION 'Balance cannot be negative';
            ELSE 
              IF transactionUserId = transactionWithUserId  THEN -- self transaction
                type = 'F';
                IF transactionAmount > lastTransactionAmount THEN
                  msg = 'Sucessfully funded your wallet with ' || (amountDiff)::TEXT || ' ' || currency;
                ELSE
                  msg = 'Sucessfully withdrew from your wallet ' || (amountDiff)::TEXT || ' ' || currency;
                END IF;
              ELSE 
                type = 'T';
                IF transactionAmount > lastTransactionAmount THEN
                  msg = 'You received ' || (amountDiff)::TEXT || ' ' || currency || ' from ' || transactionWithUserName;
                ELSE
                  msg = 'You sent ' || (amountDiff)::TEXT || ' ' || currency || ' from ' || transactionWithUserName;
                END IF;
              END IF;

              INSERT INTO ${notifications.$$NAME} (${notifications.user_id}, ${notifications.msg}, ${notifications.type})
              VALUES (transactionUserId, msg, type);
            END IF;
          END;
          RETURN NEW;
        END;
      $${funcName}$LANGUAGE PLPGSQL;

        CREATE OR REPLACE TRIGGER ${funcName}_trigger AFTER INSERT ON ${transactions.$$NAME}
        FOR EACH ROW EXECUTE FUNCTION ${funcName}();
    `;
    }
}

class NotificationStoreForPriceTriggeredQueryCreator {
    getQuery(funcName: string) {
        return `
      CREATE OR REPLACE FUNCTION ${funcName}() RETURNS TRIGGER AS 
      $${funcName}$
      DECLARE
        userId uuid = OLD.${price_alerts.user_id};
        currencyPair TEXT = OLD.${price_alerts.base} || '/' || OLD.${price_alerts.quota};
        setRate NUMERIC(39,18) = OLD.${price_alerts.set_rate};
        targetRate NUMERIC(39,18) = OLD.${price_alerts.target_rate};
        justTriggered BOOL = OLD.${price_alerts.triggered_at} IS NULL AND NEW.${price_alerts.triggered_at} IS NOT NULL;
        targetRateText TEXT = REGEXP_REPLACE((targetRate)::TEXT, '(\\d*?\\.\\d+?)0*$', '\\1', 'g');
        marketType CHAR(1) = OLD.${price_alerts.market_type};
      BEGIN
        IF justTriggered THEN 
          DECLARE
            marketText TEXT;
            priceDirection TEXT;
          BEGIN
            IF targetRate > setRate THEN 
              priceDirection = 'has gone above';
            ELSE
              priceDirection = 'has gone below';
            END IF;
            IF marketType = 'B' THEN
              marketText = 'in black market';
            ELSE
              marketText = 'in parallel market';
            END IF;
            INSERT INTO 
              ${notifications.$$NAME} 
              (${notifications.user_id},${notifications.type},${notifications.msg})
            VALUES 
              (userId, 'P', 'Price of ' || currencyPair || ' ' || marketText || ' ' || priceDirection || ' ' || targetRateText);
          END;
        END IF;
        RETURN NEW;
      END;
      $${funcName}$ LANGUAGE PLPGSQL;
      
      CREATE OR REPLACE TRIGGER ${funcName}_trigger AFTER UPDATE ON ${price_alerts.$$NAME}
      FOR EACH ROW EXECUTE FUNCTION ${funcName}();
    `;
    }
}

class NotifyNewNotificationsQueryCreator {
    getQuery(funcName: string) {
        return `
      CREATE OR REPLACE FUNCTION ${funcName}() RETURNS TRIGGER AS 
      $${funcName}$
      BEGIN
        PERFORM pg_notify('new_notification', (NEW.${notifications.user_id} || ' ' || NEW.${notifications.notification_id}));
      RETURN NEW;
      END;
      $${funcName}$ LANGUAGE PLPGSQL;
      
      CREATE OR REPLACE TRIGGER ${funcName}_trigger AFTER INSERT ON ${notifications.$$NAME}
      FOR EACH ROW EXECUTE FUNCTION ${funcName}();
    `;
    }
}
