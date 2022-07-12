import http from "http";
import _ from "lodash";
import Fastify, { FastifyInstance } from "fastify";
import { FastifyManager } from "../fastify-manager";
import { ConfigService } from "../../utils";

declare global {
    namespace jest {
        interface Matchers<R> {
            toContainInArrAtLeastOneOf: (expected: any[]) => CustomMatcherResult;
        }
    }
}

expect.extend({
    toContainInArrAtLeastOneOf(received: any, itemsToBeAtLeastOneOf: any[]) {
        const isArr = Array.isArray(received);
        const pass = isArr && checkIfInItemsToBeAtLeastOneOf();

        const preExpectedMessage = pass
            ? `Expected array to not contain at least one of: `
            : `Expected array to contain at least one of: `;
        const preReceivedMessage = isArr ? "Received values: " : "Received array";

        function checkIfInItemsToBeAtLeastOneOf() {
            return _.some(received, (item) => isInItemsToBeAtLeastOneOf(item));
        }

        function isInItemsToBeAtLeastOneOf(itemToCheck: any) {
            return _.findIndex(itemsToBeAtLeastOneOf, (item) => _.isEqual(item, itemToCheck));
        }

        function mergeMessage(preMessage: string, value: any) {
            return preMessage + JSON.stringify(value);
        }

        function joinExpectedAndReceivedMessages(expectedMessage: string, receivedMessage: string) {
            return expectedMessage + "\n" + receivedMessage;
        }

        return {
            pass,
            message: () =>
                joinExpectedAndReceivedMessages(
                    mergeMessage(preExpectedMessage, itemsToBeAtLeastOneOf),
                    mergeMessage(preReceivedMessage, received)
                ),
        };
    },
});

describe(`Test for 'FastifyManager'`, () => {
    let fastifyManager: FastifyManager,
        host: string,
        port: number,
        configService: ConfigService,
        isServerStarted = false;

    const mockOnReadyListenerFn1 = jest.fn();
    const mockOnReadyListenerFn2 = jest.fn();

    const mockOnStartListenerFn1 = jest.fn();
    const mockOnStartListenerFn2 = jest.fn();

    const mockOnCloseListenerFn1 = jest.fn();
    const mockOnCloseListenerFn2 = jest.fn();

    beforeAll(async () => {
        const setUp = await getSetUp();
        fastifyManager = setUp.fastifyManager;
        configService = setUp.configService;
        host = setUp.host;
        port = setUp.port;

        fastifyManager
            .addOnReadyListenerFn(mockOnReadyListenerFn1)
            .addOnReadyListenerFn(mockOnReadyListenerFn2)
            .addOnStartListnerFn(mockOnStartListenerFn1)
            .addOnStartListnerFn(mockOnStartListenerFn2)
            .addOnCloseListenerFn(mockOnCloseListenerFn1)
            .addOnCloseListenerFn(mockOnCloseListenerFn2);

        await fastifyManager.listen().then(() => {
            isServerStarted = true;
        });
    });

    afterAll(async () => {
        await fastifyManager.close();
    });

    describe(`Test for 'getFastify'`, () => {
        test(`instance returned should be of 'Fastify'`, () => {
            expect(fastifyManager.getFastify()).toBeDefined(); // TODO: Improve test
        });
    });

    describe(`Test for 'listen'`, () => {
        test(`Server should be listening`, () => {
            expect(isServerStarted).toBe(true);
        });

        test(`Server should be healthy`, async () => {
            expect(await checkIfServerIsListening(fastifyManager)).toBe(true);
        });
    });

    describe(`Test for 'addOnReadyListenerFn'`, () => {
        test.each([mockOnReadyListenerFn1, mockOnReadyListenerFn2])(
            `Listener fn at index %# should be calledce`,
            (mockFn) => {
                expect(mockFn.mock.calls.length).toBe(1);
            }
        );
    });

    describe(`Test for 'addOnServerListenerFn'`, () => {
        test.each([mockOnReadyListenerFn1, mockOnReadyListenerFn2])(
            `Listener fn at index %# should be called`,
            (mockFn) => {
                expect(mockFn.mock.calls.length).toBe(1);
            }
        );
    });

    describe(`Test for cors`, () => {
        const headersWithoutOrigin = {
            "Access-Control-Request-Headers":
                "access-control-allow-origin,authorization,content-type",
            "Access-Control-Request-Method": "GET",
        };

        let allowedUrls: string[];
        let unAllowedUrls: string[];

        beforeAll(() => {
            allowedUrls = configService.get("app.cors");
            unAllowedUrls = allowedUrls.map((allowedUrl) => "http://" + Math.random() + ".com"); // TODO: We can obtain unAllowedUrls in a better way
        });

        test(`Browser should allow acceptable Origin`, async () => {
            for (let i = 0; i < allowedUrls.length; ++i) {
                const allowedUrl = allowedUrls[i];
                const accessControlProps = getAllowedAccessControlPropsForBrowser({
                    ...headersWithoutOrigin,
                    Origin: allowedUrl,
                });
                const resHeaders = await getResponseHeaders({
                    host,
                    port,
                    headers: { ...headersWithoutOrigin, Origin: allowedUrl },
                });

                expect(resHeaders["access-control-allow-headers"]?.split(",")).toEqual(
                    accessControlProps.headers
                );

                expect(
                    resHeaders["access-control-allow-methods"]?.split(",")
                ).toContainInArrAtLeastOneOf(accessControlProps.methods);

                expect(resHeaders["access-control-allow-origin"]).toBe(accessControlProps.origin);
            }
        });

        test(`Browser should not allow unacceptable Origin`, async () => {
            for (let i = 0; i < unAllowedUrls.length; ++i) {
                const unAllowedUrl = unAllowedUrls[i];
                const accessControlProps = getAllowedAccessControlPropsForBrowser({
                    ...headersWithoutOrigin,
                    Origin: unAllowedUrl,
                });
                const resHeaders = await getResponseHeaders({
                    host,
                    port,
                    headers: { ...headersWithoutOrigin, Origin: unAllowedUrl },
                });

                expect(resHeaders["access-control-allow-headers"]?.split(",")).not.toEqual(
                    accessControlProps.headers
                );

                expect(
                    resHeaders["access-control-allow-methods"]?.split(",")
                ).not.toContainInArrAtLeastOneOf(accessControlProps.methods);

                expect(resHeaders["access-control-allow-origin"]).not.toBe(
                    accessControlProps.origin
                );
            }
        });
    });

    describe(`Test for 'addOnCloseListenerFn'`, () => {
        test.each([mockOnCloseListenerFn1, mockOnCloseListenerFn2])(
            `Listener fn at index %# should be called`,
            (mockFn) => {
                expect(mockFn.mock.calls.length).toBe(0);
            }
        );

        describe(`When server is closed`, () => {
            let isServerClosed = false;
            beforeAll(async () => {
                await fastifyManager.close();
                isServerClosed = !(await checkIfServerIsListening(fastifyManager));
            });

            test(`Server should be closed`, () => {
                expect(isServerClosed).toBe(true);
            });

            test.each([mockOnCloseListenerFn1, mockOnCloseListenerFn2])(
                `Listener fn at index %# should be called`,
                (mockFn) => {
                    expect(mockFn.mock.calls.length).toBe(1);
                }
            );
        });
    });
});

