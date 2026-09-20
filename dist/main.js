import * as THREE from 'three';
import {createEnvironment} from './environment.js';
import {setRainWeather} from './rain-audio.js';
import {createAutoEnvironment} from './auto-environment.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
const scene=new THREE.Scene();scene.background=new THREE.Color('#0b1624');scene.fog=new THREE.FogExp2('#0b1624',.023);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;document.querySelector('#scene').appendChild(renderer.domElement);
const camera=new THREE.PerspectiveCamera(35,innerWidth/innerHeight,.1,100);const target=new THREE.Vector3(-.7,1,0);const home=new THREE.Vector3(14,11,17);camera.position.copy(home);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(target);controls.enableDamping=true;controls.maxPolarAngle=Math.PI/2.15;controls.minDistance=12;controls.maxDistance=55;controls.enablePan=false;
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.32,.5,1.05);composer.addPass(bloom);composer.addPass(new OutputPass());
const hemisphere=new THREE.HemisphereLight('#a8c9f2','#223444',2);scene.add(hemisphere);const moon=new THREE.DirectionalLight('#92b7e3',2.4);moon.position.set(-6,10,5);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);Object.assign(moon.shadow.camera,{left:-10,right:10,top:10,bottom:-10});moon.shadow.bias=-.0006;scene.add(moon);
const lamps=[];function light(x,y,z,color,power,distance){const l=new THREE.PointLight(color,power,distance,2);l.position.set(x,y,z);scene.add(l);lamps.push(l);return l}light(0,2.7,-1,'#ffe5ac',45,9);light(-2.6,2.6,-2.4,'#fff0c4',20,6);light(2.4,2.6,-2.4,'#ffe5ac',20,6);light(0,2.8,1.5,'#ffd29d',25,8);light(-4.1,1.7,.6,'#8ce7e9',10,4);light(3.3,4.8,-3.7,'#b9d9ff',30,9);
const cube=new THREE.BoxGeometry(1,1,1),root=new THREE.Group();scene.add(root);const doors={},doorTargets=[];const specs=await fetch('./scene.json').then(r=>{if(!r.ok)throw Error('场景加载失败');return r.json()});
let roadMaterial;const mats=new Map();function material(s){const key=JSON.stringify([s.color,s.glass,s.emissive,s.roughness,s.metalness]);if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color:s.color,roughness:s.roughness??.62,metalness:s.metalness??.08,transparent:!!s.glass,opacity:s.glass?.19:1,depthWrite:!s.glass,emissive:s.emissive?s.color:'#000000',emissiveIntensity:s.emissive??0}));return mats.get(key)}
for(const s of specs){let parent=root;if(s.door){const g=new THREE.Group();root.add(g);doors[s.name]=g;parent=g}if(s.parent)parent=doors[s.parent];const mesh=new THREE.Mesh(cube,material(s));if(s.name==='road')roadMaterial=mesh.material;mesh.position.fromArray(s.position);mesh.scale.fromArray(s.size);mesh.castShadow=!s.glass;mesh.receiveShadow=true;parent.add(mesh);if(s.door||s.parent)doorTargets.push(mesh)}
// Canvas lettering becomes a texture on the actual 3D illuminated fascia.
const cv=document.createElement('canvas');cv.width=1536;cv.height=160;const ctx=cv.getContext('2d');ctx.fillStyle='#e9e1be';ctx.fillRect(0,0,1536,160);ctx.textAlign='center';ctx.fillStyle='#245958';ctx.font='bold 72px serif';ctx.fillText('雨 町 商 店',768,83);ctx.font='20px sans-serif';ctx.fillText('A M E M A C H I    •    O P E N   2 4   H O U R S',768,126);ctx.font='25px sans-serif';ctx.fillText('いつでも',205,85);ctx.fillText('24 / 7',1330,85);const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;const sign=new THREE.Mesh(new THREE.PlaneGeometry(7.65,.44),new THREE.MeshBasicMaterial({map:tex}));sign.position.set(0,3.2,1.005);root.add(sign);
// Soft irregular pools of reflected window and neon light on wet asphalt.
function glowTexture(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,.52)');g.addColorStop(.3,'rgba(255,255,255,.26)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)}const reflections=[];const glow=glowTexture();for(const [x,z,w,h,c] of [[0,2.8,6,3,'#f5d8a1'],[-4.2,2.2,1.1,3,'#88f1e5'],[2.4,2.3,1.2,2.2,'#f9dbac'],[4,-3.3,2,2,'#91b3d2']]){const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:glow,color:c,transparent:true,depthWrite:false,opacity:.42,blending:THREE.AdditiveBlending}));p.rotation.x=-Math.PI/2;p.position.set(x,.085,z);scene.add(p);reflections.push(p)}
// Bicycle parked beside the vending machine.
const bike=new THREE.Group();bike.position.set(-4.15,.4,1.08);bike.rotation.y=.2;root.add(bike);const steel=new THREE.MeshStandardMaterial({color:'#7eb4b0',metalness:.5,roughness:.3});function bar(a,b,r,mat,parent){const v=new THREE.Vector3(...a),w=new THREE.Vector3(...b),d=w.clone().sub(v);const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),8),mat);m.position.copy(v.add(w).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());parent.add(m);return m}for(const x of [-.52,.52]){const w=new THREE.Mesh(new THREE.TorusGeometry(.36,.035,8,28),steel);w.position.set(x,.37,0);bike.add(w);for(let i=0;i<8;i++){let a=i*Math.PI/4;bar([x,.37,0],[x+Math.cos(a)*.34,.37+Math.sin(a)*.34,0],.008,steel,bike)}}for(const [a,b] of [[[ -.52,.37,0],[-.15,.83,0]],[[-.15,.83,0],[.05,.37,0]],[[.05,.37,0],[-.52,.37,0]],[[-.15,.83,0],[.35,.83,0]],[[.35,.83,0],[.05,.37,0]],[[.35,.83,0],[.52,.37,0]],[[.35,.83,0],[.29,1.05,0]],[[.29,1.05,0],[.48,1.08,0]],[[-.15,.83,0],[-.19,1.01,0]]])bar(a,b,.026,steel,bike);bar([-.33,1.01,0],[-.09,1.01,0],.045,steel,bike);
let doorOpen=false;const doorButton=document.querySelector('#door');function toggleDoor(){doorOpen=!doorOpen;doorButton.setAttribute('aria-pressed',doorOpen);doorButton.innerHTML=`<span>▯</span> ${doorOpen?'关闭店门':'打开店门'}`;updateHint();}doorButton.onclick=toggleDoor;
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);ray.setFromCamera(pointer,camera);if(ray.intersectObjects(doorTargets).length)toggleDoor()});renderer.domElement.addEventListener('pointermove',e=>{pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);ray.setFromCamera(pointer,camera);renderer.domElement.style.cursor=ray.intersectObjects(doorTargets).length?'pointer':'grab'});
// Rain uses one batched line geometry; every drop stays inside the miniature.
const count=1500,positions=new Float32Array(count*6),drops=[];for(let i=0;i<count;i++)drops.push({x:(Math.random()-.5)*13,y:Math.random()*10,z:(Math.random()-.5)*10.5,s:5+Math.random()*3});const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:'#91b7d4',transparent:true,opacity:.22,depthWrite:false}));scene.add(rain);
const rings=[];for(let i=0;i<30;i++){const m=new THREE.Mesh(new THREE.RingGeometry(.08,.092,20),new THREE.MeshBasicMaterial({color:'#98b6c4',transparent:true,opacity:.3,depthWrite:false,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set((Math.random()-.5)*12,.09,2.2+Math.random()*2.8);scene.add(m);rings.push({m,phase:Math.random()})}
// Umbrella pedestrians have independent materials so the entire character fades together.
const walkers=[];function pedestrian(){const g=new THREE.Group(),col=['#cf9b60','#638f8a','#8b819f','#b36055'][Math.floor(Math.random()*4)];const mm=c=>new THREE.MeshStandardMaterial({color:c,roughness:.75,transparent:true});const coat=mm(col),skin=mm('#c6af93'),dark=mm('#243243'),umbrella=mm(col);function part(geo,mat,x,y,z){let m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);g.add(m);return m}part(new THREE.CapsuleGeometry(.14,.35,4,8),coat,0,.92,0);part(new THREE.SphereGeometry(.12,12,8),skin,0,1.33,0);const legs=[];for(const x of [-.085,.085]){const pivot=new THREE.Group();pivot.position.set(x,.73,0);g.add(pivot);const l=new THREE.Mesh(new THREE.CapsuleGeometry(.047,.4,3,6),dark);l.position.y=-.23;pivot.add(l);legs.push(pivot)}bar([.12,1.02,0],[.23,1.17,.12],.045,coat,g);const umbrellaParts=[bar([.23,1.1,.12],[.23,1.84,.12],.012,dark,g)];const canopy=part(new THREE.SphereGeometry(.62,12,5,0,Math.PI*2,0,Math.PI*.43),umbrella,.1,1.61,.04);canopy.scale.y=.48;umbrellaParts.push(canopy,part(new THREE.SphereGeometry(.028,6,5),dark,.1,1.92,.04));const dir=Math.random()>.5?1:-1;g.position.set(-dir*6.4,.15,2.25+Math.random()*.6);g.rotation.y=dir*Math.PI/2;scene.add(g);walkers.push({g,dir,umbrellaParts,speed:.4+Math.random()*.17,legs,materials:[coat,skin,dark,umbrella],phase:Math.random()*10})}pedestrian();walkers[0].g.position.x=-2.7;
const environment=createEnvironment({scene,hemisphere,sun:moon,renderer,bloom,rain,rings,reflections,lamps,road:roadMaterial,specs});
const weatherLabels={rain:'雨天',snow:'下雪',clear:'晴天'};
const timeLabels={morning:'早上',noon:'中午',dusk:'黄昏',night:'夜晚'};
const weatherSteps=['rain','snow','clear'],timeSteps=['morning','noon','dusk','night'];
const weatherSlider=document.querySelector('#weather-slider'),timeSlider=document.querySelector('#time-slider');
function syncSlider(slider,steps,value,label){
  slider.value=String(steps.indexOf(value));
  slider.setAttribute('aria-valuetext',label);
  slider.style.setProperty('--progress',`${Number(slider.value)/(steps.length-1)*100}%`);
  document.querySelector(`#${slider.id.replace('slider','value')}`).textContent=label;
}
function updateHint(){
  document.querySelector('#hint').textContent=doorOpen?'门开着，慢慢来。':environment.weather==='rain'?'点击玻璃门，进来避避雨':environment.weather==='snow'?'点击玻璃门，进来暖暖身':'点击玻璃门，进店逛逛';
}
function updateEnvironmentUI(){
  const weather=environment.weather,time=environment.time;
  document.body.dataset.time=time;
  document.body.dataset.weather=weather;
  syncSlider(timeSlider,timeSteps,time,timeLabels[time]);
  syncSlider(weatherSlider,weatherSteps,weather,weatherLabels[weather]);
  document.querySelector('#environment-status').textContent=`${weatherLabels[weather]} · ${timeLabels[time]}`;
  document.querySelector('.weathericon').textContent={rain:'☂',snow:'❄',clear:'☀'}[weather];
  document.querySelector('.eyebrow').innerHTML=`<i></i> ${time==='night'?'深夜营业中':time==='morning'?'早安，营业中':time==='noon'?'午间，营业中':'日落，营业中'}`;
  document.querySelector('h1').innerHTML={rain:'在雨里，<br>留一盏灯。',snow:'雪落时，<br>这里很暖。',clear:time==='morning'?'早安，<br>小小街角。':time==='noon'?'阳光里，<br>歇一会儿。':time==='dusk'?'日落了，<br>慢一点走。':'晴朗的夜，<br>灯还亮着。'}[weather];
  document.querySelector('.title p').textContent={morning:'新的一天，从这里开始。',noon:'午后的光，落在街角。',dusk:'把脚步，留给晚霞。',night:'夜色很深，这里还亮着。'}[time];
  document.querySelector('#scene').setAttribute('aria-label',`可旋转的${weatherLabels[weather]}${timeLabels[time]}便利店三维场景`);
  document.querySelector('.edition span').textContent=`${timeLabels[time]}便利店 / 001`;
  updateHint();
}
weatherSlider.addEventListener('input',()=>{
  autoEnvironment.setManual();
  environment.setWeather(weatherSteps[Number(weatherSlider.value)]);
  setRainWeather(environment.weather==='rain');
  updateEnvironmentUI();
});
timeSlider.addEventListener('input',()=>{
  autoEnvironment.setManual();
  environment.setTime(timeSteps[Number(timeSlider.value)]);
  updateEnvironmentUI();
});
updateEnvironmentUI();
const autoEnvironment=createAutoEnvironment({
 onTime(value){if(environment.time!==value){environment.setTime(value);updateEnvironmentUI();}},
 onWeather(value){if(environment.weather!==value){environment.setWeather(value);setRainWeather(value==='rain',false);updateEnvironmentUI();}},
});
let spawnIn=4;const clock=new THREE.Clock();let elapsed=0;
function framing(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);if(innerWidth<850){camera.position.set(27,22,34);controls.target.set(0,1,0)}else{camera.position.copy(home);controls.target.copy(target)}}framing();document.querySelector('#reset').onclick=framing;addEventListener('resize',framing);
function animate(){requestAnimationFrame(animate);let dt=Math.min(clock.getDelta(),.05);elapsed+=dt;environment.update(dt,elapsed);controls.update();const goal=doorOpen?1.38:0;doors.DoorLeft.position.x=THREE.MathUtils.damp(doors.DoorLeft.position.x,-goal,6,dt);doors.DoorRight.position.x=THREE.MathUtils.damp(doors.DoorRight.position.x,goal,6,dt);if(environment.weather==='rain'){for(let i=0;i<count;i++){const d=drops[i];d.y-=d.s*dt;d.x-=dt*.55;if(d.y<.1){d.y=7+Math.random()*3;d.x=(Math.random()-.5)*13}positions.set([d.x,d.y,d.z,d.x+.025,d.y+.2,d.z],i*6)}rainGeo.attributes.position.needsUpdate=true;}for(const r of rings){const f=(elapsed*.8+r.phase)%1;r.m.scale.setScalar(1+f*4);r.m.material.opacity=(1-f)*.22}spawnIn-=dt;if(spawnIn<=0){if(walkers.length<4)pedestrian();spawnIn=7+Math.random()*6}for(let i=walkers.length-1;i>=0;i--){const w=walkers[i];w.umbrellaParts.forEach(part=>part.visible=environment.weather!=='clear');w.g.position.x+=dt*w.speed*w.dir;const alpha=THREE.MathUtils.smoothstep(6.25-Math.abs(w.g.position.x),0,1.25);w.materials.forEach(m=>m.opacity=alpha);w.legs.forEach((l,j)=>l.rotation.x=Math.sin(elapsed*5+w.phase+j*Math.PI)*.37);w.g.position.y=.15+Math.sin(elapsed*10+w.phase)*.012;if(Math.abs(w.g.position.x)>6.5){scene.remove(w.g);w.g.traverse(o=>{if(o.isMesh)o.geometry.dispose()});w.materials.forEach(m=>m.dispose());walkers.splice(i,1)}}composer.render()}
document.querySelector('#loading').classList.add('loaded');animate();window.__sceneDebug={scene,camera,doors,walkers,toggleDoor,renderer,environment};
