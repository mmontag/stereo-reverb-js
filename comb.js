const DelayLine = require("delay-line.js");
const Lowpass = require("lowpass.js");

/*
 The comb filter class sets delay and gain while passing its
 output through a low pass filter to mimic the effect of
 sound travel through air, attenuating high frequency energy.

 The comb filter process involves reading the delay at the
 current readindex position (delay->readDelay), scaling this
 delay value by the combs gain (gain*dL) passing this value
 through the low pass filter and writing this value back
 into the delay line at the appropriate write position.
 */
export default class Comb {
  constructor(sampleRate, delayMs, maxDelayMs, gain, cutoffFreq) {
    this.sampleRate = sampleRate;
    this.delayMs = delayMs;
    this.gain = gain;
    this.delayLine = new DelayLine(sampleRate, delayMs, maxDelayMs);
    this.lowpass = new Lowpass(sampleRate, cutoffFreq);
  }

  getGain() {
    return this.gain;
  }

  getDelayMs() {
    return this.delayLine.getDelayMs();
  }

  setGain(gain) {
    this.gain = gain;
  }

  setDelayMs(delayMs) {
    return this.delayLine.setDelayMs(delayMs);
  }

  setCutoffFreq(cutoffFreq) {
    return this.lowpass.setCutoffFreq(cutoffFreq);
  }

  process(input) {
    const delayed = this.delayLine.readDelay();
    const attenuated = delayed * this.gain;
    const lowpassed = this.lowpass.process(attenuated);
    const feedback = input + lowpassed;
    this.delayLine.writeDelay(feedback);
    return delayed;
  }
}