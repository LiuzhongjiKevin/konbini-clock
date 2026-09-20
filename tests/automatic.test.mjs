import assert from 'node:assert/strict';
import test from 'node:test';
import {beijingTime} from '../dist/beijing-time.js';
import {createApp} from '../server/index.js';
import {createWeatherService,mapWeather} from '../server/weather.js';

test('Beijing time boundaries include the noon phase',()=>{
  const cases=[
    ['2026-09-17T21:59:00Z','night'],
    ['2026-09-17T22:00:00Z','morning'],
    ['2026-09-18T02:59:00Z','morning'],
    ['2026-09-18T03:00:00Z','noon'],
    ['2026-09-18T07:59:00Z','noon'],
    ['2026-09-18T08:00:00Z','dusk'],
    ['2026-09-18T10:59:00Z','dusk'],
    ['2026-09-18T11:00:00Z','night'],
  ];
  for(const [date,phase] of cases)assert.equal(beijingTime(new Date(date)).phase,phase,date);
});

test('weather descriptions map to supported scene modes',()=>{
  assert.equal(mapWeather('大雪'),'snow');
  assert.equal(mapWeather('雨夹雪'),'snow');
  assert.equal(mapWeather('雷阵雨'),'rain');
  assert.equal(mapWeather('多云'),'clear');
  assert.equal(mapWeather('未知'),null);
});

test('Amap weather response is normalized and cached',async()=>{
  const timestamp=Date.parse('2026-09-18T04:10:00Z');
  let currentTime=timestamp;
  let calls=0;
  const fetcher=async url=>{
    calls++;
    assert.equal(url.searchParams.get('city'),'110000');
    assert.equal(url.searchParams.get('key'),'test-key');
    return {
      ok:true,
      json:async()=>({status:'1',lives:[{adcode:'110000',weather:'小雨',temperature:'18',reporttime:'2026-09-18 12:00:00'}]}),
    };
  };
  const weather=createWeatherService({key:'test-key',fetcher,now:()=>currentTime});
  const first=await weather(),second=await weather();
  assert.equal(first.status,200);
  assert.equal(first.data.weather,'rain');
  assert.equal(first.data.temperature,18);
  assert.deepEqual(second,first);
  assert.equal(calls,1);

  currentTime+=29*60000;
  await weather();
  assert.equal(calls,1,'the cached response must still be used after 29 minutes');

  currentTime+=60000;
  await weather();
  assert.equal(calls,2,'Amap must be queried again when the cache reaches 30 minutes');
});

test('missing Amap key has an explicit response',async()=>{
  const result=await createWeatherService({key:''})();
  assert.equal(result.status,503);
  assert.equal(result.data.code,'KEY_MISSING');
});

test('HTTP app serves the scene and operational endpoints',async t=>{
  const app=createApp();
  await new Promise((resolve,reject)=>app.listen(0,'127.0.0.1',error=>error?reject(error):resolve()));
  t.after(()=>new Promise(resolve=>app.close(resolve)));
  const {port}=app.address(),base=`http://127.0.0.1:${port}`;

  const health=await fetch(`${base}/healthz`);
  assert.equal(health.status,200);
  assert.deepEqual(await health.json(),{ok:true});

  const page=await fetch(`${base}/`);
  assert.equal(page.status,200);
  assert.match(await page.text(),/雨町/);

  const weather=await fetch(`${base}/api/weather`);
  assert.equal(weather.status,503);
  assert.equal((await weather.json()).code,'KEY_MISSING');
});
