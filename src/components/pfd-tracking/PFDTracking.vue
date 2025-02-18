<template>
  <div class="tracking-test">
    <!-- Start Modal -->
    <Transition name="modal">
      <div v-if="showStartModal && !trainingMode" class="modal-overlay">
        <div class="modal-container">
          <div class="modal-content">
            <h2 class="modal-title">PFD Tracking Test</h2>
            <div class="modal-body">
              <p>Dalam ujian ini, anda perlu:</p>
              <ul class="modal-list">
                <li>
                  Mengendalikan indikator pesawat menggunakan joystick dan
                  thruster
                </li>
                <li>Menjaga indikator dalam rentang target</li>
              </ul>
              <p class="modal-footer-text">
                Klik Ya saat anda siap untuk memulai.
              </p>
            </div>
            <div class="modal-footer">
              <button class="modal-button mr-4 bg-green-500" @click="handleStartExam">
                YA
              </button>
              <button class="modal-button bg-red-500" @click="handleCancel">
                BATAL
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Training Instructions Modal -->
    <Transition name="modal">
      <div v-if="trainingMode && showInstructions" class="modal-overlay">
        <div class="modal-container">
          <div class="modal-content">
            <h2 class="modal-title">{{ trainingSteps[trainingStep].title }}</h2>
            <div class="modal-body">
              <img :src="trainingSteps[trainingStep].imagePath" alt="Training instruction"
                class="w-full h-auto max-h-64 object-contain mb-4 rounded" />
              <p class="text-lg">
                {{ trainingSteps[trainingStep].instruction }}
              </p>

              <!-- Step-specific tips -->
              <div v-if="trainingStep === 0" class="mt-4">
                <p class="font-bold">Tips Kendali Arah:</p>
                <ul class="list-disc pl-6">
                  <li>Gerakkan joystick kiri/kanan untuk mengontrol arah</li>
                  <li>Tampilan arah menunjukkan derajat (0-360°)</li>
                  <li>Jaga indikator arah dalam rentang ±5° dari target</li>
                </ul>
              </div>
              <div v-if="trainingStep === 1" class="mt-4">
                <p class="font-bold">Tips Ketinggian:</p>
                <ul class="list-disc pl-6">
                  <li>
                    Tarik ke belakang untuk naik, dorong ke depan untuk turun
                  </li>
                  <li>
                    Perhatikan kecepatan vertikal - hindari perubahan mendadak
                  </li>
                  <li>Jaga ketinggian dalam rentang ±100ft dari target</li>
                </ul>
              </div>
              <div v-if="trainingStep === 2" class="mt-4">
                <p class="font-bold">Tips Kecepatan:</p>
                <ul class="list-disc pl-6">
                  <li>Gunakan throttle untuk mengontrol daya mesin</li>
                  <li>Perubahan ketinggian akan mempengaruhi kecepatan</li>
                  <li>Jaga kecepatan dalam rentang ±5 knot dari target</li>
                </ul>
              </div>
            </div>
            <div class="modal-footer">
              <button class="modal-button mr-4 bg-green-500" @click="startTrainingStep">
                Mulai Latihan
              </button>
              <button v-if="completedTraining" class="modal-button bg-blue-500" @click="startExam">
                Mulai Test
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Timer -->
    <div v-if="!trainingMode" class="countdown-timer">
      {{ formatTime(timeRemaining) }}
    </div>

    <!-- Control Mode Toggle -->
    <div class="control-mode-toggle">
      <button @click="toggleControlMode">
        {{
          controlMode === "joystick"
            ? "Switch to Manual Control"
            : "Switch to Joystick Control"
        }}
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
    <div class="indicators-container" :class="{ 'training-mode': trainingMode }">
      <div class="indicators-row">
        <!-- Speed Indicator -->
        <div v-if="
          !trainingMode ||
          trainingSteps[trainingStep].activeIndicators.includes('airspeed')
        " class="indicator-group overflow-hidden" :class="{
          blink: isAirspeedOutOfTarget && examRunning,
          inactive:
            trainingMode &&
            !trainingSteps[trainingStep].activeIndicators.includes(
              'airspeed'
            ),
        }">
          <div class="indicator-label">SPEED</div>
          <div class="indicator vertical">
            <LinearGauge label="Airspeed" :value="airspeed" :target="airspeedTarget" :min="MOVEMENT_SPEED.MIN_AIRSPEED"
              :max="MOVEMENT_SPEED.MAX_AIRSPEED" :isVertical="true" :step="5" />
            <!-- Thrust Control -->
            <div class="thruster-indicator" :class="{
              highlight:
                trainingMode &&
                trainingSteps[trainingStep].activeIndicators.includes(
                  'airspeed'
                ),
            }">
              <div class="thruster-bar">
                <div class="thruster-fill" :style="{ height: `${thrustLevel}%` }"></div>
              </div>
              <div class="thruster-value">{{ Math.round(thrustLevel) }}%</div>
            </div>
          </div>
        </div>

        <!-- Heading Indicator -->
        <div v-if="
          !trainingMode ||
          trainingSteps[trainingStep].activeIndicators.includes('heading')
        " class="indicator-group overflow-hidden" :class="{
          blink: isHeadingOutOfTarget && examRunning,
          inactive:
            trainingMode &&
            !trainingSteps[trainingStep].activeIndicators.includes('heading'),
        }">
          <div class="indicator-label">HEADING</div>
          <div class="indicator horizontal">
            <LinearGauge label="compass" :value="heading" :target="headingTarget" :min="0" :max="360"
              :isVertical="false" :step="10" />
          </div>
        </div>

        <!-- Altitude Indicator -->
        <div v-if="
          !trainingMode ||
          trainingSteps[trainingStep].activeIndicators.includes('altitude')
        " class="indicator-group overflow-hidden" :class="{
          blink: isAltitudeOutOfTarget && examRunning,
          inactive:
            trainingMode &&
            !trainingSteps[trainingStep].activeIndicators.includes(
              'altitude'
            ),
        }">
          <div class="indicator-label">ALTITUDE</div>
          <div class="indicator vertical">
            <LinearGauge label="altitude" :value="altitude" :target="altitudeTarget" :min="0" :max="10000"
              :isVertical="true" :step="500" />
          </div>
        </div>
      </div>

      <!-- Training Progress Indicator -->
      <div v-if="trainingMode" class="training-progress">
        <div class="progress-steps">
          <div v-for="(step, index) in trainingSteps" :key="index" class="progress-step" :class="{
            completed: index < trainingStep,
            active: index === trainingStep,
            pending: index > trainingStep,
          }">
            <div class="step-number">{{ index + 1 }}</div>
            <div class="step-label">{{ step.title }}</div>
          </div>
        </div>
      </div>

      <!-- Training Mode Controls -->
      <!-- Add this near your training controls -->
      <div v-if="trainingMode && !showInstructions" class="training-controls">
        <!-- <button class="training-button mr-4" @click="showInstructions = true">
          <Info class="w-4 h-4 mr-2" />
          Show Instructions
        </button> -->
        <button class="training-button bg-green-500" @click="moveToNextTraining">
          Latihan Selanjutnya
          <ChevronRight class="w-4 h-4 ml-2" />
        </button>
      </div>

      <!-- Score Display -->
      <div v-if="examRunning" class="score-display">Score: {{ score }}</div>
    </div>
  </div>
