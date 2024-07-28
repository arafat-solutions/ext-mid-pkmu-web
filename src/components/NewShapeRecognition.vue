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
        <p>{{ message }}</p>
    </div>
    <div class="settings">
        <button @click="drawQuestions">New Shape</button>
    </div>
</template>

<script>
import { ref, onMounted, nextTick, watch } from 'vue';

export default {
    name: 'ShapeRecognition',
    setup() {
        const shapeCanvas = ref(null);
        const buttonCanvases = ref([]);
        const message = ref('');
        const correctShapeIndex = ref(0);
        const shapes = ref([]);
        const config = ref({
            duration: 0,
            size: '',
            variasi: 0,
            userId: '',
            sessionId: '',
            testId: ''
        })
        const quizMetrics = ref({
            correctAnswer: 0,
            wrongAnswer: 0,
            unanswered: 0,
            totalQuestion: 30,
            avgResponseTime: 0 //in seconds
        })

        const STROKE_WIDTH = 2;

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

        console.log(
            generateS,
            generateT,
            generateTriangle,
            generateSquare,
            generateCircle,
            generateOctagon,
            generateStar,
            generateParallelogram,
            generateLeftArrow,
            generateH,
            generateL,
            generatePlane,
            generateHexagon,
            generateQuestionMark,
            generateChevronLeft,
            generateReturnArrow,
            generateHeart,
        )

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

        function checkAnswer(index) {
            message.value = index === correctShapeIndex.value ? "BETUL GAN." : "SALAH.";
            if (index === correctShapeIndex.value) {
                quizMetrics.value.correctAnswer++
            } else {
                quizMetrics.value.wrongAnswer++
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

        function drawRandomizedShapes(ctx, randomAngle) {
            const canvasWidth = shapeCanvas.value.width;
            const canvasHeight = shapeCanvas.value.height;
            const numShapes = 80; // Increased number of shapes

            // Draw the correct shape first
            ctx.save();
            const correctX = Math.random() * (canvasWidth - 100) + 50;
            const correctY = Math.random() * (canvasHeight - 100) + 50;
            ctx.translate(correctX, correctY);
            ctx.rotate(randomAngle)
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

        function generateTriangle(ctx) {
            ctx.moveTo(0, -50);
            ctx.lineTo(43.3, 25);
            ctx.lineTo(-43.3, 25);
            ctx.closePath();
        }

        function generateSquare(ctx) {
            ctx.rect(-35, -35, 70, 70);
        }

        function generateCircle(ctx) {
            ctx.arc(0, 0, 40, 0, 2 * Math.PI);
        }

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
            message.value = ''
            // Randomly select 5 shapes from shapeGenerators
            shapes.value = [...shapeGenerators].sort(() => Math.random() - 0.5).slice(0, 5);
            correctShapeIndex.value = Math.floor(Math.random() * shapes.value.length);

            const angles = [0, Math.PI / 2, Math.PI, 2 * Math.PI];
            const randomAngle = angles[Math.floor(Math.random() * angles.length)];

            drawInButtons(randomAngle);
            drawInCenter(randomAngle);
        }

        function initConfig() {
            const scheduleData = JSON.parse(localStorage.getItem('scheduleData'))
            // const configShapeRecognition = scheduleData.tests.find((t) => t.testUrl === 'rotating-maze-test')
            // const { duration, rotation_frequency, id } = configRotatingMaze.config

            config.value = {
                duration: 10 * 10,
                size: 'medium', // still hardcode
                variasi: 5,
                userId: scheduleData.userId,
                sessionId: scheduleData.sessionId,
                testId: ''
            }
        }

        onMounted(() => {
            nextTick(() => {
                initConfig()
                drawQuestions();
            });
        });

        watch(buttonCanvases, () => {
            drawQuestions();
        }, { deep: true });

        return {
            shapes,
            shapeCanvas,
            buttonCanvases,
            checkAnswer,
            drawQuestions,
            message
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
    margin-top: 4%;
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
    width: 10%;
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
</style>