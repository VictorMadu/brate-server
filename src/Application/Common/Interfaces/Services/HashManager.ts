export default interface HashManager {
    isMatchAsync(password: string, hashedPassword: string): Promise<boolean>;

    hashAsync(password: string): Promise<string>;
}
