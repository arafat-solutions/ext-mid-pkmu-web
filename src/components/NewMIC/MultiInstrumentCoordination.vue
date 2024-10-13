<template>
  <div class="pilot-exam">
    <div class="indicators">
      <div class="indicator-wrapper" :class="{ 'blink': isAirspeedOutOfTarget }">
        <Airspeed class="indicator-bg" :size="200" :airspeed="Math.round(airspeed)" />
        <div class="target-text">Target: {{ Math.round(airspeedTarget) }} knots</div>
      </div>
      <div class="indicator-wrapper" :class="{ 'blink': isHeadingOutOfTarget }">
        <Heading class="indicator-bg" :size="200" :heading="Math.round(heading)" />
        <div class="target-text">Target: {{ Math.round(headingTarget) }}°</div>
      </div>
      <div class="indicator-wrapper" :class="{ 'blink': isAltitudeOutOfTarget }">
        <Altimeter class="indicator-bg" :size="200" :altitude="Math.round(altitude)" />
        <div class="target-text">Target: {{ Math.round(altitudeTarget) }} ft</div>
      </div>
      <clock-indicator :time="currentTime" />
    </div>
    <div class="controls">
      <button @click="toggleMode">Toggle Mode: {{ mode }}</button>
      <button @click="startExam" :disabled="examRunning">Start Exam</button>
    </div>
    <div v-if="examRunning">
      <p>Score: {{ score }}</p>
      <p>Time Remaining: {{ Math.ceil(timeRemaining) }}s</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Altimeter, Airspeed, Heading } from 'vue-flight-indicators';

// Constants for movement speed (adjust as needed)
const MOVEMENT_SPEED = {
  AIRSPEED: 0.2, // knots per frame
  HEADING: 0.1, // degrees per frame
  ALTITUDE: 1, // feet per frame
};

// State
const mode = ref('fixed');
const examRunning = ref(false);
const airspeed = ref(100);
const heading = ref(0);
const altitude = ref(5000);
const currentTime = ref(new Date());

const airspeedTarget = ref(100);
const headingTarget = ref(0);
const altitudeTarget = ref(5000);

const gamepad = ref(null);
const thruster = ref(null);

const score = ref(0);
const timeRemaining = ref(300); // 5 minutes exam

// Computed properties for out-of-target indicators
const isAirspeedOutOfTarget = computed(() => Math.abs(airspeed.value - airspeedTarget.value) > 5);
const isHeadingOutOfTarget = computed(() => {
  const diff = Math.abs(heading.value - headingTarget.value);
  return Math.min(diff, 360 - diff) > 5;
});
const isAltitudeOutOfTarget = computed(() => Math.abs(altitude.value - altitudeTarget.value) > 100);

// Input handling
const onGamepadConnected = (e) => {
  console.log('Connected:', e);
  if (e.gamepad.id === 'T.16000M (Vendor: 044f Product: b10a)') {
    console.log("Correct gamepad connected:", e.gamepad);
    gamepad.value = e.gamepad;
  } else if (e.gamepad.id === 'TWCS Throttle (Vendor: 044f Product: b687)') {
    console.log("Correct thruster connected:", e.gamepad);
    thruster.value = e.gamepad;
  }
};

// Game loop
const updateLoop = () => {
  if (examRunning.value) {
    updatePlanePosition();
    if (mode.value === 'moving') {
      updateTargets();
    }
    updateScore();
    updateTime();
  }
  requestAnimationFrame(updateLoop);
};

