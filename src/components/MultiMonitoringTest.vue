<template>
    <div class="relative h-full">
        <div class="bg-black h-full w-full flex justify-center items-center">
            <canvas ref="canvas" class="border border-white" :width="500" :height="300"></canvas>
        </div>
        <div class="absolute top-0 left-0 w-full flex justify-center">
            <div
                class="bg-[#6757dc] text-white w-[300px] h-[60px] rounded-b-2xl flex justify-center items-center space-x-2">
                <p>Waktu: {{ formatTime(config.duration) }}</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

const canvas = ref(null);
const ctx = ref(null);
const testInterval = ref(null)
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
        showDuration: 3, // in second
        hideDuration: 2, // in second
    }
});

const gameState = ref({
    direction: { x: 1, y: 1 },
    currentSpeed: 3,
    baseSpeed: 3,
    rectanglesVisible: true
});

const speedMap = {
    very_slow: 1,
    slow: 2,
    normal: 3,
    fast: 4,
    very_fast: 5
};

function updateGame() {
    moveCircle();
    draw();
    requestAnimationFrame(updateGame);
}

function moveCircle() {
    const { circle } = gameObjects.value;
    const { direction, currentSpeed } = gameState.value;

    changeSpeed();
    changeDirection();

    circle.x += direction.x * currentSpeed;
    circle.y += direction.y * currentSpeed;

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

function initConfig() {
    // const scheduleData = JSON.parse(localStorage.getItem('scheduleData'))
    // const configRotatingMaze = scheduleData.tests.find((t) => t.testUrl === 'rotating-maze-test')
    // const { duration, rotation_frequency, id, size } = configRotatingMaze.config

    config.value = {
        duration: 10 * 60,
        speed: "normal", //very_slow, slow, normal, fast, very_fast
        speedChange: 'none', // none, slow, normal, sudden
        directionChange: 'none', // none, slow, normal, sudden
        rectangleVisibility: {
            showDuration: 3, // seconds
            hideDuration: 5, // seconds
        }
        // userId: scheduleData.userId,
        // sessionId: scheduleData.sessionId,
        // testId: id
    }

}

function countDownTestTime() {
    if (testInterval.value) {
        clearInterval(testInterval.value);
    }

    testInterval.value = setInterval(async () => {
        if (config.value.duration > 0) {
            config.value.duration--;
        } else {
            clearInterval(testInterval.value);
            // await submitResult();
            console.log("submit gan")
        }
    }, 1000)
}

onMounted(() => {
    if (canvas.value) {
        ctx.value = canvas.value.getContext('2d');

        initConfig()

        gameObjects.value.rectangles = generateRectangles();
        updateCircleSpeed();
        updateGame();

        setInterval(() => {
            gameState.value.rectanglesVisible = !gameState.value.rectanglesVisible;
            if (gameState.value.rectanglesVisible) {
                gameObjects.value.rectangles = generateRectangles();
            }
        }, (config.value.rectangleVisibility.showDuration + config.value.rectangleVisibility.hideDuration) * 1000);

        countDownTestTime()

        canvas.value.addEventListener('mousemove', handleMouseMove);
        canvas.value.addEventListener('mouseenter', () => canvas.value.style.cursor = 'none');
        canvas.value.addEventListener('mouseleave', () => canvas.value.style.cursor = 'default');
    }
});

onUnmounted(() => {
    if (canvas.value) {
        canvas.value.removeEventListener('mousemove', handleMouseMove);
        canvas.value.removeEventListener('mouseenter', () => { });
        canvas.value.removeEventListener('mouseleave', () => { });
    }
});

watch(() => config.value.speed, updateCircleSpeed);
</script>
