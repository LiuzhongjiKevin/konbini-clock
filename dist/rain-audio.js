// Local stereo rain ambience; no audio downloads or third-party requests.
const button = document.querySelector('#sound');
let context, master, starting = false, enabled = false, interacted = false, raining = true;

function updateButton(message) {
  button.disabled = !raining || starting;
  button.setAttribute('aria-pressed', String(enabled && raining));
  button.setAttribute('aria-label', !raining ? '雨声仅在雨天播放' : enabled ? '关闭雨声' : '开启雨声');
  button.innerHTML = `<span aria-hidden="true">♫</span> ${!raining ? '雨声暂停' : message || (enabled ? '雨声开' : '雨声关')}`;
}

export function setRainWeather(value, userGesture = true) {
  raining = value;
  if (!raining) {
    if (master) master.gain.setTargetAtTime(0, context.currentTime, .15);
    updateButton();
    return;
  }
  if ((userGesture && !interacted) || enabled) {
    interacted = true;
    void enableRain();
  }
  updateButton();
}

function createRain() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error('Audio unavailable');
  context = new AudioContextClass();
  master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);

  // A soft continuous bed and individual droplets, independently generated
  // for each ear. Loop joins are crossfaded to avoid a repeating click.
  const seconds = 16, length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let low = 0;
    for (let i = 0; i < length; i++) {
      const noise = Math.random() * 2 - 1;
      low = .985 * low + .015 * noise;
      const swell = 1 + .12 * Math.sin(2 * Math.PI * i / length * 3 + channel);
      data[i] = (low * 2.7 + noise * .085) * swell;
    }
    // Short, damped drops scattered over the steady rainfall.
    for (let drop = 0; drop < 620; drop++) {
      const start = Math.floor(Math.random() * length);
      const duration = Math.floor(context.sampleRate * (.012 + Math.random() * .035));
      const frequency = 900 + Math.random() * 2400;
      const amplitude = .025 + Math.random() * .065;
      for (let j = 0; j < duration; j++) {
        const envelope = Math.sin(Math.PI * j / duration) * Math.exp(-j / duration * 5);
        const splash = .65 * (Math.random() * 2 - 1) + .35 * Math.sin(2 * Math.PI * frequency * j / context.sampleRate);
        data[(start + j) % length] += splash * envelope * amplitude;
      }
    }
    const fade = Math.floor(context.sampleRate * .12);
    for (let i = 0; i < fade; i++) {
      const blend = i / fade;
      data[length - fade + i] = data[length - fade + i] * (1 - blend) + data[i] * blend;
    }
  }
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.loopStart = .12;
  source.loopEnd = seconds;
  const highpass = context.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 110;
  const lowpass = context.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 5500;
  source.connect(highpass).connect(lowpass).connect(master);
  source.start();
}

async function enableRain() {
  if (starting || !raining || document.hidden) return;
  starting = true;
  button.disabled = true;
  try {
    if (!context) createRain();
    await context.resume();
    enabled = context.state === 'running';
    master.gain.setTargetAtTime(enabled && raining && !document.hidden ? .85 : 0, context.currentTime, .35);
    updateButton(enabled ? undefined : '点击开启雨声');
  } catch {
    enabled = false;
    updateButton('点击重试雨声');
  } finally {
    starting = false;
    button.disabled = !raining;
  }
}

button.addEventListener('click', () => {
  if (!raining) return;
  interacted = true;
  if (!enabled) { void enableRain(); return; }
  enabled = false;
  master.gain.setTargetAtTime(0, context.currentTime, .15);
  updateButton();
});

// Browsers require a user gesture before playing sound.
function firstInteraction(event) {
  if (interacted || !raining || event.target.closest?.('#sound, #weather-slider')) return;
  if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
  interacted = true;
  void enableRain();
}
document.addEventListener('pointerdown', firstInteraction);
document.addEventListener('keydown', firstInteraction);
document.addEventListener('visibilitychange', () => {
  if (!context) return;
  if (document.hidden) void context.suspend().catch(() => {});
  else if (enabled && raining) void enableRain();
});
updateButton('开启雨声');
