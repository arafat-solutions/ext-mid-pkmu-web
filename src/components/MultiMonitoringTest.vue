<template>
    <div class="relative h-full">
        <div class="bg-black h-full w-full flex justify-center items-center">
            <canvas ref="multiMonitoringCanvas" class="border border-white" :width="canvasWidth"
                :height="canvasHeight"></canvas>
        </div>
        <div class="absolute top-0 left-0 w-full flex justify-center">
            <div
                class="bg-[#6757dc] text-white w-[300px] h-[60px] rounded-b-2xl flex justify-center items-center space-x-2">
                <p>Waktu: </p>
                <p>{{ formatTime(config.duration) }}</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

const canvasWidth = ref(500)
const canvasHeight = ref(300)
const multiMonitoringCanvas = ref(null);
const ctx = ref(null);
const circle = ref({ x: 250, y: 150, radius: 10, dx: 2, dy: 2 });
const aim = ref({ x: 0, y: 0, size: 20 });
const rectangles = ref([]);
const testInterval = ref(null)
const config = ref({
    speed: "normal", //very_slow, slow, normal, fast, very_fast
    speedChange: '', // none, slow, normal, sudden
    directionChange: '', // none, slow, normal, sudden
    duration: 0,
    rectangleVisibility: {
        showDuration: 3, // seconds
        hideDuration: 2, // seconds
    }
})

const baseSpeed = ref(3); // Normal speed
const currentSpeed = ref(3);
const direction = ref({ x: 1, y: 1 });
const rectanglesVisible = ref(true);
const visibilityInterval = ref(null);

const updateCircleSpeed = () => {
    const speedMap = {
        very_slow: 1,
        slow: 2,
        normal: 3,
        fast: 4,
        very_fast: 5
    };

    baseSpeed.value = speedMap[config.value.speed] || speedMap.normal;
    currentSpeed.value = baseSpeed.value;
};

const changeSpeed = () => {
    const changeRates = {
        none: 0,
        slow: 0.01,
        normal: 0.05,
        sudden: 0.2
    };

    const rate = changeRates[config.value.speedChange];
    const randomChange = (Math.random() - 0.5) * 2 * rate * baseSpeed.value;
    currentSpeed.value = Math.max(0.5, Math.min(baseSpeed.value * 2, currentSpeed.value + randomChange));
};

const changeDirection = () => {
    const changeRates = {
        none: 0,
        slow: 0.01,
        normal: 0.05,
        sudden: 0.2
    };

    const rate = changeRates[config.value.directionChange];
    const angle = (Math.random() - 0.5) * 2 * Math.PI * rate;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const newX = direction.value.x * cos - direction.value.y * sin;
    const newY = direction.value.x * sin + direction.value.y * cos;

    const magnitude = Math.sqrt(newX * newX + newY * newY);
    direction.value.x = newX / magnitude;
    direction.value.y = newY / magnitude;
};

const moveCircle = () => {
    changeSpeed();
    changeDirection();

    circle.value.x += direction.value.x * currentSpeed.value;
    circle.value.y += direction.value.y * currentSpeed.value;

    if (circle.value.x + circle.value.radius > canvasWidth.value || circle.value.x - circle.value.radius < 0) {
        direction.value.x = -direction.value.x;
    }
    if (circle.value.y + circle.value.radius > canvasHeight.value || circle.value.y - circle.value.radius < 0) {
        direction.value.y = -direction.value.y;
    }

    circle.value.x = Math.max(circle.value.radius, Math.min(canvasWidth.value - circle.value.radius, circle.value.x));
    circle.value.y = Math.max(circle.value.radius, Math.min(canvasHeight.value - circle.value.radius, circle.value.y));
};

const drawAim = () => {
    ctx.value.beginPath();
    ctx.value.arc(aim.value.x, aim.value.y, aim.value.size / 2, 0, Math.PI * 2);
    ctx.value.strokeStyle = 'yellow';
    ctx.value.lineWidth = 2;
    ctx.value.stroke();
    ctx.value.moveTo(aim.value.x - aim.value.size / 2, aim.value.y);
    ctx.value.lineTo(aim.value.x + aim.value.size / 2, aim.value.y);
    ctx.value.moveTo(aim.value.x, aim.value.y - aim.value.size / 2);
    ctx.value.lineTo(aim.value.x, aim.value.y + aim.value.size / 2);
    ctx.value.stroke();
};

const drawCircle = () => {
    ctx.value.beginPath();
    ctx.value.arc(circle.value.x, circle.value.y, circle.value.radius, 0, Math.PI * 2);
    ctx.value.fillStyle = 'white';
    ctx.value.fill();
};

const generateRectangle = () => {
    return {
        x: Math.random() * (canvasWidth.value - 30),
        y: Math.random() * (canvasHeight.value - 30),
        width: 30,
        height: 30
    };
};

