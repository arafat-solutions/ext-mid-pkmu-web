<template>
    <div class="color-test">
        <canvas ref="colorCanvas" :width="500" :height="600"></canvas>
    </div>
</template>

<script>


export default {
    name: 'ColorTest',
    props: {
        colorTankData: {
            type: Object,
            required: true
        },
        updateResults: Function
    },
    data() {
        return {
            rectangles: [
                { x: 120, y: 60, width: 60, height: 100, fillColor: 'blue', letter: "Q" },
                { x: 200, y: 60, width: 60, height: 100, fillColor: 'green', letter: "W" },
                { x: 280, y: 60, width: 60, height: 100, fillColor: 'yellow', letter: "E" },
                { x: 360, y: 60, width: 60, height: 100, fillColor: 'red', letter: "R" },
            ],
            rectanglesColorize: [
                { x: 120, y: 400, width: 60, height: 100, fillColor: ['yellow', 'green', 'blue'], letter: "A" },
                { x: 200, y: 400, width: 60, height: 100, fillColor: ['red', 'yellow', 'blue'], letter: "S" },
                { x: 280, y: 400, width: 60, height: 100, fillColor: ['green', 'blue', 'red'], letter: "D" },
                { x: 360, y: 400, width: 60, height: 100, fillColor: ['red', 'yellow', 'green'], letter: "F" },
            ],
            currentHeights: [  // Initialize the current heights for each rectangle
                [100, 100, 100],
                [100, 100, 100],
                [100, 100, 100],
                [100, 100, 100]
            ],
            decreaseInterval: 1000, // Time in ms between each decrease animation
            decreaseDuration: 1000, // Duration of each decrease animation
            minHeight: 4, // Minimum height before stopping the animation
            finishedDecreasing: [],
            colorsInProgress: [],
            selectedColor: null,
            minRefillThreshold: 25,
            animationInterval: null,
        };
    },
    mounted() {
        this.initializeTest()
        window.addEventListener('keydown', this.handleKeyPress);
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this.handleKeyPress);
        clearInterval(this.animationInterval)
    },
    methods: {
        initializeTest() {
            this.initConfig();
            this.initVisual();
            this.drawVisual();
            if (this.colorTankData.play) {
                this.startDecreaseAnimation()
            }
        },
        initVisual() {
            const canvas = this.$refs.colorCanvas;
            this.ctx = canvas.getContext("2d");
        },
        initConfig() {
            const DECREASE_SPEED = {
                slow: 8000,
                medium: 6000,
                fast: 4000
            };
            const DECREASE_INTERVAL = {
                slow: 2000,
                medium: 2000,
                fast: 2000
            }
            const { descend_speed, speed } = this.colorTankData;
            this.decreaseDuration = DECREASE_SPEED[descend_speed]
            this.decreaseInterval = DECREASE_INTERVAL[speed]
        },
        drawVisual() {
            this.clearCanvas();
            this.rectangles.forEach(rect => this.drawRectangle(rect));
            this.rectanglesColorize.forEach((rect, index) => this.drawRectangleColorize(rect, index));
        },
        clearCanvas() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        },
        drawRectangle({ x, y, width, height, fillColor, letter }) {
            const ctx = this.ctx;
            ctx.fillStyle = fillColor;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.fillRect(x, y, width, height);
            ctx.strokeRect(x, y, width, height);

            const textX = x + width / 2;
            const textY = y + height + 17;
            ctx.fillStyle = 'black';
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(letter, textX, textY);

            this.drawLine({ x, y, width, height });
            this.drawLineAskew()
            this.drawLineBottom()
        },
        drawLine({ x, y, width, height, short = true }) {
            const ctx = this.ctx;
            const lineY = y + height;
            const positions = [x + width / 6, x + width / 2, x + width * 5 / 6];

            ctx.lineWidth = 4;
            ctx.strokeStyle = '#574e4e';
            positions.forEach((pos, i) => {
                ctx.beginPath();
                ctx.moveTo(pos, i === 1 && short ? lineY + 30 : lineY);
                ctx.lineTo(pos, lineY + 40);
                ctx.stroke();
            });
        },
        drawLineAskew() {
            const ctx = this.ctx;

            const lineAskew = [
                // Q
                { x1: 130, y1: 200, x2: 170, y2: 330 },
                { x1: 150, y1: 200, x2: 250, y2: 330 },
                { x1: 170, y1: 200, x2: 310, y2: 330 },
                // W
                { x1: 210, y1: 200, x2: 150, y2: 330 },
                { x1: 230, y1: 200, x2: 290, y2: 330 },
                { x1: 250, y1: 200, x2: 410, y2: 330 },
                // E
                { x1: 290, y1: 200, x2: 130, y2: 330 },
                { x1: 310, y1: 200, x2: 230, y2: 330 },
                { x1: 330, y1: 200, x2: 390, y2: 330 },
                // R
                { x1: 370, y1: 200, x2: 210, y2: 330 },
                { x1: 390, y1: 200, x2: 330, y2: 330 },
                { x1: 410, y1: 200, x2: 370, y2: 330 },
            ]

            lineAskew.forEach(line => {
                ctx.beginPath();
                ctx.moveTo(line.x1, line.y1);
                ctx.lineTo(line.x2, line.y2);
                ctx.strokeStyle = '#574e4e';
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.stroke();
            });
        },
        drawLineBottom() {
            const ctx = this.ctx;
            const linesBelow = [
                { x: 120, y: 350, width: 60 },
                { x: 200, y: 350, width: 60 },
                { x: 280, y: 350, width: 60 },
                { x: 360, y: 350, width: 60 },
            ]

            linesBelow.forEach(line => {
                const lineY = line.y;
                const positions = [line.x + line.width / 6, line.x + line.width / 2, line.x + line.width * 5 / 6];

                ctx.lineWidth = 4;
                ctx.strokeStyle = '#574e4e';
                ctx.lineCap = 'butt'
                positions.forEach(pos => {
                    ctx.beginPath();
                    ctx.moveTo(pos, lineY);
                    ctx.lineTo(pos, lineY - 20);
                    ctx.stroke();
                });
            });


        },
        drawHorizontalLineMinimum({ x, y, width, height }) {
            const ctx = this.ctx
            const lineY = y + height - (this.minRefillThreshold / 100 * height)
            ctx.beginPath();
            ctx.moveTo(x, lineY);
            ctx.lineTo(x + width, lineY);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.stroke();
        },
        drawRectangleColorize({ x, y, width, height, fillColor, letter }, index) {
            const ctx = this.ctx;
            const w = width / 3;

            this.drawHorizontalLineMinimum({ x, y, width, height })

            const lineY = y - 20;
            const positions = [x + width / 6, x + width / 2, x + width * 5 / 6];
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#574e4e';
            positions.forEach((pos) => {
                ctx.beginPath();
                ctx.moveTo(pos, lineY);
                ctx.lineTo(pos, lineY + 20);
                ctx.stroke();
            });


            fillColor.forEach((color, colorIndex) => {
                ctx.fillStyle = this.colorTankData.colored_lower_tank ? color : 'gray';
                const currentHeight = this.currentHeights[index][colorIndex];
                ctx.fillRect(x + colorIndex * w, y + height - currentHeight, w, currentHeight);
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
                ctx.strokeRect(x + colorIndex * w, y, w, height);
            });

            const textX = x + width / 2;
            const textY = y + height + 17;
            ctx.fillStyle = 'black';
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(letter, textX, textY);

            // line minimum
            this.drawHorizontalLineMinimum({ x, y, width, height })
        },
        startDecreaseAnimation() {
            this.finishedDecreasing = Array.from({ length: 4 }, () => Array(3).fill(false));
            this.colorsInProgress = Array.from({ length: 4 }, () => Array(3).fill(false));
            this.startAnimationInterval();
        },
        startAnimationInterval() {
            this.animationInterval = setInterval(() => {
                if (this.finishedDecreasing.flat().every(Boolean)) {
                    clearInterval(this.animationInterval);
                    return;
                }

                let rectIndex;
                let colorIndex;
                let found = false;

                for (let attempts = 0; attempts < 100 && !found; attempts++) {
                    rectIndex = this.getRandomNumber(4);
                    colorIndex = this.getRandomNumber(3);

                    if (!this.colorsInProgress[rectIndex][colorIndex] &&
                        !this.finishedDecreasing[rectIndex][colorIndex] &&
                        this.currentHeights[rectIndex][colorIndex] === 100) {
                        found = true;
                    }
                }

                if (found) {
                    this.updateResults('color_tank', { total_occurrences: 1 });
                    this.startDecreaseAnimationForColor(rectIndex, colorIndex);
                }
            }, this.decreaseInterval);
        },
        restartDecreaseAnimation() {
            if (!this.finishedDecreasing.flat().every(Boolean)) {
                this.finishedDecreasing = Array.from({ length: 4 }, () => Array(3).fill(false));
                this.startAnimationInterval();
            }
        },
        getRandomNumber(max) {
            return Math.floor(Math.random() * max);
        },
        handleKeyPress(event) {
            const key = event.key.toUpperCase();
            if ('QWER'.includes(key)) {
                this.selectedColor = this.rectangles.find(rect => rect.letter === key).fillColor;
            } else if ('ASDF'.includes(key) && this.selectedColor) {

                const tankIndex = this.rectanglesColorize.findIndex(rect => rect.letter === key);
                const colorIndex = this.rectanglesColorize[tankIndex].fillColor.indexOf(this.selectedColor);

                if (colorIndex !== -1) {
                    const currentHeight = this.currentHeights[tankIndex][colorIndex];
                    const minRefillHeight = this.minRefillThreshold / 100 * 100; // Assuming 100 is the max height

                    // Check if the current height is below 100 and increase correct_button_combination
                    if (currentHeight < 100) {
                        // this.correct_button_combination++;
                        this.updateResults('color_tank', { correct_button_combination: 1 });
                    }

                    // Check if the current height is below the minimum refill line
                    if (currentHeight < minRefillHeight) {
                        this.updateResults('color_tank', { below_line_responses: 1 });
                        // this.below_line_responses++;
                    }

                    this.increaseColor(key);
                }

            }
        },
        increaseColor(tankLetter) {
            const tankIndex = this.rectanglesColorize.findIndex(rect => rect.letter === tankLetter);
            const colorIndex = this.rectanglesColorize[tankIndex].fillColor.indexOf(this.selectedColor);

            if (colorIndex !== -1) {
                if (this.colorsInProgress[tankIndex][colorIndex]) {
                    this.colorsInProgress[tankIndex][colorIndex] = false;
                }

                // Fill the color to 100%
                this.currentHeights[tankIndex][colorIndex] = 100;

                // Reset the finished state
                this.finishedDecreasing[tankIndex][colorIndex] = false;

                // Redraw the specific tank
                this.drawSpecificTank(tankIndex);

                // Restart the decrease animation if all colors were previously finished
                this.restartDecreaseAnimation();
            }
        },
        drawSpecificTank(tankIndex) {
            const rect = this.rectanglesColorize[tankIndex];
            const ctx = this.ctx;
            const w = rect.width / 3;

            ctx.clearRect(rect.x, rect.y, rect.width, rect.height);

            rect.fillColor.forEach((color, index) => {
                ctx.fillStyle = this.colorTankData.colored_lower_tank ? color : 'gray';
                const height = this.currentHeights[tankIndex][index];
                ctx.fillRect(rect.x + index * w, rect.y + rect.height - height, w, height);
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
                ctx.strokeRect(rect.x + index * w, rect.y, w, rect.height);
            });

            this.drawHorizontalLineMinimum({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
        },
        startDecreaseAnimationForColor(rectIndex, colorIndex) {

            const startHeight = this.currentHeights[rectIndex][colorIndex];
            const targetHeight = this.minHeight;
            const startTime = Date.now();

            this.colorsInProgress[rectIndex][colorIndex] = true;
            this.finishedDecreasing[rectIndex][colorIndex] = false;

            const animateDecrease = () => {
                if (!this.colorsInProgress[rectIndex][colorIndex]) {
                    return;
                }

                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / this.decreaseDuration, 1);

                if (this.currentHeights[rectIndex][colorIndex] > this.minHeight) {
                    const currentHeight = startHeight - (progress * (startHeight - targetHeight));
                    this.currentHeights[rectIndex][colorIndex] = Math.max(this.minHeight, currentHeight);

                    this.drawSpecificTank(rectIndex);

                    if (progress < 1) {
                        requestAnimationFrame(animateDecrease);
                    } else {
                        this.colorsInProgress[rectIndex][colorIndex] = false;
                        if (this.currentHeights[rectIndex][colorIndex] <= this.minHeight) {
                            this.finishedDecreasing[rectIndex][colorIndex] = true;
                        }
                    }
                } else {
                    this.colorsInProgress[rectIndex][colorIndex] = false;
                    this.finishedDecreasing[rectIndex][colorIndex] = true;
                }
            };

            animateDecrease();
        }
    }
}
</script>

<style scoped>
canvas {
    border: none
}
</style>