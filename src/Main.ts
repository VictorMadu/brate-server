import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import LoginCommandHandler from './Commands/Authentication/Login/LoginCommandHandler';
import { LoginCommandValidator } from './Commands/Authentication/Login/LoginCommandValidator';
import RegisterCommandHandler from './Commands/Authentication/Register/RegisterCommandHandler';
import { RegisterCommandValidator } from './Commands/Authentication/Register/RegisterCommandValidator';
import SendOTPCommandHandler from './Commands/Authentication/SendOTP/SendOTPCommandHandler';
import { SendOTPCommandValidator } from './Commands/Authentication/SendOTP/SendOTPCommandValidator';
import VerifyOTPCommandHandler from './Commands/Authentication/VerifyOTP/VerifyOTPCommandHandler';
import { VerifyOTPCommandValidator } from './Commands/Authentication/VerifyOTP/VerifyOTPCommandValidator';
import ErateDataAccessor from './Database/Erate/ErateDataAccessor';
import PostgresDb from './Database/PostgresDb';
import BcryptHashManager from './Infrastructure/BcryptHashManager';
import GoogleMailer from './Infrastructure/GoogleMailer';
import JWTAuthTokenManager from './Infrastructure/JWTAuthTokenManager';
import RandomNumPasswordGenerator from './Infrastructure/RandomNumPasswordGenerator';
import ErateRepositoryDI from './Repositories/Erate/DependencyInjection';
import ErateUserRepository from './Repositories/Erate/ErateUserRepository';
import Config from './Application/Common/Config';
import { RefreshTokenCommandValidator } from './Commands/Authentication/RefreshToken/RefreshTokenCommandValidator';
import RefreshTokenCommandHandler from './Commands/Authentication/RefreshToken/RefreshTokenCommandHandler';
import helmet from 'helmet';
import UpdateDbCurrenciesManager from './Commands/CurrencyPairs/UpdateDbCurrencies/UpdateDbCurrenciesManager';
import UpdateDbCurrenciesCommandHandler from './Commands/CurrencyPairs/UpdateDbCurrencies/UpdateDbCurrenciesHandler';
import CurrencyRetrievalManager from './Commands/CurrencyPairs/CurrencyRetrieval/CurrencyRetrievalManager';
import { CurrencyRetrievalCommandValidator } from './Commands/CurrencyPairs/CurrencyRetrieval/CurrencyRetrievalCommandValidator';
import CurrencyRetrievalCommandHandler from './Commands/CurrencyPairs/CurrencyRetrieval/CurrencyRetrievalCommandHandler';
import cron from 'node-cron';
import fs from 'node:fs';
import UpdateParallelMarketCommandHandler from './Commands/Market/UpdateParallelMarketAndTriggerAllAlerts/UpdateParallelMarketCommandHandler';
import { GetOfficialRatesCommandValidator } from './Commands/Market/GetOfficialRates/GetOfficialRatesValidator';
import GetOfficialRatesCommandHandler from './Commands/Market/GetOfficialRates/GetOfficialRatesHandler';
import { GetSpecificRatesCommandValidator } from './Commands/Market/GetSpecificBlackRates/GetSpecificRatesCommandValidator';
import GetSpecificRatesCommandHandler from './Commands/Market/GetSpecificBlackRates/GetSpecificRatesCommandHandler';
import { OpenBlackMarketCommandValidator } from './Commands/Market/OpenBlackMarket/OpenMarketCommandValidator';
import OpenBlackMarketCommandHandler from './Commands/Market/OpenBlackMarket/OpenMarketCommandHandler';
import { CloseBlackMarketCommandValidator } from './Commands/Market/CloseBlackMarket/CloseMarketCommandValidator';
import CloseBlackMarketCommandHandler from './Commands/Market/CloseBlackMarket/CloseMarketCommandHandler';
import { SetAlertCommandValidator } from './Commands/Alert/SetAlert/SetAlertCommandValidator';
import SetAlertCommandHandler from './Commands/Alert/SetAlert/SetAlertCommandHandler';
import { DeleteAlertCommandValidator } from './Commands/Alert/DeleteAlert/DeleteAlertCommandValidator';
import DeleteAlertCommandHandler from './Commands/Alert/DeleteAlert/DeleteAlertCommandHandler';
import { SetAlertCommandRequest } from './Commands/Alert/SetAlert/SetAlertCommand';
import { GetAlertsCommandValidator } from './Commands/Alert/GetAlerts/GetAlertsCommandValidator';
import GetAlertsCommandHandler from './Commands/Alert/GetAlerts/GetAlertsCommandHandler';
import BankProfileRetrievalCommandHandler from './Commands/Profile/BankProfileRetrievalCommand/BankProfileRetrievalCommandHandler';
import { BankProfileRetrievalCommandValidator } from './Commands/Profile/BankProfileRetrievalCommand/BankProfieRetrievalCommandValidator';
import NotificationRetrievalCommandHandler from './Commands/Notification/NotificationRetrieval/NotificationRetrievalCommandHandler';
import { NotificationRetrievalCommandValidator } from './Commands/Notification/NotificationRetrieval/NotificationRetrievalCommandValidator';
import { DeleteAlertCommandRequest } from './Commands/Alert/DeleteAlert/DeleteAlertCommand';

