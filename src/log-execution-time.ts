export async function logExecutionTime<T extends unknown>(
    func: () => T,
    message: string,
): Promise<T> {
    const start = Date.now();
    let end: number;
    let result: T;

    try {
        result = await func();
        end = Date.now();

        console.log(message, end - start, 'ms');
    } catch (error) {
        end = Date.now();

        console.log(message, end - start, 'ms');
        throw error;
    }

    return result;
}
