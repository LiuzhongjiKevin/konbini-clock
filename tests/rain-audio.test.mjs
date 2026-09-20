import test from 'node:test';
import assert from 'node:assert/strict';

// Browser audio/visibility adapters are unavailable in Node. Exercise the real
// controller and sample generator with observable AudioParam endpoints.
test('rain sound follows weather, preserves manual mute, and handles pending resume', async () => {
  const events = new Map(), buttonEvents = new Map(), attrs = {};
  const button = {
    setAttribute: (key, value) => attrs[key] = value,
    addEventListener: (event, fn) => buttonEvents.set(event, fn),
    disabled:false, innerHTML:'',
  };
  globalThis.document = { hidden:false, querySelector:()=>button, addEventListener:(event,fn)=>events.set(event,fn) };
  let context, gain, delayedResume;
  class AudioContext {
    constructor() { context=this; this.sampleRate=8000; this.currentTime=0; this.state='suspended'; this.destination={}; }
    createGain() { gain={gain:{value:0,setTargetAtTime(value){this.value=value;}},connect(){return this;}}; return gain; }
    createBuffer(channels,length) {
      const data = Array.from({length:channels},()=>new Float32Array(length));
      return {getChannelData:i=>data[i]};
    }
    createBufferSource() {
      return {connect(node){return node;},start(){
        const samples=this.buffer.getChannelData(0);
        assert.ok(samples.every(Number.isFinite));
        assert.ok(samples.some(value=>value!==0));
      }};
    }
    createBiquadFilter() { return {frequency:{value:0},connect(node){return node;}}; }
    async resume() { if(delayedResume) await delayedResume; this.state='running'; }
    async suspend() {this.state='suspended';}
  }
  globalThis.window={AudioContext};
  const {setRainWeather}=await import('../dist/rain-audio.js');
  const flush = () => new Promise(resolve => setImmediate(resolve));
  setRainWeather(false);
  assert.equal(button.disabled,true);
  assert.equal(context,undefined,'snow/clear should not start the audio engine');
  setRainWeather(true);
  await flush();
  assert.equal(gain.gain.value,.85);
  assert.equal(attrs['aria-pressed'],'true');
  setRainWeather(false);
  assert.equal(gain.gain.value,0);
  assert.equal(attrs['aria-pressed'],'false');
  setRainWeather(true);
  await flush();
  assert.equal(gain.gain.value,.85);
  buttonEvents.get('click')();
  assert.equal(gain.gain.value,0);
  setRainWeather(false);
  setRainWeather(true);
  await flush();
  assert.equal(gain.gain.value,0,'weather change must preserve manual mute');
  let release;
  delayedResume=new Promise(resolve=>release=resolve);
  buttonEvents.get('click')();
  setRainWeather(false);
  release();
  await flush();
  assert.equal(gain.gain.value,0,'a late resume must not play in snow or clear weather');
  assert.equal(button.disabled,true);
  delayedResume=undefined;
  setRainWeather(true);
  await flush();
  document.hidden=true;
  events.get('visibilitychange')();
  await flush();
  assert.equal(context.state,'suspended');
  document.hidden=false;
  events.get('visibilitychange')();
  await flush();
  assert.equal(context.state,'running');
  assert.equal(gain.gain.value,.85);
  delete globalThis.document;
  delete globalThis.window;
});
