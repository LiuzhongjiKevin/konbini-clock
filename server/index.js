import http from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createWeatherService} from './weather.js';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.wasm':'application/wasm','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8'};
export function createApp({key='',fetcher=fetch,now=Date.now}={}) {
  const weather=createWeatherService({key,fetcher,now});
  return http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    const json=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:JSON.stringify(data));};
    try {
      if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return json({error:'Method not allowed'},405);}
      const url=new URL(req.url,'http://localhost');
      if(url.pathname==='/healthz')return json({ok:true});
      if(url.pathname==='/api/weather'){
        const result=await weather();
        return json({...result.data,city:'北京',adcode:'110000',serverTime:now()},result.status);
      }
      let pathname;
      try{pathname=decodeURIComponent(url.pathname);}catch{return json({error:'Bad URL'},400);}
      if(pathname.includes('\0')||pathname.split('/').some(part=>part.startsWith('.')))return json({error:'Not found'},404);
      const filename=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
      if(!filename.startsWith(root))return json({error:'Not found'},404);
      const resolved=await realpath(filename);
      if(!resolved.startsWith(root)||!(await stat(resolved)).isFile())return json({error:'Not found'},404);
      const body=await readFile(resolved);
      res.writeHead(200,{'Content-Type':types[path.extname(resolved)]||'application/octet-stream','Cache-Control':'no-cache','Content-Length':body.length});
      res.end(req.method==='HEAD'?undefined:body);
    }catch(error){
      if(!res.headersSent)json({error:'Not found'},['ENOENT','ENOTDIR'].includes(error.code)?404:500);
      else res.end();
    }
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const envFile=fileURLToPath(new URL('../.env',import.meta.url));
  if(existsSync(envFile))process.loadEnvFile(envFile);
  const port=Number(process.env.PORT||8080),host=process.env.HOST||'0.0.0.0';
  if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT must be 1-65535');
  const app=createApp({key:process.env.AMAP_WEATHER_KEY||''});
  app.listen(port,host,()=>console.log(`雨町已启动，端口 ${port}；高德天气${process.env.AMAP_WEATHER_KEY?'已配置（等待请求验证）':'未配置，时间与手动模式可用'}`));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{app.close(()=>process.exit(0));setTimeout(()=>process.exit(1),10000).unref();});
}