const generateRectangles = () => {
    rectangles.value = [];
    for (let i = 0; i < 2; i++) {
        rectangles.value.push(generateRectangle());
    }
};

const repositionRectangles = () => {
    rectangles.value = rectangles.value.map(() => generateRectangle());
};

const toggleRectangleVisibility = () => {
    rectanglesVisible.value = !rectanglesVisible.value;
    if (rectanglesVisible.value) {
        repositionRectangles();
    }
};

const startVisibilityToggle = () => {
    if (visibilityInterval.value) {
        clearInterval(visibilityInterval.value);
    }

    visibilityInterval.value = setInterval(() => {
        toggleRectangleVisibility();
        setTimeout(() => {
            toggleRectangleVisibility();
        }, rectanglesVisible.value ? config.value.rectangleVisibility.showDuration * 1000 : config.value.rectangleVisibility.hideDuration * 1000);
    }, (config.value.rectangleVisibility.showDuration + config.value.rectangleVisibility.hideDuration) * 1000);
};

const drawRectangles = () => {
    if (rectanglesVisible.value) {
        ctx.value.fillStyle = '#1C97FF';
        rectangles.value.forEach(rect => {
            ctx.value.fillRect(rect.x, rect.y, rect.width, rect.height);
        });
    }
};

const updateCanvas = () => {
    ctx.value.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
    drawRectangles();
    moveCircle();
    drawCircle();
    drawAim();
    requestAnimationFrame(updateCanvas);
};

const handleMouseMove = (event) => {
    if (!multiMonitoringCanvas.value) return;

    const rect = multiMonitoringCanvas.value.getBoundingClientRect();
    aim.value.x = event.clientX - rect.left;
    aim.value.y = event.clientY - rect.top;
};

const handleMouseEnter = () => {
    if (multiMonitoringCanvas.value) {
        multiMonitoringCanvas.value.style.cursor = 'none';
    }
};

const handleMouseLeave = () => {
    if (multiMonitoringCanvas.value) {
        multiMonitoringCanvas.value.style.cursor = 'default';
    }
};

const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainderSeconds = seconds % 60;
    return `${minutes}:${remainderSeconds < 10 ? '0' : ''}${remainderSeconds}`;
}

const initConfig = () => {
    // const scheduleData = JSON.parse(localStorage.getItem('scheduleData'))
    // const configRotatingMaze = scheduleData.tests.find((t) => t.testUrl === 'rotating-maze-test')
    // const { duration, rotation_frequency, id, size } = configRotatingMaze.config

    // const ROTATION_FREQUENCY_VALUE = {
    //     easy: 6000,
    //     medium: 4000,
    //     hard: 2000
    // }

    config.value = {
        duration: 10 * 60,
        speed: "very_fast", //very_slow, slow, normal, fast, very_fast
        speedChange: 'none', // none, slow, normal, sudden
        directionChange: 'none', // none, slow, normal, sudden
        rectangleVisibility: {
            showDuration: 3, // seconds
            hideDuration: 2, // seconds
        }
        // userId: scheduleData.userId,
        // sessionId: scheduleData.sessionId,
        // testId: id
    }
}

const countDownTestTime = () => {
    if (testInterval.value) {
        clearInterval(testInterval.value);
    }

    testInterval.value = setInterval(async () => {
        if (config.value.duration > 0) {
            config.value.duration--;
        } else {
            clearInterval(testInterval.value);
            // await submitResult();
        }
    }, 1000)
}

onMounted(() => {
    if (multiMonitoringCanvas.value) {
        ctx.value = multiMonitoringCanvas.value.getContext('2d');
        initConfig()
        generateRectangles();
        updateCircleSpeed();
        updateCanvas();
        countDownTestTime()
        startVisibilityToggle();
        multiMonitoringCanvas.value.addEventListener('mousemove', handleMouseMove);
        multiMonitoringCanvas.value.addEventListener('mouseenter', handleMouseEnter);
        multiMonitoringCanvas.value.addEventListener('mouseleave', handleMouseLeave);
    }
});

onUnmounted(() => {
    if (multiMonitoringCanvas.value) {
        multiMonitoringCanvas.value.removeEventListener('mousemove', handleMouseMove);
        multiMonitoringCanvas.value.removeEventListener('mouseenter', handleMouseEnter);
        multiMonitoringCanvas.value.removeEventListener('mouseleave', handleMouseLeave);
    }
    if (visibilityInterval.value) {
        clearInterval(visibilityInterval.value);
    }
});

watch(() => config.value.speed, updateCircleSpeed);
watch(() => config.value.rectangleVisibility, startVisibilityToggle, { deep: true });
</script>