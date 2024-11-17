<template>
    <div class="pilot-exam">
        <div class="countdown-timer">{{ formatTime(timeRemaining) }}</div>
        <div class="indicators">
            <div class="indicator-wrapper" :class="{ 'blink': isAirspeedOutOfTarget }">
                <Airspeed class="indicator-bg" :size="200" :airspeed="Math.round(airspeed)" />
                <div class="thruster-indicator">
                    <div class="thruster-bar">
                        <div class="thruster-fill" :style="{ height: `${thrustLevel}%` }"></div>
                    </div>
                    <div class="thruster-value">Thrust: {{ Math.round(thrustLevel) }}%</div>
                </div>
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

        <!-- Audio Test Controls -->
        <div class="audio-test">
            <div class="number-display">Last numbers: {{ displayedNumbers.join(' - ') }}</div>
            <div class="response-buttons">
                <button class="btn-red" @click="handleAudioResponse('odd')" :disabled="!canRespond">
                    Odd Numbers
                </button>
                <button class="btn-green" @click="handleAudioResponse('even')" :disabled="!canRespond">
                    Even Numbers
                </button>
            </div>
        </div>

        <div class="controls">
            <button @click="toggleMode">Toggle Mode: {{ mode }}</button>
            <button @click="startExam" :disabled="examRunning">Start Exam</button>
        </div>
        <div v-if="examRunning">
            <p>Score: {{ score }}</p>
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
    AIRSPEED: 0.5,        // Increased from 0.2
    HEADING: 0.2,         // Increased from 0.1
    ALTITUDE: 2,          // Increased from 1
    THRUST_RESPONSE: 0.8, // Increased from 0.5
    DRAG_COEFFICIENT: 0.015,  // Reduced from 0.02 for smoother deceleration
    MIN_AIRSPEED: 60,     // Increased from 50
    MAX_AIRSPEED: 160,    // New constant for maximum airspeed
    GRAVITY_EFFECT: 0.08, // Increased from 0.01 for more pronounced altitude effect
    VERTICAL_SPEED_MULTIPLIER: 1.2  // New constant for vertical speed impact
};

// State
const mode = ref('fixed');
const examRunning = ref(false);
const airspeed = ref(100);
const heading = ref(0);
const altitude = ref(5000);
const currentTime = ref(new Date());
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
const config = ref({});
const lastRecordedTime = ref(Date.now());

// Computed properties
const isAirspeedOutOfTarget = computed(() => {
    if (config.value.airspeed === 'inactive') return false;
    return Math.abs(airspeed.value - airspeedTarget.value) > 5;
});

const isHeadingOutOfTarget = computed(() => {
    if (config.value.compass === 'inactive') return false;
    const diff = Math.abs(heading.value - headingTarget.value);
    return Math.min(diff, 360 - diff) > 5;
});

