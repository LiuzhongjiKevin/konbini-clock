import {beijingTime} from './beijing-time.js';
export function createAutoEnvironment({onTime,onWeather}) {
  const toggle=document.querySelector('#auto-mode'),clock=document.querySelector('#beijing-clock'),status=document.querySelector('#live-weather');
  let automatic=true,data=null,lastAttempt=0,pending=false,offset=0,error='',controller=null,timer;
  const now=()=>Date.now()+offset;
  function render(){
    toggle.checked=automatic;
    clock.textContent=`北京 ${beijingTime(new Date(now())).clock}`;
    if(!automatic){status.textContent='手动模式 · 拖动滑块自由切换';return;}
    if(data&&now()-data.reportedAt<=3*3600000){
      const temp=data.temperature===null?'':` · ${data.temperature}°C`;
      status.textContent=`${data.description}${temp} · ${String(data.reportTime).slice(11,16)} 发布${error?' · 更新失败，保留上次天气':''}`;
      status.title='高德天气；阴、多云等无降水天气使用晴天场景。';
    }else{status.textContent=error||'正在连接天气 · 当前为演示天气';status.title='';}
  }
  function apply(){
    if(automatic){onTime(beijingTime(new Date(now())).phase);if(data&&now()-data.reportedAt<=3*3600000)onWeather(data.weather);}
    render();
  }
  async function refresh(){
    if(pending||!automatic||document.hidden)return;
    pending=true;lastAttempt=Date.now();controller=new AbortController();
    const timeout=setTimeout(()=>controller?.abort(),10000);
    try{
      const response=await fetch('/api/weather',{cache:'no-store',signal:controller.signal}),result=await response.json();
      if(Number.isFinite(result.serverTime))offset=result.serverTime-Date.now();
      if(!response.ok)error=result.code==='KEY_MISSING'?'天气待连接 · 当前为演示天气':'天气更新失败 · 可手动切换';
      else if(['rain','snow','clear'].includes(result.weather)&&Number.isFinite(result.reportedAt)){data=result;error='';}
      else error='天气数据不可用 · 可手动切换';
    }catch{error='天气连接失败 · 可手动切换';}
    finally{clearTimeout(timeout);pending=false;controller=null;apply();}
  }
  const tick=()=>{if(document.hidden)return;apply();if(automatic&&Date.now()-lastAttempt>=30*60000)void refresh();};
  toggle.addEventListener('change',()=>{automatic=toggle.checked;apply();if(automatic&&Date.now()-lastAttempt>=60000)void refresh();});
  document.addEventListener('visibilitychange',tick);
  addEventListener('pagehide',()=>{clearInterval(timer);controller?.abort();});
  addEventListener('pageshow',event=>{if(event.persisted){timer=setInterval(tick,30000);tick();}});
  timer=setInterval(tick,30000);apply();void refresh();
  return {setManual(){automatic=false;render();}};
}
