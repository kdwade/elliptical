'use strict';

//load imported modules
let flock  = require('flocking'),
	enviro = flock.init();

const VOL_MULTIPLIER   = .90; //default volume of a new voice
const DEFAULT_VOICE    = 'flock.ugen.sinOsc'; //default oscillator for a new voice

//function to create a voice
function elliptical(freq,voice,pulsePeriod,vol) {
	pulsePeriod = pulsePeriod           || 1;
	voice       = voice                 || DEFAULT_VOICE;
	freq        = freq                  || 330;
	vol         = (vol > 0 ? vol : .02) || 25;

	return {
		ugen: voice, 
	    freq: freq,  
	    rate:'audio',
	    mul: { 
	        ugen: "flock.ugen.asr",
	        start: 0, 
	        attack: 3 * (1 / pulsePeriod), 
	        sustain: vol * VOL_MULTIPLIER,
	        release: 2.5 * (1 / pulsePeriod), 
	        gate: {
	            ugen: "flock.ugen.impulse",
	            rate: "control",
	            freq: .01 * pulsePeriod
	        }
	    },
		phase : {
			ugen: 'flock.ugen.sinOsc',
			freq: {
				ugen     : 'flock.ugen.xLine',
				start    : 0.01,
				end      : 0,
				duration : 1000
			}
		}
	}
}

//function that creates an "elliptical" voice, but changes some of its properties
//so that it will take longer to repeat
function longElliptical(freq,voice,pulsePeriod,vol) {
	let synth = elliptical(freq,voice,pulsePeriod,vol * 2);

	synth.mul.release = 5 * (1 / pulsePeriod);
	synth.mul.attack = 7 * (1 / pulsePeriod);

	return synth;
}

//function that creates a "longElliptical" voice, then makes it last longer
function overlay(freq,voice,pulsePeriod,vol) {
	let synth = longElliptical(freq,voice,pulsePeriod,vol)

	synth.mul.release = 12;

	return synth;
}

//function that creates an "overlay" voice, but modulates its phase
function phasedOverlay(freq,voice,pulsePeriod,vol,phaseMult) {
	phaseMult = phaseMult || 0;

	let synth = overlay(freq,voice,pulsePeriod,vol);

	synth.phase = {
		ugen: 'flock.ugen.sinOsc',
			freq : {
			ugen : 'flock.ugen.xLine',
			start: 5 * phaseMult,
			end  : 1,
			duration: 2000
		}
	}

	return synth;
}

//function to create a steadily pulsing voice
function pulse(freq, voice, vol, per) {
	freq  = freq  || 220;
	voice = voice || DEFAULT_VOICE;
	vol   = vol   || .2;
	per   = per   || .05;

	let synth = { 
		ugen: 'flock.ugen.out',
		sources: [
			{
				ugen  : voice,
				rate  : 'audio',
				freq  : freq,
				mul   : {
					ugen : 'flock.ugen.sinOsc',
					freq : per,
					mul  : vol * VOL_MULTIPLIER
				}
			}
		]
	}

	synth.phase = {
		ugen: 'flock.ugen.sinOsc',
		freq: {
			ugen : 'flock.ugen.xLine',
			start: 16,
			end  : 1,
			duration: 2000
		}
	}

	return synth;	
}

//given a synth, add it with flock.synth
function addSynth(synth) {
	flock.synth({
		synthDef: synth
	})
}

//voices in the piece

//bass               freq    voice      pulse  vol
addSynth(new overlay(55,     undefined, .11,   .03)); //a1
addSynth(new overlay(164.81, undefined, 3,     .02)); //e3
 
//pulses           freq  voice                vol    pulse
addSynth(new pulse(55,  'flock.ugen.sinOsc', .017,   .184)); //a1
addSynth(new pulse(110,  'flock.ugen.sinOsc', .015,   .075)); //a2
addSynth(new pulse(220,  'flock.ugen.sinOsc', .020,    .035)); //a3

//midrange           freq    voice      pulse vol
addSynth(new overlay(277.81, undefined, 1.1,  .03)); //c#4
addSynth(new overlay(329.63, undefined, 1.3,  .04)); //e4
addSynth(new overlay(329.63, undefined, 2.6,  .03)); //e4
addSynth(new overlay(554.37, undefined, .4,   .04)); //c#5

//high               freq    voice       per   vol
addSynth(new overlay(659.25, undefined, .024, .02)); //e5

//wavy                     freq    voice      pulse vol  phaseMult
addSynth(new phasedOverlay(220,    undefined, .6,   .019, 1.8)); //a3
addSynth(new phasedOverlay(329.63, undefined, 1.48, .021, 1.5)); //e4
addSynth(new phasedOverlay(369.99, undefined, 3.1,  .022, 1.5)); //f#4
addSynth(new phasedOverlay(440,    undefined, 2.3,  .023, 1.2)) //a4
addSynth(new phasedOverlay(554.37, undefined, 1.7,  .025,  0.9)); //c#5

//noise
addSynth(new overlay(440, 'flock.ugen.whiteNoise', 1, .01))

//now that all of our synths have been declared and loaded,
enviro.start();