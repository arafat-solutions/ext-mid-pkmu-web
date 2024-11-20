<template>
    <div class="pilot-exam">
        <Transition name="modal">
            <div v-if="showStartModal" class="modal-overlay">
                <div class="modal-container">
                    <div class="modal-content">
                        <h2 class="modal-title">Monitoring & Instrument Coordination Test</h2>
                        <div class="modal-body">
                            <p>In this test, you will need to:</p>
                            <ul class="modal-list">
                                <li>Control aircraft indicators using the joystick and throttle</li>
                                <li>Keep indicators within target ranges</li>
                                <li>Listen for number sequences and identify if they are all odd or even</li>
                            </ul>
                            <p class="modal-footer-text">Click OK when you are ready to begin.</p>
                        </div>
                        <div class="modal-footer">
                            <button class="modal-button" @click="handleStartExam">OK</button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
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
            <div class="number-display">
                Dengarkan dan pilih apakah semua angka yang Anda dengar adalah genap atau ganjil.
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
import { removeTestByNameAndUpdateLocalStorage } from '@/utils';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Altimeter, Airspeed, Heading } from 'vue-flight-indicators';
import { useRouter } from 'vue-router';

// Constants for movement speed
const MOVEMENT_SPEED = {
    HEADING: 0.2,
    ALTITUDE: 2,
    THRUST_RESPONSE: 1,
    MIN_AIRSPEED: 60,
    MAX_AIRSPEED: 160,
    GRAVITY_EFFECT: 0.08,
    VERTICAL_SPEED_MULTIPLIER: 1.2,
    TARGET_CHANGE_RATE: 1,
    ACCELERATION_RATE: 0.001,     // Increased from 0.000001
    DECELERATION_RATE: 0.0008,     // Increased from 0.000001
    DRAG_COEFFICIENT: 0.00015,     // Adjusted to match new acceleration
    MOMENTUM_RETENTION: 0.98,      // Slightly reduced from 1 to allow for more responsive changes
    ENGINE_IDLE_THRUST: 15,
    ALTITUDE_EFFECT_RATE: 0.0004,
    MAX_ALTITUDE_EFFECT: 5,
    THRUST_MULTIPLIER: 4,    // New: how much momentum is retained (close to 1)
};

// State
const mode = ref('moving');
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

const generateRandomNumber = () => Math.floor(Math.random() * 10);

const speakNumber = (number) => {
    const utterance = new SpeechSynthesisUtterance(number.toString());
    utterance.lang = 'en-US'; // Set language
    utterance.volume = 1;     // Maximum volume
    utterance.rate = 1;       // Normal speed
    utterance.pitch = 1;      // Normal pitch

    // Cancel any ongoing speech
    synthesis.cancel();

    // Speak the new number
    synthesis.speak(utterance);

    // Log for debugging
    console.log('Speaking number:', number);
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

// Constants for audio test
const AUDIO_TEST = {
    SEQUENCE_PAUSE: 15000,
    NUMBER_INTERVAL: 1000,
    RESPONSE_WINDOW: 15000
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

    const allEven = displayedNumbers.value.every(num => num % 2 === 0);
    const allOdd = displayedNumbers.value.every(num => num % 2 === 1);
    const isCorrect = (allEven && response === 'even') || (allOdd && response === 'odd');

    audioResponses.value.push({
        numbers: [...displayedNumbers.value],
        response,
        responseTime,
        correct: isCorrect,
        configIndex: currentConfigIndex.value
    });

    canRespond.value = false;
    displayedNumbers.value = [];

    setTimeout(startAudioSequence, AUDIO_TEST.SEQUENCE_PAUSE);
};

const handleNoResponse = () => {
    audioResponses.value.push({
        numbers: [...displayedNumbers.value],
        response: 'none',
        responseTime: AUDIO_TEST.RESPONSE_WINDOW,
        correct: false,
        configIndex: currentConfigIndex.value
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
        const newConfig = config.value.configs[nextIndex];
        airspeedTarget.value = airspeed.value;
        headingTarget.value = heading.value;
        altitudeTarget.value = altitude.value;

        // Start new audio sequence if applicable
        if (newConfig.listening_task === 'active') {
            startAudioSequence();
        }
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

    if (Math.random() < 0.005) {
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

    if (mode === 'adjust_for_consistent_updates') {
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
        console.log(currentValue)

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
    }
};


const startExam = () => {
    examRunning.value = true;
    score.value = 0;
    currentConfigIndex.value = 0;

    // Initialize first config duration
    timeRemaining.value = config.value.configs[0].duration * 60;

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

    // Start audio sequence if enabled for first config
    if (config.value.configs[0].listening_task === 'active') {
        startAudioSequence();
    }
};

// Modify endExam to cleanup sounds
const endExam = () => {
    examRunning.value = false;
    cancelAudioSequence();
    cleanupSounds();

    sendPerformanceData();
};


const initConfig = async () => {
    const scheduleData = JSON.parse(localStorage.getItem('scheduleData'));
    const configMIC = scheduleData.tests.find((t) => t.testUrl === "monitoring-instrument-coordination-test");
    console.log(configMIC, 'config')
    // Store all configs and calculate total duration
    config.value = {
        configs: configMIC.configs,
        totalDuration: configMIC.configs.reduce((total, cfg) => total + Number(cfg.duration), 0),
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

        removeTestByNameAndUpdateLocalStorage('Monitoring & Instrument Koordination');
        localStorage.removeItem('refreshCountShapeRecognition');
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
    background-color: #00C851;
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
    z-index: 1000;
}

.modal-container {
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.modal-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #333;
    margin-bottom: 1rem;
}

.modal-body {
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
    background-color: #007bff;
    color: white;
    border: none;
    padding: 8px 24px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.2s;
}

.modal-button:hover {
    background-color: #0056b3;
}

.modal-button:active {
    background-color: #004085;
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
