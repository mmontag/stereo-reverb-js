const Allpass = require("allpass.js");
const Comb = require("comb.js");
const DelayLine = require("delay-line.js");
const Lowpass = require("lowpass.js");
const MultiTapDelay = require("multi-tap-delay.js");

const NUM_COMBS = 6;
const NUM_ALLPASSES = 1;
const NUM_LOWPASSES = 6;

// 18-tap early reflections from "About This Reverberation Business" (Moorer 1979)
const ER_DELAYS = [
  0.0043, 0.0215, 0.0225, 0.0268, 0.0270, 0.0298,
  0.0458, 0.0485, 0.0572, 0.0587, 0.0595, 0.0612,
  0.0707, 0.0708, 0.0726, 0.0741, 0.0753, 0.0797,
];
const ER_GAINS = [
  0.8410, 0.5040, 0.4910, 0.3790, 0.3800, 0.3460,
  0.2890, 0.2720, 0.1920, 0.1930, 0.2170, 0.1810,
  0.1800, 0.1810, 0.1760, 0.1420, 0.1670, 0.1340,
];


//constructor setting initial values for comb delays and gains
//comb delays must be mutually prime
//
//  Comb 1  : 50.0 msec delay
//  Comb 2  : 56.0 msec delay
//  Comb 3  : 61.0 msec delay
//  Comb 4  : 68.0 msec delay
//  Comb 5  : 72.0 msec delay
//  Comb 6  : 78.0 msec delay
//  APF 1   : 6.0 msec delay, gain 0.707
//  LPF 1-6 : low pass filter values for each comb feedback loop
//  SR      : 44100KHz
//  RT60    : default of 3 seconds
//  LD      : Late Delay ration between onset of late tail and ER

export default class StereoReverb {
  constructor(sampleRate = 44100, rt60 = 3.0) {
    const allpassDelayMs = 6.0;
    const allpassGain = 0.707;
    const lateReflDelay = 10.0;
    const maxDelayMs = 100;

    this.bypass = false;
    this.sampleRate = sampleRate;
    this.decayFactor = rt60;
    this.combs = [
      [50.0, 4942],
      [56.0, 4363],
      [61.0, 4312],
      [68.0, 4574],
      [72.0, 3981],
      [78.0, 4036],
    ].map(([delayMs, lowpassCutoff]) => {
      const gain = StereoReverb.calcCombGain(delayMs, this.decayFactor);
      return new Comb(this.sampleRate, delayMs, maxDelayMs, gain, lowpassCutoff);
    });
    for (let i = 0; i < this.combs.length; i++) {
      this.setCombDelay(i, delayMs);
    }

    this.allpass = new Allpass(sampleRate, allpassDelayMs, 20, allpassGain);
    this.earlyReflDelay = new MultiTapDelay(sampleRate, ER_DELAYS, ER_GAINS);
    this.lateReflDelay = new DelayLine(sampleRate, lateReflDelay);

  }

  static calcCombGain(delayMs, rt60) {
    return Math.pow(10, ((-3 * delayMs) / (rt60 * 1000)));
  }

  setDecayFactor(df) {
    this.decayFactor = df;
    this.combs.forEach(combFilter => {
      combFilter.setGain(StereoReverb.calcCombGain(combFilter.getDelayMs(), this.decayFactor));
    });
  }

  setCombDelay(id, delayMs) {
    const combFilter = this.combs[id];
    combFilter.setGain(StereoReverb.calcCombGain(delayMs, this.decayFactor));
    combFilter.setDelayMs(delayMs);
  }

  setAllpassGain(id, g) {

  }

  setAllpassDelay(id, sr, delayMs) {

  }

  setBypass(bp) {
    this.bypass = bp;
  }

  setLPFreq(lpf) {

  }

  process(input) {
    if (this.bypass) return input;

    const tapped = this.earlyReflDelay.process(input) + input;
    let combed = 0;
    this.combs.forEach(comb => {
      combed += comb.next(tapped * 0.25);
    });
    const allpassed = this.allpass.process(combed);
    const delayed = this.lateReflDelay.process(allpassed);
    return tapped * 0.25 + delayed;
  }
}