//  =========================================== Types ============================================
type CorsReqHeaders = Record<
    "Access-Control-Request-Headers" | "Origin" | "Access-Control-Request-Method",
    string
>;

type CorsResHeaders = Record<
    "access-control-allow-origin" | "access-control-allow-methods" | "access-control-allow-headers",
    string | undefined
>;

interface RequestConfig {
    host: string;
    port: number;
    headers: CorsReqHeaders;
}

interface FastifyManagerServerConfig {
    fastifyManager: FastifyManager;
}

interface ConnectionServerConfig {
    host: string;
    port: number;
}

interface ServerConfig extends FastifyManagerServerConfig, ConnectionServerConfig {}

//  ============================================ Set ups =============================================

async function getSetUp() {
    const configService = new ConfigService();
    const fastifyManager = await FastifyManager.getInstance(configService);

    return {
        fastifyManager,
        host: configService.get("app.host"),
        port: configService.get("app.port"),
        configService,
    };
}

async function checkIfServerIsListening(fastifyManager: FastifyManager) {
    const fastify = fastifyManager.getFastify();
    return fastify.server.listening;
}
async function getResponseHeaders({ host, port, headers }: RequestConfig) {
    const request = http.request({
        method: "OPTIONS",
        port,
        host,
        headers,
    });

    request.end();
    return new Promise<CorsResHeaders>((resolve, reject) => {
        request.on("error", reject);
        request.on("response", (response) => {
            response.resume();
            resolve(<CorsResHeaders>response.headers);
        });
    });
}

function getAllowedAccessControlPropsForBrowser(reqHeaders: CorsReqHeaders) {
    return {
        headers: ["access-control-allow-origin", "authorization", "content-type"],
        methods: reqHeaders["Access-Control-Request-Method"].split(",").map((s) => s.toUpperCase()),
        origin: reqHeaders.Origin,
    };
}

function getUnAllowedAccessControlPropsForBrowser(reqHeaders: CorsReqHeaders) {
    return {
        headers: undefined,
        methods: undefined,
        origin: undefined,
    };
}
