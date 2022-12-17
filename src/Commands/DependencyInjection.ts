import { QueryResult } from 'pg';
import UserRepository from '../../Application/Common/Interfaces/Repositories/UserRepository';
import ErateDataAccessor from '../../Database/Erate/ErateDataAccessor';
import PostgresDb from '../../Database/PostgresDb';
import { Runner } from '../../databases/db';
import NotificationRepository from '../../services/notifications/notification-repository';
import MarketRepository from './ErateMarketRepository';
import TradeRepository from './ErateTradeRepository';
import ErateUserRepository from './ErateUserRepository';
import WalletRepository from './ErateWalletRepository';
import CurrenciesRepository from './ErrateCurrencyPairRepository';

export interface Commands {
    getUserRepository: () => UserRepository;
    getMarketRepository: () => MarketRepository;
    getNotificationRepository: () => NotificationRepository;
    getTradeRepository: () => TradeRepository;
    getWalletRepository: () => WalletRepository;
    getCurrenciesRepository: () => CurrenciesRepository;
}

export type InjectedServices<T extends {}> = T & { Repositories: Repositories };

export default class DependencyInjection {
    private static Repositories = {} as Repositories;
    private static singletonInstance: DependencyInjection;

    private constructor() {}

    static getSingletonInstance() {
        if (DependencyInjection.singletonInstance == null) {
            DependencyInjection.singletonInstance = new DependencyInjection();
        }
        return DependencyInjection.singletonInstance;
    }

    async addRepository(runner: Runner<string, QueryResult<any>>) {
        const Repositories = DependencyInjection.Repositories;

        Repositories.getUserRepository = () => new ErateUserRepository(runner);
        Repositories.getMarketRepository = () => new MarketRepository(runner);
        Repositories.getNotificationRepository = () => new NotificationRepository(runner);
        Repositories.getTradeRepository = () => new TradeRepository(runner);
        Repositories.getWalletRepository = () => new WalletRepository(runner);
        Repositories.getCurrenciesRepository = () => new CurrenciesRepository(runner);
        return this;
    }

    getService<T extends {}>(service: T): InjectedServices<T> {
        (service as InjectedServices<T>).Repositories = DependencyInjection.Repositories;
        return service as InjectedServices<T>;
    }
}
