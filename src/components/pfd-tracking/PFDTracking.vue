<template>
  <div class="tracking-test">
    <!-- Start Modal -->
    <Transition name="modal">
      <div v-if="showStartModal" class="modal-overlay">
        <div class="modal-container">
          <div class="modal-content">
            <h2 class="modal-title">PFD Tracking Test</h2>
            <div class="modal-body">
              <p>Dala ujian ini, anda perlu:</p>
              <ul class="modal-list">
                <li>Mengendalikan indikator pesawat menggunakan joystick dan throttle</li>
                <li>Menjaga indikator dalam rentang target</li>
              </ul>
              <p class="modal-footer-text">Klik Ya saat anda siap untuk memulai.</p>
            </div>
            <div class="modal-footer">
              <button class="modal-button mr-4 bg-green-500" @click="handleStartExam">YA</button>
              <button class="modal-button bg-red-500" @click="handleCancel">BATAL</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Timer -->
    <div class="countdown-timer">{{ formatTime(timeRemaining) }}</div>

    <!-- Main Indicators -->
    <div class="indicators-container">
      <div class="indicators-row">
        <!-- Speed Indicator -->
        <div class="indicator-group" :class="{ 'blink': isAirspeedOutOfTarget }">
          <div class="indicator-label">SPEED</div>
          <div class="indicator vertical">
            <LinearGauge label="Airspeed" :value="airspeed" :target="airspeedTarget" :min="MOVEMENT_SPEED.MIN_AIRSPEED"
              :max="MOVEMENT_SPEED.MAX_AIRSPEED" :isVertical="true" />
            <!-- Thrust Control -->
            <div class="thruster-indicator">
              <div class="thruster-bar">
                <div class="thruster-fill" :style="{ height: `${thrustLevel}%` }"></div>
              </div>
              <div class="thruster-value">{{ Math.round(thrustLevel) }}%</div>
            </div>
          </div>
        </div>

        <!-- Heading Indicator -->
        <div class="indicator-group" :class="{ 'blink': isHeadingOutOfTarget }">
          <div class="indicator-label">HEADING</div>
          <div class="indicator horizontal">
            <LinearGauge label="compass" :value="heading" :target="headingTarget" :min="0" :max="360"
              :isVertical="false" />
          </div>
        </div>

        <!-- Altitude Indicator -->
        <div class="indicator-group" :class="{ 'blink': isAltitudeOutOfTarget }">
          <div class="indicator-label">ALTITUDE</div>
          <div class="indicator vertical">
            <LinearGauge label="altitude" :value="altitude" :target="altitudeTarget" :min="0" :max="10000"
              :isVertical="true" :step="500" />
          </div>
        </div>
      </div>
    </div>

    <!-- Score Display -->
    <div v-if="examRunning" class="score-display">
      Score: {{ score }}
    </div>
  </div>
</template>

<style scoped>
.tracking-test {
  background: #1a1a1a;
  min-height: 100vh;
  padding: 20px;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.countdown-timer {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  font-size: 24px;
  font-weight: bold;
  border-radius: 0 0 10px 10px;
  z-index: 1000;
}

.indicators-container {
  margin-top: 80px;
  width: 100%;
  max-width: 1200px;
  padding: 20px;
}

.indicators-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 40px;
}