</template>

<script setup>
import { removeTestByNameAndUpdateLocalStorage } from "@/utils";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import LinearGauge from "./LinearGauge.vue";

const router = useRouter();

// Constants for movement speed
const MOVEMENT_SPEED = {
  HEADING: 3,
  ALTITUDE: 20,
  THRUST_RESPONSE: 1,
  MIN_AIRSPEED: 60,
  MAX_AIRSPEED: 160,
  GRAVITY_EFFECT: 0.08,
  VERTICAL_SPEED_MULTIPLIER: 1.2,
  ACCELERATION_RATE: 0.001, // Increased from 0.000001
  DECELERATION_RATE: 0.0008, // Increased from 0.000001
  DRAG_COEFFICIENT: 0.00015, // Adjusted to match new acceleration
  MOMENTUM_RETENTION: 0.98, // Slightly reduced from 1 to allow for more responsive changes
  ENGINE_IDLE_THRUST: 15,
  ALTITUDE_EFFECT_RATE: 0.0004,
  MAX_ALTITUDE_EFFECT: 5,
  THRUST_MULTIPLIER: 4, // New: how much momentum is retained (close to 1)
  TARGET_CHANGE_RATE: 5,
};

// State
const controlMode = ref("joystick");
const mode = ref("moving");
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
  totalDuration: 0,
});
const lastRecordedTime = ref(Date.now());
// Add to your state declarations
const trainingMode = ref(true);
const trainingStep = ref(0);
const completedTraining = ref(false);
const showInstructions = ref(true);
// Training steps configuration
// Modify the trainingSteps array
// Complete trainingSteps array
const trainingSteps = [
  {
    title: "Heading Control Training",
    instruction:
      "Lakukan latihan mengontrol arah pesawat menggunakan gerakan joystick kiri/kanan. Jaga dalam rentang ±5° dari target.",
    activeIndicators: ["heading"],
    content: `
      <div class="space-y-4">
        <img src="/devices/joystick.png" alt="Heading Control Diagram" class="rounded-lg w-full">
        <div class="bg-gray-800 p-4 rounded-lg">
            <h3 class="text-lg font-bold mb-2">Kontrol Joystick:</h3>
            <ul class="list-disc pl-6 space-y-2">
            <li>Gerakkan joystick ke <span class="font-bold text-blue-400">KIRI</span> untuk menambah angka arah</li>
            <li>Gerakkan joystick ke <span class="font-bold text-blue-400">KANAN</span> untuk mengurangi angka arah</li>
            <li>Arah saat ini ditampilkan dalam derajat (0-360°)</li>
            <li>Penanda biru menunjukkan target arah Anda</li>
            </ul>
        </div>
      </div>
    `,
  },
  {
    title: "Altitude Control Training",
    instruction:
      "Lakukan latihan mengontrol ketinggian pesawat menggunakan gerakan joystick maju/mundur. Jaga dalam rentang ±100ft dari target.",
    activeIndicators: ["altitude"],
    content: `
      <div class="space-y-4">
        <img src="/devices/thruster.png" alt="Altitude Control Diagram" class="rounded-lg w-full">
        <div class="bg-gray-800 p-4 rounded-lg">
            <h3 class="text-lg font-bold mb-2">Kontrol Joystick:</h3>
            <ul class="list-disc pl-6 space-y-2">
            <li>Tarik joystick ke <span class="font-bold text-blue-400">BELAKANG</span> untuk menambah ketinggian</li>
            <li>Dorong joystick ke <span class="font-bold text-blue-400">DEPAN</span> untuk menurunkan ketinggian</li>
            <li>Ketinggian ditampilkan dalam satuan kaki (0-10.000ft)</li>
            <li>Penanda biru menunjukkan target ketinggian Anda</li>
            </ul>
        </div>
      </div>
    `,
  },
  {
    title: "Airspeed Control Training",
    instruction:
      "Lakukan latihan mengontrol kecepatan pesawat menggunakan throttle. Jaga dalam rentang ±5 knots dari target.",
    activeIndicators: ["airspeed"],
    content: `
      <div class="space-y-4">
        <img src="/api/placeholder/600/300" alt="Airspeed Control Diagram" class="rounded-lg w-full">
        <div class="bg-gray-800 p-4 rounded-lg">
          <h3 class="text-lg font-bold mb-2">Kontrol Throttle:</h3>
          <ul class="list-disc pl-6 space-y-2">
            <li>Gerakkan throttle ke <span class="font-bold text-blue-400">DEPAN</span> untuk menambah kecepatan</li>
            <li>Gerakkan throttle ke <span class="font-bold text-blue-400">BELAKANG</span> untuk mengurangi kecepatan</li>
            <li>Kecepatan ditampilkan dalam knot (60-160 knot)</li>
            <li>Ingat: Perubahan kecepatan bersifat bertahap dan dipengaruhi oleh ketinggian</li>
          </ul>
        </div>
      </div>
    `,
  },
];