const isAltitudeOutOfTarget = computed(() => {
    if (config.value.altimeter === 'inactive') return false;
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

const generateRandomNumber = () => Math.floor(Math.random() * 10);

const speakNumber = (number) => {
    const utterance = new SpeechSynthesisUtterance(number.toString());
    synthesis.speak(utterance);
};

// Gamepad handling
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

// Add/update these constants
const AUDIO_TEST = {
    SEQUENCE_PAUSE: 15000,  // 15 seconds between sequences
    NUMBER_INTERVAL: 1000,  // 1 second between numbers in a sequence
    RESPONSE_WINDOW: 15000  // 15 seconds to respond
};

// Audio test functions
const startAudioSequence = () => {
    if (!examRunning.value) return;
    
    const numbers = [generateRandomNumber(), generateRandomNumber(), generateRandomNumber()];
    displayedNumbers.value = numbers;
    
    let index = 0;
    const speakNextNumber = () => {
        if (index < numbers.length) {
            speakNumber(numbers[index]);
            index++;
            setTimeout(speakNextNumber, AUDIO_TEST.NUMBER_INTERVAL);
        } else {
            // Enable response after the last number
            canRespond.value = true;
            currentAudioStart.value = Date.now();
            
            // Set timeout for no response
            audioTimeout.value = setTimeout(() => {
                if (canRespond.value) {
                    handleNoResponse();
                }
            }, AUDIO_TEST.RESPONSE_WINDOW);
        }
    };
    
    // Start speaking the sequence
    speakNextNumber();
};

const handleAudioResponse = (response) => {
    if (!canRespond.value) return;
    
    clearTimeout(audioTimeout.value);
    const responseTime = Date.now() - currentAudioStart.value;
    
    const allEven = displayedNumbers.value.every(num => num % 2 === 0);
    const allOdd = displayedNumbers.value.every(num => num % 2 === 1);
    const isCorrect = (allEven && response === 'even') || (allOdd && response === 'odd');
    
    audioResponses.value.push({
        numbers: [...displayedNumbers.value],
        response,
        responseTime,
        correct: isCorrect
    });
    
    canRespond.value = false;
    displayedNumbers.value = [];
    
    // Wait for SEQUENCE_PAUSE milliseconds before starting next sequence
    setTimeout(startAudioSequence, AUDIO_TEST.SEQUENCE_PAUSE);
};

const handleNoResponse = () => {
    audioResponses.value.push({
        numbers: [...displayedNumbers.value],
        response: 'none',
        responseTime: AUDIO_TEST.RESPONSE_WINDOW,
        correct: false
    });
    
    canRespond.value = false;
    displayedNumbers.value = [];
    
    // Wait for SEQUENCE_PAUSE milliseconds before starting next sequence
    setTimeout(startAudioSequence, AUDIO_TEST.SEQUENCE_PAUSE);
};

// Add this helper function to cancel any ongoing audio sequence
const cancelAudioSequence = () => {
    clearTimeout(audioTimeout.value);
    synthesis.cancel();
    displayedNumbers.value = [];
    canRespond.value = false;
};


const updatePlanePosition = () => {
    lastAltitude.value = altitude.value;

    if (gamepad.value) {
        const stick = navigator.getGamepads()[gamepad.value.index];
        if (stick) {
            // Update heading
            const headingChange = stick.axes[0] * MOVEMENT_SPEED.HEADING;
            heading.value = (heading.value + headingChange + 360) % 360;

            // Update altitude with more pronounced effect
            const altitudeChange = -stick.axes[1] * MOVEMENT_SPEED.ALTITUDE;
            altitude.value = Math.max(0, Math.min(10000, altitude.value + altitudeChange));
        }
    }

    // Update thrust level
    if (thruster.value) {
        const throttle = navigator.getGamepads()[thruster.value.index];
        if (throttle) {
            thrustLevel.value = (1 - throttle.axes[2]) * 100;
        }
    }

    // Calculate vertical speed effect with enhanced impact
    const verticalSpeed = altitude.value - lastAltitude.value;
    const verticalSpeedEffect = verticalSpeed * MOVEMENT_SPEED.GRAVITY_EFFECT;
    
    // Enhanced altitude-speed relationship
    const altitudeEffect = verticalSpeed * MOVEMENT_SPEED.VERTICAL_SPEED_MULTIPLIER;
    
    // Calculate thrust effect with improved response
    const thrustEffect = (thrustLevel.value / 100) * MOVEMENT_SPEED.THRUST_RESPONSE;
    
    // Enhanced air resistance calculation
    const currentSpeed = airspeed.value;
    const dragEffect = Math.pow(currentSpeed - MOVEMENT_SPEED.MIN_AIRSPEED, 1.5) * 
                      MOVEMENT_SPEED.DRAG_COEFFICIENT;
    
    // Update airspeed with all forces
    const speedChange = (thrustEffect - dragEffect - verticalSpeedEffect + altitudeEffect);
    
    // Apply the speed change with limits
    airspeed.value = Math.max(
        MOVEMENT_SPEED.MIN_AIRSPEED,
        Math.min(MOVEMENT_SPEED.MAX_AIRSPEED, airspeed.value + speedChange)
    );
};

const updateScore = () => {
    if (config.value.airspeed !== 'inactive' && !isAirspeedOutOfTarget.value) {
        timeOnTargetAirspeed.value += 1 / 60;
    }
    if (config.value.compass !== 'inactive' && !isHeadingOutOfTarget.value) {
        timeOnTargetHeading.value += 1 / 60;
    }
    if (config.value.altimeter !== 'inactive' && !isAltitudeOutOfTarget.value) {
        timeOnTargetAltitude.value += 1 / 60;
    }

    if ((!isAirspeedOutOfTarget.value || config.value.airspeed === 'inactive') &&
        (!isHeadingOutOfTarget.value || config.value.compass === 'inactive') &&
        (!isAltitudeOutOfTarget.value || config.value.altimeter === 'inactive')) {
        score.value += 1;
    }
};

const updatePerformanceData = () => {
    const currentTime = Date.now();
    if (currentTime - lastRecordedTime.value >= 1000) {
        headingPerformanceData.value.push({
            type: isHeadingOutOfTarget.value ? 'wrong' : 'correct',
            deviations: heading.value - headingTarget.value,
            timestamp: currentTime
        });

        airspeedPerformanceData.value.push({
            type: isAirspeedOutOfTarget.value ? 'wrong' : 'correct',
            deviations: airspeed.value - airspeedTarget.value,
            timestamp: currentTime
        });

        altitudePerformanceData.value.push({
            type: isAltitudeOutOfTarget.value ? 'wrong' : 'correct',
            deviations: altitude.value - altitudeTarget.value,
            timestamp: currentTime
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
    }
    requestAnimationFrame(updateLoop);
};

const updateTime = () => {
    timeRemaining.value -= 1 / 60;
    if (timeRemaining.value <= 0) {
        endExam();
    }
};

const updateTargets = () => {
    // Increased probability from 0.001 to 0.005 (5x more frequent)
    if (Math.random() < 0.005) {
        updateIndicator('airspeed', config.value.airspeed);
        updateIndicator('heading', config.value.compass);
        updateIndicator('altitude', config.value.altimeter);
    }
};

const updateIndicator = (indicator, mode) => {
    if (mode === 'inactive') {
        if (indicator === 'airspeed') {
            airspeedTarget.value = 'Inactive';
        } else if (indicator === 'heading') {
            headingTarget.value = 'Inactive';
        } else if (indicator === 'altitude') {
            altitudeTarget.value = 'Inactive';
        }
        return;
    }

    if (mode === 'keep_indicator') {
        return;
    }

    let newTarget;
    let currentTarget;
    let changeDirection;

    if (indicator === 'airspeed') {
        newTarget = Math.floor(Math.random() * 150) + 50;
        currentTarget = airspeedTarget.value;
        changeDirection = airspeedChangeDirection;
    } else if (indicator === 'heading') {
        newTarget = Math.floor(Math.random() * 360);
        currentTarget = headingTarget.value;
        changeDirection = headingChangeDirection;
    } else if (indicator === 'altitude') {
        newTarget = Math.floor(Math.random() * 8000) + 1000;
        currentTarget = altitudeTarget.value;
        changeDirection = altitudeChangeDirection;
    }

    if (mode === 'adjust_for_consistent_updates') {
        if (changeDirection.value === null) {
            changeDirection.value = newTarget > currentTarget ? 'up' : 'down';
        }
        newTarget = changeDirection.value === 'up' ? currentTarget + 10 : currentTarget - 10;
    }

    const moveTarget = () => {
        if (indicator === 'airspeed') {
            airspeedTarget.value += Math.sign(newTarget - airspeedTarget.value) * 
                Math.min(Math.abs(newTarget - airspeedTarget.value), MOVEMENT_SPEED.AIRSPEED);
        } else if (indicator === 'heading') {
            const headingDiff = newTarget - headingTarget.value;
            const shortestPath = (Math.abs(headingDiff) > 180) ? 
                -Math.sign(headingDiff) * (360 - Math.abs(headingDiff)) : headingDiff;
            headingTarget.value = (headingTarget.value + 
                Math.sign(shortestPath) * Math.min(Math.abs(shortestPath), MOVEMENT_SPEED.HEADING) + 360) % 360;
        } else if (indicator === 'altitude') {
            altitudeTarget.value += Math.sign(newTarget - altitudeTarget.value) * 
                Math.min(Math.abs(newTarget - altitudeTarget.value), MOVEMENT_SPEED.ALTITUDE);
        }

        if (currentTarget !== newTarget) {
            requestAnimationFrame(moveTarget);
        }
    };

    moveTarget();
};

// Exam control functions
const toggleMode = () => {
    mode.value = mode.value === 'fixed' ? 'moving' : 'fixed';
};

const startExam = () => {
    examRunning.value = true;
    score.value = 0;
    timeRemaining.value = config.value.duration * 60;
    
    // More realistic initial values
    airspeed.value = 120;  // Starting at cruise speed
    heading.value = 0;
    altitude.value = 5000;
    airspeedTarget.value = 120;
    headingTarget.value = 0;
    altitudeTarget.value = 5000;
    thrustLevel.value = 60;  // Starting at cruise power
    
    timeOnTargetAirspeed.value = 0;
    timeOnTargetHeading.value = 0;
    timeOnTargetAltitude.value = 0;
    
    audioResponses.value = [];
    displayedNumbers.value = [];
    startAudioSequence();
};
const endExam = () => {
    examRunning.value = false;
    sendPerformanceData();
    alert(`Exam ended. Your score: ${score.value}`);
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
};

const sendPerformanceData = async () => {
    try {
        loading.value = true;
        const router = useRouter();
        const API_URL = process.env.VUE_APP_API_URL;
        const payload = {
            testSessionId: config.value.sessionId,
            userId: config.value.userId,
            batteryTestConfigId: config.value.batteryTestConfigId,
            result: {
                multi_graph_data: {
                    heading: headingPerformanceData.value,
                    airspeed: airspeedPerformanceData.value,
                    altitude: altitudePerformanceData.value,
                },
                timeOnTargetAirspeed: timeOnTargetAirspeed.value,
                timeOnTargetHeading: timeOnTargetHeading.value,
                timeOnTargetAltitude: timeOnTargetAltitude.value,
                audioTest: {
                    responses: audioResponses.value,
                    averageResponseTime: audioResponses.value.reduce((acc, curr) => acc + curr.responseTime, 0) / 
                        (audioResponses.value.length || 1),
                    correctResponses: audioResponses.value.filter(r => r.correct).length,
                    totalResponses: audioResponses.value.length,
                    missedResponses: audioResponses.value.filter(r => r.response === 'none').length
                },
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
        removeTestByNameAndUpdateLocalStorage('Monitoring & Instrument Koordination');
        localStorage.removeItem('refreshCountShapeRecognition');
        router.push('/module');
    } catch (error) {
        console.log("error submit:", error);
    } finally {
        loading.value = false;
    }
};

// Lifecycle hooks
onMounted(() => {
    initConfig();
    window.addEventListener('gamepadconnected', onGamepadConnected);
    window.addEventListener('gamepaddisconnected', onGamepadDisconnected);
    checkGamepadConnection();
    updateLoop();
    startExam();
});

onUnmounted(() => {
    window.removeEventListener('gamepadconnected', onGamepadConnected);
    window.removeEventListener('gamepaddisconnected', onGamepadDisconnected);
    cancelAudioSequence();
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

.thruster-indicator {
    position: absolute;
    left: -40px;
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

.btn-red, .btn-green {
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
    background-color: #00C851;
}

.btn-red:hover, .btn-green:hover {
    transform: scale(1.05);
}

.btn-red:disabled, .btn-green:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

/* ... rest of original styles ... */
</style>
