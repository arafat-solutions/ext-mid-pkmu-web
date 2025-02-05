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
                <li>Mengendalikan indikator pesawat menggunakan joystick dan thruster</li>
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
    <!-- Control Mode Toggle -->
    <div class="control-mode-toggle">
      <button @click="toggleControlMode">
        {{ controlMode === 'joystick' ? 'Switch to Manual Control' : 'Switch to Joystick Control' }}
      </button>
    </div>

    <!-- Manual Control Instructions -->
    <div class="manual-control-instructions" v-if="controlMode === 'manual'">
      <p>Manual Controls:</p>
      <ul>
        <li>Arrow Keys: Control heading and altitude</li>
        <li>W: Increase thrust</li>
        <li>S: Decrease thrust</li>
      </ul>
    </div>

    <!-- Main Indicators -->
    <div class="indicators-container">
      <div class="indicators-row">
        <!-- Speed Indicator -->
        <div class="indicator-group overflow-hidden" :class="{ 'blink': isAirspeedOutOfTarget }">
          <div class="indicator-label">SPEED</div>
          <div class="indicator vertical">
            <LinearGauge label="Airspeed" :value="airspeed" :target="airspeedTarget" :min="MOVEMENT_SPEED.MIN_AIRSPEED"
              :max="MOVEMENT_SPEED.MAX_AIRSPEED" :isVertical="true" :step="5" />
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
        <div class="indicator-group overflow-hidden" :class="{ 'blink': isHeadingOutOfTarget }">
          <div class="indicator-label">HEADING</div>
          <div class="indicator horizontal">
            <LinearGauge label="compass" :value="heading" :target="headingTarget" :min="0" :max="360"
              :isVertical="false" />
          </div>
        </div>

        <!-- Altitude Indicator -->
        <div class="indicator-group overflow-hidden" :class="{ 'blink': isAltitudeOutOfTarget }">
          <div class="indicator-label">ALTITUDE</div>
          <div class="indicator vertical">
            <LinearGauge label="altitude" :value="altitude" :target="altitudeTarget" :min="0" :max="10000"
              :isVertical="true" :step="500" />

            <div class="thruster-indicator hidden">
            </div>
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
const controlMode = ref('joystick');
const mode = ref('moving');
const examRunning = ref(false);
const airspeed = ref(100);
const heading = ref(0);
const altitude = ref(5000);
// const currentTime = ref(new Date());
const airspeedTarget = ref(140);
const headingTarget = ref(150);
const altitudeTarget = ref(8000);
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
const audioContext = ref(null);
const engineGain = ref(null);
const baseOscillator = ref(null);
const propellerOscillator = ref(null);
const harmonic1 = ref(null);
const harmonic2 = ref(null);
const currentAcceleration = ref(0);
const targetSpeed = ref(MOVEMENT_SPEED.MIN_AIRSPEED);
const UPDATE_INTERVAL = 4000; // Update every 2 seconds
const lastTargetUpdate = ref(Date.now());
const lastAirspeedUpdate = ref(Date.now());
const lastHeadingUpdate = ref(Date.now());
const lastAltitudeUpdate = ref(Date.now());

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

