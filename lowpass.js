/*
A Single-Pole Low Pass Filter
Formula for coefficients taken from R. Boulanger, 2011, p.486
Filter acts on a one sample delay affected by pole coefficients
*/
export default class Lowpass {
  constructor(sampleRate, cutoffFreq) {
    this.prev = 0;
    this.sampleRate = sampleRate;
    this.setCutoffFreq(cutoffFreq);
  }

  setCutoffFreq(cutoffFreq) {
    this.cutoffFreq = cutoffFreq;
    const costh = 2 - Math.cos(2 * Math.PI * this.cutoffFreq / this.sampleRate);
    this.coef = Math.sqrt(costh * costh - 1) - costh;
  }

  process(input) {
    this.prev = input * (1 + this.coef) - (this.prev * this.coef);
    return this.prev;
  }
}
