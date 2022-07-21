import { clamp } from "lodash";
import { OrWithPromise } from "ts-util-types";
import { sleep } from "./funcs";

export interface IncrementStrategy {
    getNextIncr(): number;
    hasReachedLimit(): boolean;
}

export class DiminishingRetry<T extends Exclude<unknown, undefined>> {
    private result: T | undefined = undefined;

    private constructor(
        private incrementStrategy: IncrementStrategy,
        private func: () => OrWithPromise<T | undefined>
    ) {}

    static async getReturnValue<T extends Exclude<unknown, undefined>>(
        incrementStrategy: IncrementStrategy,
        func: () => OrWithPromise<T | undefined>
    ) {
        const diminishingRetry = new DiminishingRetry<T>(incrementStrategy, func);
        await diminishingRetry.run();
        return diminishingRetry.getFuncReturnValue();
    }

    private async run() {
        while (this.hasNotReachedRetryLimit() && this.hasNotReturned()) {
            await this.runFunc();
            await this.waitBeforeNextRetry();
        }
        return this;
    }

    private hasNotReachedRetryLimit() {
        return !this.incrementStrategy.hasReachedLimit();
    }

    private hasNotReturned() {
        return this.result == null;
    }

    private async waitBeforeNextRetry() {
        return sleep(this.incrementStrategy.getNextIncr());
    }

    private async runFunc() {
        this.result = await this.func();
    }

    private getFuncReturnValue() {
        return this.result;
    }
}

export class MultipleIncr implements IncrementStrategy {
    private multiple = 0;
    private curr: number;
    // Time in ms
    constructor(
        private start: number,
        private step: number,
        private stop = Number.MAX_SAFE_INTEGER
    ) {
        this.curr = start;
    }

    private increment() {
        if (this.hasReachedLimit()) return;

        this.multiple++;
        const nextIncr = this.curr + this.multiple * this.step;

        if (this.start < this.stop) this.curr = clamp(nextIncr, this.start, this.stop);
        else this.curr = clamp(nextIncr, this.stop, this.start);
    }

    getNextIncr() {
        this.increment();
        return this.curr;
    }

    hasReachedLimit() {
        return this.curr === this.stop;
    }
}
