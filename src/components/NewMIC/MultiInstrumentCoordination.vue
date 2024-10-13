<template>
    <div class="pilot-exam">
        <div class="countdown-timer">{{ formatTime(timeRemaining) }}</div>
        <div class="indicators">
            <div class="indicator-wrapper" :class="{ 'blink': isAirspeedOutOfTarget }">
                <Airspeed class="indicator-bg" :size="200" :airspeed="Math.round(airspeed)" />
                <div class="target-text">
                    Target: {{ Math.round(airspeedTarget) }} knots
                    <span v-if="airspeedChangeDirection"
                        :class="['direction-indicator', airspeedChangeDirection]"></span>
                </div>
            </div>
            <div class="indicator-wrapper" :class="{ 'blink': isHeadingOutOfTarget }">
                <Heading class="indicator-bg" :size="200" :heading="Math.round(heading)" />
                <div class="target-text">
                    Target: {{ Math.round(headingTarget) }}°
                    <span v-if="headingChangeDirection" :class="['direction-indicator', headingChangeDirection]"></span>
                </div>
            </div>
            <div class="indicator-wrapper" :class="{ 'blink': isAltitudeOutOfTarget }">
                <Altimeter class="indicator-bg" :size="200" :altitude="Math.round(altitude)" />
                <div class="target-text">
                    Target: {{ Math.round(altitudeTarget) }} ft
                    <span v-if="altitudeChangeDirection"
                        :class="['direction-indicator', altitudeChangeDirection]"></span>
                </div>
            </div>
            <clock-indicator :time="currentTime" />
        </div>
        <div class="controls">
            <button @click="toggleMode">Toggle Mode: {{ mode }}</button>
            <button @click="startExam" :disabled="examRunning">Start Exam</button>
        </div>
    </div>
</template>

<script setup>
import { removeTestByNameAndUpdateLocalStorage } from '@/utils';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Altimeter, Airspeed, Heading } from 'vue-flight-indicators';
import { useRouter } from 'vue-router';

// Constants for movement speed
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
const airspeedChangeDirection = ref(null);
const headingChangeDirection = ref(null);
const altitudeChangeDirection = ref(null);
const loading = ref(false);
const timeOnTargetAirspeed = ref(0);
const timeOnTargetHeading = ref(0);
const timeOnTargetAltitude = ref(0);

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

const headingPerformanceData = ref([]);
const airspeedPerformanceData = ref([]);
const altitudePerformanceData = ref([]);
const config = ref({});

const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Gamepad connection handling
const checkGamepadConnection = () => {
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            if (gamepads[i].id === 'T.16000M (Vendor: 044f Product: b10a)') {
                gamepad.value = gamepads[i];
                console.log("Reconnected to joystick:", gamepad.value);
            } else if (gamepads[i].id === 'TWCS Throttle (Vendor: 044f Product: b687)') {
                thruster.value = gamepads[i];
                console.log("Reconnected to throttle:", thruster.value);
            }
        }
    }
};

const onGamepadConnected = (e) => {
    console.log('Gamepad connected:', e.gamepad);
    if (e.gamepad.id === 'T.16000M (Vendor: 044f Product: b10a)') {
        gamepad.value = e.gamepad;
        console.log("Joystick connected:", gamepad.value);
    } else if (e.gamepad.id === 'TWCS Throttle (Vendor: 044f Product: b687)') {
        thruster.value = e.gamepad;
        console.log("Throttle connected:", thruster.value);
    }
};

const onGamepadDisconnected = (e) => {
    console.log('Gamepad disconnected:', e.gamepad);
    if (e.gamepad.id === 'T.16000M (Vendor: 044f Product: b10a)') {
        gamepad.value = null;
        console.log("Joystick disconnected");
    } else if (e.gamepad.id === 'TWCS Throttle (Vendor: 044f Product: b687)') {
        thruster.value = null;
        console.log("Throttle disconnected");
    }
};

// Game loop
const updateLoop = () => {
    checkGamepadConnection(); // Check connection each frame
    if (examRunning.value) {
        updatePlanePosition();
        if (mode.value === 'moving') {
            updateTargets();
        }
        updateScore();
        updateTime();
        updatePerformanceData();
    }
    requestAnimationFrame(updateLoop);
};

const updateScore = () => {
    if (!isAirspeedOutOfTarget.value) {
        timeOnTargetAirspeed.value += 1 / 60;
    }
    if (!isHeadingOutOfTarget.value) {
        timeOnTargetHeading.value += 1 / 60;
    }
    if (!isAltitudeOutOfTarget.value) {
        timeOnTargetAltitude.value += 1 / 60;
    }

    if (!isAirspeedOutOfTarget.value && !isHeadingOutOfTarget.value && !isAltitudeOutOfTarget.value) {
        score.value += 1;
    }
};

