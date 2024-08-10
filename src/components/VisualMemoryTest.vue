<template>
    <div class="visual-container">
        <canvas ref="visualCanvas" :width="canvasDimensions.width" :height="canvasDimensions.height"></canvas>
        <div class="timer">
            <p>Waktu:</p>
            <p>{{ formatTime(testTime) }}</p>
        </div>
        <input v-if="input.input1.visible" :style="input.input1.style" v-model="input.input1.userInput" ref="input1">
        <input v-if="input.input2.visible" :style="input.input2.style" v-model="input.input2.userInput" ref="input2">
        <div v-if="loading" class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">Your result is submitting</div>
        </div>
    </div>
</template>

<script>
import { removeTestByNameAndUpdateLocalStorage } from '@/utils/index'

export default {
    data() {
        return {
            canvasWidth: 0,
            canvasHeight: 0,
            canvasRect: null,
            timerConfig: {
                timerPosition: { top: '20px', left: `${this.canvasWidth / 2}px` },
            },
            loading: false,
            memoryTime: 0,
            testTime: 0,
            renderInput: 0,
            input: {
                input1: {
                    visible: false,
                    style: {
                        position: 'absolute',
                        top: '0px',
                        left: '0px',
                        width: '0px',
                        height: '0px',
                    },
                    userInput: ''
                },
                input2: {
                    visible: false,
                    style: {
                        position: 'absolute',
                        top: '0px',
                        left: '0px',
                        width: '0px',
                        height: '0px',
                    },
                    userInput: ''
                }
            },
            // this config is use to render the question
            innerConfig: [],
            questions: [],
            questionMarkPositions: [],
            canAnswer: false,
            result: {
                noOfQuestionDisplayed: 1,
                unansweredQuestion: 0,
                correctAnswer: 0,
            },
            configBe: {
                duration: 5,
                display: {
                    alphanumeric: true,
                    shape: true
                },
                questionInterval: 30,
                testId: '',
                moduleId: '',
                sessionId: '',
                userId: ''
            },
            timerInterval: null,
            tesInterval: null
        };
    },
    mounted() {
        this.updateCanvasDimensions();
        window.addEventListener('resize', this.handleResize);
        this.initializeTest()
        document.addEventListener('keydown', this.handleGlobalKeydown);
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this.handleGlobalKeydown);
        window.removeEventListener('resize', this.handleResize);
        clearInterval(this.tesInterval)
        clearInterval(this.timerInterval)
    },
    methods: {
        initVisual() {
            const canvas = this.$refs.visualCanvas;
            this.ctx = canvas.getContext("2d");
        },
        initializeTest() {
            this.createRandomQuestion();
            this.initConfig()
            this.initVisual();
            this.drawVisual();
            this.countDownMemoryTime();
            this.countDownTestTime();
        },
        initConfig() {
            const scheduleData = JSON.parse(localStorage.getItem('scheduleData'))
            const config = scheduleData.tests.find((t) => t.name === 'Visual Memory Test').config
            const { id, display, duration, interval } = config

            this.configBe = {
                duration: duration * 60,
                questionInterval: interval,
                testId: id,
                sessionId: scheduleData.sessionId,
                userId: scheduleData.userId,
                display: {
                    alphanumeric: display ? display.alphanumeric : true,
                    shape: display ? display.shape : true
                },
            }

            this.testTime = duration * 60
            this.memoryTime = interval
        },
        updateCanvasDimensions() {
            this.canvasWidth = this.canvasDimensions.width;
            this.canvasHeight = this.canvasDimensions.height;
            this.updateCanvasRect();
        },
        drawVisual() {
            this.clearCanvas();
            this.drawVerticalLines();
            this.drawHorizontalLine();
            this.drawInnerBox();
        },
        clearCanvas() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        },
        drawVerticalLines() {
            const ctx = this.ctx;
            const lines = [
                { position: this.canvasWidth * 3 / 10, width: 1 },
                { position: this.canvasWidth / 2, width: 8 },
                { position: this.canvasWidth * 8 / 10, width: 1 },
            ];
            lines.forEach(line => {
                ctx.beginPath();
                ctx.lineWidth = line.width;
                ctx.moveTo(line.position, 0);
                ctx.lineTo(line.position, this.canvasHeight);
                ctx.stroke();
            });
        },
        drawHorizontalLine() {
            const ctx = this.ctx;
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.moveTo(0, this.canvasHeight / 2);
            ctx.lineTo(this.canvasWidth, this.canvasHeight / 2);
            ctx.stroke();
        },
        calculatePositions() {
            const { canvasWidth, canvasHeight } = this;
            const firstLine = canvasWidth * 3 / 10;
            const middleLine = canvasWidth / 2;
            const lastLine = canvasWidth * 8 / 10;
            return [
                { x: firstLine / 2, y: canvasHeight / 4 },
                { x: (firstLine + middleLine) / 2, y: canvasHeight / 4 },
                { x: (middleLine + lastLine) / 2, y: canvasHeight / 4 },
                { x: (lastLine + canvasWidth) / 2, y: canvasHeight / 4 },
                { x: firstLine / 2, y: canvasHeight * 3 / 4 },
                { x: (firstLine + middleLine) / 2, y: canvasHeight * 3 / 4 },
                { x: middleLine + (lastLine - middleLine) / 2, y: canvasHeight * 3 / 4 },
                { x: (lastLine + canvasWidth) / 2, y: canvasHeight * 3 / 4 },
            ];
        },
        drawInnerBox() {
            const ctx = this.ctx;
            const positions = this.calculatePositions();
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            this.innerConfig.forEach((item, i) => {
                const pos = positions[i];
                if (item.type === 'text' || item.type === 'number') {
                    this.drawText({ ctx, text: item.text, x: pos.x, y: pos.y, bold: item.type === 'text' });
                } else if (item.type === 'shape') {
                    switch (item.shapeName) {
                        case 'rectangle':
                            this.drawRectangle({ ctx, shape: item, x: pos.x, y: pos.y });
                            break;
                        case 'questionMark':
                            this.drawQuestionMark({ ctx, x: pos.x, y: pos.y });
                            break;
                        case 'circle':
                            this.drawCircle({ ctx, shape: item, x: pos.x, y: pos.y });
                            break;
                        case 'triangle':
                            this.drawTriangle({ ctx, shape: item, x: pos.x, y: pos.y });
                            break;
                        case 'arrow':
                            this.drawArrow({ ctx, shape: item, x: pos.x, y: pos.y });
                            break;
                    }
                }
            });
        },
        drawText({ ctx, text, x, y, bold = false }) {
            ctx.font = bold ? 'bold 50px Arial' : '50px Arial';
            ctx.fillStyle = "black";
            ctx.fillText(text, x, y);
        },
        drawRectangle({ ctx, shape, x, y }) {
            ctx.fillStyle = shape.color;
            ctx.fillRect(x - shape.width / 2, y - shape.height / 2, shape.width, shape.height);
        },
        drawQuestionMark({ ctx, x, y }) {
            ctx.fillStyle = "black";
            ctx.font = 'bold 100px Arial';
            ctx.fillText('?', x, y);
        },
        drawCircle({ ctx, shape, x, y }) {
            ctx.fillStyle = shape.color;
            ctx.beginPath();
            ctx.arc(x, y, shape.width / 2, 0, Math.PI * 2);
            ctx.fill();
        },
        drawTriangle({ ctx, shape, x, y }) {
            ctx.fillStyle = shape.color;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(shape.angle * Math.PI / 180);
            ctx.beginPath();
            ctx.moveTo(0, -shape.height / 2);
            ctx.lineTo(-shape.width / 2, shape.height / 2);
            ctx.lineTo(shape.width / 2, shape.height / 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        },
        drawArrow({ ctx, shape, x, y }) {
            ctx.fillStyle = shape.color;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(shape.angle * Math.PI / 180);
            ctx.beginPath();
            ctx.moveTo(0, -shape.height / 2);
            ctx.lineTo(-shape.width / 2, shape.height / 2);
            ctx.lineTo(0, shape.height / 4);
            ctx.lineTo(shape.width / 2, shape.height / 2);
            ctx.lineTo(0, -shape.height / 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        },
        calculateInputPositions() {
            if (!this.canvasRect) {
                return null;
            }

            const canvasTop = this.canvasRect.top;
            const canvasLeft = this.canvasRect.left;
            const inputWidth = 100;
            const verticalOffset = 40;

            const positions = this.calculatePositions();

            return {
                input1: {
                    top: positions[this.questionMarkPositions[0]].y + canvasTop + verticalOffset,
                    left: positions[this.questionMarkPositions[0]].x + canvasLeft - inputWidth / 2
                },
                input2: {
                    top: positions[this.questionMarkPositions[1]].y + canvasTop + verticalOffset,
                    left: positions[this.questionMarkPositions[1]].x + canvasLeft - inputWidth / 2
                }
            };
        },
        drawInput({ input, inputType }) {
            const positions = this.calculateInputPositions();
            if (!positions) {
                return;
            }

            const position = positions[inputType];

            input.style.position = 'fixed';
            input.style.top = `${position.top}px`;
            input.style.left = `${position.left}px`;
            input.style.width = `100px`;
            input.style.height = `20px`;
            input.visible = true;
        },
        countDownTestTime() {
            this.tesInterval = setInterval(async () => {
                if (this.testTime > 0) {
                    this.testTime--;
                    this.drawVisual()
                } else {
                    clearInterval(this.tesInterval);
                    await this.submitResult();

                }
            }, 1000)
        },
        countDownMemoryTime() {
            this.timerInterval = setInterval(() => {
                if (this.memoryTime > 0) {
                    this.memoryTime--;
                    this.drawVisual()
                } else {
                    clearInterval(this.timerInterval);

                    while (this.questionMarkPositions.length < 2) {
                        const randomIndex = Math.floor(Math.random() * 8);
                        if (this.innerConfig[randomIndex].type === 'text' || this.innerConfig[randomIndex].type === 'number') {
                            this.innerConfig[randomIndex] = { type: 'shape', shapeName: 'questionMark' }
                            this.questionMarkPositions.push(randomIndex);
                        }

                    }
                    this.canAnswer = true
                    this.drawVisual()
                }
            }, 1000);
        },
        formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainderSeconds = seconds % 60;
            return `${minutes}:${remainderSeconds < 10 ? '0' : ''}${remainderSeconds}`;
        },
        handleGlobalKeydown(event) {
            if (this.memoryTime === 0 && this.canAnswer) {
                if (event.key === 'Enter') {
                    const input1 = this.input.input1
                    const input2 = this.input.input2

                    if (this.renderInput === 0) {
                        this.renderInput = 1

                        this.drawInput({ input: this.input.input1, inputType: 'input1' });

                        this.$nextTick(() => {
                            if (this.$refs.input1) {
                                this.$refs.input1.focus();
                            }
                        });
                    } else if (this.renderInput === 1) {
                        this.renderInput = 2

                        this.drawInput({ input: this.input.input2, inputType: 'input2' });

                        this.$nextTick(() => {
                            if (this.$refs.input2) {
                                this.$refs.input2.focus();
                            }
                        });

                    } else if (this.renderInput === 2) {

                        let resultQuestion1 = false;
                        let resultQuestion2 = false

                        // check if the answer is empty
                        if (input1.userInput === '' && input2.userInput === '') {
                            this.result.unansweredQuestion += 1
                        }

                        // check if answer is correct
                        if (this.questions[3].type === 'number') {
                            if (Number(input1.userInput) === this.questions[3].text) {
                                resultQuestion1 = true
                            }
                        } else if (this.questions[3].type === 'text') {
                            if (input1.userInput.toUpperCase() === this.questions[3].text) {
                                resultQuestion1 = true
                            }
                        }

                        if (this.questions[7].type === 'number') {
                            if (Number(input2.userInput) === this.questions[7].text) {
                                resultQuestion2 = true
                            }
                        } else if (this.questions[7].type === 'text') {
                            if (input2.userInput.toUpperCase() === this.questions[7].text) {
                                resultQuestion2 = true
                            }
                        }

                        if (resultQuestion1 && resultQuestion2) {
                            this.result.correctAnswer += 1
                        }

                        this.renderInput = 0
                        input1.visible = false
                        input2.visible = false
                        input1.userInput = ''
                        input2.userInput = ''
                        resultQuestion1 = false
                        resultQuestion2 = false
                        this.questionMarkPositions = []

                        if (this.testTime > 0) {
                            this.result.noOfQuestionDisplayed += 1
                            this.createRandomQuestion()
                            this.canAnswer = false
                            this.memoryTime = this.configBe.questionInterval
                            this.drawVisual()
                            this.countDownMemoryTime()
                        }

                    }

                }
            }
        },
        createRandomQuestion() {
            const { display } = this.configBe
            const arrQuestion = []
            let textOrNumberCount = 0

            for (let i = 0; i < 8; i++) {
                if (display.alphanumeric && display.shape) {
                    if (Math.random() < 0.5 || textOrNumberCount < 2) {
                        if (Math.random() < 0.5) {
                            const number = this.generateRandomNumbers()
                            arrQuestion.push(number)
                        } else {
                            const text = this.generateRandomLetters()
                            arrQuestion.push(text);
                        }
                        textOrNumberCount++
                    } else {
                        const shape = this.getRandomShape();
                        arrQuestion.push(shape);
                    }
                } else if (display.alphanumeric) {
                    if (Math.random() < 0.5) {
                        const number = this.generateRandomNumbers();
                        arrQuestion.push(number);
                    } else {
                        const text = this.generateRandomLetters()
                        arrQuestion.push(text);
                    }
                    textOrNumberCount++;
                } else if (display.shape) {
                    const shape = this.getRandomShape();
                    arrQuestion.push(shape);
                }
            }

            // Ensure at least 2 text or number elements
            while (textOrNumberCount < 2) {
                const randomIndex = Math.floor(Math.random() * 8);
                if (arrQuestion[randomIndex].type === 'shape') {
                    if (Math.random() < 0.5) {
                        arrQuestion[randomIndex] = this.generateRandomNumbers();
                    } else {
                        arrQuestion[randomIndex] = this.generateRandomLetters();
                    }
                    textOrNumberCount++;
                }
            }

            this.innerConfig = JSON.parse(JSON.stringify(arrQuestion));
            this.questions = JSON.parse(JSON.stringify(arrQuestion));
        },
        generateRandomLetters() {
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            let result = '';
            for (let i = 0; i < 2; i++) {
                result += letters.charAt(Math.floor(Math.random() * letters.length));
            }

            return { type: 'text', text: result }
        },
        generateRandomNumbers() {
            const number = Math.floor(Math.random() * 90) + 10; // Generates a number between 10 and 99
            return { type: 'number', text: number }
        },
        getRandomShape() {
            const shapes = ['triangle', 'rectangle', 'arrow', 'circle'];
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            const commonAttributes = { type: 'shape', shapeName: shape, color: this.getRandomColor() };

            const isSquare = Math.random() < 0.5;
            switch (shape) {
                case 'triangle':
                    return { ...commonAttributes, width: 80, height: 80, angle: this.getRandomAngle() };
                case 'rectangle':
                    return { ...commonAttributes, width: isSquare ? 100 : 130, height: isSquare ? 100 : 50 };
                case 'arrow':
                    return { ...commonAttributes, width: 60, height: 80, angle: this.getRandomAngle() };
                case 'circle':
                    return { ...commonAttributes, width: 70 };
                default:
                    throw new Error('Unknown shape type');
            }
        },
        getRandomColor() {
            const colors = ['blue', 'red', 'green', 'yellow'];
            return colors[Math.floor(Math.random() * colors.length)];
        },
        getRandomAngle() {
            return Math.floor(Math.random() * 361); // Generates a random angle between 0 and 360 (inclusive)
        },
        updateCanvasRect() {
            if (this.$refs.visualCanvas) {
                this.canvasRect = this.$refs.visualCanvas.getBoundingClientRect();
            }
        },
        handleResize() {
            this.updateCanvasDimensions();
            this.drawVisual();
            if (this.input.input1.visible) {
                this.drawInput({ input: this.input.input1, inputType: 'input1' });
            }
            if (this.input.input2.visible) {
                this.drawInput({ input: this.input.input2, inputType: 'input2' });
            }
        },
        async submitResult() {
            try {
                this.loading = true;
                const API_URL = process.env.VUE_APP_API_URL;

                const payload = {
                    testSessionId: this.configBe.sessionId,
                    userId: this.configBe.userId,
                    batteryTestConfigId: this.configBe.testId,
                    result: this.result
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
                removeTestByNameAndUpdateLocalStorage('Visual Memory Test')
                this.$router.push('/module');
            } catch (error) {
                console.log(error, "<< error")
            } finally {
                this.loading = false; // Set loading to false when the submission is complete
            }
        },

    },
    computed: {
        canvasDimensions() {
            return {
                width: Math.min(1000, window.innerWidth * 0.9),
                height: Math.min(400, window.innerHeight * 0.7)
            };
        }
    },
};
</script>

<style scoped>
.visual-container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100vw;
    position: relative;
}

canvas {
    display: block;
    margin: 0 auto;
    background-color: white;
    border: 2px solid black;
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

input {
    border: 1px solid black;
    padding: 5px;
}

.loading-container {
    /* Add your loading indicator styles here */
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    /* Black background with 80% opacity */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    /* Ensure it is above other content */
}

.loading-spinner {
    border: 8px solid rgba(255, 255, 255, 0.3);
    /* Light border */
    border-top: 8px solid #ffffff;
    /* White border for the spinning part */
    border-radius: 50%;
    width: 60px;
    height: 60px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.loading-text {
    color: #ffffff;
    margin-top: 20px;
    font-size: 1.2em;
}
</style>