main();
async function main() {
    const app = express();

    const config = new Config();
    const erateDataAccessor = new ErateDataAccessor(config);

    await erateDataAccessor.initialize();
    const postgresDb = new PostgresDb(erateDataAccessor);

    const withRepsoitoryService = await ErateRepositoryDI.addRepository({ runner: postgresDb });
    const repositories = withRepsoitoryService.Repositories.Erate.Postgres;

    const bcryptHashManager = new BcryptHashManager(config);
    const randomNumPasswordGenerator = new RandomNumPasswordGenerator();
    const googleMailer = new GoogleMailer();
    const jwtAuthTokenManager = new JWTAuthTokenManager(config);

    //  ================================ Middleware ====================================

    app.use(express.json());

    app.use((req, res, next) => {
        console.log('\n\n\nREQUEST');
        console.log('path', req.path);
        console.log('method', req.method);
        console.log('query', req.query);
        console.log('params', req.params);
        console.log('body', req.body);
        console.log('authorization', req.headers['authorization']);
        console.log('origin', req.headers['origin']);
        next();
    });

    app.use((req, res, next) => {
        const method = req.method?.toUpperCase?.();
        const origin = req.headers['origin'];

        console.log('Here in CORS', method, origin, config.get('allowedOrigins'));

        if (origin != null && config.get('allowedOrigins').has(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', '*');

            console.log('Here in CORS');
        }

        if (method === 'OPTIONS') {
            return res.status(204).setHeader('Content-Length', '0').end();
        } else return next();
    });

    app.use(helmet());

    //  ======================= Reoutes =============================================

    app.use((req, res, next) => {
        console.log('\n\n\nREQUEST2');
        console.log('path', req.path);
        console.log('method', req.method);
        console.log('query', req.query);
        console.log('params', req.params);
        console.log('body', req.body);
        next();
    });

    const registerCommand = new RegisterCommandValidator(
        new RegisterCommandHandler(
            repositories.getUserRepository(),
            bcryptHashManager,
            randomNumPasswordGenerator,
            googleMailer,
            jwtAuthTokenManager,
        ),
    );

    app.post(
        '/v1/auth/sign-up',
        handleError(async (req, res) => {
            const result = await registerCommand.handle({
                email: req.body?.email,
                password: req.body?.password,
                name: req.body?.name,
                phone: req.body?.phone,
                isBank: req.body?.isBank,
            });
            console.log('result', result);
            res.status(201).send(result);
        }),
    );

    const sendOTPCommand = new SendOTPCommandValidator(
        new SendOTPCommandHandler(
            repositories.getUserVerificationRepository(),
            bcryptHashManager,
            randomNumPasswordGenerator,
            googleMailer,
        ),
    );

    app.post(
        '/v1/auth/send-otp/:email',
        handleError(async (req, res) => {
            await sendOTPCommand.handle({
                email: req.params?.email,
            });

            res.status(204).end();
        }),
    );

    const verifyOTPCommand = new VerifyOTPCommandValidator(
        new VerifyOTPCommandHandler(
            repositories.getUserRepository(),
            repositories.getUserVerificationRepository(),
            bcryptHashManager,
            jwtAuthTokenManager,
        ),
    );

    app.post(
        '/v1/auth/verify-otp',
        handleError(async (req, res) => {
            const result = await verifyOTPCommand.handle({
                email: req.body?.email,
                otp: req.body?.otp,
            });
            console.log('result', result);
            res.status(200).send(result);
        }),
    );

    const retrieveCurrenciesCommand = new CurrencyRetrievalCommandValidator(
        new CurrencyRetrievalCommandHandler(repositories.getCurrenciesRepository()),
    );

    app.get(
        '/v1/currency',
        handleError(async (req, res) => {
            const result = await retrieveCurrenciesCommand.handle({});
            res.status(200).send(result);
        }),
    );

    // const refreshTokenCommand = new RefreshTokenCommandValidator(
    //     new RefreshTokenCommandHandler(jwtAuthTokenManager),
    // );

    // app.post(
    //     '/v1/auth/refresh-token',
    //     handleError(async (req, res) => {
    //         const result = await refreshTokenCommand.handle({
    //             authToken: req.headers.authorization?.split(' ')[1],
    //         });

    //         res.status(200).send(result);
    //     }),
    // );

    const loginCommand = new LoginCommandValidator(
        new LoginCommandHandler(
            repositories.getUserRepository(),
            repositories.getUserVerificationRepository(),
            bcryptHashManager,
            jwtAuthTokenManager,
        ),
    );

    app.post(
        '/v1/auth/login',
        handleError(async (req, res) => {
            const result = await loginCommand.handle({
                email: req.body?.email,
                password: req.body?.password,
            });

            res.status(200).send(result);
        }),
    );

    const bankProfileCommand = new BankProfileRetrievalCommandValidator(
        new BankProfileRetrievalCommandHandler(repositories.getUserRepository()),
    );

    app.get(
        '/v1/banks',
        handleError(async (req, res) => {
            const result = await bankProfileCommand.handle({
                limit: req.query.limit,
                offset: req.query.offset,
            });

            console.log('v1/banks', result);

            res.status(200).send(result);
        }),
    );

    const getOfficialRatesCommand = new GetOfficialRatesCommandValidator(
        new GetOfficialRatesCommandHandler(repositories.getMarketRepository()),
    );

    app.get(
        '/v1/rates/official',
        handleError(async (req, res) => {
            const result = await getOfficialRatesCommand.handle({
                intervalInSecs: req.query.intervalInSecs,
                base: req.query.base,
                quota: req.query.quota as string[] | undefined,
                minCreatedAt:
                    req.query.minCreatedAt == null
                        ? undefined
                        : new Date(req.query.minCreatedAt as string),
                maxCreatedAt:
                    req.query.maxCreatedAt == null
                        ? undefined
                        : new Date(req.query.maxCreatedAt as string),
                historyLength: req.query.historyLength,
            });

            console.log('h/rates/official result', result);

            res.status(200).send(result);
        }),
    );

    const getBankRatesCommand = new GetSpecificRatesCommandValidator(
        new GetSpecificRatesCommandHandler(repositories.getMarketRepository()),
    );
    app.get(
        '/v1/rates/banks',
        handleError(async (req, res) => {
            const result = await getBankRatesCommand.handle({
                userIds: req.query.userIds as string[] | undefined,
                bankRateIds: req.query.bankRateIds as string[] | undefined,
                baseIds: (req.query.baseIds as string[] | undefined)?.map((id) => +id),
                quotaIds: (req.query.quotaIds as string[] | undefined)?.map((id) => +id),
                minRate: req.query.minRate as string | undefined,
                maxRate: req.query.maxRate as string | undefined,
                minCreatedAt:
                    req.query.minCreatedAt == null
                        ? undefined
                        : new Date(req.query.minCreatedAt as string),
                maxCreatedAt:
                    req.query.maxCreatedAt == null
                        ? undefined
                        : new Date(req.query.maxCreatedAt as string),
                historyMaxSize: +(req.query.historyMaxSize as string),
                totalLimit: +(req.query.totalLimit as string),
                intervalInSecs: +(req.query.intervalInSecs as string),
            });

            console.log('h/rates/official result', result);
            res.status(200).send(result);
        }),
    );

    const openBankRateCommand = new OpenBlackMarketCommandValidator(
        new OpenBlackMarketCommandHandler(repositories.getMarketRepository(), jwtAuthTokenManager),
    );

    app.post(
        '/v1/rates/banks/open',
        handleError(async (req, res) => {
            const result = await openBankRateCommand.handle({
                authToken: req.headers.authorization?.split(' ')[1] as string,
                baseCurrencyId: req.body.baseCurrencyId as number,
                quotaCurrencyId: req.body.quotaCurrencyId as number,
                rate: req.body.rate as number,
            });

            console.log('/v1/rates/banks/open', result);
            res.status(200).send(result);
        }),
    );

    const closeBankRateCommand = new CloseBlackMarketCommandValidator(
        new CloseBlackMarketCommandHandler(repositories.getMarketRepository()),
    );

    app.post(
        '/v1/rates/banks/close',
        handleError(async (req, res) => {
            const result = await closeBankRateCommand.handle({
                authToken: req.headers.authorization?.split(' ')[1] as string,
                baseCurrencyId: req.body.baseCurrencyId as number,
                quotaCurrencyId: req.body.quotaCurrencyId as number,
            });

            console.log('/v1/rates/banks/:bankId/open', result);
            res.status(200).send(result);
        }),
    );

    const setAlertCommand = new SetAlertCommandValidator(
        new SetAlertCommandHandler(repositories.getAlertRepository(), jwtAuthTokenManager),
    );

    app.post(
        '/v1/alerts',
        handleError(async (req, res) => {
            const type = req.body.type as 'official' | 'bank';
            let inData = {} as SetAlertCommandRequest;

            if (type === 'official') {
                inData = {
                    authToken: req.headers.authorization?.split(' ')[1] as string,
                    official: {
                        baseCurrencyId: req.body.baseCurrencyId,
                        quotaCurrencyId: req.body.quotaCurrencyId,
                        targetRate: req.body.targetRate,
                    },
                };
            } else {
                inData = {
                    authToken: req.headers.authorization?.split(' ')[1] as string,
                    bank: {
                        bankUserId: req.body.bankUserId,
                        baseCurrencyId: req.body.baseCurrencyId,
                        quotaCurrencyId: req.body.quotaCurrencyId,
                        targetRate: req.body.targetRate,
                    },
                };
            }

            const result = await setAlertCommand.handle(inData);

            res.status(200).send(result);
        }),
    );

    const deleteAlertCommand = new DeleteAlertCommandValidator(
        new DeleteAlertCommandHandler(repositories.getAlertRepository(), jwtAuthTokenManager),
    );

    app.delete(
        '/v1/alerts',
        handleError(async (req, res) => {
            const type = req.body.type as 'official' | 'bank';

            let inData = {} as DeleteAlertCommandRequest;

            if (type === 'official') {
                inData = {
                    authToken: req.headers.authorization?.split(' ')[1] as string,
                    official: {
                        rateAlertId: req.body.rateAlertIds as string,
                    },
                };
            } else {
                inData = {
                    authToken: req.headers.authorization?.split(' ')[1] as string,
                    bank: {
                        rateAlertId: req.body.rateAlertIds as string,
                    },
                };
            }

            const result = await deleteAlertCommand.handle(inData);

            res.status(200).send(result);
        }),
    );

    const getAlertsCommand = new GetAlertsCommandValidator(
        new GetAlertsCommandHandler(repositories.getAlertRepository(), jwtAuthTokenManager),
    );

    app.get(
        '/v1/alerts',
        handleError(async (req, res) => {
            const result = await getAlertsCommand.handle({
                authToken: req.headers.authorization?.split(' ')[1] as string,
                pageOffset: +(req.query.pageOffset as string),
                pageCount: +(req.query.pageCount as string),
                baseCurrencyId:
                    req.query.baseId == null ? undefined : [+(req.query.baseId as string)],
                quotaCurrencyId:
                    req.query.quotaId == null ? undefined : [+(req.query.quotaId as string)],

                minCreatedAt:
                    req.query.minCreatedAt == null
                        ? undefined
                        : new Date(req.query.minCreatedAt as string),
                maxCreatedAt:
                    req.query.maxCreatedAt == null
                        ? undefined
                        : new Date(req.query.maxCreatedAt as string),
                minTriggeredAt:
                    req.query.minTriggeredAt == null
                        ? undefined
                        : new Date(req.query.minTriggeredAt as string),
                maxTriggeredAt:
                    req.query.maxTriggeredAt == null
                        ? undefined
                        : new Date(req.query.maxTriggeredAt as string),
                unTriggeredOnly:
                    req.query.unTriggeredOnly === 'y'
                        ? true
                        : req.query.unTriggeredOnly === 'n'
                        ? false
                        : undefined,
                triggeredOnly:
                    req.query.unTriggeredOnly === 'y'
                        ? true
                        : req.query.unTriggeredOnly === 'n'
                        ? false
                        : undefined,
                rateAlertIds: req.query.rateAlertIds as string[] | undefined,
            });

            res.status(200).send(result);
        }),
    );

    const notificationRetrievalCommand = new NotificationRetrievalCommandValidator(
        new NotificationRetrievalCommandHandler(repositories.getNotificationRepository()),
    );

    app.get(
        '/v1/notifications',
        handleError(async (req, res) => {
            const result = await notificationRetrievalCommand.handle({
                authToken: req.headers.authorization?.split(' ')[1] as string,
                pageOffset: +(req.query.pageOffset as string),
                pageCount: +(req.query.pageCount as string),
            });

            res.status(200).send(result);
        }),
    );

    const updateCurrencyNamesCommand = new UpdateDbCurrenciesCommandHandler(
        repositories.getCurrenciesRepository(),
        config,
    );

    const args = new Set(process.argv);

    try {
        if (args.has('--seed-currencies')) {
            const result = await updateCurrencyNamesCommand.handle({});
            console.log(result);
        }
    } catch (error) {
        console.error(error);
    }

    const updateParallelRate = new UpdateParallelMarketCommandHandler(
        config,
        repositories.getMarketRepository(),
        repositories.getCurrenciesRepository(),
        repositories.getAlertRepository(),
    );

    const parallelRateUpdateTask = cron.schedule(
        '1 * * * * *',
        () => {
            console.log('Here');
            updateParallelRate.handle({});
        },
        {
            scheduled: false,
        },
    );

    // process.on('exit', () => exitHandler('Exit'));
    // process.on('SIGINT', () => exitHandler('SIGINT'));
    // process.on('SIGTERM', () => exitHandler('SIGTERM'));
    // process.on('SIGQUIT', () => exitHandler('SIGQUIT'));

    // process.on('SIGUSR1', () => exitHandler('SIGUSR1'));
    // process.on('SIGUSR2', () => exitHandler('SIGUSR2'));
    // process.on('SIGHUP', () => exitHandler('SIGHUP'));

    // process.on('uncaughtException', (error) => {
    //     console.error('error', error);
    //     exitHandler('uncaughtException');
    // });

    let hasCleanedUp = false;
    async function exitHandler(msg: string) {
        if (hasCleanedUp === true) return;
        else hasCleanedUp = true;

        await Promise.all([erateDataAccessor.close(), parallelRateUpdateTask.stop()]);
        process.exit(0);
    }

    // parallelRateUpdateTask.start();

    app.listen(config.get('port'), () => {
        console.log('Server listening to PORT', config.get('port'));
    });
}

function handleError(requestHandler: (req: Request, res: Response) => Promise<any>) {
    return async (req: Request, res: Response) => {
        try {
            await requestHandler(req, res);
        } catch (error) {
            console.log('error', error);
            res.status(500).send({
                constructor: error?.constructor?.name,
                message: error?.message,
            });
        }
    };
}
