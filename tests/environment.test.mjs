import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import { createEnvironment } from '../dist/environment.js';

test('all twelve combinations retain independent weather and time, with correct precipitation', () => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color();
  scene.fog = new THREE.FogExp2();
  const hemisphere = new THREE.HemisphereLight();
  const sun = new THREE.DirectionalLight();
  const rain = new THREE.Group();
  const rings = [{ m: new THREE.Mesh() }];
  const reflection = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial());
  const road = new THREE.MeshStandardMaterial({ roughness: .19, metalness: .4 });
  const env = createEnvironment({ scene, hemisphere, sun, rain, rings, reflections:[reflection], lamps:[], road,
    renderer:{toneMappingExposure:1, domElement:{height:800}}, bloom:{strength:.32}, specs:[] });
  for (const time of ['morning','noon','dusk','night']) {
    env.setTime(time);
    for (const weather of ['rain','snow','clear']) {
      env.setWeather(weather);
      env.update(1, 1);
      assert.equal(env.weather, weather);
      assert.equal(env.time, time);
      assert.equal(rain.visible, weather === 'rain');
      assert.equal(rings[0].m.visible, weather === 'rain');
      assert.equal(env.snow.visible, weather === 'snow');
      assert.equal(env.snowCover.visible, weather === 'snow');
      assert.equal(reflection.visible, weather === 'rain');
      assert.equal(road.roughness, weather === 'rain' ? .19 : .85);
      assert.ok(Number.isFinite(scene.background.r));
    }
  }
  env.setTime('morning');
  env.setWeather('clear');
  env.update(10, 1);
  const morningBrightness=scene.background.r+scene.background.g+scene.background.b;
  const morningSun=sun.position.clone();
  env.setTime('night');
  env.update(10, 1);
  assert.ok(morningBrightness > scene.background.r+scene.background.g+scene.background.b);
  env.setTime('dusk');
  env.update(10, 1);
  assert.ok(sun.position.distanceTo(morningSun)>1);
  env.setWeather('snow');
  const positions = env.snow.geometry.attributes.position.array;
  const before = positions.slice();
  env.update(.016, 2);
  assert.notDeepEqual(positions, before);
  assert.ok(positions.every(Number.isFinite));
  const count = scene.children.length;
  for(let i=0;i<50;i++) { env.setWeather('rain'); env.setWeather('snow'); }
  assert.equal(scene.children.length, count, 'switching must reuse particle resources');
  assert.throws(() => env.setWeather('invalid'));
});
