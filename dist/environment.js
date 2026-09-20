import * as THREE from './vendor/three.module.js';

const times = {
  morning: { sky: '#a9cbdc', haze: '#bdcbd1', upper: '#e4f3ff', ground: '#7e8d88', sun: '#fff1ce', position: [-7, 9, 6], ambient: 2.8, direct: 3.6, exposure: 1.05, lamps: .24, bloom: .1 },
  noon: { sky: '#91c9e9', haze: '#bfccd4', upper: '#f0f8ff', ground: '#89968a', sun: '#fff8e8', position: [.5,16,1.5], ambient: 3.1, direct: 4.2, exposure: .98, lamps: .15, bloom: .06 },
  dusk: { sky: '#98717d', haze: '#8b7f89', upper: '#f6c6a0', ground: '#515469', sun: '#ffac68', position: [9, 4, -5], ambient: 1.9, direct: 3.4, exposure: 1, lamps: .7, bloom: .23 },
  night: { sky: '#0b1624', haze: '#192c3d', upper: '#a8c9f2', ground: '#223444', sun: '#92b7e3', position: [-6, 10, 5], ambient: 2, direct: 2.4, exposure: 1.1, lamps: 1, bloom: .32 },
};

export function createEnvironment({ scene, hemisphere, sun, renderer, bloom, rain, rings, reflections, lamps, road, specs }) {
  let weather = 'rain', time = 'night';
  const snowCount = 850;
  const positions = new Float32Array(snowCount * 3);
  const sizes = new Float32Array(snowCount);
  const seeds = Array.from({ length: snowCount }, () => Math.random() * Math.PI * 2);
  const speeds = Array.from({ length: snowCount }, () => .45 + Math.random() * .55);
  for (let i = 0; i < snowCount; i++) {
    positions.set([(Math.random() - .5) * 12.8, Math.random() * 10, (Math.random() - .5) * 10.3], i * 3);
    sizes[i] = .025 + Math.random() * .045;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  const snowMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { viewportHeight: { value: 800 } },
    vertexShader: `attribute float size;
      uniform float viewportHeight;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(size * viewportHeight / -mv.z, 1.5, 7.0);
      }`,
    fragmentShader: `void main() {
      float radius = length(gl_PointCoord - vec2(0.5));
      if(radius > 0.5) discard;
      float alpha = (1.0 - smoothstep(0.1, 0.5, radius)) * 0.85;
      gl_FragColor = vec4(0.92, 0.96, 1.0, alpha);
    }`,
  });
  const snow = new THREE.Points(geometry, snowMaterial);
  snow.frustumCulled = false;
  scene.add(snow);
  const snowCover = new THREE.Group();
  const coverMaterial = new THREE.MeshStandardMaterial({ color: '#e5edf0', roughness: .96 });
  // A thin cover on the roof and roadside, leaving the walking path clear.
  for (const spec of specs.filter(s => ['roofInset', 'roofRim'].includes(s.name))) {
    const cover = new THREE.Mesh(new THREE.BoxGeometry(spec.size[0], .055, spec.size[2]), coverMaterial);
    cover.position.set(spec.position[0], spec.position[1] + spec.size[1] / 2 + .028, spec.position[2]);
    cover.receiveShadow = true;
    snowCover.add(cover);
  }
  for (const x of [-6.05, 6.05]) {
    const cover = new THREE.Mesh(new THREE.BoxGeometry(.65, .055, 9.8), coverMaterial);
    cover.position.set(x, .085, 0);
    cover.receiveShadow = true;
    snowCover.add(cover);
  }
  scene.add(snowCover);
  const baseIntensities = lamps.map(l => l.intensity);
  const sky = new THREE.Color(), upper = new THREE.Color(), ground = new THREE.Color(), sunlight = new THREE.Color();
  const sunPosition = new THREE.Vector3();
  let target;
  function select() {
    const preset = times[time];
    const cloudiness = weather === 'clear' ? 0 : weather === 'snow' ? .48 : .35;
    sky.set(preset.sky).lerp(new THREE.Color(preset.haze), cloudiness);
    upper.set(preset.upper);
    ground.set(preset.ground);
    sunlight.set(preset.sun);
    sunPosition.fromArray(preset.position);
    target = { ...preset, direct: preset.direct * (weather === 'clear' ? 1 : .65), fog: weather === 'snow' ? .034 : weather === 'rain' ? .023 : .012 };
    rain.visible = weather === 'rain';
    rings.forEach(({ m }) => m.visible = weather === 'rain');
    reflections.forEach(m => m.visible = weather === 'rain');
    snow.visible = snowCover.visible = weather === 'snow';
    if (road) { road.roughness = weather === 'rain' ? .19 : .85; road.metalness = weather === 'rain' ? .4 : .05; }
  }
  select();
  return {
    snow, snowCover,
    get weather() { return weather; },
    get time() { return time; },
    setWeather(value) {
      if (!['rain', 'snow', 'clear'].includes(value)) throw new Error('Unknown weather');
      weather = value; select();
    },
    setTime(value) {
      if (!times[value]) throw new Error('Unknown time');
      time = value; select();
    },
    update(dt, elapsed) {
      const blend = 1 - Math.exp(-dt * 3);
      scene.background.lerp(sky, blend);
      scene.fog.color.copy(scene.background);
      scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, target.fog, blend);
      hemisphere.color.lerp(upper, blend);
      hemisphere.groundColor.lerp(ground, blend);
      hemisphere.intensity = THREE.MathUtils.lerp(hemisphere.intensity, target.ambient, blend);
      sun.color.lerp(sunlight, blend);
      sun.position.lerp(sunPosition, blend);
      sun.intensity = THREE.MathUtils.lerp(sun.intensity, target.direct, blend);
      lamps.forEach((lamp, i) => lamp.intensity = THREE.MathUtils.lerp(lamp.intensity, baseIntensities[i] * target.lamps, blend));
      reflections.forEach(m => m.material.opacity = THREE.MathUtils.lerp(m.material.opacity, .42 * target.lamps, blend));
      renderer.toneMappingExposure = THREE.MathUtils.lerp(renderer.toneMappingExposure, target.exposure, blend);
      bloom.strength = THREE.MathUtils.lerp(bloom.strength, target.bloom, blend);
      if (!snow.visible) return;
      snowMaterial.uniforms.viewportHeight.value = renderer.domElement.height;
      for (let i = 0; i < snowCount; i++) {
        const j = i * 3;
        positions[j] += Math.sin(elapsed * .6 + seeds[i]) * dt * .22;
        positions[j + 1] -= speeds[i] * dt;
        positions[j + 2] += Math.cos(elapsed * .45 + seeds[i]) * dt * .12;
        const x = positions[j], z = positions[j + 2];
        const floor = Math.abs(x) < 4 && z > -4.4 && z < .8 ? 3.9 : Math.abs(x) < 4.7 && z < 2.05 && z > -4.65 ? .33 : .12;
        if (positions[j + 1] < floor || Math.abs(x) > 6.4 || Math.abs(z) > 5.15) {
          positions[j] = (Math.random() - .5) * 12.8;
          positions[j + 1] = 8 + Math.random() * 2;
          positions[j + 2] = (Math.random() - .5) * 10.3;
        }
      }
      geometry.attributes.position.needsUpdate = true;
    },
  };
}
