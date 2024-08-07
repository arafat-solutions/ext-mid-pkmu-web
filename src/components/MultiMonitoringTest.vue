<template>
    <div class="relative h-full">
        <ModalConfirmSound :visible="isModalVisible" title="Start Test"
            message="Are you sure you want to start this test?" @confirm="handleConfirm" @cancel="handleCancel" />
        <div class="bg-black h-full w-full flex justify-center items-center">
            <canvas ref="canvas" class="border border-white" :width="500" :height="300"></canvas>
        </div>
        <div class="absolute top-0 left-0 w-full flex justify-center">
            <div
                class="bg-[#6757dc] text-white w-[300px] h-[60px] rounded-b-2xl flex justify-center items-center space-x-2">
                <p>Waktu: {{ formatTime(config.duration) }}</p>
            </div>
        </div>
        <div class="absolute left-0 top-0 h-full w-48 bg-gray-950 text-left text-white pt-20 pl-2">
            <p>correctTime: {{ metrics.tracking_task.correctTime.toFixed(2) }} s</p>
            <p>Button:</p>
            <p>correct: {{ metrics.button_task.correct_answer }}</p>
            <p>wrong: {{ metrics.button_task.incorrect_answer }}</p>
            <p>total: {{ metrics.button_task.total_question }}</p>
            <p>Acoustic:</p>
            <p>correct: {{ metrics.acoustic_task.correct_answer }}</p>
            <p>wrong: {{ metrics.acoustic_task.incorrect_answer }}</p>
            <p>total: {{ metrics.acoustic_task.total_question }}</p>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router'
import ModalConfirmSound from './common/ModalConfirmSound.vue'

// const loading = ref(false)
const router = useRouter()
const isModalVisible = ref(true)
const canvas = ref(null);
const ctx = ref(null);
const testInterval = ref(null);
const rectangleInterval = ref(null);
const soundInterval = ref(null)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const isSoundSame = ref(false)
const gameObjects = ref({
    circle: { x: 250, y: 150, radius: 10 },
    aim: { x: 0, y: 0, size: 20 },
    rectangles: []
});

const config = ref({
    speed: "normal",
    speedChange: '',
    directionChange: '',
    duration: 0,
    rectangleVisibility: {
        showDuration: 1,
        hideDuration: 8,
    },
    playInterval: 10000
});

const metrics = ref({
    tracking_task: {
        correctTime: 0,
        lastCheckTime: 0
    },
    acoustic_task: {
        correct_answer: 0,
        total_question: 0,
        incorrect_answer: 0
    },
    button_task: {
        correct_answer: 0,
        total_question: 0,
        incorrect_answer: 0
    }
})

const gameState = ref({
    direction: { x: 1, y: 1 },
    currentSpeed: 3,
    baseSpeed: 3,
    rectanglesVisible: false,
    lastRectangleTime: 0,
    userAnswered: false,
    lastFrameTime: 0,
    acousticAnswerAllowed: false,
    lastAcousticPlayTime: 0
});

const speedMap = {
    very_slow: 1,
    slow: 2,
    normal: 3,
    fast: 4,
    very_fast: 5
};

function moveCircle(deltaTime) {
    const { circle } = gameObjects.value;
    const { direction, currentSpeed } = gameState.value;

    changeSpeed();
    changeDirection();

    const moveDistance = currentSpeed * (deltaTime / 16.67); // Normalize for 60 FPS

    circle.x += direction.x * moveDistance;
    circle.y += direction.y * moveDistance;

    if (circle.x + circle.radius > 500 || circle.x - circle.radius < 0) direction.x *= -1;
    if (circle.y + circle.radius > 300 || circle.y - circle.radius < 0) direction.y *= -1;

    circle.x = Math.max(circle.radius, Math.min(500 - circle.radius, circle.x));
    circle.y = Math.max(circle.radius, Math.min(300 - circle.radius, circle.y));
}

function changeSpeed() {
    const changeRates = { none: 0, slow: 0.01, normal: 0.05, sudden: 0.2 };
    const rate = changeRates[config.value.speedChange];
    const randomChange = (Math.random() - 0.5) * 2 * rate * gameState.value.baseSpeed;
    gameState.value.currentSpeed = Math.max(0.5, Math.min(gameState.value.baseSpeed * 2, gameState.value.currentSpeed + randomChange));
}

function changeDirection() {
    const changeRates = { none: 0, slow: 0.01, normal: 0.05, sudden: 0.2 };
    const rate = changeRates[config.value.directionChange];
    const angle = (Math.random() - 0.5) * 2 * Math.PI * rate;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const { direction } = gameState.value;
    const newX = direction.x * cos - direction.y * sin;
    const newY = direction.x * sin + direction.y * cos;

    const magnitude = Math.sqrt(newX * newX + newY * newY);
    direction.x = newX / magnitude;
    direction.y = newY / magnitude;
}

