<template>
    <div class="shapeContainer">
        <canvas id="shapeCanvas" ref="shapeCanvas" width="500" height="300"></canvas>
        <div class="buttonContainer">
            <div class="buttonGroup" v-for="(shape, index) in shapes.slice(0, 5)" :key="index"
                @click="checkAnswer(index)">
                <canvas :ref="el => buttonCanvases[index] = el" width="200" height="100"></canvas>
                <button>
                    {{ ['A', 'B', 'C', 'D', 'E'][index] }}
                </button>
            </div>
        </div>
    </div>
    <div v-if="loading" class="loadingContainer">
        <div class="spinner"></div>
        <p class="loadingText">Your result is submitting...</p>
    </div>
    <!-- <div class="settings">
        <button @click="drawQuestions">New Shape</button>
        <div>
            <p>correct : {{ quizMetrics.correctAnswer }}</p>
            <p>wrong: {{ quizMetrics.wrongAnswer }}</p>
            <p>unanswered: {{ quizMetrics.unanswered }}</p>
            <p>totalQuestion: {{ quizMetrics.totalQuestion }}</p>
            <p>avgResponseTime: {{ quizMetrics.avgResponseTime.toFixed(2) }} s</p>
            <p>answer count: {{ answerCount }}</p>
            <p>Time left: {{ questionCountdown }}s</p>
        </div>
    </div> -->
    <div class="timer">
        <p>Waktu:</p>
        <p>{{ formatTime(config.duration) }}</p>
    </div>
</template>

<script>
import { ref, onMounted, nextTick, watch, onUnmounted } from 'vue';
import { removeTestByNameAndUpdateLocalStorage } from '@/utils/index'
import { useRouter } from 'vue-router'

