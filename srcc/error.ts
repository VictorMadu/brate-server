export class App extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class Validation extends App {
    constructor(message: string) {
        super(message);
    }
}

export class BadRequest extends App {
    constructor(message: string) {
        super(message);
    }
}

export class Database extends App {
    constructor(message: string) {
        super(message);
    }
}