function draw() {
    ctx.value.clearRect(0, 0, 500, 300);

    if (gameState.value.rectanglesVisible) {
        ctx.value.fillStyle = '#1C97FF';
        gameObjects.value.rectangles.forEach(rect => ctx.value.fillRect(rect.x, rect.y, 30, 30));
    }

    ctx.value.beginPath();
    ctx.value.arc(gameObjects.value.circle.x, gameObjects.value.circle.y, gameObjects.value.circle.radius, 0, Math.PI * 2);
    ctx.value.fillStyle = 'white';
    ctx.value.fill();

    const { aim } = gameObjects.value;
    ctx.value.beginPath();
    ctx.value.arc(aim.x, aim.y, aim.size / 2, 0, Math.PI * 2);
    ctx.value.strokeStyle = 'yellow';
    ctx.value.lineWidth = 2;
    ctx.value.stroke();
    ctx.value.moveTo(aim.x - aim.size / 2, aim.y);
    ctx.value.lineTo(aim.x + aim.size / 2, aim.y);
    ctx.value.moveTo(aim.x, aim.y - aim.size / 2);
    ctx.value.lineTo(aim.x, aim.y + aim.size / 2);
    ctx.value.stroke();
}

function handleMouseMove(event) {
    const rect = canvas.value.getBoundingClientRect();
    gameObjects.value.aim.x = event.clientX - rect.left;
    gameObjects.value.aim.y = event.clientY - rect.top;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainderSeconds = seconds % 60;
    return `${minutes}:${remainderSeconds < 10 ? '0' : ''}${remainderSeconds}`;
}

function generateRectangles() {
    return Array.from({ length: 2 }, () => ({
        x: Math.random() * 470,
        y: Math.random() * 270
    }));
}

function updateCircleSpeed() {
    gameState.value.baseSpeed = speedMap[config.value.speed] || speedMap.normal;
    gameState.value.currentSpeed = gameState.value.baseSpeed;
}

function toggleRectangles() {
    gameState.value.rectanglesVisible = !gameState.value.rectanglesVisible;

    if (!gameState.value.rectanglesVisible) {
        gameObjects.value.rectangles = generateRectangles();
        metrics.value.button_task.total_question++;
    } else {
        if (!gameState.value.userAnswered) {
            metrics.value.button_task.incorrect_answer++;
        }
        gameState.value.userAnswered = false;
    }

    setTimeout(toggleRectangles, (gameState.value.rectanglesVisible ? config.value.rectangleVisibility.showDuration : config.value.rectangleVisibility.hideDuration) * 1000);
}

function initConfig() {
    const scheduleData = JSON.parse(localStorage.getItem('scheduleData'))
    const configMultiMonitoring = scheduleData.tests.find((t) => t.testUrl === 'multi-monitoring-test')
    const { duration, id, speed, speed_change, direction_change } = configMultiMonitoring.config

    config.value = {
        ...config.value,
        duration: duration * 60,
        speed,
        speedChange: speed_change,
        directionChange: direction_change,
        userId: scheduleData.userId,
        sessionId: scheduleData.sessionId,
        testId: id,
    }
}

// async function submitResult () {
//     try {
//                 loadingSubmit.value = true;
//                 const API_URL = process.env.VUE_APP_API_URL;
//                 const payload = {
//                     testSessionId: config.value.sessionId,
//                     userId: config.value.userId,
//                     batteryTestConfigId: config.value.testId,
//                     result: arrayMetrics.value
//                 }

//                 const response = await fetch(`${API_URL}api/submission`, {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                     body: JSON.stringify(payload),
//                 });

//                 if (!response.ok) {
//                     throw new Error(`Error: ${response.statusText}`);
//                 }
//                 removeTestByNameAndUpdateLocalStorage('Rotating Maze')
//                 localStorage.removeItem('arrayMetrics')
//                 router.push('/module');
//             } catch (error) {
//                 console.log(error, "<< error")
//             } finally {
//                 loadingSubmit.value = false; // Set loading to false when the submission is complete
//             }
// }


function countDownTestTime() {
    if (testInterval.value) {
        clearInterval(testInterval.value);
    }

    testInterval.value = setInterval(async () => {
        if (config.value.duration > 0) {
            config.value.duration--;
        } else {
            clearInterval(testInterval.value);
            console.log("submit gan")
        }
    }, 1000)
}

