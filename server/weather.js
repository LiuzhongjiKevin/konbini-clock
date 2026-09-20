export function mapWeather(text) {
  if(typeof text!=='string'||!text.trim())return null;
  if(/雪|冰粒/.test(text))return 'snow';
  if(/雨/.test(text))return 'rain';
  if(/晴|云|阴|雾|霾|沙|尘|风/.test(text))return 'clear';
  return null;
}
export function createWeatherService({key='',fetcher=fetch,now=Date.now}={}) {
  let cache=null,pending=null,retryAfter=0;
  return async()=>{
    if(!key.trim())return {status:503,data:{code:'KEY_MISSING',message:'天气待连接'}};
    if(cache&&now()-cache.fetchedAt<30*60000&&now()-cache.reportedAt<=3*3600000)return {status:200,data:cache};
    if(now()<retryAfter)return {status:503,data:{code:'UPSTREAM_UNAVAILABLE',message:'天气暂时不可用'}};
    if(pending)return pending;
    pending=(async()=>{
      try {
        const url=new URL('https://restapi.amap.com/v3/weather/weatherInfo');
        url.search=new URLSearchParams({key,city:'110000',extensions:'base',output:'JSON'}).toString();
        const response=await fetcher(url,{signal:AbortSignal.timeout(8000)});
        if(!response.ok)throw new Error('Unavailable');
        const body=await response.json(),live=body.lives?.[0];
        if(body.status!=='1'||!live||!String(live.adcode).startsWith('110'))throw new Error('Invalid response');
        const weather=mapWeather(live.weather);
        const reportedAt=Date.parse(String(live.reporttime).replace(' ','T')+'+08:00');
        if(!weather||!Number.isFinite(reportedAt)||now()-reportedAt>3*3600000||reportedAt-now()>600000)throw new Error('Stale response');
        const temp=String(live.temperature??'').trim();
        cache={weather,description:String(live.weather).slice(0,30),temperature:temp&&Number.isFinite(Number(temp))?Number(temp):null,reportTime:live.reporttime,reportedAt,fetchedAt:now(),source:'高德天气'};
        return {status:200,data:cache};
      }catch{
        retryAfter=now()+60000;
        return {status:503,data:{code:'UPSTREAM_UNAVAILABLE',message:'天气暂时不可用'}};
      }
    })();
    try{return await pending;}finally{pending=null;}
  };
}
