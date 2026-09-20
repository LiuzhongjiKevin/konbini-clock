import assert from 'node:assert/strict';
import test from 'node:test';
import {createAutoEnvironment} from '../dist/auto-environment.js';

const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('automatic weather refresh waits for the full 30-minute interval',async t=>{
  const saved={
    document:globalThis.document,
    addEventListener:globalThis.addEventListener,
    fetch:globalThis.fetch,
    setInterval:globalThis.setInterval,
    clearInterval:globalThis.clearInterval,
    dateNow:Date.now,
  };
  t.after(()=>{
    if(saved.document===undefined)delete globalThis.document;else globalThis.document=saved.document;
    if(saved.addEventListener===undefined)delete globalThis.addEventListener;else globalThis.addEventListener=saved.addEventListener;
    globalThis.fetch=saved.fetch;
    globalThis.setInterval=saved.setInterval;
    globalThis.clearInterval=saved.clearInterval;
    Date.now=saved.dateNow;
  });

  const toggle={checked:true,addEventListener(){}};
  const clock={textContent:''};
  const status={textContent:'',title:''};
  const intervals=[];
  let currentTime=Date.parse('2026-09-20T04:00:00Z');
  let calls=0;

  globalThis.document={
    hidden:false,
    querySelector(selector){
      return {'#auto-mode':toggle,'#beijing-clock':clock,'#live-weather':status}[selector];
    },
    addEventListener(){},
  };
  globalThis.addEventListener=()=>{};
  globalThis.setInterval=(fn,ms)=>{intervals.push({fn,ms});return intervals.length;};
  globalThis.clearInterval=()=>{};
  Date.now=()=>currentTime;
  globalThis.fetch=async()=>{
    calls++;
    return {
      ok:true,
      json:async()=>({
        weather:'clear',description:'晴',temperature:26,
        reportTime:'2026-09-20 12:00:00',reportedAt:currentTime,serverTime:currentTime,
      }),
    };
  };

  createAutoEnvironment({onTime(){},onWeather(){}});
  await flush();
  assert.equal(calls,1,'the page must request weather immediately after opening');

  const ticker=intervals.find(({ms})=>ms===30000);
  assert.ok(ticker,'the automatic environment ticker must be running');

  currentTime+=29*60000;
  ticker.fn();
  await flush();
  assert.equal(calls,1,'29 minutes must not trigger another weather request');

  currentTime+=60000;
  ticker.fn();
  await flush();
  assert.equal(calls,2,'30 minutes must trigger the next weather request');
});
