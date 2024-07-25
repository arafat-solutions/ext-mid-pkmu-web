<template>
    <div class="shapeContainer">
        <canvas id="shapeCanvas" ref="shapeCanvas" width="500" height="300"></canvas>
        <div class="buttonContainer">
            <div class="buttonGroup" v-for="(shape, index) in shapes.slice(0, 5)" :key="index"
                @click="checkAnswer(index)">
                <canvas :ref="el => buttonCanvases[index] = el" width="200" height="80"></canvas>
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

        const STROKE_WIDTH = 2;

        const shapeGenerators = [
            generateTriangle,
            generateSquare,
            generateCircle,
            generateOctagon,
            generateStar,
            generateParallelogram,
            generateLeftArrow,
            generateH,
            generateHexagon,
            generateQuestionMark
        ];

        function drawShape(ctx, shapeGenerator, canvasWidth, canvasHeight) {
            ctx.save();
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = STROKE_WIDTH;
            ctx.translate(canvasWidth / 2, canvasHeight / 2);
            const scale = Math.min(canvasWidth, canvasHeight) * 0.8;
            ctx.scale(scale / 100, scale / 100);
            ctx.beginPath();
            shapeGenerator(ctx);
            ctx.stroke();
            ctx.restore();
        }

        function checkAnswer(index) {
            message.value = index === correctShapeIndex.value ? "BETUL GAN." : "SALAH.";
        }

        function drawInButtons() {
            buttonCanvases.value.forEach((canvas, index) => {
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    drawShape(ctx, shapes.value[index], canvas.width, canvas.height);
                }
            });
        }

        function drawInCenter() {
            const ctx = shapeCanvas.value.getContext('2d');
            ctx.clearRect(0, 0, shapeCanvas.value.width, shapeCanvas.value.height);

            // Only draw randomized shapes (including the correct one)
            drawRandomizedShapes(ctx);
        }

        function drawRandomizedShapes(ctx) {
            const canvasWidth = shapeCanvas.value.width;
            const canvasHeight = shapeCanvas.value.height;
            const numShapes = 80; // Increased number of shapes

            // Draw the correct shape first
            ctx.save();
            const correctX = Math.random() * (canvasWidth - 100) + 50; // Ensure the shape stays within the canvas
            const correctY = Math.random() * (canvasHeight - 100) + 50;
            ctx.translate(correctX, correctY);
            ctx.beginPath();
            ctx.strokeStyle = 'black'; // Semi-transparent green
            ctx.lineWidth = STROKE_WIDTH;
            shapes.value[correctShapeIndex.value](ctx);
            ctx.stroke();
            ctx.restore();

            // Draw random abstract shapes
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
            ctx.beginPath();
            ctx.moveTo(-30, -40);
            ctx.lineTo(-30, 40);
            ctx.lineTo(-20, 40)
            ctx.lineTo(-20, 10)
            ctx.lineTo(20, 10)
            ctx.lineTo(20, 40)
            ctx.lineTo(30, 40)
            ctx.lineTo(30, -40)
            ctx.lineTo(20, -40)
            ctx.lineTo(20, 0)
            ctx.lineTo(-20, 0)
            ctx.lineTo(-20, -40)
            ctx.lineTo(-30, -40)
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

        function drawQuestions() {
            message.value = ''
            // Randomly select 5 shapes from shapeGenerators
            shapes.value = [...shapeGenerators].sort(() => Math.random() - 0.5).slice(0, 5);
            correctShapeIndex.value = Math.floor(Math.random() * shapes.value.length);
            drawInButtons();
            drawInCenter();
        }

        onMounted(() => {
            nextTick(() => {
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
    text-align: center;
    position: relative;
    padding-left: 12%;
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