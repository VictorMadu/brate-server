import { clamp } from "lodash";
import { OrWithPromise } from "ts-util-types";
import { sleep } from "./funcs";

export interface IncrementStrategy {
  getNextIncr(): number;
  hasReachedLimit(): boolean;
}

export class DiminishingRetry<T extends Exclude<unknown, undefined>> {
  private result: T | undefined = undefined;
  constructor(private incrementStrategy: IncrementStrategy) {}

  static async getReturnValue<T extends Exclude<unknown, undefined>>(
    incrementStrategy: IncrementStrategy,
    func: () => OrWithPromise<T | undefined>
  ) {
    const diminishingRetry = new DiminishingRetry<T>(incrementStrategy);
    await diminishingRetry.run(func);
    return diminishingRetry.getFuncReturnValue();
  }

  async run(func: () => OrWithPromise<T | undefined>) {
    this.result = undefined;

    while (this.hasNotReachedRetryLimit() && this.hasFuncReturnedValue()) {
      this.result = await func();
      await this.waitBeforeRetry();
    }

    return this;
  }

  hasFuncReturnedValue() {
    return this.result != null;
  }

  getFuncReturnValue() {
    return this.result;
  }

  private hasNotReachedRetryLimit() {
    return !this.incrementStrategy.hasReachedLimit();
  }

  private async waitBeforeRetry() {
    return sleep(this.incrementStrategy.getNextIncr());
  }
}

export class MultipleIncr implements IncrementStrategy {
  private multiple = 0;
  private curr: number;
  // Time in ms
  constructor(private start: number, private step: number, private stop = Number.MAX_SAFE_INTEGER) {
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