// Computed properties
const isAirspeedOutOfTarget = computed(() => {
  const currentConfig = config.value.configs[currentConfigIndex.value];
  if (currentConfig?.airspeed === "inactive") return false;
  return Math.abs(airspeed.value - airspeedTarget.value) > 5;
});

const isHeadingOutOfTarget = computed(() => {
  const currentConfig = config.value.configs[currentConfigIndex.value];
  if (currentConfig?.compass === "inactive") return false;
  const diff = Math.abs(heading.value - headingTarget.value);
  return Math.min(diff, 360 - diff) > 5;
});

const isAltitudeOutOfTarget = computed(() => {
  const currentConfig = config.value.configs[currentConfigIndex.value];
  if (currentConfig?.altimeter === "inactive") return false;
  return Math.abs(altitude.value - altitudeTarget.value) > 100;
});

const verticalSpeed = computed(() => {
  return altitude.value - lastAltitude.value;
});

const toggleControlMode = () => {
  controlMode.value = controlMode.value === "joystick" ? "manual" : "joystick";
};

// Utility functions
const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

const headingInputDuration = ref(0);
const altitudeInputDuration = ref(0);

// Add the moveToNextTraining function
const moveToNextTraining = () => {
  if (trainingStep.value < trainingSteps.length - 1) {
    trainingStep.value++;
    showInstructions.value = true;
    headingInputDuration.value = 0;
    altitudeInputDuration.value = 0;

    // Reset relevant parameters for new training step
    if (
      trainingSteps[trainingStep.value].activeIndicators.includes("heading")
    ) {
      heading.value = 180;
      headingTarget.value = 270;
    }
    if (
      trainingSteps[trainingStep.value].activeIndicators.includes("altitude")
    ) {
      altitude.value = 5000;
      altitudeTarget.value = 6000;
    }
    if (
      trainingSteps[trainingStep.value].activeIndicators.includes("airspeed")
    ) {
      airspeed.value = 100;
      airspeedTarget.value = 120;
      thrustLevel.value = 50;
    }
  } else {
    completedTraining.value = true;
    trainingMode.value = false;
    startExam();
  }
};