function playSound(frequency, duration) {
    const oscillator = audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

function handleKeydown(event) {
    if (event.code === 'Space' && gameState.value.rectanglesVisible && !gameState.value.userAnswered) {
        metrics.value.button_task.correct_answer++;
        gameState.value.userAnswered = true;
    } else if (event.code === 'Enter') {
        if (gameState.value.acousticAnswerAllowed) {
            if (isSoundSame.value) {
                metrics.value.acoustic_task.correct_answer++;
            } else {
                metrics.value.acoustic_task.incorrect_answer++;
            }
            isSoundSame.value = false;
            gameState.value.acousticAnswerAllowed = false;
        }
    }
}

function checkAimCollision(timestamp) {
    const currentTimeInSeconds = timestamp / 1000;
    const { circle, aim } = gameObjects.value;
    const distance = Math.sqrt(
        Math.pow(circle.x - aim.x, 2) + Math.pow(circle.y - aim.y, 2)
    );

    if (distance <= circle.radius + aim.size / 2) {
        const elapsedTime = currentTimeInSeconds - metrics.value.tracking_task.lastCheckTime;
        metrics.value.tracking_task.correctTime += elapsedTime;
    }
    metrics.value.tracking_task.lastCheckTime = currentTimeInSeconds;
}

function initRectangleInterval() {
    if (rectangleInterval.value) {
        clearInterval(rectangleInterval.value);
    }
    toggleRectangles();
}

function gameLoop(timestamp) {
    const deltaTime = timestamp - gameState.value.lastFrameTime;
    gameState.value.lastFrameTime = timestamp;

    moveCircle(deltaTime);
    checkAimCollision(timestamp);
    draw();
    requestAnimationFrame(gameLoop);
}

function playRandomSounds() {
    const soundOptions = [
        { frequency: 200, duration: 0.2 },
        { frequency: 200, duration: 0.5 },
        { frequency: 1000, duration: 0.2 },
        { frequency: 1000, duration: 0.5 }
    ];

    function getRandomSoundOption() {
        return soundOptions[Math.floor(Math.random() * soundOptions.length)];
    }

    function playThreeTimes() {
        // Check if user didn't answer the previous question
        if (gameState.value.acousticAnswerAllowed) {
            metrics.value.acoustic_task.incorrect_answer++;
        }

        const randomDecision = Math.random();
        metrics.value.acoustic_task.total_question++;

        if (randomDecision < 0.5) {
            isSoundSame.value = false;

            for (let i = 0; i < 3; i++) {
                const selectedOption = getRandomSoundOption();
                const { frequency, duration } = selectedOption;

                setTimeout(() => {
                    playSound(frequency, duration);
                }, i * (duration * 1000 + 1000));
            }
        } else {
            isSoundSame.value = true;

            const selectedOption = getRandomSoundOption();
            const { frequency, duration } = selectedOption;

            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    playSound(frequency, duration);
                }, i * (duration * 1000 + 1000));
            }
        }

        // Allow acoustic answer after the sounds have been played
        setTimeout(() => {
            gameState.value.acousticAnswerAllowed = true;
            gameState.value.lastAcousticPlayTime = Date.now();
        }, 3000); // Assuming 3 seconds for all sounds to play
    }

    function startSoundInterval() {
        if (soundInterval.value) {
            clearInterval(soundInterval.value);
        }

        soundInterval.value = setInterval(() => {
            playThreeTimes();
        }, config.value.playInterval);
    }

    startSoundInterval();
}

function handleConfirm() {
    isModalVisible.value = false
    countDownTestTime();
    playRandomSounds();
    gameState.value.lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function handleCancel() {
    router.replace('/module')
}

onMounted(() => {
    if (canvas.value) {
        ctx.value = canvas.value.getContext('2d');

        initConfig();

        gameObjects.value.rectangles = generateRectangles();
        updateCircleSpeed();
        metrics.value.tracking_task.lastCheckTime = performance.now() / 1000;

        initRectangleInterval();

        canvas.value.addEventListener('mousemove', handleMouseMove);
        canvas.value.addEventListener('mouseenter', () => canvas.value.style.cursor = 'none');
        canvas.value.addEventListener('mouseleave', () => canvas.value.style.cursor = 'default');
        window.addEventListener('keydown', handleKeydown);
    }
});

onUnmounted(() => {
    if (canvas.value) {
        canvas.value.removeEventListener('mousemove', handleMouseMove);
        canvas.value.removeEventListener('mouseenter', () => { });
        canvas.value.removeEventListener('mouseleave', () => { });
        window.removeEventListener('keydown', handleKeydown);
    }
    if (testInterval.value) {
        clearInterval(testInterval.value);
    }
    if (rectangleInterval.value) {
        clearInterval(rectangleInterval.value);
    }
    if (soundInterval.value) {
        clearInterval(soundInterval.value);
    }
});

watch(() => config.value.speed, updateCircleSpeed);
</script>
