export default class Notification {
    static InvalidToken = class extends Error {};
    static InvalidDateTimeFrom = class extends Error {};
    static InvalidDateTimeTo = class extends Error {};
    static InvalidType = class extends Error {};
    static InvalidPageOffset = class extends Error {};
    static InvalidPageCount = class extends Error {};
}
