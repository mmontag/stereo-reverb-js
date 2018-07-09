// TODO: refactor with delay-line.js

export default class MultiTapDelay {
  constructor(sampleRate, tapDelays, tapGains) {
    this.sampleRate = sampleRate;
    this.bufferSize = Math.ceil(this.toSamples(Math.max(...tapDelays)));
    this.maxDelayMs = this.bufferSize * 1000 / this.sampleRate;
    this.taps = tapDelays.map((tapDelay, index) => {
      return { delayMs: tapDelay, gain: tapGains[index] };
    });
    this.writePos = 0;

    this.buffer = new Float32Array(this.bufferSize);
  }

  readBufferLinearInterp(pos) {
    const idx1 = Math.floor(pos);
    const idx2 = (idx1 + 1) % this.bufferSize;
    const coeff1 = pos - idx1;
    const coeff2 = 1 - coeff1;
    return coeff1 * this.buffer[idx1] + coeff2 * this.buffer[idx2];
  }

  toSamples(ms) {
    return ms * 0.001 * this.sampleRate;
  }

  getMaxDelayMs() {
    return this.maxDelayMs;
  }

  getReadPos(delayMs) {
    if (delayMs > this.maxDelayMs) {
      throw new Error(`delayMs (${delayMs}) is greater than ${this.maxDelayMs}.`);
    }

    const delaySamples = this.toSamples(delayMs);
    let readPos = this.writePos - delaySamples;
    if (readPos < 0) {
      readPos += this.bufferSize;
    }
    return readPos;
  }

  readDelayTaps() {
    let accumulated = 0;
    this.taps.forEach(tap => {
      // Update delay for each tap
      const readPos = this.getReadPos(tap.delayMs);
      accumulated += tap.gain * this.readBufferLinearInterp(readPos);
    });
    return accumulated;
  }

  writeDelay(input) {
    this.buffer[this.writePos] = input;
    this.writePos = (this.writePos + 1) % this.bufferSize;
  }

  reset() {
    this.writePos = 0;
    this.buffer.fill(0);
  }

  process(input) {
    const out = this.readDelayTaps();
    this.writeDelay(input);
    return out;
  }
}