import { clamp } from "lodash";
import { sleep } from "./funcs";

interface IncrementStrategy {
  getNextIncr(): number;
  hasReachedLimit(): boolean;
}

export class DiminishingRetry {
  constructor(private incrementStrategy: IncrementStrategy) {}

  async run<T extends unknown>(func: () => T): Promise<T | undefined> {
    let result: T | undefined = undefined;
    while (!this.incrementStrategy.hasReachedLimit()) {
      result = await func();
      if (result != null) break;
      await sleep(this.incrementStrategy.getNextIncr());
    }
    return result;
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
