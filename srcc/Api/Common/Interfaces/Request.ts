export default interface Request {
    body: any;
    query: any;
    params: any;
    headers: Record<string, any>;
}
