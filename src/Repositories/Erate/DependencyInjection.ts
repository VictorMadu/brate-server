import { QueryResult } from 'pg';
import UserRepository from '../../Application/Common/Interfaces/Repositories/UserRepository';
import ErateDataAccessor from '../../Database/Erate/ErateDataAccessor';
import PostgresDb from '../../Database/PostgresDb';
import { Runner } from '../../databases/db';
import NotificationRepository from '../../services/notifications/notification-repository';
import AlertRepository from './ErateAlertRepository';
import MarketRepository from './ErateMarketRepository';
import TradeRepository from './ErateTradeRepository';
import ErateUserRepository from './ErateUserRepository';
import ErateUserVerificationRepository from './ErateUserVerificationRepository';
import WalletRepository from './ErateWalletRepository';
import CurrenciesRepository from './ErrateCurrencyPairRepository';

export interface EratePostgresRepositories {
    getUserRepository: () => UserRepository;
    getMarketRepository: () => MarketRepository;
    getNotificationRepository: () => NotificationRepository;
    getTradeRepository: () => TradeRepository;
    getWalletRepository: () => WalletRepository;
    getCurrenciesRepository: () => CurrenciesRepository;
    getUserVerificationRepository: () => ErateUserVerificationRepository;
    getAlertRepository: () => AlertRepository;
}

export type InjectedServices<T extends {}> = T & {
    Repositories: { Erate: { Postgres: EratePostgresRepositories } };
};

export default class DependencyInjection {
    private static Container = {
        Repositories: { Erate: { Postgres: {} } },
    } as InjectedServices<{}>;

    private constructor() {}

    static async addRepository<Services extends { runner: Runner<string, QueryResult<any>> }>(
        services: Services,
    ): Promise<InjectedServices<Services>> {
        const EratePostgres = DependencyInjection.Container.Repositories.Erate.Postgres;

        EratePostgres.getUserRepository = () => new ErateUserRepository(services.runner);
        EratePostgres.getMarketRepository = () => new MarketRepository(services.runner);
        EratePostgres.getUserVerificationRepository = () =>
            new ErateUserVerificationRepository(services.runner);
        EratePostgres.getNotificationRepository = () => new NotificationRepository(services.runner);
        EratePostgres.getTradeRepository = () => new TradeRepository(services.runner);
        EratePostgres.getWalletRepository = () => new WalletRepository(services.runner);
        EratePostgres.getCurrenciesRepository = () => new CurrenciesRepository(services.runner);
        EratePostgres.getAlertRepository = () => new AlertRepository(services.runner);

        (services as InjectedServices<Services>).Repositories =
            DependencyInjection.Container.Repositories;
        return services as InjectedServices<Services>;
    }
}
