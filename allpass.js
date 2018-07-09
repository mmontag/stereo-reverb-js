const DelayLine = require("delay-line.js");

export default class Allpass {
  constructor(sampleRate = 44100, delayMs = 10, maxDelayMs = 100, gain) {
    this.sampleRate = sampleRate;
    this.gain = gain;
    this.delayLine = new DelayLine(this.sampleRate, delayMs, maxDelayMs);
  }
  
  getGain() { 
    return this.gain; 
  }
  
  setGain(gain) {
    this.gain = gain;
  }
  
  setDelayMs(delayMs) {
    return this.delayLine.setDelayMs(delayMs);
  }

  // The all-pass filter process involves reading the delay
  // at the current position (delay->readDelay)
  // scaling this delay value by the comb gain (gain*dL)
  // and writing this value back into the delay line
  // at the appropriate write position.
  process(input) {
    const dl = this.delayLine.readDelay();
    const fw = input + this.gain * dl;
    const out = -this.gain * fw + dl;
    this.delayLine.writeDelay(fw);
    return out;
  }
}