const toggleControlMode = () => {
  controlMode.value = controlMode.value === 'joystick' ? 'manual' : 'joystick';
};

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

    // // Log the new config index
    // console.log('Moving to Config Index:', nextIndex);

    // Reset targets for the new config
    airspeedTarget.value = airspeed.value;
    headingTarget.value = heading.value;
    altitudeTarget.value = altitude.value;

    // Update timeRemaining for the new config
    const remainingConfigs = config.value.configs.slice(nextIndex);
    const remainingDuration = remainingConfigs.reduce((acc, cfg) => acc + Number(cfg.duration), 0);
    timeRemaining.value = remainingDuration * 60; // Convert minutes to seconds

    // // Log the remaining duration
    // console.log('Remaining Duration (seconds):', timeRemaining.value);
  } else {
    console.log('No more configs. Ending exam...');
    endExam(); // End the exam if there are no more configs
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

  // Log the current timeRemaining before decrementing
  // console.log('Current timeRemaining:', timeRemaining.value);

  // Decrement timeRemaining by 1/60th of a second (assuming 60 FPS)
  timeRemaining.value -= 1 / 60;

  // Ensure timeRemaining doesn't go below zero
  if (timeRemaining.value <= 0) {
    timeRemaining.value = 0;
    // console.log('Time is up! Ending exam...');
    endExam(); // End the exam when time runs out
    return;
  }

  // Check if the current config's duration has elapsed
  const currentConfig = config.value.configs[currentConfigIndex.value];
  const configDuration = currentConfig?.duration * 60; // Convert minutes to seconds

  // Log the current config and its duration
  // console.log('Current Config:', currentConfig);
  // console.log('Config Duration (seconds):', configDuration);

  // Calculate elapsed time for the current config
  const elapsedTime = configDuration - timeRemaining.value;
  // console.log('Elapsed Time (seconds):', elapsedTime);

  // If elapsed time exceeds the current config's duration, move to the next config
  if (elapsedTime >= configDuration) {
    // console.log('Moving to next config...');
    moveToNextConfig();
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
  if (mode === 'inactive' || mode === 'keep_indicator') {
    console.log(`${indicator} is inactive or set to keep_indicator. Skipping update.`);
    return;
  }

  const currentTime = Date.now();
  let lastUpdateTime;

  // Determine which lastUpdateTime to use
  switch (indicator) {
    case 'airspeed':
      lastUpdateTime = lastAirspeedUpdate.value;
      break;
    case 'heading':
      lastUpdateTime = lastHeadingUpdate.value;
      break;
    case 'altitude':
      lastUpdateTime = lastAltitudeUpdate.value;
      break;
    default:
      return;
  }

  // Check if it's time to update the target
  if (currentTime - lastUpdateTime < UPDATE_INTERVAL) {
    console.log(`Skipping ${indicator} update: too soon since last update.`);
    return;
  }

  // Update the lastUpdateTime for this indicator
  switch (indicator) {
    case 'airspeed':
      lastAirspeedUpdate.value = currentTime;
      break;
    case 'heading':
      lastHeadingUpdate.value = currentTime;
      break;
    case 'altitude':
      lastAltitudeUpdate.value = currentTime;
      break;
  }

  let currentTarget, minValue, maxValue;

  switch (indicator) {
    case 'airspeed':
      currentTarget = airspeedTarget.value;
      minValue = MOVEMENT_SPEED.MIN_AIRSPEED;
      maxValue = MOVEMENT_SPEED.MAX_AIRSPEED;
      break;
    case 'heading':
      currentTarget = headingTarget.value;
      minValue = 0;
      maxValue = 360;
      break;
    case 'altitude':
      currentTarget = altitudeTarget.value;
      minValue = 1000;
      maxValue = 9000;
      break;
    default:
      return;
  }

  // console.log(`Updating ${indicator} target. Current target: ${currentTarget}`);

  // Calculate the maximum change amount
  let maxChange;

  if (indicator === 'heading') {
    // Use a larger percentage (e.g., 30%) or a fixed value for heading
    maxChange = currentTarget * 0.3; // 30% of current value
    // Alternatively, use a fixed value for heading changes
    // maxChange = 30; // Fixed change of 30 degrees
  } else {
    // Use 20% for airspeed and altitude
    maxChange = currentTarget * 0.2;
  }

  // Ensure a minimum change for heading when currentTarget is 0
  if (indicator === 'heading' && currentTarget === 0) {
    maxChange = 30; // Minimum change of 30 degrees
  }

  // Generate a random change within the range of -maxChange to +maxChange
  const changeAmount = (Math.random() * 2 - 1) * maxChange; // Random value between -maxChange and +maxChange

  // Calculate the new target value
  let newTarget = currentTarget + changeAmount;

  // Handle wrapping for heading (0-360 degrees)
  if (indicator === 'heading') {
    newTarget = (newTarget + 360) % 360; // Wrap around at 0 and 360
  } else {
    // Clamp newTarget within min and max values
    newTarget = Math.max(minValue, Math.min(maxValue, newTarget));
  }

  // console.log(`New ${indicator} target: ${newTarget}`);

  // Update the target
  switch (indicator) {
    case 'airspeed':
      airspeedTarget.value = newTarget;
      break;
    case 'heading':
      headingTarget.value = newTarget;
      break;
    case 'altitude':
      altitudeTarget.value = newTarget;
      break;
  }
};

const startExam = () => {
  examRunning.value = true;
  score.value = 0;
  currentConfigIndex.value = 0;

  // Log the configs and their durations
  // console.log('Configurations:', config.value.configs);

  // Calculate total duration of all configs
  const totalDur = config.value.configs.reduce((acc, cfg) => acc + Number(cfg.duration), 0);
  // console.log('Total Duration (minutes):', totalDur);

  timeRemaining.value = totalDur * 60; // Convert minutes to seconds
  // console.log('Initial timeRemaining (seconds):', timeRemaining.value);

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
  timeRemaining.value = 0; // Ensure timeRemaining is set to zero
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

const adjustHeading = (amount) => {
  heading.value = (heading.value + amount + 360) % 360;
};

const adjustAltitude = (amount) => {
  altitude.value = Math.max(0, Math.min(10000, altitude.value + amount));
};

const adjustThrust = (amount) => {
  thrustLevel.value = Math.max(0, Math.min(100, thrustLevel.value + amount));
};

const handleKeyDown = (event) => {
  if (controlMode.value === 'manual') {
    switch (event.key) {
      case 'ArrowLeft':
        adjustHeading(-10); // Adjust heading left
        break;
      case 'ArrowRight':
        adjustHeading(10); // Adjust heading right
        break;
      case 'ArrowUp':
        adjustAltitude(100); // Increase altitude
        break;
      case 'ArrowDown':
        adjustAltitude(-100); // Decrease altitude
        break;
      case 'w':
        adjustThrust(10); // Increase thrust
        break;
      case 's':
        adjustThrust(-10); // Decrease thrust
        break;
    }
  }
};

// Lifecycle hooks
onMounted(() => {
  initConfig();
  window.addEventListener('gamepadconnected', onGamepadConnected);
  window.addEventListener('gamepaddisconnected', onGamepadDisconnected);
  window.addEventListener('keydown', handleKeyDown);
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
  window.removeEventListener('keydown', handleKeyDown);

  if (audioContext.value) {
    audioContext.value.close();
  }
});

</script>

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
  padding: 44px;
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

/* Control Mode Toggle */
.control-mode-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.control-mode-toggle button {
  padding: 10px 20px;
  font-size: 14px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.control-mode-toggle button:hover {
  background-color: #0056b3;
}

/* Manual Control Instructions */
.manual-control-instructions {
  position: fixed;
  bottom: 70px;
  /* Position above the toggle button */
  right: 20px;
  background-color: rgba(44, 62, 80, 0.9);
  /* Semi-transparent background */
  padding: 15px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  z-index: 1000;
}

.manual-control-instructions p {
  margin: 0 0 10px 0;
  font-weight: bold;
}

.manual-control-instructions ul {
  margin: 0;
  padding-left: 20px;
}

.manual-control-instructions li {
  margin-bottom: 5px;
}
</style>