export default {
    name: 'ShapeRecognition',
    setup() {
        const router = useRouter()

        const shapeCanvas = ref(null);
        const buttonCanvases = ref([]);
        const correctShapeIndex = ref(0);
        const shapes = ref([]);
        const tesInterval = ref(null)
        const answerCount = ref(0)
        const startTime = ref(null);
        const totalResponseTime = ref(0);
        const responseCount = ref(0);
        const questionCountdown = ref(0);
        const questionCountDownInterval = ref(null)
        const loading = ref(false)
        const config = ref({
            duration: 0,
            size: '',
            variation: 0,
            userId: '',
            sessionId: '',
            testId: '',
            timePerQuestion: 0
        })
        const quizMetrics = ref({
            correctAnswer: 0,
            wrongAnswer: 0,
            unanswered: 0,
            totalQuestion: 30,
            avgResponseTime: 0 //in seconds
        })

        const STROKE_WIDTH = 2;
        const ANGLES = [0, Math.PI / 2, Math.PI, 2 * Math.PI];

        const shapeGenerators = [
            generateOctagon,
            generateStar,
            generateParallelogram,
            generateLeftArrow,
            generateH,
            generatePlane,
            generateReturnArrow,
            generateHexagon,
            generateQuestionMark,
            generateChevronLeft,
            generateT,
            generateHeart,
            generateS,
            generateL
        ];

        function drawShape(ctx, shapeGenerator, canvasWidth, canvasHeight, angle) {
            ctx.save();
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = STROKE_WIDTH;
            ctx.translate(canvasWidth / 2, canvasHeight / 2);
            const scale = Math.min(canvasWidth, canvasHeight) * 0.7;
            ctx.scale(scale / 100, scale / 100);
            console.log(angle)
            ctx.rotate(angle);
            ctx.beginPath();
            shapeGenerator(ctx);
            ctx.stroke();
            ctx.restore();
        }

        async function checkAnswer(index) {

            // count average user answer in seconds
            const currentTime = Date.now();
            if (!startTime.value) {
                startTime.value = currentTime;
            }
            const elapsedTime = (currentTime - startTime.value) / 1000; // Convert to seconds
            totalResponseTime.value += elapsedTime;
            responseCount.value++;
            quizMetrics.value.avgResponseTime = totalResponseTime.value / responseCount.value;

            startTime.value = currentTime;

            // check the answer if correct or wrong
            if (index === correctShapeIndex.value) {
                quizMetrics.value.correctAnswer++
            } else {
                quizMetrics.value.wrongAnswer++
            }

            // count unanswered
            quizMetrics.value.unanswered = quizMetrics.value.totalQuestion - (quizMetrics.value.correctAnswer + quizMetrics.value.wrongAnswer)

            if (answerCount.value < config.value.variation - 1) {
                answerCount.value++

                // keep the button shape
                correctShapeIndex.value = Math.floor(Math.random() * shapes.value.length);
                const randomAngle = ANGLES[Math.floor(Math.random() * ANGLES.length)];

                drawInButtons(randomAngle);
                drawInCenter(randomAngle);

                startQuestionCountdown();
            } else {
                answerCount.value = 0

                if (quizMetrics.value.correctAnswer + quizMetrics.value.wrongAnswer >= quizMetrics.value.totalQuestion) {
                    await submitResult();
                } else {

                    drawQuestions()
                }

            }
        }

        function drawInButtons(randomAngle) {
            buttonCanvases.value.forEach((canvas, index) => {
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    drawShape(ctx, shapes.value[index], canvas.width, canvas.height, randomAngle);
                }
            });
        }

        function drawInCenter(angle) {
            const ctx = shapeCanvas.value.getContext('2d');
            ctx.clearRect(0, 0, shapeCanvas.value.width, shapeCanvas.value.height);

            // Only draw randomized shapes (including the correct one)
            drawRandomizedShapes(ctx, angle);
        }

        function getScaleFactor(size) {
            switch (size) {
                case 'very_small': return 0.5;
                case 'small': return 0.75;
                case 'normal': return 1;
                case 'large': return 1.25;
                case 'very_large': return 1.5;
                default: return 1;
            }
        }

        function drawRandomizedShapes(ctx, randomAngle) {
            const canvasWidth = shapeCanvas.value.width;
            const canvasHeight = shapeCanvas.value.height;
            const numShapes = 80; // Increased number of shapes

            const scaleFactor = getScaleFactor(config.value.size);

            // Draw the correct shape first
            ctx.save();
            const correctX = Math.random() * (canvasWidth - 100) + 50;
            const correctY = Math.random() * (canvasHeight - 100) + 50;
            ctx.translate(correctX, correctY);
            ctx.rotate(randomAngle)
            ctx.scale(scaleFactor, scaleFactor)
            ctx.beginPath();
            ctx.strokeStyle = 'green';
            ctx.lineWidth = STROKE_WIDTH;
            shapes.value[correctShapeIndex.value](ctx);
            ctx.stroke();
            ctx.restore();

            // // Draw random abstract shapes
            for (let i = 1; i < numShapes; i++) {
                ctx.save();
                ctx.translate(
                    Math.random() * canvasWidth,
                    Math.random() * canvasHeight
                );
                ctx.beginPath();
                ctx.strokeStyle = 'black';
                ctx.lineWidth = STROKE_WIDTH;

                // Generate a truly random abstract shape
                const points = Math.floor(Math.random() * 3) + 2; // 2 to 4 points
                const size = Math.random() * 300 + 50; // Increased size range

                for (let j = 0; j < points; j++) {
                    const x = Math.random() * size - size / 2;
                    const y = Math.random() * size - size / 2;
                    if (j === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        // Always use lineTo for simpler shapes
                        ctx.lineTo(x, y);
                    }
                }

                ctx.stroke();
                ctx.restore();
            }
        }

        // function generateTriangle(ctx) {
        //     ctx.moveTo(0, -50);
        //     ctx.lineTo(43.3, 25);
        //     ctx.lineTo(-43.3, 25);
        //     ctx.closePath();
        // }

        // function generateSquare(ctx) {
        //     ctx.rect(-35, -35, 70, 70);
        // }

        // function generateCircle(ctx) {
        //     ctx.arc(0, 0, 40, 0, 2 * Math.PI);
        // }

        function generateOctagon(ctx) {
            for (let i = 0; i < 8; i++) {
                const angle = i * Math.PI / 4;
                const x = 40 * Math.cos(angle);
                const y = 40 * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
        }

        function generateStar(ctx) {
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5;
                const x = 40 * Math.cos(angle);
                const y = 40 * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
        }

        function generateParallelogram(ctx) {
            ctx.beginPath();
            ctx.moveTo(-40, -20);
            ctx.lineTo(20, -20);
            ctx.lineTo(40, 20);
            ctx.lineTo(-20, 20);
            ctx.closePath();
        }

        function generateLeftArrow(ctx) {
            ctx.beginPath();
            ctx.moveTo(20, -30);
            ctx.lineTo(-20, 0);
            ctx.lineTo(20, 30);
            ctx.lineTo(20, 15);
            ctx.lineTo(40, 15);
            ctx.lineTo(40, -15);
            ctx.lineTo(20, -15);
            ctx.closePath();
        }

        function generateH(ctx) {
            ctx.save()
            ctx.scale(0.6, 0.8)

            ctx.beginPath();
            ctx.moveTo(-40, -40);
            ctx.lineTo(-40, 40);
            ctx.lineTo(-10, 40)
            ctx.lineTo(-10, 10)
            ctx.lineTo(10, 10)
            ctx.lineTo(10, 40)
            ctx.lineTo(40, 40)
            ctx.lineTo(40, -40)
            ctx.lineTo(10, -40)
            ctx.lineTo(10, -15)
            ctx.lineTo(-10, -15)
            ctx.lineTo(-10, -40)
            ctx.lineTo(-40, -40)

            ctx.restore()
        }

        function generateHexagon(ctx) {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const x = 35 * Math.cos(angle);
                const y = 35 * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
        }

        function generateQuestionMark(ctx) {
            ctx.beginPath();
            ctx.arc(0, -15, 25, -Math.PI * 0.8, Math.PI * 0.1, false);
            ctx.lineTo(5, 15);
            ctx.moveTo(0, 30);
            ctx.arc(0, 30, 3, 0, Math.PI * 2);
        }

        function generateChevronLeft(ctx) {
            ctx.save()
            ctx.scale(0.8, 0.8)

            ctx.beginPath();
            ctx.moveTo(30, 0);
            ctx.lineTo(-40, -50);
            ctx.lineTo(-40, -20);
            ctx.lineTo(-10, 0)
            ctx.lineTo(-40, 20)
            ctx.lineTo(-40, 50);
            ctx.closePath();

            ctx.restore()
        }

        function generatePlane(ctx) {
            ctx.save()
            ctx.scale(0.8, 0.8)

            ctx.beginPath();
            ctx.moveTo(-30, -30);
            ctx.lineTo(40, -20);
            ctx.lineTo(50, 0);
            ctx.lineTo(40, 20);
            ctx.lineTo(10, 10);
            ctx.lineTo(20, 40);
            ctx.lineTo(0, 50);
            ctx.lineTo(-20, 40);
            ctx.closePath();

            ctx.restore()
        }

        function generateReturnArrow(ctx) {
            ctx.save()
            ctx.scale(0.6, 0.6)

            ctx.beginPath();
            ctx.moveTo(-60, -50);
            ctx.lineTo(50, -50)
            ctx.lineTo(70, -30)
            ctx.lineTo(70, 30)
            ctx.lineTo(50, 50)
            ctx.lineTo(-60, 50)
            ctx.lineTo(-60, 20)
            ctx.lineTo(20, 20)
            ctx.lineTo(40, 0)
            ctx.lineTo(20, -20)
            ctx.lineTo(-60, -20)
            ctx.closePath();

            ctx.restore()
        }

        function generateHeart(ctx) {
            const x = 0;
            const y = -40;
            const width = 80;
            const height = 90;

            ctx.save();
            ctx.beginPath();

            const topCurveHeight = height * 0.3;
            ctx.moveTo(x, y + topCurveHeight);

            // top left curve
            ctx.bezierCurveTo(
                x, y,
                x - width / 2, y,
                x - width / 2, y + topCurveHeight
            );

            // bottom left curve
            ctx.bezierCurveTo(
                x - width / 2, y + (height + topCurveHeight) / 2,
                x, y + (height + topCurveHeight) / 2,
                x, y + height
            );

            // bottom right curve
            ctx.bezierCurveTo(
                x, y + (height + topCurveHeight) / 2,
                x + width / 2, y + (height + topCurveHeight) / 2,
                x + width / 2, y + topCurveHeight
            );

            // top right curve
            ctx.bezierCurveTo(
                x + width / 2, y,
                x, y,
                x, y + topCurveHeight
            );

            ctx.closePath();
            ctx.restore();
        }

        function generateS(ctx) {
            const rand = Math.random() < 0.5

            ctx.save()
            ctx.scale(0.8, 0.8)

            ctx.beginPath();
            ctx.moveTo(-50, 40);
            ctx.lineTo(20, 40)
            ctx.lineTo(20, 10)
            ctx.lineTo(rand ? 90 : 60, 10)
            ctx.lineTo(rand ? 90 : 60, -20)
            ctx.lineTo(-10, -20)
            ctx.lineTo(-10, 10)
            ctx.lineTo(-50, 10)
            ctx.closePath();

            ctx.restore()
        }

        function generateL(ctx) {
            ctx.save()
            ctx.scale(0.8, 0.8)

            ctx.beginPath();
            ctx.moveTo(-40, 40);
            ctx.lineTo(20, 40)
            ctx.lineTo(20, 10)
            ctx.lineTo(-10, 10)
            ctx.lineTo(-10, -40)
            ctx.lineTo(-40, -40)
            ctx.closePath();

            ctx.restore()
        }

        function generateT(ctx) {
            ctx.save()
            ctx.scale(0.6, 0.8)

            ctx.beginPath();
            ctx.moveTo(-60, 40);
            ctx.lineTo(60, 40)
            ctx.lineTo(60, 10)
            ctx.lineTo(20, 10)
            ctx.lineTo(20, -20)
            ctx.lineTo(-20, -20)
            ctx.lineTo(-20, 10)
            ctx.lineTo(-60, 10)
            ctx.closePath()

            ctx.restore()
        }

        function drawQuestions() {
            // Randomly select 5 shapes from shapeGenerators
            shapes.value = [...shapeGenerators].sort(() => Math.random() - 0.5).slice(0, 5);
            correctShapeIndex.value = Math.floor(Math.random() * shapes.value.length);

            const randomAngle = ANGLES[Math.floor(Math.random() * ANGLES.length)];

            drawInButtons(randomAngle);
            drawInCenter(randomAngle);

            startQuestionCountdown()
        }

        function initConfig() {
            const scheduleData = JSON.parse(localStorage.getItem('scheduleData'))
            const configShapeRecognition = scheduleData.tests.find((t) => t.testUrl === "shape-recognition-test")
            const { size, variation, id, duration, time_per_question } = configShapeRecognition.config

            config.value = {
                duration: duration * 60,
                size,
                variation,
                userId: scheduleData.userId,
                sessionId: scheduleData.sessionId,
                testId: id,
                timePerQuestion: time_per_question
            }
            quizMetrics.value.unanswered = 30 // still hardcode
            quizMetrics.value.totalQuestion = 30 // still hardcode
        }

        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainderSeconds = seconds % 60;
            return `${minutes}:${remainderSeconds < 10 ? '0' : ''}${remainderSeconds}`;
        }

        async function submitResult() {
            try {
                loading.value = true;
                const API_URL = process.env.VUE_APP_API_URL;
                const payload = {
                    testSessionId: config.value.sessionId,
                    userId: config.value.userId,
                    batteryTestConfigId: config.value.testId,
                    result: quizMetrics.value
                }
                const response = await fetch(`${API_URL}api/submission`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }
                removeTestByNameAndUpdateLocalStorage('Shape Recognition')
                router.push('/module');
            } catch (error) {
                console.log("error submit shape recognition:", error)
            } finally {
                loading.value = false; // Set loading to false when the submission is complete
            }
        }

        function countDownTestTime() {
            if (tesInterval.value) {
                clearInterval(tesInterval.value);
            }

            tesInterval.value = setInterval(async () => {
                if (config.value.duration > 0) {
                    config.value.duration--;
                } else {
                    clearInterval(tesInterval.value);
                    await submitResult();
                }
            }, 1000)
        }

        function startQuestionCountdown() {
            // Clear any existing interval to avoid multiple intervals running simultaneously
            if (questionCountDownInterval.value) {
                clearInterval(questionCountDownInterval.value);
            }

            questionCountdown.value = config.value.timePerQuestion;
            questionCountDownInterval.value = setInterval(() => {
                if (questionCountdown.value > 0) {
                    questionCountdown.value--;
                } else {
                    clearInterval(questionCountDownInterval);
                    drawQuestions();
                }
            }, 1000);
        }

        onMounted(() => {
            nextTick(() => {
                initConfig()
                countDownTestTime()
                drawQuestions();
            });
        });

        onUnmounted(() => {
            clearInterval(questionCountDownInterval.value);
            clearInterval(tesInterval.value)
        })

        watch(buttonCanvases, () => {
            drawQuestions();
        }, { deep: true });

        return {
            shapes,
            shapeCanvas,
            buttonCanvases,
            checkAnswer,
            drawQuestions,
            formatTime,
            quizMetrics,
            config,
            answerCount,
            questionCountdown,
            loading
        };
    }
}
</script>

