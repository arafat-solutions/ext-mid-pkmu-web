<template>
  <div class="pilot-exam">
    <!-- In your template -->]
    <!-- Final Exam Confirmation Modal -->
    <Transition name="modal">
      <div v-if="showExamConfirmModal" class="modal-overlay">
        <div class="modal-container">
          <div class="modal-content">
            <h1 class="modal-title">Mulai Tes</h1>
            <div class="modal-body">
              <p class="mb-4">
                Anda akan memulai tes sesungguhnya. Dalam tes ini:
              </p>
            </div>
            <div class="modal-footer">
              <button class="modal-button bg-gray-500 mr-4" @click="showExamConfirmModal = false">
                Kembali
              </button>
              <button class="modal-button bg-green-500" @click="startActualExam">
                Mulai Tes
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="showStartModal" class="modal-overlay">
        <div class="modal-container">
          <div class="modal-content">
            <div class="modal-body">
              <p>Dalam tes ini, Anda perlu:</p>
              <ul class="modal-list">
                <li>
                  Mengendalikan indikator pesawat menggunakan joystick dan
                  thruster
                </li>
                <li>Menjaga indikator dalam rentang target</li>
                <li>
                  Mendengarkan urutan angka dan mengidentifikasi apakah semuanya
                  ganjil atau genap
                </li>
              </ul>
            </div>
            <div class="modal-footer">
              <button class="modal-button bg-green-500 mr-4" @click="handleStartExam">
                {{ trainingMode ? "Mulai Latihan" : "Mulai Tes" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="showTrainingModal" class="modal-overlay">
        <div class="modal-container">
          <div class="modal-content">
            <h1 class="modal-title">
              {{
                currentTrainingStep < TRAINING_STEPS.length ? TRAINING_STEPS[currentTrainingStep].title : "" }} </h1>
                <div class="modal-body" v-html="currentTrainingStep < TRAINING_STEPS.length
                    ? TRAINING_STEPS[currentTrainingStep].instructions
                    : ''
                  "></div>
                <div class="modal-footer">
                  <button class="modal-button bg-green-500" @click="startTrainingStep">
                    Mulai
                  </button>
                </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Feedback Message -->
    <Transition name="fade">
      <div v-if="showFeedback" class="feedback-message" :class="userFollowingDirection ? 'feedback-correct' : 'feedback-incorrect'
        ">
        {{ feedbackMessage }}
      </div>
    </Transition>

    <button v-if="trainingMode && examRunning" class="next-step-button" @click="moveToNextTrainingStep">
      {{ nextStepButtonText }}
    </button>

    <!-- Update this part in the template -->
    <div class="countdown-timer" v-if="!trainingMode">
      {{ formatTime(config.totalDuration) }}
    </div>
    <div class="control-mode-toggle">
      <!-- <button @click="toggleControlMode">
        {{
          controlMode === "joystick"
            ? "Switch to Manual Control"
            : "Switch to Joystick Control"
        }}
      </button> -->
    </div>
    <div class="manual-control-instructions" v-if="controlMode === 'manual'">
      <p>Manual Controls:</p>
      <ul>
        <li>Arrow Keys: Control heading and altitude</li>
        <li>W: Increase thrust</li>
        <li>S: Decrease thrust</li>
      </ul>
    </div>
    <div class="indicators place-items-center">
      <!-- Heading - only show during joystick training -->
      <div v-if="
        !trainingMode ||
        (trainingMode &&
          TRAINING_STEPS[currentTrainingStep]?.activeControls.includes(
            'compass'
          ))
      " class="indicator-wrapper col-span-3" :class="{ blink: isHeadingOutOfTarget }">
        <Heading class="indicator-bg" :size="200" :heading="Math.round(heading)" />
        <div class="target-text">
          Target: {{ Math.round(headingTarget) }}°
          <span v-if="headingChangeDirection" :class="['direction-indicator', headingChangeDirection]"></span>
        </div>
      </div>

      <!-- Airspeed/Thrust - only show during throttle training -->
      <div v-if="
        !trainingMode ||
        (trainingMode &&
          TRAINING_STEPS[currentTrainingStep]?.activeControls.includes(
            'airspeed'
          ))
      " class="indicator-wrapper col-span-1" :class="{ blink: isAirspeedOutOfTarget }">
        <Airspeed class="indicator-bg" :size="200" :airspeed="Math.round(airspeed)" />
        <div class="thruster-indicator">
          <div class="thruster-bar">
            <div class="thruster-fill" :style="{ height: `${thrustLevel}%` }"></div>
          </div>
          <div class="thruster-value">
            Thrust: {{ Math.round(thrustLevel) }}%
          </div>
        </div>
        <div class="target-text">
          Target: {{ Math.round(airspeedTarget) }} knots
          <span v-if="airspeedChangeDirection" :class="['direction-indicator', airspeedChangeDirection]"></span>
        </div>
      </div>

      <!-- Analog Clock - always shown -->
      <div class="indicator-wrapper col-span-1" v-if="!trainingMode">
        <AnalogClock class="indicator-bg" style="padding: 20px" size="200" />
      </div>

      <!-- Altimeter - only show during joystick training -->
      <div v-if="
        !trainingMode ||
        (trainingMode &&
          TRAINING_STEPS[currentTrainingStep]?.activeControls.includes(
            'altimeter'
          ))
      " class="indicator-wrapper col-span-1" :class="{ blink: isAltitudeOutOfTarget }">
        <Altimeter class="indicator-bg" :size="200" :altitude="Math.round(altitude)" />
        <div class="target-text">
          Target: {{ Math.round(altitudeTarget) }} ft
          <span v-if="altitudeChangeDirection" :class="['direction-indicator', altitudeChangeDirection]"></span>
        </div>
      </div>
    </div>

    <!-- Audio Test Controls -->
    <!-- Audio Test Controls -->
    <div class="audio-test" v-if="
      !trainingMode ||
      (trainingMode &&
        TRAINING_STEPS[currentTrainingStep]?.activeControls.includes('audio'))
    ">
      <div class="number-display">
        Dengarkan dan pilih apakah semua angka yang Anda dengar adalah genap
        atau ganjil.
      </div>
      <div class="response-buttons">
        <button class="btn-red" @click="handleAudioResponse('odd')" :disabled="!canRespond">
          Ganjil
        </button>
        <button class="btn-green" @click="handleAudioResponse('even')" :disabled="!canRespond">
          Genap
        </button>
      </div>
    </div>
    <div v-if="examRunning">
      <p>Score: {{ score }}</p>
    </div>
  </div>
</template>

<script setup>
import { removeTestByNameAndUpdateLocalStorage } from "@/utils";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Altimeter, Airspeed, Heading } from "vue-flight-indicators";
import AnalogClock from "./AnalogClock.vue";
import { useRouter } from "vue-router";

// Constants for movement speed
const MOVEMENT_SPEED = {
  HEADING: 0.2,
  ALTITUDE: 5,
  THRUST_RESPONSE: 1,
  MIN_AIRSPEED: -10,
  MAX_AIRSPEED: 160,
  GRAVITY_EFFECT: 0.08,
  VERTICAL_SPEED_MULTIPLIER: 1.2,
  TARGET_CHANGE_RATE: 1,
  ACCELERATION_RATE: 0.001, // Increased from 0.000001
  DECELERATION_RATE: 0.0008, // Increased from 0.000001
  DRAG_COEFFICIENT: 0.00015, // Adjusted to match new acceleration
  MOMENTUM_RETENTION: 0.98, // Slightly reduced from 1 to allow for more responsive changes
  ENGINE_IDLE_THRUST: 15,
  ALTITUDE_EFFECT_RATE: 0.0004,
  MAX_ALTITUDE_EFFECT: 5,
  THRUST_MULTIPLIER: 4, // New: how much momentum is retained (close to 1)
};

//  manual input
const controlMode = ref("joystick");
const manualInput = ref({
  up: false, // Increase altitude
  down: false, // Decrease altitude
  left: false, // Decrease heading
  right: false, // Increase heading
  thrustUp: false, // Increase thrust
  thrustDown: false, // Decrease thrust
});

// State
const mode = ref("moving");
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
const audioContext = ref(null);
const engineGain = ref(null);
const baseOscillator = ref(null);
const propellerOscillator = ref(null);
const harmonic1 = ref(null);
const harmonic2 = ref(null);
const currentAcceleration = ref(0);
const targetSpeed = ref(MOVEMENT_SPEED.MIN_AIRSPEED);

// Audio test state
const displayedNumbers = ref([]);
const audioResponses = ref([]);
const canRespond = ref(false);
const currentAudioStart = ref(null);
const audioTimeout = ref(null);
const synthesis = window.speechSynthesis;

// Performance data
const headingPerformanceData = ref([]);
const airspeedPerformanceData = ref([]);
const altitudePerformanceData = ref([]);
const config = ref({
  configs: [],
  totalDuration: 0,
});
const lastRecordedTime = ref(Date.now());
const userInputs = ref([]);

const trainingMode = ref(true);
const currentTrainingStep = ref(0);
const showFeedback = ref(false);
const feedbackMessage = ref("");
const userFollowingDirection = ref(false);
const currentStep = ref(null);
const performanceMetrics = ref({});
const showTrainingModal = ref(false); // Training step modal
const showExamConfirmModal = ref(false);

const TRAINING_STEPS = [
  {
    id: "joystick",
    title: "LATIHAN",
    instructions: `
      <div class="training-instructions">
        <img src="/devices/mic.png" alt="Panduan Joystick" class="instruction-image" style="display: block; margin: 0 auto;" />
<p>
Pada latihan ini Anda diminta untuk menggerakan JOYSTICK KANAN atau KIRI untuk menyesuaikan target yang ditentukan.</p>
      </div>
    `,
    activeControls: ["compass"],
    feedbackThreshold: 5, // seconds to maintain correct direction before positive feedback
  },
  {
    id: "joystick2",
    title: "LATIHAN",
    instructions: `
      <div class="training-instructions">
      <img src="/devices/mic_2.png" alt="Panduan Throttle" class="instruction-image" style="display: block; margin: 0 auto" />
<p>Pada latihan ini Anda diminta untuk menggerakan JOYSTICK ATAS atau BAWAH untuk menyesuaikan target yang ditentukan.
</p>
      </div>
    `,
    activeControls: ["altimeter"],
    feedbackThreshold: 3,
  },

  {
    id: "throttle",
    title: "LATIHAN",
    instructions: `
      <div class="training-instructions">
      <img src="/devices/mic_3.png" alt="Panduan Throttle" class="instruction-image" style="display: block; margin: 0 auto" />
<p>Pada latihan ini Anda diminta untuk menggerakan THRUSTER DEPAN atau BELAKANG untuk menyesuaikan target yang ditentukan.</p>
      </div>
    `,
    activeControls: ["airspeed"],
    feedbackThreshold: 3,
  },
  {
    id: "numbers",
    title: "Latihan Tes Angka",
    instructions: `
      <div class="training-instructions">
      <img src="/devices/mic_4.png" alt="Panduan Throttle" class="instruction-image" style="display: block; margin: 0 auto" />
<p>Pada latihan ini Anda diminta untuk mendengarkan urutan angka, bila mendengar 3 urutan GENAP atau GANJIL. Maka pilihlah jawaban yang sesuai.
(contoh: 3 – 7 – 11, maka jawabannya GANJIL).</p>
      </div>
    `,
    activeControls: ["audio"],
    feedbackThreshold: 2,
  },
  {
    id: "combined",
    title: "LATIHAN",
    instructions: `
      <div class="training-instructions">
        <h2>Latihan Semua Kontrol</h2>
        <ul>
          <li>Kontrol semua aspek pesawat sambil mendengarkan angka</li>
          <li>Prioritaskan kontrol pesawat</li>
          <li>Jawab pertanyaan angka saat Anda siap</li>
        </ul>
      </div>
    `,
    activeControls: ["compass", "altimeter", "airspeed", "audio"],
    feedbackThreshold: 8,
  },
];

const checkDirectionFollowing = () => {
  const currentStep = TRAINING_STEPS[currentTrainingStep.value];

  if (currentStep.activeControls.includes("compass")) {
    const headingDiff = heading.value - headingTarget.value;
    const isCorrectDirection =
      (headingChangeDirection.value === "up" && headingDiff < 0) ||
      (headingChangeDirection.value === "down" && headingDiff > 0);
    return isCorrectDirection;
  }

  if (currentStep.activeControls.includes("airspeed")) {
    const speedDiff = airspeed.value - airspeedTarget.value;
    const isCorrectDirection =
      (airspeedChangeDirection.value === "up" && speedDiff < 0) ||
      (airspeedChangeDirection.value === "down" && speedDiff > 0);
    return isCorrectDirection;
  }

  return true;
};

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

const nextStepButtonText = computed(() => {
  return currentTrainingStep.value === TRAINING_STEPS.length - 1
    ? "Mulai Tes"
    : "Lanjut ke Latihan Berikutnya";
});

// const toggleControlMode = () => {
//   controlMode.value = controlMode.value === "joystick" ? "manual" : "joystick";
// };

// Utility functions
const formatTime = (time) => {
  if (time <= 0) {
    return "00:00";
  }
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

const generateRandomNumber = () => Math.floor(Math.random() * 10);

const speakNumber = (number) => {
  const utterance = new SpeechSynthesisUtterance(number.toString());
  utterance.lang = "id-ID"; // Set language
  utterance.volume = 5; // Maximum volume
  utterance.rate = 1; // Normal speed
  utterance.pitch = 1; // Normal pitch

  // Cancel any ongoing speech
  synthesis.cancel();

  // Speak the new number
  synthesis.speak(utterance);
};

// const initSounds = () => {
//     try {
//         // Initialize Audio Context
//         audioContext.value = new (window.AudioContext || window.webkitAudioContext)();

//         // Create main gain and compressor
//         const compressor = audioContext.value.createDynamicsCompressor();
//         compressor.connect(audioContext.value.destination);

//         engineGain.value = audioContext.value.createGain();
//         engineGain.value.connect(compressor);
//         engineGain.value.gain.setValueAtTime(0, audioContext.value.currentTime);

//         // Create noise generator
//         const noiseBuffer = audioContext.value.createBuffer(
//             1, audioContext.value.sampleRate * 2, audioContext.value.sampleRate
//         );
//         const noise = noiseBuffer.getChannelData(0);
//         for (let i = 0; i < noiseBuffer.length; i++) {
//             noise[i] = Math.random() * 2 - 1;
//         }

//         const noiseNode = audioContext.value.createBufferSource();
//         noiseNode.buffer = noiseBuffer;
//         noiseNode.loop = true;

//         // Create filters
//         const noiseFilter = audioContext.value.createBiquadFilter();
//         noiseFilter.type = 'bandpass';
//         noiseFilter.frequency.setValueAtTime(1000, audioContext.value.currentTime);
//         noiseFilter.Q.setValueAtTime(1, audioContext.value.currentTime);

//         // Base engine sound (low frequency)
//         baseOscillator.value = audioContext.value.createOscillator();
//         baseOscillator.value.type = 'sawtooth';
//         baseOscillator.value.frequency.setValueAtTime(40, audioContext.value.currentTime);

//         // Propeller sound with modulation
//         propellerOscillator.value = audioContext.value.createOscillator();
//         propellerOscillator.value.type = 'square';
//         propellerOscillator.value.frequency.setValueAtTime(80, audioContext.value.currentTime);

//         // LFO for propeller modulation
//         const lfo = audioContext.value.createOscillator();
//         const lfoGain = audioContext.value.createGain();
//         lfo.frequency.setValueAtTime(2, audioContext.value.currentTime);
//         lfoGain.gain.setValueAtTime(10, audioContext.value.currentTime);
//         lfo.connect(lfoGain);
//         lfoGain.connect(propellerOscillator.value.frequency);

//         // Harmonics
//         harmonic1.value = audioContext.value.createOscillator();
//         harmonic1.value.type = 'triangle';
//         harmonic1.value.frequency.setValueAtTime(160, audioContext.value.currentTime);

//         harmonic2.value = audioContext.value.createOscillator();
//         harmonic2.value.type = 'triangle';
//         harmonic2.value.frequency.setValueAtTime(200, audioContext.value.currentTime);

//         // Gain nodes for mixing
//         const baseGain = audioContext.value.createGain();
//         const propellerGain = audioContext.value.createGain();
//         const harmonic1Gain = audioContext.value.createGain();
//         const harmonic2Gain = audioContext.value.createGain();
//         const noiseGain = audioContext.value.createGain();

//         // Adjust mix levels
//         baseGain.gain.setValueAtTime(0.8, audioContext.value.currentTime);
//         propellerGain.gain.setValueAtTime(0.3, audioContext.value.currentTime);
//         harmonic1Gain.gain.setValueAtTime(0.1, audioContext.value.currentTime);
//         harmonic2Gain.gain.setValueAtTime(0.05, audioContext.value.currentTime);
//         noiseGain.gain.setValueAtTime(0.2, audioContext.value.currentTime);

//         // Connect everything
//         baseOscillator.value.connect(baseGain);
//         propellerOscillator.value.connect(propellerGain);
//         harmonic1.value.connect(harmonic1Gain);
//         harmonic2.value.connect(harmonic2Gain);
//         noiseNode.connect(noiseFilter);
//         noiseFilter.connect(noiseGain);

//         baseGain.connect(engineGain.value);
//         propellerGain.connect(engineGain.value);
//         harmonic1Gain.connect(engineGain.value);
//         harmonic2Gain.connect(engineGain.value);
//         noiseGain.connect(engineGain.value);

//         // Start all oscillators
//         baseOscillator.value.start();
//         propellerOscillator.value.start();
//         harmonic1.value.start();
//         harmonic2.value.start();
//         lfo.start();
//         noiseNode.start();

//         // Add subtle random variations to create more organic sound
//         setInterval(() => {
//             const now = audioContext.value.currentTime;
//             const slight = Math.random() * 2 - 1;
//             baseOscillator.value.frequency.setValueAtTime(40 + slight, now);
//             propellerOscillator.value.frequency.setValueAtTime(80 + slight * 2, now);
//         }, 100);

//     } catch (error) {
//         console.error('Audio system initialization failed:', error);
//     }
// };

// Add this method and call it on first user interaction
const initAudioContext = () => {
  if (audioContext.value === null) {
    // initSounds();
  } else if (audioContext.value.state === "suspended") {
    // audioContext.value.resume();
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

// Constants for audio test
const AUDIO_TEST = {
  SEQUENCE_PAUSE: 15000,
  NUMBER_INTERVAL: 1000,
  RESPONSE_WINDOW: 15000,
};

// Audio test functions
const startAudioSequence = () => {
  if (!examRunning.value) return;

  if (
    trainingMode.value &&
    !TRAINING_STEPS[currentTrainingStep.value].activeControls.includes("audio")
  ) {
    return;
  }

  const numbers = [
    generateRandomNumber(),
    generateRandomNumber(),
    generateRandomNumber(),
  ];
  displayedNumbers.value = numbers;

  let index = 0;
  const speakNextNumber = () => {
    if (index < numbers.length) {
      speakNumber(numbers[index]);
      index++;
      setTimeout(speakNextNumber, AUDIO_TEST.NUMBER_INTERVAL);
    } else {
      canRespond.value = true;
      currentAudioStart.value = Date.now();

      audioTimeout.value = setTimeout(() => {
        if (canRespond.value) {
          handleNoResponse();
        }
      }, AUDIO_TEST.RESPONSE_WINDOW);
    }
  };

  speakNextNumber();
};

const handleAudioResponse = (response) => {
  if (!canRespond.value) return;

  clearTimeout(audioTimeout.value);
  const responseTime = Date.now() - currentAudioStart.value;

  const allEven = displayedNumbers.value.every((num) => num % 2 === 0);
  const allOdd = displayedNumbers.value.every((num) => num % 2 === 1);
  const isCorrect =
    (allEven && response === "even") || (allOdd && response === "odd");

  audioResponses.value.push({
    numbers: [...displayedNumbers.value],
    response,
    responseTime,
    correct: isCorrect,
    configIndex: currentConfigIndex.value,
  });

  // graph data
  userInputs.value.push({
    type: isCorrect ? "correct" : "wrong",
    responseTime,
    timestamp: Date.now(),
  });

  canRespond.value = false;
  displayedNumbers.value = [];

  setTimeout(startAudioSequence, AUDIO_TEST.SEQUENCE_PAUSE);
};

const handleNoResponse = () => {
  audioResponses.value.push({
    numbers: [...displayedNumbers.value],
    response: "none",
    responseTime: AUDIO_TEST.RESPONSE_WINDOW,
    correct: false,
    configIndex: currentConfigIndex.value,
  });

  canRespond.value = false;
  displayedNumbers.value = [];

  setTimeout(startAudioSequence, AUDIO_TEST.SEQUENCE_PAUSE);
};

const cancelAudioSequence = () => {
  clearTimeout(audioTimeout.value);
  synthesis.cancel();
  displayedNumbers.value = [];
  canRespond.value = false;
};

// Update the plane position function
const updatePlanePosition = () => {
  lastAltitude.value = altitude.value;

  // Handle joystick controls
  if (controlMode.value === "joystick") {
    if (gamepad.value) {
      const stick = navigator.getGamepads()[gamepad.value.index];
      if (stick) {
        const headingChange = stick.axes[0] * MOVEMENT_SPEED.HEADING;
        heading.value = (heading.value + headingChange + 360) % 360;

        const altitudeChange = -stick.axes[1] * MOVEMENT_SPEED.ALTITUDE;
        altitude.value = Math.max(
          0,
          Math.min(10000, altitude.value + altitudeChange)
        );
      }
    }

    if (thruster.value) {
      const throttle = navigator.getGamepads()[thruster.value.index];
      if (throttle) {
        thrustLevel.value = (0.5 - throttle.axes[2] / 2) * 100;
      }
    }
  } else if (controlMode.value === "manual") {
    // this is the manual input to test without joystick
    let headingChange = 0;
    let altitudeChange = 0;

    if (manualInput.value.left) {
      headingChange = -MOVEMENT_SPEED.HEADING; // Turn left
    }
    if (manualInput.value.right) {
      headingChange = MOVEMENT_SPEED.HEADING; // Turn right
    }
    if (manualInput.value.up) {
      altitudeChange = MOVEMENT_SPEED.ALTITUDE; // Increase altitude
    }
    if (manualInput.value.down) {
      altitudeChange = -MOVEMENT_SPEED.ALTITUDE; // Decrease altitude
    }

    // Apply changes to heading and altitude
    heading.value = (heading.value + headingChange + 360) % 360;
    altitude.value = Math.max(
      0,
      Math.min(10000, altitude.value + altitudeChange)
    );

    // Update thrust based on manual input
    if (manualInput.value.thrustUp) {
      thrustLevel.value = Math.min(
        100,
        thrustLevel.value + MOVEMENT_SPEED.THRUST_RESPONSE
      ); // Increase thrust
    }
    if (manualInput.value.thrustDown) {
      thrustLevel.value = Math.max(
        0,
        thrustLevel.value - MOVEMENT_SPEED.THRUST_RESPONSE
      ); // Decrease thrust
    }
  }

  // Calculate air density factor (thinner air at higher altitudes)
  const altitudeFactor = 1 - altitude.value / 20000;

  // Calculate drag (increases with speed)
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

  // Set minimum airspeed based on altitude (higher minimum speed at higher altitudes)
  const minimumAirspeed =
    MOVEMENT_SPEED.MIN_AIRSPEED + (altitude.value / 10000) * 20;

  // Calculate target speed based on thrust with minimum speed
  targetSpeed.value = Math.max(
    minimumAirspeed,
    MOVEMENT_SPEED.MIN_AIRSPEED +
    (MOVEMENT_SPEED.MAX_AIRSPEED - MOVEMENT_SPEED.MIN_AIRSPEED) *
    (thrustLevel.value / 100)
  );

  // Calculate acceleration
  const speedDifference = targetSpeed.value - airspeed.value;
  const accelerationRate =
    speedDifference > 0
      ? MOVEMENT_SPEED.ACCELERATION_RATE * altitudeFactor
      : MOVEMENT_SPEED.DECELERATION_RATE * altitudeFactor;

  // Update acceleration with momentum
  currentAcceleration.value += speedDifference * accelerationRate;
  currentAcceleration.value *= MOVEMENT_SPEED.MOMENTUM_RETENTION;

  // Apply drag and altitude effects
  currentAcceleration.value -= dragForce;
  currentAcceleration.value -=
    clampedAltitudeEffect * MOVEMENT_SPEED.ALTITUDE_EFFECT_RATE;

  // Update airspeed with minimum speed enforcement
  airspeed.value = Math.max(
    minimumAirspeed,
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
  // This condition means it will only end when totalDuration is 0 or negative
  if (config.value.totalDuration <= 0) {
    endExam();
    return;
  }
  // But we're checking if nextIndex is within bounds, which might never be true
  if (nextIndex <= config.value.configs.length) {
    currentConfigIndex.value = nextIndex;
    // Reset targets for new config
    airspeedTarget.value = airspeed.value;
    headingTarget.value = heading.value;
    altitudeTarget.value = altitude.value;

    startAudioSequence();
  } else {
    endExam();
  }
};

const updateLoop = () => {
  checkGamepadConnection();
  if (examRunning.value) {
    updatePlanePosition();
    if (mode.value === "moving") {
      updateTargets();
    }
    monitorPerformance();
    updateScore();
    updateTime();
    updatePerformanceData();
    updateSounds();
  }
  requestAnimationFrame(updateLoop);
};

const updateTime = () => {
  if (!examRunning.value) return;

  // Don't decrease time during training mode
  if (trainingMode.value) return;

  timeRemaining.value -= 1 / 60;
  config.value.totalDuration -= 1 / 60;

  // Add explicit check for exam end
  if (config.value.totalDuration <= 0) {
    endExam();
    return;
  }

  if (timeRemaining.value <= 0) {
    const currentConfig = config.value.configs[currentConfigIndex.value];
    const configDuration = currentConfig?.duration * 60;

    // Check if we've completed the current config's duration
    if (Math.abs(timeRemaining.value) <= configDuration) {
      moveToNextConfig();
      // Reset timeRemaining for next config if there is one
      if (currentConfigIndex.value < config.value.configs.length) {
        timeRemaining.value =
          config.value.configs[currentConfigIndex.value].duration * 60;
      }
    }
  }
};

const updateTargets = () => {
  const currentConfig = config.value.configs[currentConfigIndex.value];
  const currentTime = Date.now();

  // Only update every 10 seconds
  if (currentTime - lastUpdateTime.value < 10000) {
    return;
  }

  lastUpdateTime.value = currentTime;

  // Generate smooth, gradual changes for each indicator
  if (currentConfig?.airspeed !== "inactive") {
    // Calculate new airspeed target with 5% maximum change
    const maxAirspeedChange = airspeedTarget.value * 0.05;
    const airspeedChange = (Math.random() * 2 - 1) * maxAirspeedChange;
    const newAirspeedTarget = Math.max(
      MOVEMENT_SPEED.MIN_AIRSPEED + 20, // Minimum target speed
      Math.min(
        MOVEMENT_SPEED.MAX_AIRSPEED - 20, // Maximum target speed
        airspeedTarget.value + airspeedChange
      )
    );

    airspeedTarget.value = newAirspeedTarget;
    airspeedChangeDirection.value = airspeedChange > 0 ? "up" : "down";
  }

  if (currentConfig?.compass !== "inactive") {
    // Calculate new heading target with 10-degree maximum change
    const headingChange = (Math.random() * 2 - 1) * 10;
    const newHeadingTarget = (headingTarget.value + headingChange + 360) % 360;

    headingTarget.value = newHeadingTarget;
    headingChangeDirection.value = headingChange > 0 ? "up" : "down";
  }

  if (currentConfig?.altimeter !== "inactive") {
    // Calculate new altitude target with 3% maximum change
    const maxAltitudeChange = altitudeTarget.value * 0.03;
    const altitudeChange = (Math.random() * 2 - 1) * maxAltitudeChange;
    const newAltitudeTarget = Math.max(
      1000, // Minimum altitude
      Math.min(
        9000, // Maximum altitude
        altitudeTarget.value + altitudeChange
      )
    );

    altitudeTarget.value = newAltitudeTarget;
    altitudeChangeDirection.value = altitudeChange > 0 ? "up" : "down";
  }
};

const startExam = () => {
  // Common initialization regardless of mode
  examRunning.value = true;
  currentConfigIndex.value = 0;
  score.value = 0;

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

  if (trainingMode.value) {
    // Training mode specific initialization
    const currentStep = TRAINING_STEPS[currentTrainingStep.value];

    // Create a training config based on active controls
    config.value = {
      configs: [
        {
          id: `training-${currentStep.id}`,
          duration: currentStep.feedbackThreshold,
          compass: currentStep.activeControls.includes("compass")
            ? "adjust_for_consistent_updates"
            : "inactive",
          airspeed: currentStep.activeControls.includes("airspeed")
            ? "adjust_for_consistent_updates"
            : "inactive",
          altimeter: currentStep.activeControls.includes("altimeter")
            ? "adjust_for_consistent_updates"
            : "inactive",
        },
      ],
      totalDuration: currentStep.feedbackThreshold * 60, // Convert to seconds
      sessionId: "training-session",
      userId: "training-user",
    };

    currentConfigIndex.value = 0;
    timeRemaining.value = currentStep.feedbackThreshold * 60;

    // Only start audio sequence if it's part of current training step
    if (currentStep.activeControls.includes("audio")) {
      startAudioSequence();
    }

    // Start performance monitoring for training feedback
    setInterval(() => {
      monitorPerformance();
    }, 1000);
  } else {
    // Regular exam mode initialization
    currentConfigIndex.value = 0;
    config.value.configs = config.value.configs.map((cfg) => ({
      ...cfg,
      compass: "adjust_for_consistent_updates",
      airspeed: "adjust_for_consistent_updates",
      altimeter: "adjust_for_consistent_updates",
    }));

    // Initialize with first config duration
    if (config.value.configs && config.value.configs.length > 0) {
      timeRemaining.value =
        config.value.configs.reduce((acc, cfg) => acc + cfg.duration, 0) * 60;
      startAudioSequence();
    }
  }
};

// Update these functions:
const handleStartExam = () => {
  showStartModal.value = false;
  if (trainingMode.value) {
    // For training mode, show training instructions first
    showTrainingModal.value = true;
  } else {
    // For regular exam, start directly
    startExam();
  }
  initAudioContext();
};

const startTrainingStep = () => {
  showTrainingModal.value = false;

  // Configure controls based on current training step
  const currentStep = TRAINING_STEPS[currentTrainingStep.value];

  // Create a training config based on active controls
  config.value = {
    configs: [
      {
        id: `training-${currentStep.id}`,
        duration: 999999, // Very long duration for training
        compass: currentStep.activeControls.includes("compass")
          ? "adjust_for_consistent_updates"
          : "inactive",
        airspeed: currentStep.activeControls.includes("airspeed")
          ? "adjust_for_consistent_updates"
          : "inactive",
        altimeter: currentStep.activeControls.includes("altimeter")
          ? "adjust_for_consistent_updates"
          : "inactive",
      },
    ],
    totalDuration: 999999, // Very long duration for training
    sessionId: "training-session",
    userId: "training-user",
  };

  startExam();
};

const monitorPerformance = () => {
  if (!examRunning.value) return;

  // Collect metrics
  currentStep.value = {
    time: Date.now(),
    heading: heading.value,
    airspeed: airspeed.value,
    altitude: altitude.value,
    targets: {
      heading: headingTarget.value,
      airspeed: airspeedTarget.value,
      altitude: altitudeTarget.value,
    },
  };

  // Only show feedback during training mode
  if (trainingMode.value) {
    const isFollowingDirection = checkDirectionFollowing();

    if (isFollowingDirection && !userFollowingDirection.value) {
      feedbackMessage.value = "Bagus! Terus Ikuti Pergerakan Target";
      showFeedback.value = true;
      userFollowingDirection.value = true;
    } else if (!isFollowingDirection && userFollowingDirection.value) {
      feedbackMessage.value =
        "Perhatikan arah pergerakan target dan coba kontrol pesawat anda ke arah target";
      showFeedback.value = true;
      userFollowingDirection.value = false;
    }

    // Clear feedback after 3 seconds
    setTimeout(() => {
      showFeedback.value = false;
    }, 3000);
  }

  updatePerformanceData();
};

// 3. performanceMetrics should be used in updatePerformanceData
const updatePerformanceData = () => {
  const currentTime = Date.now();
  if (currentTime - lastRecordedTime.value >= 1000) {
    performanceMetrics.value = {
      heading: {
        type: isHeadingOutOfTarget.value ? "wrong" : "correct",
        deviations: heading.value - headingTarget.value,
        timestamp: currentTime,
        configIndex: currentConfigIndex.value,
      },
      airspeed: {
        type: isAirspeedOutOfTarget.value ? "wrong" : "correct",
        deviations: airspeed.value - airspeedTarget.value,
        timestamp: currentTime,
        configIndex: currentConfigIndex.value,
      },
      altitude: {
        type: isAltitudeOutOfTarget.value ? "wrong" : "correct",
        deviations: altitude.value - altitudeTarget.value,
        timestamp: currentTime,
        configIndex: currentConfigIndex.value,
      },
    };

    // Use these metrics to update the performance data arrays
    headingPerformanceData.value.push(performanceMetrics.value.heading);
    airspeedPerformanceData.value.push(performanceMetrics.value.airspeed);
    altitudePerformanceData.value.push(performanceMetrics.value.altitude);

    lastRecordedTime.value = currentTime;
  }
};

const moveToNextTrainingStep = () => {
  examRunning.value = false; // Stop current step
  currentTrainingStep.value++;

  if (currentTrainingStep.value < TRAINING_STEPS.length) {
    // Show instructions for next step
    showTrainingModal.value = true;
    cancelAudioSequence(); // Stop any ongoing audio
  } else {
    // Show final exam confirmation modal
    showExamConfirmModal.value = true;
  }
};

const startActualExam = async () => {
  // Close confirmation modal
  showExamConfirmModal.value = false;

  // Reset everything
  examRunning.value = false;
  trainingMode.value = false;
  score.value = 0;
  timeOnTargetAirspeed.value = 0;
  timeOnTargetHeading.value = 0;
  timeOnTargetAltitude.value = 0;
  currentTrainingStep.value = 0;
  // Reset performance tracking
  airspeed.value = 120;
  heading.value = 0;
  altitude.value = 5000;
  airspeedTarget.value = 120;
  headingTarget.value = 0;
  altitudeTarget.value = 5000;
  thrustLevel.value = 60;

  // Reset audio
  cancelAudioSequence();
  audioResponses.value = [];
  displayedNumbers.value = [];

  // Reset performance data
  headingPerformanceData.value = [];
  airspeedPerformanceData.value = [];
  altitudePerformanceData.value = [];
  userInputs.value = [];

  // Reinitialize config
  await initConfig();

  // Make sure all controls are active
  config.value.configs = config.value.configs.map((cfg) => ({
    ...cfg,
    compass: "adjust_for_consistent_updates",
    airspeed: "adjust_for_consistent_updates",
    altimeter: "adjust_for_consistent_updates",
  }));

  // Start the exam
  startExam();
};

// Modify endExam to cleanup sounds
const endExam = () => {
  examRunning.value = false;
  cancelAudioSequence();
  cleanupSounds();

  sendPerformanceData();
};

const initConfig = async () => {
  const scheduleData = JSON.parse(localStorage.getItem("scheduleData"));
  const configMIC = scheduleData.tests.find(
    (t) => t.testUrl === "monitoring-instrument-coordination-test"
  );

  if (!configMIC || !configMIC.configs) {
    console.error("Invalid configuration data");
    return;
  }

  // Store all configs and calculate total duration
  config.value = {
    configs: configMIC.configs,
    totalDuration:
      configMIC.configs.reduce((acc, curr) => acc + Number(curr.duration), 0) *
      60,
    sessionId: scheduleData.sessionId,
    userId: scheduleData.userId,
    batteryTestId: configMIC.id,
  };
};

// Define router at the top level of script setup
const router = useRouter();

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
      userId: config.value.userId,
      batteryTestId: config.value.batteryTestId,
      result: {
        // multi_graph_data: performanceByConfig.map(perf => ({
        //     heading: perf.headingData,
        //     airspeed: perf.airspeedData,
        //     altitude: perf.altitudeData,
        // })),
        graph_data: userInputs.value,
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

    removeTestByNameAndUpdateLocalStorage(
      "Monitoring & Instrument Koordination"
    );
    localStorage.removeItem("refreshCountShapeRecognition");
    router.push("/module");
  } catch (error) {
    console.log("error submit:", error);
  } finally {
    loading.value = false;
  }
};

// Add this to your state declarations
const showStartModal = ref(false);

const handleKeyDown = (event) => {
  if (controlMode.value === "manual") {
    switch (event.key) {
      case "ArrowUp":
        manualInput.value.up = true;
        break;
      case "ArrowDown":
        manualInput.value.down = true;
        break;
      case "ArrowLeft":
        manualInput.value.left = true;
        break;
      case "ArrowRight":
        manualInput.value.right = true;
        break;
      case "w":
        manualInput.value.thrustUp = true;
        break;
      case "s":
        manualInput.value.thrustDown = true;
        break;
    }
  }
};

const handleKeyUp = (event) => {
  if (controlMode.value === "manual") {
    switch (event.key) {
      case "ArrowUp":
        manualInput.value.up = false;
        break;
      case "ArrowDown":
        manualInput.value.down = false;
        break;
      case "ArrowLeft":
        manualInput.value.left = false;
        break;
      case "ArrowRight":
        manualInput.value.right = false;
        break;
      case "w": // Stop increasing thrust
        manualInput.value.thrustUp = false;
        break;
      case "s": // Stop decreasing thrust
        manualInput.value.thrustDown = false;
        break;
    }
  }
};

// Lifecycle hooks
onMounted(() => {
  initConfig();
  window.addEventListener("gamepadconnected", onGamepadConnected);
  window.addEventListener("gamepaddisconnected", onGamepadDisconnected);
  checkGamepadConnection();
  updateLoop();
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  handleStartExam();
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
  window.removeEventListener("gamepadconnected", onGamepadConnected);
  window.removeEventListener("gamepaddisconnected", onGamepadDisconnected);
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  cancelAudioSequence();

  if (audioContext.value) {
    audioContext.value.close();
  }
});
</script>

<style scoped>
.pilot-exam {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding-top: 60px;
  background-color: #080808;
  /* Make room for the timer */
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

.indicators {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.controls {
  margin-top: 20px;
}

.indicator-bg {
  background-color: #292929;
  border-radius: 10px;
  padding: 10px;
}

.indicator-wrapper {
  position: relative;
  width: 200px;
  height: 240px;
}

.target-text {
  text-align: center;
  margin-top: 10px;
  font-weight: bold;
  color: white;
}

.direction-indicator {
  display: inline-block;
  width: 0;
  height: 0;
  margin-left: 5px;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
}

.direction-indicator.up {
  border-bottom: 10px solid lime;
  animation: blink-green 1s infinite;
}

.direction-indicator.down {
  border-top: 10px solid lime;
  animation: blink-green 1s infinite;
}

@keyframes blink-green {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}

@keyframes blink {
  0% {
    background-color: #292929;
  }

  50% {
    background-color: rgba(255, 0, 0, 0.5);
  }

  100% {
    background-color: #292929;
  }
}

.blink .indicator-bg {
  animation: blink 1s infinite;
}

.thruster-indicator {
  position: absolute;
  left: -60px;
  top: 0;
  height: 200px;
  width: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.thruster-bar {
  height: 180px;
  width: 20px;
  background-color: #333;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.thruster-fill {
  position: absolute;
  bottom: 0;
  width: 100%;
  background-color: #ff6b6b;
  transition: height 0.2s ease;
}

.thruster-value {
  margin-top: 5px;
  font-size: 12px;
  white-space: nowrap;
  color: white;
}

/* Audio test styles */
.audio-test {
  margin-top: 20px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 10px;
  text-align: center;
}

.number-display {
  font-size: 24px;
  margin-bottom: 15px;
  min-height: 36px;
}

.response-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.btn-red,
.btn-green {
  padding: 15px 30px;
  border: none;
  border-radius: 5px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-red {
  background-color: #ff4444;
}

.btn-green {
  background-color: #00c851;
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
  z-index: 100000;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  width: 100%;
  height: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.modal-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 1rem;
}

.modal-body {
  font-size: 20px;
  margin: 1rem 0;
}

.modal-list {
  list-style-type: disc;
  margin-left: 1.5rem;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
}

.modal-list li {
  margin-bottom: 0.5rem;
  color: #666;
}

.modal-footer-text {
  margin-top: 1rem;
  color: #666;
  font-style: italic;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.modal-button {
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
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

.control-mode-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.control-mode-toggle button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.control-mode-toggle button:hover {
  background-color: #0056b3;
}

.manual-control-instructions {
  position: fixed;
  bottom: 80px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 5px;
  z-index: 1000;
}

.manual-control-instructions ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.manual-control-instructions li {
  margin: 5px 0;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.feedback-message {
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px 30px;
  border-radius: 8px;
  z-index: 1000;
  transition: opacity 0.3s ease;
}

.training-instructions {
  max-width: 600px;
  margin: 0 auto;
}

.instruction-image {
  max-width: 100%;
  margin: 20px 0;
  border-radius: 8px;
}

.feedback-correct {
  background-color: rgba(0, 255, 0, 0.2);
}

.feedback-incorrect {
  background-color: rgba(255, 0, 0, 0.2);
}

.next-step-button {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #4caf50;
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  z-index: 1000;
  transition: background-color 0.3s;
}

.next-step-button:hover {
  background-color: #45a049;
}

.modal-list li {
  margin-bottom: 0.75rem;
}

.modal-list ul li {
  margin-bottom: 0.5rem;
  list-style-type: circle;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mt-4 {
  margin-top: 1rem;
}

.ml-8 {
  margin-left: 2rem;
}

.text-red-600 {
  color: #dc2626;
}

.font-bold {
  font-weight: bold;
}

.bg-gray-500 {
  background-color: #6b7280;
}
</style>