.indicator-group {
  background: #2c3e50;
  padding: 20px;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.indicator-label {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #fff;
}

.indicator {
  display: flex;
  align-items: center;
  gap: 20px;
}

.indicator.vertical {
  flex-direction: row;
}

.indicator.horizontal {
  flex-direction: column;
}

.thruster-indicator {
  width: 30px;
  height: 300px;
  margin-left: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.thruster-bar {
  height: 100%;
  width: 100%;
  background: #34495e;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.thruster-fill {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: #ff6b6b;
  transition: height 0.2s ease;
}

.thruster-value {
  margin-top: 8px;
  font-size: 14px;
  color: #fff;
}

.audio-test {
  margin-top: 40px;
  padding: 20px;
  background: #2c3e50;
  border-radius: 8px;
  text-align: center;
}

.number-display {
  font-size: 20px;
  margin-bottom: 20px;
}

.response-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.btn-red,
.btn-green {
  padding: 12px 30px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.btn-red {
  background-color: #e74c3c;
}

.btn-green {
  background-color: #2ecc71;
}

.btn-red:hover,
.btn-green:hover {
  transform: scale(1.05);
}

.btn-red:disabled,
.btn-green:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.score-display {
  margin-top: 20px;
  font-size: 24px;
  font-weight: bold;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: #2c3e50;
  border-radius: 8px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
}

.modal-title {
  font-size: 24px;
  color: #fff;
  margin-bottom: 20px;
}

.modal-body {
  color: #ecf0f1;
}

.modal-list {
  list-style-type: disc;
  margin-left: 20px;
  margin-bottom: 20px;
}

.modal-list li {
  margin-bottom: 10px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.start-button {
  background-color: green;
}

.cancel-button {
  background-color: red;
}

.modal-button {
  color: white;
  border: none;
  padding: 10px 30px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;
}

.modal-button:hover {
  background-color: #2980b9;
}

/* Blink animation for out-of-target indicators */
@keyframes blink {
  0% {
    background-color: #2c3e50;
  }

  50% {
    background-color: rgba(231, 76, 60, 0.3);
  }

  100% {
    background-color: #2c3e50;
  }
}

.blink {
  animation: blink 1s infinite;
}

/* Transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

<script setup>
import { removeTestByNameAndUpdateLocalStorage } from '@/utils';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import LinearGauge from './LinearGauge.vue';

const router = useRouter()

// Constants for movement speed
const MOVEMENT_SPEED = {
  HEADING: 0.2,
  ALTITUDE: 2,
  THRUST_RESPONSE: 1,
  MIN_AIRSPEED: 60,
  MAX_AIRSPEED: 160,
  GRAVITY_EFFECT: 0.08,
  VERTICAL_SPEED_MULTIPLIER: 1.2,
  ACCELERATION_RATE: 0.001,     // Increased from 0.000001
  DECELERATION_RATE: 0.0008,     // Increased from 0.000001
  DRAG_COEFFICIENT: 0.00015,     // Adjusted to match new acceleration
  MOMENTUM_RETENTION: 0.98,      // Slightly reduced from 1 to allow for more responsive changes
  ENGINE_IDLE_THRUST: 15,
  ALTITUDE_EFFECT_RATE: 0.0004,
  MAX_ALTITUDE_EFFECT: 5,
  THRUST_MULTIPLIER: 4,    // New: how much momentum is retained (close to 1)
  TARGET_CHANGE_RATE: 5
};

// State
const mode = ref('moving');
const examRunning = ref(false);
const airspeed = ref(100);
const heading = ref(0);
const altitude = ref(5000);
// const currentTime = ref(new Date());
const airspeedTarget = ref(140);
const headingTarget = ref(150);
const altitudeTarget = ref(8000);
const airspeedChangeDirection = ref(null);
const headingChangeDirection = ref(null);
const altitudeChangeDirection = ref(null);
const loading = ref(false);
const timeOnTargetAirspeed = ref(0);
const timeOnTargetHeading = ref(0);
const timeOnTargetAltitude = ref(0);
const score = ref(0);
const timeRemaining = ref(300);
const gamepad = ref(null);
const thruster = ref(null);
const lastAltitude = ref(altitude.value);
const thrustLevel = ref(0);
const currentConfigIndex = ref(0);
const lastUpdateTime = ref(Date.now());
const targetUpdateInterval = ref(50); // Update every 50ms
const audioContext = ref(null);
const engineGain = ref(null);
const baseOscillator = ref(null);
const propellerOscillator = ref(null);
const harmonic1 = ref(null);
const harmonic2 = ref(null);
const currentAcceleration = ref(0);
const targetSpeed = ref(MOVEMENT_SPEED.MIN_AIRSPEED);
const UPDATE_INTERVAL = 2000; // Update every 2 seconds
const lastTargetUpdate = ref(Date.now());

// Audio test state
const displayedNumbers = ref([]);
const audioResponses = ref([]);

// Performance data
const headingPerformanceData = ref([]);
const airspeedPerformanceData = ref([]);
const altitudePerformanceData = ref([]);
const config = ref({
  configs: [],
  totalDuration: 0
});
const lastRecordedTime = ref(Date.now());

// Computed properties
const isAirspeedOutOfTarget = computed(() => {
  const currentConfig = config.value.configs[currentConfigIndex.value];
  if (currentConfig?.airspeed === 'inactive') return false;
  return Math.abs(airspeed.value - airspeedTarget.value) > 5;
});

const isHeadingOutOfTarget = computed(() => {
  const currentConfig = config.value.configs[currentConfigIndex.value];
  if (currentConfig?.compass === 'inactive') return false;
  const diff = Math.abs(heading.value - headingTarget.value);
  return Math.min(diff, 360 - diff) > 5;
});

const isAltitudeOutOfTarget = computed(() => {
  const currentConfig = config.value.configs[currentConfigIndex.value];
  if (currentConfig?.altimeter === 'inactive') return false;
  return Math.abs(altitude.value - altitudeTarget.value) > 100;
});

const verticalSpeed = computed(() => {
  return altitude.value - lastAltitude.value;
});

// Utility functions
const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const initSounds = () => {
  try {
    // Initialize Audio Context
    audioContext.value = new (window.AudioContext || window.webkitAudioContext)();

    // Create main gain and compressor
    const compressor = audioContext.value.createDynamicsCompressor();
    compressor.connect(audioContext.value.destination);

    engineGain.value = audioContext.value.createGain();
    engineGain.value.connect(compressor);
    engineGain.value.gain.setValueAtTime(0, audioContext.value.currentTime);

    // Create noise generator
    const noiseBuffer = audioContext.value.createBuffer(
      1, audioContext.value.sampleRate * 2, audioContext.value.sampleRate
    );
    const noise = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      noise[i] = Math.random() * 2 - 1;
    }

    const noiseNode = audioContext.value.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    // Create filters
    const noiseFilter = audioContext.value.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1000, audioContext.value.currentTime);
    noiseFilter.Q.setValueAtTime(1, audioContext.value.currentTime);

    // Base engine sound (low frequency)
    baseOscillator.value = audioContext.value.createOscillator();
    baseOscillator.value.type = 'sawtooth';
    baseOscillator.value.frequency.setValueAtTime(40, audioContext.value.currentTime);

    // Propeller sound with modulation
    propellerOscillator.value = audioContext.value.createOscillator();
    propellerOscillator.value.type = 'square';
    propellerOscillator.value.frequency.setValueAtTime(80, audioContext.value.currentTime);

    // LFO for propeller modulation
    const lfo = audioContext.value.createOscillator();
    const lfoGain = audioContext.value.createGain();
    lfo.frequency.setValueAtTime(2, audioContext.value.currentTime);
    lfoGain.gain.setValueAtTime(10, audioContext.value.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(propellerOscillator.value.frequency);

    // Harmonics
    harmonic1.value = audioContext.value.createOscillator();
    harmonic1.value.type = 'triangle';
    harmonic1.value.frequency.setValueAtTime(160, audioContext.value.currentTime);

    harmonic2.value = audioContext.value.createOscillator();
    harmonic2.value.type = 'triangle';
    harmonic2.value.frequency.setValueAtTime(200, audioContext.value.currentTime);

    // Gain nodes for mixing
    const baseGain = audioContext.value.createGain();
    const propellerGain = audioContext.value.createGain();
    const harmonic1Gain = audioContext.value.createGain();
    const harmonic2Gain = audioContext.value.createGain();
    const noiseGain = audioContext.value.createGain();

    // Adjust mix levels
    baseGain.gain.setValueAtTime(0.8, audioContext.value.currentTime);
    propellerGain.gain.setValueAtTime(0.3, audioContext.value.currentTime);
    harmonic1Gain.gain.setValueAtTime(0.1, audioContext.value.currentTime);
    harmonic2Gain.gain.setValueAtTime(0.05, audioContext.value.currentTime);
    noiseGain.gain.setValueAtTime(0.2, audioContext.value.currentTime);

    // Connect everything
    baseOscillator.value.connect(baseGain);
    propellerOscillator.value.connect(propellerGain);
    harmonic1.value.connect(harmonic1Gain);
    harmonic2.value.connect(harmonic2Gain);
    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);

    baseGain.connect(engineGain.value);
    propellerGain.connect(engineGain.value);
    harmonic1Gain.connect(engineGain.value);
    harmonic2Gain.connect(engineGain.value);
    noiseGain.connect(engineGain.value);

    // Start all oscillators
    baseOscillator.value.start();
    propellerOscillator.value.start();
    harmonic1.value.start();
    harmonic2.value.start();
    lfo.start();
    noiseNode.start();

    // Add subtle random variations to create more organic sound
    setInterval(() => {
      const now = audioContext.value.currentTime;
      const slight = Math.random() * 2 - 1;
      baseOscillator.value.frequency.setValueAtTime(40 + slight, now);
      propellerOscillator.value.frequency.setValueAtTime(80 + slight * 2, now);
    }, 100);

  } catch (error) {
    console.error('Audio system initialization failed:', error);
  }
};

// Add this method and call it on first user interaction
const initAudioContext = () => {
  if (audioContext.value === null) {
    initSounds();
  } else if (audioContext.value.state === 'suspended') {
    audioContext.value.resume();
  }
};

const updateSounds = () => {
  if (!audioContext.value || !engineGain.value) return;

  // Ensure minimum thrust for idle
  const effectiveThrust = Math.max(MOVEMENT_SPEED.ENGINE_IDLE_THRUST, thrustLevel.value);

  // Calculate base frequency with idle minimum
  const baseFreq = 30 + (Math.pow(effectiveThrust / 100, 0.7) * 30);

  // Calculate RPM factor based on actual airspeed rather than thrust
  const rpmFactor = Math.pow(
    (airspeed.value - MOVEMENT_SPEED.MIN_AIRSPEED) /
    (MOVEMENT_SPEED.MAX_AIRSPEED - MOVEMENT_SPEED.MIN_AIRSPEED),
    0.8
  );

  // Add altitude effect to sound (higher altitude = thinner air = higher pitch)
  const altitudePitchEffect = (altitude.value / 10000) * 5; // 5Hz variation across full altitude range

  // Add vertical speed effect (diving increases pitch, climbing decreases)
  const verticalSpeedEffect = (verticalSpeed.value / MOVEMENT_SPEED.ALTITUDE) * 3; // 3Hz variation for max climb/dive rate

  if (baseOscillator.value) {
    // Base engine sound - mostly affected by thrust
    baseOscillator.value.frequency.setTargetAtTime(
      baseFreq + altitudePitchEffect,
      audioContext.value.currentTime,
      0.1
    );

    // Propeller sound - more affected by actual airspeed
    propellerOscillator.value.frequency.setTargetAtTime(
      70 + (rpmFactor * 50) + altitudePitchEffect + verticalSpeedEffect,
      audioContext.value.currentTime,
      0.1
    );

    // Harmonics - blend of thrust and airspeed effects
    harmonic1.value.frequency.setTargetAtTime(
      baseFreq * 3 + (rpmFactor * 20) + altitudePitchEffect,
      audioContext.value.currentTime,
      0.1
    );

    harmonic2.value.frequency.setTargetAtTime(
      baseFreq * 4 + (rpmFactor * 25) + altitudePitchEffect,
      audioContext.value.currentTime,
      0.1
    );
  }

  // Volume based on thrust but with minimum idle level
  const idleVolume = 0.1;
  const thrustVolume = Math.pow(effectiveThrust / 100, 1.2) * 0.3;
  const engineVolume = idleVolume + thrustVolume;

  engineGain.value.gain.setTargetAtTime(
    Math.min(0.4, engineVolume),
    audioContext.value.currentTime,
    0.1
  );
};

// Gamepad handling
const checkGamepadConnection = () => {
  const gamepads = navigator.getGamepads();
  for (let i = 0; i < gamepads.length; i++) {
    if (gamepads[i]) {
      if (gamepads[i].id === 'T.16000M (Vendor: 044f Product: b10a)') {
        gamepad.value = gamepads[i];
      } else if (gamepads[i].id === 'TWCS Throttle (Vendor: 044f Product: b687)') {
        thruster.value = gamepads[i];
      }
    }
  }
};

const onGamepadConnected = (e) => {
  if (e.gamepad.id === 'T.16000M (Vendor: 044f Product: b10a)') {
    gamepad.value = e.gamepad;
  } else if (e.gamepad.id === 'TWCS Throttle (Vendor: 044f Product: b687)') {
    thruster.value = e.gamepad;
  }
};

const onGamepadDisconnected = (e) => {
  if (e.gamepad.id === 'T.16000M (Vendor: 044f Product: b10a)') {
    gamepad.value = null;
  } else if (e.gamepad.id === 'TWCS Throttle (Vendor: 044f Product: b687)') {
    thruster.value = null;
  }
};

// Update the plane position function
const updatePlanePosition = () => {
  lastAltitude.value = altitude.value;

  // Handle joystick controls...
  if (gamepad.value) {
    const stick = navigator.getGamepads()[gamepad.value.index];
    if (stick) {
      const headingChange = stick.axes[0] * MOVEMENT_SPEED.HEADING;
      heading.value = (heading.value + headingChange + 360) % 360;

      const altitudeChange = -stick.axes[1] * MOVEMENT_SPEED.ALTITUDE;
      altitude.value = Math.max(0, Math.min(10000, altitude.value + altitudeChange));
    }
  }

  // Update thrust...
  if (thruster.value) {
    const throttle = navigator.getGamepads()[thruster.value.index];
    if (throttle) {
      thrustLevel.value = (1 - throttle.axes[2]) * 100;
    }
  }

  // Calculate air density factor (thinner air at higher altitudes)
  const altitudeFactor = 1 - (altitude.value / 20000); // Simplified air density calculation

  // Calculate drag (increases with speed)
  const dragForce = Math.pow(airspeed.value / 100, 2) * MOVEMENT_SPEED.DRAG_COEFFICIENT * altitudeFactor;

  // Calculate vertical speed effects
  const altitudeEffect = verticalSpeed.value * MOVEMENT_SPEED.ALTITUDE_EFFECT_RATE;
  const clampedAltitudeEffect = Math.max(
    -MOVEMENT_SPEED.MAX_ALTITUDE_EFFECT,
    Math.min(MOVEMENT_SPEED.MAX_ALTITUDE_EFFECT, altitudeEffect)
  );

  // Calculate target speed based on thrust
  targetSpeed.value = MOVEMENT_SPEED.MIN_AIRSPEED +
    ((MOVEMENT_SPEED.MAX_AIRSPEED - MOVEMENT_SPEED.MIN_AIRSPEED) * (thrustLevel.value / 100));

  // Calculate acceleration more realistically
  const speedDifference = targetSpeed.value - airspeed.value;
  const accelerationRate = speedDifference > 0 ?
    MOVEMENT_SPEED.ACCELERATION_RATE * altitudeFactor :
    MOVEMENT_SPEED.DECELERATION_RATE * altitudeFactor;

  // Update acceleration with momentum
  currentAcceleration.value += speedDifference * accelerationRate;
  currentAcceleration.value *= MOVEMENT_SPEED.MOMENTUM_RETENTION;  // Maintain momentum

  // Apply drag
  currentAcceleration.value -= dragForce;

  // Apply altitude effects
  currentAcceleration.value -= clampedAltitudeEffect * MOVEMENT_SPEED.ALTITUDE_EFFECT_RATE;

  // Update airspeed
  airspeed.value = Math.max(
    MOVEMENT_SPEED.MIN_AIRSPEED,
    Math.min(
      MOVEMENT_SPEED.MAX_AIRSPEED,
      airspeed.value + currentAcceleration.value
    )
  );

  // Debug logging - remove in production
  if (Math.random() < 0.01) { // Log only occasionally to avoid spam
    console.log({
      currentSpeed: Math.round(airspeed.value),
      targetSpeed: Math.round(targetSpeed.value),
      acceleration: currentAcceleration.value,
      drag: dragForce,
      altitudeEffect: clampedAltitudeEffect
    });
  }
};


const updateScore = () => {
  const currentConfig = config.value.configs[currentConfigIndex.value];

  if (currentConfig?.airspeed !== 'inactive' && !isAirspeedOutOfTarget.value) {
    timeOnTargetAirspeed.value += 1 / 60;
  }
  if (currentConfig?.compass !== 'inactive' && !isHeadingOutOfTarget.value) {
    timeOnTargetHeading.value += 1 / 60;
  }
  if (currentConfig?.altimeter !== 'inactive' && !isAltitudeOutOfTarget.value) {
    timeOnTargetAltitude.value += 1 / 60;
  }

  if ((!isAirspeedOutOfTarget.value || currentConfig?.airspeed === 'inactive') &&
    (!isHeadingOutOfTarget.value || currentConfig?.compass === 'inactive') &&
    (!isAltitudeOutOfTarget.value || currentConfig?.altimeter === 'inactive')) {
    score.value += 1;
  }
};

const moveToNextConfig = () => {
  const nextIndex = currentConfigIndex.value + 1;
  if (nextIndex < config.value.configs.length) {
    currentConfigIndex.value = nextIndex;
    // Reset targets for new config
    airspeedTarget.value = airspeed.value;
    headingTarget.value = heading.value;
    altitudeTarget.value = altitude.value;

  } else {
    endExam();
  }
};

const updatePerformanceData = () => {
  const currentTime = Date.now();
  if (currentTime - lastRecordedTime.value >= 1000) {
    headingPerformanceData.value.push({
      type: isHeadingOutOfTarget.value ? 'wrong' : 'correct',
      deviations: heading.value - headingTarget.value,
      timestamp: currentTime,
      configIndex: currentConfigIndex.value
    });

    airspeedPerformanceData.value.push({
      type: isAirspeedOutOfTarget.value ? 'wrong' : 'correct',
      deviations: airspeed.value - airspeedTarget.value,
      timestamp: currentTime,
      configIndex: currentConfigIndex.value
    });

    altitudePerformanceData.value.push({
      type: isAltitudeOutOfTarget.value ? 'wrong' : 'correct',
      deviations: altitude.value - altitudeTarget.value,
      timestamp: currentTime,
      configIndex: currentConfigIndex.value
    });

    lastRecordedTime.value = currentTime;
  }
};

const updateLoop = () => {
  checkGamepadConnection();
  if (examRunning.value) {
    updatePlanePosition();
    if (mode.value === 'moving') {
      updateTargets();
    }
    updateScore();
    updateTime();
    updatePerformanceData();
    updateSounds(); // Add sound updates
  }
  requestAnimationFrame(updateLoop);
};

const updateTime = () => {
  if (!examRunning.value) return;

  timeRemaining.value -= 1 / 60;
  if (timeRemaining.value <= 0) {
    const currentConfig = config.value.configs[currentConfigIndex.value];
    const configDuration = currentConfig?.duration * 60;

    // Check if we've completed the current config's duration
    if (Math.abs(timeRemaining.value) >= configDuration) {
      moveToNextConfig();
      // Reset timeRemaining for next config if there is one
      if (currentConfigIndex.value < config.value.configs.length) {
        timeRemaining.value = config.value.configs[currentConfigIndex.value].duration * 60;
      }
    }
  }
};

const updateTargets = () => {
  const currentConfig = config.value.configs[currentConfigIndex.value];
  const currentTime = Date.now();

  // Update every UPDATE_INTERVAL milliseconds
  if (currentTime - lastTargetUpdate.value >= UPDATE_INTERVAL) {
    lastTargetUpdate.value = currentTime;

    updateIndicator('airspeed', currentConfig?.airspeed);
    updateIndicator('heading', currentConfig?.compass);
    updateIndicator('altitude', currentConfig?.altimeter);
  }
};

const updateIndicator = (indicator, mode) => {
  if (mode === 'inactive' || mode === 'keep_indicator') return;
  const currentTime = Date.now();
  if (currentTime - lastUpdateTime.value < targetUpdateInterval.value) return;

  lastUpdateTime.value = currentTime;

  let currentValue, currentTarget, minValue, maxValue;

  switch (indicator) {
    case 'airspeed':
      currentValue = airspeed.value;
      currentTarget = airspeedTarget.value;
      minValue = MOVEMENT_SPEED.MIN_AIRSPEED;
      maxValue = MOVEMENT_SPEED.MAX_AIRSPEED;
      break;
    case 'heading':
      currentValue = heading.value;
      currentTarget = headingTarget.value;
      minValue = 0;
      maxValue = 360;
      break;
    case 'altitude':
      currentValue = altitude.value;
      currentTarget = altitudeTarget.value;
      minValue = 1000;
      maxValue = 9000;
      break;
  }
  console.log(currentValue, 'currentValue')
  // Calculate new target
  let newTarget;
  const changeDirection = Math.random() > 0.5 ? 1 : -1;

  if (indicator === 'heading') {
    // Special handling for heading to handle 0-360 wrap
    newTarget = (currentTarget + (changeDirection * MOVEMENT_SPEED.TARGET_CHANGE_RATE) + 360) % 360;
  } else {
    newTarget = currentTarget + (changeDirection * MOVEMENT_SPEED.TARGET_CHANGE_RATE);

    // Bounce back if we hit limits
    if (newTarget > maxValue) {
      newTarget = maxValue - MOVEMENT_SPEED.TARGET_CHANGE_RATE;
    } else if (newTarget < minValue) {
      newTarget = minValue + MOVEMENT_SPEED.TARGET_CHANGE_RATE;
    }
  }

  console.log('updating target', newTarget)
  // Update the target
  switch (indicator) {
    case 'airspeed':
      airspeedTarget.value = newTarget;
      airspeedChangeDirection.value = changeDirection > 0 ? 'up' : 'down';
      break;
    case 'heading':
      headingTarget.value = newTarget;
      headingChangeDirection.value = changeDirection > 0 ? 'up' : 'down';
      break;
    case 'altitude':
      altitudeTarget.value = newTarget;
      altitudeChangeDirection.value = changeDirection > 0 ? 'up' : 'down';
      break;
  }
  console.log(newTarget, 'updated target')
};


const startExam = () => {
  examRunning.value = true;
  score.value = 0;
  currentConfigIndex.value = 0;

  // Initialize first config duration
  const totalDur = config.value.configs.reduce((acc, cfg) => acc + Number(cfg.duration), 0);
  timeRemaining.value = totalDur * 60;

  // Reset performance tracking
  airspeed.value = 120;
  heading.value = 0;
  altitude.value = 5000;
  airspeedTarget.value = 120;
  headingTarget.value = 0;
  altitudeTarget.value = 5000;
  thrustLevel.value = 60;

  timeOnTargetAirspeed.value = 0;
  timeOnTargetHeading.value = 0;
  timeOnTargetAltitude.value = 0;

  // Reset audio test data
  audioResponses.value = [];
  displayedNumbers.value = [];

  // Initialize sound system
  initSounds();
};

// Modify endExam to cleanup sounds
const endExam = () => {
  examRunning.value = false;
  cleanupSounds();

  sendPerformanceData();
};


const initConfig = async () => {
  const scheduleData = JSON.parse(localStorage.getItem('scheduleData'));
  const configPFD = scheduleData.tests.find((t) => t.testUrl === "pfd-tracking-test");
  console.log(configPFD, 'config')
  // Store all configs and calculate total duration
  config.value = {
    configs: configPFD.configs,
    totalDuration: configPFD.configs.reduce((total, cfg) => total + Number(cfg.duration), 0),
    sessionId: scheduleData.sessionId,
    userId: scheduleData.userId
  };
};

const sendPerformanceData = async () => {
  try {
    loading.value = true;
    const router = useRouter();
    const API_URL = process.env.VUE_APP_API_URL;

    // Prepare performance data by config
    const performanceByConfig = config.value.configs.map((cfg, index) => {
      return {
        configId: cfg.id,
        airspeedData: airspeedPerformanceData.value.filter(d => d.configIndex === index),
        headingData: headingPerformanceData.value.filter(d => d.configIndex === index),
        altitudeData: altitudePerformanceData.value.filter(d => d.configIndex === index),
        audioResponses: audioResponses.value.filter(r => r.configIndex === index)
      };
    });

    const payload = {
      testSessionId: config.value.sessionId,
      userId: config.value.userId,
      result: {
        multi_graph_data: performanceByConfig.map(perf => ({
          heading: perf.headingData,
          airspeed: perf.airspeedData,
          altitude: perf.altitudeData,
        })),
        timeOnTargetAirspeed: timeOnTargetAirspeed.value,
        timeOnTargetHeading: timeOnTargetHeading.value,
        timeOnTargetAltitude: timeOnTargetAltitude.value,
        audioTest: performanceByConfig.map(perf => ({
          responses: perf.audioResponses,
          averageResponseTime: perf.audioResponses.reduce((acc, curr) => acc + curr.responseTime, 0) /
            (perf.audioResponses.length || 1),
          correctResponses: perf.audioResponses.filter(r => r.correct).length,
          totalResponses: perf.audioResponses.length,
          missedResponses: perf.audioResponses.filter(r => r.response === 'none').length
        })),
        thrustData: {
          averageThrust: thrustLevel.value,
          verticalSpeedImpact: verticalSpeed.value
        }
      },
    };

    const response = await fetch(`${API_URL}/api/submission`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    removeTestByNameAndUpdateLocalStorage('PFD Tracking Test');
    router.push('/module');
  } catch (error) {
    console.log("error submit:", error);
  } finally {
    loading.value = false;
  }
};

// Add this to your state declarations
const showStartModal = ref(true);

// Add this method
const handleStartExam = () => {
  showStartModal.value = false;
  initSounds();
  startExam();
  initAudioContext();
};

const handleCancel = () => {
  router.replace("/module");
}

// Lifecycle hooks
onMounted(() => {
  initConfig();
  window.addEventListener('gamepadconnected', onGamepadConnected);
  window.addEventListener('gamepaddisconnected', onGamepadDisconnected);
  checkGamepadConnection();
  updateLoop();
});

const cleanupSounds = () => {
  if (baseOscillator.value) {
    baseOscillator.value.stop();
    baseOscillator.value.disconnect();
  }
  if (propellerOscillator.value) {
    propellerOscillator.value.stop();
    propellerOscillator.value.disconnect();
  }
  if (harmonic1.value) {
    harmonic1.value.stop();
    harmonic1.value.disconnect();
  }
  if (harmonic2.value) {
    harmonic2.value.stop();
    harmonic2.value.disconnect();
  }
  if (audioContext.value) {
    audioContext.value.close();
  }
};

// Update onUnmounted to cleanup sounds
onUnmounted(() => {
  window.removeEventListener('gamepadconnected', onGamepadConnected);
  window.removeEventListener('gamepaddisconnected', onGamepadDisconnected);

  if (audioContext.value) {
    audioContext.value.close();
  }
});

</script>