const updatePerformanceData = () => {
    headingPerformanceData.value.push({
        type: isHeadingOutOfTarget.value ? 'wrong' : 'correct',
        deviations: heading.value - headingTarget.value,
        timestamp: Date.now()
    })

    airspeedPerformanceData.value.push({
        type: isAirspeedOutOfTarget.value ? 'wrong' : 'correct',
        deviations: airspeed.value - airspeedTarget.value,
        timestamp: Date.now()
    })

    altitudePerformanceData.value.push({
        type: isAltitudeOutOfTarget.value ? 'wrong' : 'correct',
        deviations: altitude.value - altitudeTarget.value,
        timestamp: Date.now()
    })
};

const updatePlanePosition = () => {
    // Handle user input
    if (gamepad.value) {
        const stick = navigator.getGamepads()[gamepad.value.index];
        if (stick) {
            // Adjust heading based on joystick X-axis
            const headingChange = stick.axes[0] * MOVEMENT_SPEED.HEADING;
            heading.value = (heading.value + headingChange + 360) % 360;

            // Adjust altitude based on joystick Y-axis
            const altitudeChange = -stick.axes[1] * MOVEMENT_SPEED.ALTITUDE; // Inverted Y-axis
            altitude.value = Math.max(0, Math.min(10000, altitude.value + altitudeChange));
        }
    }

    if (thruster.value) {
        const throttle = navigator.getGamepads()[thruster.value.index];
        if (throttle) {
            // Adjust airspeed based on throttle position
            const targetAirspeed = 50 + (1 - throttle.axes[2]) * 150; // Map throttle to 50-200 knots
            const airspeedDiff = targetAirspeed - airspeed.value;
            airspeed.value += Math.sign(airspeedDiff) * Math.min(Math.abs(airspeedDiff), MOVEMENT_SPEED.AIRSPEED);
        }
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

const updateTime = () => {
    timeRemaining.value -= 1 / 60; // Assuming 60 FPS
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


    //submissions
    timeOnTargetAirspeed.value = 0;
    timeOnTargetHeading.value = 0;
    timeOnTargetAltitude.value = 0;
};

const initConfig = async () => {
    const scheduleData = JSON.parse(localStorage.getItem('scheduleData'))
    const configMIC = scheduleData.tests.find((t) => t.testUrl === "monitoring-instrument-coordination-test")
    const { airspeed, altimeter, id, compass, duration, listening_task, yaw_speed } = configMIC.configs[0]

    config.value = {
        duration,
        airspeed,
        altimeter,
        compass,
        yaw_speed,
        listening_task,
        sessionId: scheduleData.sessionId,
        userId: scheduleData.userId,
        batteryTestConfigId: id,
    }
}

const sendPerformanceData = async () => {
    // Mock API call
    try {
        loading.value = true;
        const router = useRouter();
        const API_URL = process.env.VUE_APP_API_URL;
        const payload = {
            testSessionId: config.value.sessionId,
            userId: config.value.userId,
            batteryTestConfigId: config.value.testId,
            result: {
                multi_graph_data: {
                    heading: headingPerformanceData.value,
                    airspeed: airspeedPerformanceData.value,
                    altitude: altitudePerformanceData.value,
                },
                timeOnTargetAirspeed: timeOnTargetAirspeed.value,
                timeOnTargetHeading: timeOnTargetHeading.value,
                timeOnTargetAltitude: timeOnTargetAltitude.value,
            },
        }
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
        removeTestByNameAndUpdateLocalStorage('Monitoring & Instrument Koordination')
        localStorage.removeItem('refreshCountShapeRecognition')
        router.push('/module');
    } catch (error) {
        console.log("error submit shape recognition:", error)
    } finally {
        loading.value = false;
    }
};

const endExam = () => {
    examRunning.value = false;
    sendPerformanceData();
    alert(`Exam ended. Your score: ${score.value}`);
};


// Lifecycle hooks
onMounted(() => {
    initConfig();
    window.addEventListener('gamepadconnected', onGamepadConnected);
    window.addEventListener('gamepaddisconnected', onGamepadDisconnected);
    checkGamepadConnection(); // Check for already connected gamepads
    updateLoop();
});

onUnmounted(() => {
    window.removeEventListener('gamepadconnected', onGamepadConnected);
    window.removeEventListener('gamepaddisconnected', onGamepadDisconnected);
});
</script>

<style scoped>
.pilot-exam {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    padding-top: 60px;
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
    height: 240px;
}

.target-text {
    text-align: center;
    margin-top: 10px;
    font-weight: bold;
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
</style>
