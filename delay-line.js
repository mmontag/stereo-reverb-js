export default class DelayLine {
  constructor(sampleRate = 44100, delayMs = 100, maxDelayMs = 500) {
    this.readPos = 0;
    this.writePos = 0;
    this.sampleRate = sampleRate;
    this.delayMs = delayMs;
    this.maxDelaySamples = Math.ceil(this.toSamples(maxDelayMs));
    this.maxDelayMs = this.maxDelaySamples * 1000 / this.sampleRate;

    this.setDelayMs(delayMs);
    this.buffer = new Float32Array(this.maxDelaySamples);
  }

  static linInterp(x1, x2, y1, y2, x) {
    const denom = x2 - x1;
    if (denom === 0) return y1;
    const dx = (x - x1) / denom;
    return dx * y2 + (1 - dx) * y1;
  }

  toSamples(ms) {
    return ms * 0.001 * this.sampleRate;
  }

  getDelayMs() {
    return this.delayMs;
  }

  getMaxDelayMs() {
    return this.maxDelayMs;
  }

  setDelayMs(delayMs) {
    if (delayMs > this.maxDelayMs) {
      throw new Error(`delayMs (${delayMs}) is greater than ${this.maxDelayMs}.`);
    }

    const delaySamples = this.toSamples(this.delayMs);
    this.delayWhole = Math.floor(delaySamples);
    this.delayFrac = this.delayWhole - delaySamples;

    this.readPos = this.writePos - delaySamples;
    if (this.readPos < 0) {
      this.readPos += this.maxDelaySamples;
    }
  }

  readDelay() {
    const yn = this.buffer[this.readPos];
    const readPosPrev = this.readPos < 1 ? this.maxDelaySamples - 1 : this.readPos - 1;
    const ynPrev = this.buffer[readPosPrev];
    return DelayLine.linInterp(0, 1, yn, ynPrev, this.delayFrac);
  }

  writeDelay(input) {
    this.buffer[this.writePos] = input;
    this.writePos = (this.writePos + 1) % this.maxDelaySamples;
    this.readPos = (this.readPos + 1) % this.maxDelaySamples;
  }

  reset() {
    this.readPos = 0;
    this.writePos = 0;
    this.buffer.fill(0);
  }

  process(input) {
    const out = this.delayWhole === 0 ? input : this.readDelay();
    this.writeDelay(input);
    return out;
  }
}