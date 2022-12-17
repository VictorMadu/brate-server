export default class DependencyInjection {
    static getMediator() {
        return {
            Authentication: new Authentication(),
        };
    }
}