const updatePlanePosition = () => {
  // Handle user input
  if (gamepad.value) {
    const gamepads = navigator.getGamepads();
    const stick = gamepads[gamepad.value.index];
    
    // Adjust heading based on joystick X-axis
    const headingChange = stick.axes[0] * MOVEMENT_SPEED.HEADING;
    heading.value = (heading.value + headingChange + 360) % 360;
    
    // Adjust altitude based on joystick Y-axis
    const altitudeChange = -stick.axes[1] * MOVEMENT_SPEED.ALTITUDE; // Inverted Y-axis
    altitude.value = Math.max(0, Math.min(10000, altitude.value + altitudeChange));
  }

  if (thruster.value) {
    const gamepads = navigator.getGamepads();
    const throttle = gamepads[thruster.value.index];
    
    // Adjust airspeed based on throttle position
    const targetAirspeed = 50 + (1 - throttle.axes[2]) * 150; // Map throttle to 50-200 knots
    const airspeedDiff = targetAirspeed - airspeed.value;
    airspeed.value += Math.sign(airspeedDiff) * Math.min(Math.abs(airspeedDiff), MOVEMENT_SPEED.AIRSPEED);
  }
};

const updateTargets = () => {
  if (Math.random() < 0.001) { // 0.1% chance each frame to change targets (about once every 16 seconds at 60 FPS)
    const newAirspeedTarget = Math.floor(Math.random() * 150) + 50; // 50 to 200 knots
    const newHeadingTarget = Math.floor(Math.random() * 360); // 0 to 359 degrees
    const newAltitudeTarget = Math.floor(Math.random() * 8000) + 1000; // 1000 to 9000 feet

    // Gradually move targets
    const moveTargets = () => {
      airspeedTarget.value += Math.sign(newAirspeedTarget - airspeedTarget.value) * Math.min(Math.abs(newAirspeedTarget - airspeedTarget.value), MOVEMENT_SPEED.AIRSPEED);
      
      const headingDiff = newHeadingTarget - headingTarget.value;
      const shortestPath = (Math.abs(headingDiff) > 180) ? -Math.sign(headingDiff) * (360 - Math.abs(headingDiff)) : headingDiff;
      headingTarget.value = (headingTarget.value + Math.sign(shortestPath) * Math.min(Math.abs(shortestPath), MOVEMENT_SPEED.HEADING) + 360) % 360;
      
      altitudeTarget.value += Math.sign(newAltitudeTarget - altitudeTarget.value) * Math.min(Math.abs(newAltitudeTarget - altitudeTarget.value), MOVEMENT_SPEED.ALTITUDE);

      if (airspeedTarget.value !== newAirspeedTarget || headingTarget.value !== newHeadingTarget || altitudeTarget.value !== newAltitudeTarget) {
        requestAnimationFrame(moveTargets);
      }
    };

    moveTargets();
  }
};

const updateScore = () => {
  if (!isAirspeedOutOfTarget.value && !isHeadingOutOfTarget.value && !isAltitudeOutOfTarget.value) {
    score.value += 1;
  }
};

const updateTime = () => {
  timeRemaining.value -= 1/60; // Assuming 60 FPS
  if (timeRemaining.value <= 0) {
    endExam();
  }
};

const toggleMode = () => {
  mode.value = mode.value === 'fixed' ? 'moving' : 'fixed';
};

const startExam = () => {
  examRunning.value = true;
  score.value = 0;
  timeRemaining.value = 300;
  // Initialize exam parameters
  airspeed.value = 100;
  heading.value = 0;
  altitude.value = 5000;
  airspeedTarget.value = 100;
  headingTarget.value = 0;
  altitudeTarget.value = 5000;
};

const endExam = () => {
  examRunning.value = false;
  alert(`Exam ended. Your score: ${score.value}`);
};

// Lifecycle hooks
onMounted(() => {
  window.addEventListener('gamepadconnected', onGamepadConnected);
  updateLoop();
});

onUnmounted(() => {
  window.removeEventListener('gamepadconnected', onGamepadConnected);
});
</script>

<style scoped>
.pilot-exam {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.indicators {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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
  height: 240px; /* Increased height to accommodate target text */
}

.target-text {
  text-align: center;
  margin-top: 10px;
  font-weight: bold;
}

@keyframes blink {
  0% { background-color: #292929; }
  50% { background-color: rgba(255, 0, 0, 0.5); }
  100% { background-color: #292929; }
}

.blink .indicator-bg {
  animation: blink 1s infinite;
}
</style>