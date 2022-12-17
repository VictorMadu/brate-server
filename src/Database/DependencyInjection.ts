// import Config from '../Application/Common/Config';
// import ErateDataAccessor from './Erate/ErateDataAccessor';
// import PostgresDb from './PostgresDb';

// export type DbAccessor = {
//     Erate: {
//         Postgres: ErateDataAccessor
//     };
// };

// export type InjectedServices<T extends {}> = T & { Database: Database };

// export default class DependencyInjection {
//     private static DIContainer = { Database: { Erate: {} } } as InjectedServices<{}>;

//     private constructor() {}

//     static async addDatabase<Services extends { config: Config }>(
//         services: Services,
//     ): Promise<InjectedServices<Services>> {
//         const injectedServices = services as InjectedServices<Services>;
//         const DIContainer = DependencyInjection.DIContainer;
//         const Erate = DIContainer.Database.Erate;

//         Erate.Postgres = new PostgresDb(new ErateDataAccessor(services.config).);
//         injectedServices.Database = DIContainer.Database;

//         return injectedServices;
//     }
// }
