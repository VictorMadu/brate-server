export default interface HashManager {
    isMatch(password: string, hashedPassword: string): Promise<boolean>;

    hashAsync(password: string): Promise<string>;
}