const initSounds = () => {
  try {
    // Initialize Audio Context
    audioContext.value = new (window.AudioContext ||
      window.webkitAudioContext)();

    // Create main gain and compressor
    const compressor = audioContext.value.createDynamicsCompressor();
    compressor.connect(audioContext.value.destination);

    engineGain.value = audioContext.value.createGain();
    engineGain.value.connect(compressor);
    engineGain.value.gain.setValueAtTime(0, audioContext.value.currentTime);

    // Create noise generator
    const noiseBuffer = audioContext.value.createBuffer(
      1,
      audioContext.value.sampleRate * 2,
      audioContext.value.sampleRate
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
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(1000, audioContext.value.currentTime);
    noiseFilter.Q.setValueAtTime(1, audioContext.value.currentTime);

    // Base engine sound (low frequency)
    baseOscillator.value = audioContext.value.createOscillator();
    baseOscillator.value.type = "sawtooth";
    baseOscillator.value.frequency.setValueAtTime(
      40,
      audioContext.value.currentTime
    );

    // Propeller sound with modulation
    propellerOscillator.value = audioContext.value.createOscillator();
    propellerOscillator.value.type = "square";
    propellerOscillator.value.frequency.setValueAtTime(
      80,
      audioContext.value.currentTime
    );

    // LFO for propeller modulation
    const lfo = audioContext.value.createOscillator();
    const lfoGain = audioContext.value.createGain();
    lfo.frequency.setValueAtTime(2, audioContext.value.currentTime);
    lfoGain.gain.setValueAtTime(10, audioContext.value.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(propellerOscillator.value.frequency);

    // Harmonics
    harmonic1.value = audioContext.value.createOscillator();
    harmonic1.value.type = "triangle";
    harmonic1.value.frequency.setValueAtTime(
      160,
      audioContext.value.currentTime
    );

    harmonic2.value = audioContext.value.createOscillator();
    harmonic2.value.type = "triangle";
    harmonic2.value.frequency.setValueAtTime(
      200,
      audioContext.value.currentTime
    );

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
    console.error("Audio system initialization failed:", error);
  }
};

// Add this method and call it on first user interaction
const initAudioContext = () => {
  if (audioContext.value === null) {
    initSounds();
  } else if (audioContext.value.state === "suspended") {
    audioContext.value.resume();
  }
};

const updateSounds = () => {
  if (!audioContext.value || !engineGain.value) return;

  // Ensure minimum thrust for idle
  const effectiveThrust = Math.max(
    MOVEMENT_SPEED.ENGINE_IDLE_THRUST,
    thrustLevel.value
  );

  // Calculate base frequency with idle minimum
  const baseFreq = 30 + Math.pow(effectiveThrust / 100, 0.7) * 30;

  // Calculate RPM factor based on actual airspeed rather than thrust
  const rpmFactor = Math.pow(
    (airspeed.value - MOVEMENT_SPEED.MIN_AIRSPEED) /
    (MOVEMENT_SPEED.MAX_AIRSPEED - MOVEMENT_SPEED.MIN_AIRSPEED),
    0.8
  );

  // Add altitude effect to sound (higher altitude = thinner air = higher pitch)
  const altitudePitchEffect = (altitude.value / 10000) * 5; // 5Hz variation across full altitude range

  // Add vertical speed effect (diving increases pitch, climbing decreases)
  const verticalSpeedEffect =
    (verticalSpeed.value / MOVEMENT_SPEED.ALTITUDE) * 3; // 3Hz variation for max climb/dive rate

  if (baseOscillator.value) {
    // Base engine sound - mostly affected by thrust
    baseOscillator.value.frequency.setTargetAtTime(
      baseFreq + altitudePitchEffect,
      audioContext.value.currentTime,
      0.1
    );

    // Propeller sound - more affected by actual airspeed
    propellerOscillator.value.frequency.setTargetAtTime(
      70 + rpmFactor * 50 + altitudePitchEffect + verticalSpeedEffect,
      audioContext.value.currentTime,
      0.1
    );

    // Harmonics - blend of thrust and airspeed effects
    harmonic1.value.frequency.setTargetAtTime(
      baseFreq * 3 + rpmFactor * 20 + altitudePitchEffect,
      audioContext.value.currentTime,
      0.1
    );

    harmonic2.value.frequency.setTargetAtTime(
      baseFreq * 4 + rpmFactor * 25 + altitudePitchEffect,
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

const isOutOfTarget = (indicator) => {
  let diff;
  switch (indicator) {
    case "heading":
      diff = Math.abs(heading.value - headingTarget.value);
      return Math.min(diff, 360 - diff) > 5;
    case "altitude":
      return Math.abs(altitude.value - altitudeTarget.value) > 100;
    case "airspeed":
      return Math.abs(airspeed.value - airspeedTarget.value) > 5;
    default:
      return false;
  }
};

// Training progress monitoring
const timeOnTarget = ref(0);
const MASTERY_TIME = 5; // 5 seconds to master each control

const checkTrainingProgress = () => {
  const activeIndicators = trainingSteps[trainingStep.value].activeIndicators;
  let allOnTarget = true;

  for (const indicator of activeIndicators) {
    if (isOutOfTarget(indicator)) {
      allOnTarget = false;
      timeOnTarget.value = 0;
      break;
    }
  }

  if (allOnTarget) {
    timeOnTarget.value += 1 / 60; // Assuming 60 FPS
    if (timeOnTarget.value >= MASTERY_TIME) {
      completeTrainingStep();
      timeOnTarget.value = 0;
    }
  }
};

// Gamepad handling
const checkGamepadConnection = () => {
  const gamepads = navigator.getGamepads();
  for (let i = 0; i < gamepads.length; i++) {
    if (gamepads[i]) {
      if (gamepads[i].id === "T.16000M (Vendor: 044f Product: b10a)") {
        gamepad.value = gamepads[i];
      } else if (
        gamepads[i].id === "TWCS Throttle (Vendor: 044f Product: b687)"
      ) {
        thruster.value = gamepads[i];
      }
    }
  }
};

const onGamepadConnected = (e) => {
  if (e.gamepad.id === "T.16000M (Vendor: 044f Product: b10a)") {
    gamepad.value = e.gamepad;
  } else if (e.gamepad.id === "TWCS Throttle (Vendor: 044f Product: b687)") {
    thruster.value = e.gamepad;
  }
};

const onGamepadDisconnected = (e) => {
  if (e.gamepad.id === "T.16000M (Vendor: 044f Product: b10a)") {
    gamepad.value = null;
  } else if (e.gamepad.id === "TWCS Throttle (Vendor: 044f Product: b687)") {
    thruster.value = null;
  }
};

// Complete updatePlanePosition function
const updatePlanePosition = () => {
  lastAltitude.value = altitude.value;

  // Handle joystick controls
  if (gamepad.value) {
    const stick = navigator.getGamepads()[gamepad.value.index];

    if (stick) {
      // Apply deadzone and get raw values with reduced sensitivity
      const applyDeadzone = (value, threshold = 0.05) => {
        const absValue = Math.abs(value);
        if (absValue < threshold) return 0;
        // Add non-linear response for finer control
        const normalized = (absValue - threshold) / (1 - threshold);
        return value > 0 ? normalized : -normalized;
      };

      // Handle heading (X-axis) with reduced speed
      const rawX = applyDeadzone(stick.axes[0], 0.1);
      if (
        !trainingMode.value ||
        trainingSteps[trainingStep.value].activeIndicators.includes("heading")
      ) {
        const headingChange = rawX * MOVEMENT_SPEED.HEADING * 1.5; // Reduced from 5 to 1.5
        if (rawX !== 0) {
          heading.value = (heading.value - headingChange + 360) % 360;
        }
      }

      // Handle altitude (Y-axis) with reduced speed
      const rawY = applyDeadzone(stick.axes[1], 0.1);
      if (
        !trainingMode.value ||
        trainingSteps[trainingStep.value].activeIndicators.includes("altitude")
      ) {
        const altitudeChange = rawY * MOVEMENT_SPEED.ALTITUDE * 1.5; // Reduced from 5 to 1.5
        if (rawY !== 0) {
          altitude.value = Math.max(
            0,
            Math.min(10000, altitude.value - altitudeChange)
          );
        }
      }
    }
  }

  // Handle throttle
  if (thruster.value) {
    const throttle = navigator.getGamepads()[thruster.value.index];
    if (
      throttle &&
      (!trainingMode.value ||
        trainingSteps[trainingStep.value].activeIndicators.includes("airspeed"))
    ) {
      thrustLevel.value = (1 - throttle.axes[2]) * 100;
    }
  }

  // Calculate air density factor
  const altitudeFactor = 1 - altitude.value / 20000;
  const dragForce =
    Math.pow(airspeed.value / 100, 2) *
    MOVEMENT_SPEED.DRAG_COEFFICIENT *
    altitudeFactor;

  // Calculate vertical speed effects
  const altitudeEffect =
    verticalSpeed.value * MOVEMENT_SPEED.ALTITUDE_EFFECT_RATE;
  const clampedAltitudeEffect = Math.max(
    -MOVEMENT_SPEED.MAX_ALTITUDE_EFFECT,
    Math.min(MOVEMENT_SPEED.MAX_ALTITUDE_EFFECT, altitudeEffect)
  );

  // Calculate target speed based on thrust
  targetSpeed.value =
    MOVEMENT_SPEED.MIN_AIRSPEED +
    (MOVEMENT_SPEED.MAX_AIRSPEED - MOVEMENT_SPEED.MIN_AIRSPEED) *
    (thrustLevel.value / 100);

  // Calculate acceleration with improved response
  const speedDifference = targetSpeed.value - airspeed.value;
  const accelerationRate =
    speedDifference > 0
      ? MOVEMENT_SPEED.ACCELERATION_RATE * altitudeFactor * 2 // Doubled for better response
      : MOVEMENT_SPEED.DECELERATION_RATE * altitudeFactor * 2;

  // Update acceleration with momentum
  currentAcceleration.value += speedDifference * accelerationRate;
  currentAcceleration.value *= MOVEMENT_SPEED.MOMENTUM_RETENTION;

  // Apply forces
  currentAcceleration.value -= dragForce;
  currentAcceleration.value -=
    clampedAltitudeEffect * MOVEMENT_SPEED.ALTITUDE_EFFECT_RATE;

  // Update final airspeed
  airspeed.value = Math.max(
    MOVEMENT_SPEED.MIN_AIRSPEED,
    Math.min(
      MOVEMENT_SPEED.MAX_AIRSPEED,
      airspeed.value + currentAcceleration.value
    )
  );
};

const updateScore = () => {
  const currentConfig = config.value.configs[currentConfigIndex.value];

  if (currentConfig?.airspeed !== "inactive" && !isAirspeedOutOfTarget.value) {
    timeOnTargetAirspeed.value += 1 / 60;
  }
  if (currentConfig?.compass !== "inactive" && !isHeadingOutOfTarget.value) {
    timeOnTargetHeading.value += 1 / 60;
  }
  if (currentConfig?.altimeter !== "inactive" && !isAltitudeOutOfTarget.value) {
    timeOnTargetAltitude.value += 1 / 60;
  }

  if (
    (!isAirspeedOutOfTarget.value || currentConfig?.airspeed === "inactive") &&
    (!isHeadingOutOfTarget.value || currentConfig?.compass === "inactive") &&
    (!isAltitudeOutOfTarget.value || currentConfig?.altimeter === "inactive")
  ) {
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
    const remainingDuration = remainingConfigs.reduce(
      (acc, cfg) => acc + Number(cfg.duration),
      0
    );
    timeRemaining.value = remainingDuration * 60; // Convert minutes to seconds

    // // Log the remaining duration
    // console.log('Remaining Duration (seconds):', timeRemaining.value);
  } else {
    console.log("No more configs. Ending exam...");
    endExam(); // End the exam if there are no more configs
  }
};

const updatePerformanceData = () => {
  const currentTime = Date.now();
  if (currentTime - lastRecordedTime.value >= 1000) {
    headingPerformanceData.value.push({
      type: isHeadingOutOfTarget.value ? "wrong" : "correct",
      deviations: heading.value - headingTarget.value,
      timestamp: currentTime,
      configIndex: currentConfigIndex.value,
    });

    airspeedPerformanceData.value.push({
      type: isAirspeedOutOfTarget.value ? "wrong" : "correct",
      deviations: airspeed.value - airspeedTarget.value,
      timestamp: currentTime,
      configIndex: currentConfigIndex.value,
    });

    altitudePerformanceData.value.push({
      type: isAltitudeOutOfTarget.value ? "wrong" : "correct",
      deviations: altitude.value - altitudeTarget.value,
      timestamp: currentTime,
      configIndex: currentConfigIndex.value,
    });

    lastRecordedTime.value = currentTime;
  }
};

const updateLoop = () => {
  checkGamepadConnection();
  if (examRunning.value || trainingMode.value) {
    // Modified to run in training mode too
    updatePlanePosition();
    if (mode.value === "moving") {
      updateTargets();
    }
    if (examRunning.value) {
      updateScore();
      updateTime();
      updatePerformanceData();
    } else if (trainingMode.value) {
      checkTrainingProgress(); // New function to monitor training progress
    }
    updateSounds();
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

    updateIndicator("airspeed", currentConfig?.airspeed);
    updateIndicator("heading", currentConfig?.compass);
    updateIndicator("altitude", currentConfig?.altimeter);
  }
};

// Update the updateIndicator function for gradual target movement
const updateIndicator = (indicator, mode) => {
  if (mode === "inactive" || mode === "keep_indicator") {
    return;
  }

  const currentTime = Date.now();
  let lastUpdateTime =
    indicator === "airspeed"
      ? lastAirspeedUpdate.value
      : indicator === "heading"
        ? lastHeadingUpdate.value
        : lastAltitudeUpdate.value;

  if (currentTime - lastUpdateTime < UPDATE_INTERVAL) {
    return;
  }

  // Update the last update time
  if (indicator === "airspeed") lastAirspeedUpdate.value = currentTime;
  if (indicator === "heading") lastHeadingUpdate.value = currentTime;
  if (indicator === "altitude") lastAltitudeUpdate.value = currentTime;

  // Get current values
  const currentValue =
    indicator === "airspeed"
      ? airspeed.value
      : indicator === "heading"
        ? heading.value
        : altitude.value;

  const currentTarget =
    indicator === "airspeed"
      ? airspeedTarget.value
      : indicator === "heading"
        ? headingTarget.value
        : altitudeTarget.value;

  // Calculate new target with gradual movement
  let newTarget;
  if (indicator === "heading") {
    // For heading, we need to handle the 0-360 wrap
    const diff = ((currentValue - currentTarget + 180 + 360) % 360) - 180;
    const moveAmount = Math.min(Math.abs(diff), 45) * Math.sign(diff);
    newTarget = (currentTarget + moveAmount + 360) % 360;
  } else {
    // For altitude and airspeed
    const range = indicator === "altitude" ? 500 : 10;
    const diff = currentValue - currentTarget;
    const moveAmount = Math.min(Math.abs(diff), range) * Math.sign(diff);

    if (indicator === "altitude") {
      newTarget = Math.max(1000, Math.min(9000, currentTarget + moveAmount));
    } else {
      newTarget = Math.max(
        MOVEMENT_SPEED.MIN_AIRSPEED,
        Math.min(MOVEMENT_SPEED.MAX_AIRSPEED, currentTarget + moveAmount)
      );
    }
  }

  // Update the target value
  if (indicator === "airspeed") airspeedTarget.value = newTarget;
  if (indicator === "heading") headingTarget.value = newTarget;
  if (indicator === "altitude") altitudeTarget.value = newTarget;
};

const startTrainingStep = () => {
  showInstructions.value = false;
  const activeIndicators = trainingSteps[trainingStep.value].activeIndicators;

  // Reset parameters based on active indicators
  if (activeIndicators.includes("heading")) {
    heading.value = 180;
    headingTarget.value = 270;
  }
  if (activeIndicators.includes("altitude")) {
    altitude.value = 5000;
    altitudeTarget.value = 6000;
  }
  if (activeIndicators.includes("airspeed")) {
    airspeed.value = 100;
    airspeedTarget.value = 120;
    thrustLevel.value = 50;
  }
};

const completeTrainingStep = () => {
  // Check if current step is mastered (within target for 5 seconds)
  const activeIndicators = trainingSteps[trainingStep.value].activeIndicators;
  let stepMastered = true;

  for (const indicator of activeIndicators) {
    if (isOutOfTarget(indicator)) {
      stepMastered = false;
      break;
    }
  }

  if (stepMastered) {
    if (trainingStep.value < trainingSteps.length - 1) {
      trainingStep.value++;
      showInstructions.value = true;
    } else {
      completedTraining.value = true;
      trainingMode.value = false;
      startExam();
    }
  }
};

const startExam = () => {
  if (trainingMode.value && !completedTraining.value) {
    showInstructions.value = true;
    return;
  }

  examRunning.value = true;
  score.value = 0;
  currentConfigIndex.value = 0;

  const totalDur = config.value.configs.reduce((acc, cfg) => acc + Number(cfg.duration), 0);
  timeRemaining.value = totalDur * 60;

  // Reset all parameters
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

  audioResponses.value = [];
  displayedNumbers.value = [];

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
  const scheduleData = JSON.parse(localStorage.getItem("scheduleData"));
  const configPFD = scheduleData.tests.find(
    (t) => t.testUrl === "pfd-tracking-test"
  );
  // Store all configs and calculate total duration
  config.value = {
    configs: configPFD.configs,
    totalDuration: configPFD.configs.reduce(
      (total, cfg) => total + Number(cfg.duration),
      0
    ),
    sessionId: scheduleData.sessionId,
    userId: scheduleData.userId,
    id: configPFD.id,
  };
};

const sendPerformanceData = async () => {
  try {
    loading.value = true;
    const API_URL = process.env.VUE_APP_API_URL;

    // Prepare performance data by config
    const performanceByConfig = config.value.configs.map((cfg, index) => {
      return {
        configId: cfg.id,
        airspeedData: airspeedPerformanceData.value.filter(
          (d) => d.configIndex === index
        ),
        headingData: headingPerformanceData.value.filter(
          (d) => d.configIndex === index
        ),
        altitudeData: altitudePerformanceData.value.filter(
          (d) => d.configIndex === index
        ),
        audioResponses: audioResponses.value.filter(
          (r) => r.configIndex === index
        ),
      };
    });

    const payload = {
      testSessionId: config.value.sessionId,
      batteryTestId: config.value.id,
      userId: config.value.userId,
      result: {
        multi_graph_data: performanceByConfig.map((perf) => ({
          heading: perf.headingData,
          airspeed: perf.airspeedData,
          altitude: perf.altitudeData,
        })),
        timeOnTargetAirspeed: timeOnTargetAirspeed.value,
        timeOnTargetHeading: timeOnTargetHeading.value,
        timeOnTargetAltitude: timeOnTargetAltitude.value,
        audioTest: performanceByConfig.map((perf) => ({
          responses: perf.audioResponses,
          averageResponseTime:
            perf.audioResponses.reduce(
              (acc, curr) => acc + curr.responseTime,
              0
            ) / (perf.audioResponses.length || 1),
          correctResponses: perf.audioResponses.filter((r) => r.correct).length,
          totalResponses: perf.audioResponses.length,
          missedResponses: perf.audioResponses.filter(
            (r) => r.response === "none"
          ).length,
        })),
        thrustData: {
          averageThrust: thrustLevel.value,
          verticalSpeedImpact: verticalSpeed.value,
        },
      },
    };

    const response = await fetch(`${API_URL}/api/submission`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    removeTestByNameAndUpdateLocalStorage("PFD Tracking Test");
    router.push("/module");
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
};

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
  if (controlMode.value === "manual") {
    switch (event.key) {
      case "ArrowLeft":
        adjustHeading(-10); // Adjust heading left
        break;
      case "ArrowRight":
        adjustHeading(10); // Adjust heading right
        break;
      case "ArrowUp":
        adjustAltitude(100); // Increase altitude
        break;
      case "ArrowDown":
        adjustAltitude(-100); // Decrease altitude
        break;
      case "w":
        adjustThrust(10); // Increase thrust
        break;
      case "s":
        adjustThrust(-10); // Decrease thrust
        break;
    }
  }
};

// Lifecycle hooks
onMounted(() => {
  initConfig();
  showInstructions.value = true; // Ensure instructions show on mount
  window.addEventListener("gamepadconnected", onGamepadConnected);
  window.addEventListener("gamepaddisconnected", onGamepadDisconnected);
  window.addEventListener("keydown", handleKeyDown);
  checkGamepadConnection();
  updateLoop();
});

const cleanupSounds = () => {
  const stopAndDisconnect = (oscillator) => {
    if (oscillator.value) {
      try {
        oscillator.value.close();
        oscillator.value.stop();
        oscillator.value.disconnect();
      } catch (error) {
        console.warn("Failed to stop/disconnect oscillator:", error);
      }
    }
  };

  stopAndDisconnect(baseOscillator);
  stopAndDisconnect(propellerOscillator);
  stopAndDisconnect(harmonic1);
  stopAndDisconnect(harmonic2);

  if (audioContext.value && audioContext.value.state !== "closed") {
    audioContext.value.close().catch((error) => {
      console.warn("Failed to close AudioContext:", error);
    });
  }
};

// Update onUnmounted to cleanup sounds
onUnmounted(() => {
  window.removeEventListener("gamepadconnected", onGamepadConnected);
  window.removeEventListener("gamepaddisconnected", onGamepadDisconnected);
  window.removeEventListener("keydown", handleKeyDown);

  cleanupSounds()

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

.training-mode {
  position: relative;
}

.training-progress {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(44, 62, 80, 0.9);
  padding: 15px;
  border-radius: 8px;
  z-index: 1000;
}

.progress-steps {
  display: flex;
  gap: 20px;
}

.progress-step {
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.progress-step.active {
  opacity: 1;
}

.progress-step.completed {
  opacity: 0.8;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #4a5568;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.step-label {
  font-size: 14px;
}

.training-controls {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.training-button {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: #4a5568;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  transition: background-color 0.2s;
}

.training-button:hover {
  background: #2d3748;
}

.highlight {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(66, 153, 225, 0.5);
  }

  70% {
    box-shadow: 0 0 0 10px rgba(66, 153, 225, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(66, 153, 225, 0);
  }
}

.indicator-group.inactive {
  opacity: 0.3;
  pointer-events: none;
}

.modal-container {
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-body img {
  max-height: 300px;
  object-fit: contain;
  margin: 0 auto;
}
</style>