<style scoped>
.shapeContainer {
    width: 100%;
    height: 100%;
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
    /* Add space for the settings panel */

}

#shapeCanvas {
    border: 1px solid black;
    margin-top: 8%;
}

.buttonContainer {
    width: 80%;
    margin: 60px auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.buttonGroup {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

/* .buttonGroup canvas {
    border: 1px solid black;
} */

.buttonGroup button {
    margin-top: 10px;
    width: 60px;
    height: 30px;
    cursor: pointer;
}

.settings {
    position: fixed;
    width: 15%;
    height: 100vh;
    background-color: #f0f0f0;
    top: 0;
    left: 0;
    padding: 20px;
    box-sizing: border-box;
}

.settings button {
    width: 100%;
    padding: 10px;
    margin-top: 20px;
    cursor: pointer;
}

.timer {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    margin: 0 auto;
    font-size: 24px;
    font-weight: bold;
    width: 300px;
    height: 60px;
    background-color: #6757dc;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
}

.timer p {
    margin: 0;
    padding: 0;
}

.timer :nth-child(1) {
    font-size: 12px;
}

.timer :nth-child(2) {
    font-size: 24px;
    margin-top: 4px
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.spinner {
    width: 80px;
    height: 80px;
    border: 12px solid #5b4ac4;
    border-top-color: #cecece;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}


.loadingContainer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.loadingContainer p {
    margin-top: 50px;
    font-size: 24px;
}
</style>