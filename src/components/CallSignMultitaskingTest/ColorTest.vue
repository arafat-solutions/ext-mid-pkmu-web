<template>
    <div class="color-test">
        <canvas ref="colorCanvas" :width="550" :height="550"></canvas>
    </div>
    <div class="border p-2 bg-gray-200 -mt-4 w-12">{{ finalScore }}</div>
    <VirtualKeyboard :active-keys="activeKeys" @key-press="handleKeyPress" @key-release="handleKeyRelease" />
</template>

<script>
import VirtualKeyboard from './VirtualKeyboard.vue';

export default {
    name: 'ColorTest',
    props: {
        colorTankData: {
            type: Object,
            required: true
        },
        updateResults: Function,
        finalScore: Number
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
            decreaseInterval: 30000, // Time in ms between each decrease animation
            decreaseDuration: 35000, // Duration of each decrease animation
            increaseDuration: 10000, // New property for controlling increase speed
            minHeight: 4, // Minimum height before stopping the animation
            finishedDecreasing: [],
            colorsInProgress: [],
            selectedColor: null,
            minRefillThreshold: 25,
            animationInterval: null,
            decreaseSpeedRanges: {
                slow: [10000, 9000, 8000],
                medium: [7000, 7500, 6500],
                fast: [6000, 5500, 5000]
            },
            currentDescendSpeed: 'medium',
            currentPattern: [],
            activeKeys: [],
            colorDecreaseHistory: [],
            availableColors: ['blue', 'green', 'yellow', 'red'],
        };
    },
    mounted() {
        this.initializeTest()
        window.addEventListener('keydown', this.handlePhysicalKeyPress);
        window.addEventListener('keyup', this.handlePhysicalKeyRelease);
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this.handlePhysicalKeyPress);
        window.removeEventListener('keyup', this.handlePhysicalKeyRelease);
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
            const DECREASE_INTERVAL = {
                slow: 20000,
                medium: 25000,
                fast: 20000
            }
            const { descend_speed, speed } = this.colorTankData;
            this.currentDescendSpeed = descend_speed || 'medium'; // Set default if undefined
            this.decreaseInterval = DECREASE_INTERVAL[speed] || 20000; // Set default if undefined
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
            this.colorDecreaseHistory = []; // Initialize color history
            this.startAnimationInterval();
        },
        chooseColorToDecrease() {
            if (this.colorDecreaseHistory.length < 2) {
                // First two selections are random
                const color = this.getRandomColor();
                this.colorDecreaseHistory.push(color);
                return color;
            } else {
                // Third selection must be the same as two steps ago
                const color = this.colorDecreaseHistory[0];
                this.colorDecreaseHistory.push(color);
                this.colorDecreaseHistory.shift(); // Remove the oldest color
                return color;
            }
        },
        getRandomColor() {
            const unusedColors = this.availableColors.filter(color =>
                !this.colorDecreaseHistory.includes(color)
            );
            return unusedColors.length > 0
                ? unusedColors[Math.floor(Math.random() * unusedColors.length)]
                : this.availableColors[Math.floor(Math.random() * this.availableColors.length)];
        },
        startAnimationInterval() {
            const tryDecreaseColor = () => {
                if (this.finishedDecreasing.flat().every(Boolean)) {
                    clearInterval(this.animationInterval);
                    return;
                }

                const colorToDecrease = this.chooseColorToDecrease();
                let availableTanks = this.rectanglesColorize.map((_, index) => index);
                this.shuffleArray(availableTanks);

                let found = false;
                for (const tankIndex of availableTanks) {
                    const colorIndex = this.rectanglesColorize[tankIndex].fillColor.indexOf(colorToDecrease);
                    if (colorIndex !== -1 &&
                        !this.colorsInProgress[tankIndex][colorIndex] &&
                        !this.finishedDecreasing[tankIndex][colorIndex] &&
                        this.currentHeights[tankIndex][colorIndex] > this.minHeight) {

                        found = true;
                        this.updateResults('color_tank', { total_occurrences: 1 });
                        this.startDecreaseAnimationForColor(tankIndex, colorIndex);
                        break;
                    }
                }

                if (!found) {
                    this.colorDecreaseHistory.pop();
                    // Immediately try again if no suitable color/tank was found
                    setTimeout(tryDecreaseColor, 0);
                }
            };

            this.animationInterval = setInterval(tryDecreaseColor, this.decreaseInterval);
            // Start the first decrease immediately
            tryDecreaseColor();
        },
        shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        },
        restartDecreaseAnimation() {
            if (!this.finishedDecreasing.flat().every(Boolean)) {
                this.finishedDecreasing = Array.from({ length: 4 }, () => Array(3).fill(false));
                this.colorDecreaseHistory = []; // Reset color history
                this.startAnimationInterval();
            }
        },
        getRandomNumber(max) {
            return Math.floor(Math.random() * max);
        },
        handlePhysicalKeyPress(event) {
            this.handleKeyPress(event);
        },
        handlePhysicalKeyRelease(event) {
            this.handleKeyRelease({ key: event.key });
        },
        handleKeyPress(event) {
            this.processKeyPress(event);
        },

        handleKeyRelease(event) {
            const key = event.key.toUpperCase();
            const index = this.activeKeys.indexOf(key);
            if (index > -1) {
                this.activeKeys.splice(index, 1);
            }
        },
        processKeyPress(event) {
            let key = event.key;
            if (typeof key === 'string') {
                key = key.toUpperCase();
            } else if (typeof event === 'object' && event.key && typeof event.key === 'string') {
                key = event.key.toUpperCase();
            } else {
                console.warn('Unexpected key format:', event);
                return;  // Exit the function if we can't process the key
            }

            if ('QWER'.includes(key)) {
                this.currentPattern = [key];
            } else if ('ASDF'.includes(key) && this.currentPattern.length > 0 && this.currentPattern.length < 3) {
                if (this.currentPattern.length === 1) {
                    // This is the first ASDF key
                    this.currentPattern.push(key);
                } else if (this.currentPattern.length === 2) {
                    // This is the second ASDF key, check if it corresponds to the same color as the first
                    const firstTankIndex = this.rectanglesColorize.findIndex(rect => rect.letter === this.currentPattern[1]);
                    const secondTankIndex = this.rectanglesColorize.findIndex(rect => rect.letter === key);

                    if (firstTankIndex !== -1 && secondTankIndex !== -1) {
                        const selectedColor = this.rectangles.find(rect => rect.letter === this.currentPattern[0])?.fillColor;
                        const firstColorIndex = this.rectanglesColorize[firstTankIndex].fillColor.indexOf(selectedColor);
                        const secondColorIndex = this.rectanglesColorize[secondTankIndex].fillColor.indexOf(selectedColor);

                        if (firstColorIndex !== -1 && secondColorIndex !== -1) {
                            this.currentPattern.push(key);
                        } else {
                            // Colors don't match, reset the pattern
                            this.currentPattern = [this.currentPattern[0]];
                        }
                    } else {
                        // Invalid tank keys, reset the pattern
                        this.currentPattern = [this.currentPattern[0]];
                    }
                }
            }

            if (!this.activeKeys.includes(key)) {
                this.activeKeys.push(key);
            }

            if (this.currentPattern.length === 3) {
                this.handleCompletePattern();
            }
        },

        handleCompletePattern() {
            const [colorKey, firstTankKey, secondTankKey] = this.currentPattern;
            const selectedColor = this.rectangles.find(rect => rect.letter === colorKey)?.fillColor;

            if (selectedColor) {
                const firstTankIndex = this.rectanglesColorize.findIndex(rect => rect.letter === firstTankKey);
                const secondTankIndex = this.rectanglesColorize.findIndex(rect => rect.letter === secondTankKey);

                if (firstTankIndex !== -1 && secondTankIndex !== -1) {
                    const firstColorIndex = this.rectanglesColorize[firstTankIndex].fillColor.indexOf(selectedColor);
                    const secondColorIndex = this.rectanglesColorize[secondTankIndex].fillColor.indexOf(selectedColor);

                    if (firstColorIndex !== -1 && secondColorIndex !== -1) {
                        this.startIncreaseColor(firstTankIndex, firstColorIndex);
                        this.startIncreaseColor(secondTankIndex, secondColorIndex);
                    }
                }
            }

            this.resetPatternAndKeyboard();
        },

        resetPatternAndKeyboard() {
            this.currentPattern = [];
            this.activeKeys = [];
        },
        startIncreaseColor(tankIndex, colorIndex) {
            const currentHeight = this.currentHeights[tankIndex][colorIndex];
            if (currentHeight >= 100) {
                return; // Don't increase if already at max height
            }

            // Cancel any ongoing animation for this color
            if (this.colorsInProgress[tankIndex][colorIndex]) {
                cancelAnimationFrame(this.colorsInProgress[tankIndex][colorIndex]);
            }

            const startHeight = currentHeight;
            const targetHeight = 100;
            const startTime = performance.now();

            const animateIncrease = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / this.increaseDuration, 1);

                if (progress < 1) {
                    const newHeight = startHeight + (progress * (targetHeight - startHeight));
                    this.currentHeights[tankIndex][colorIndex] = Math.min(targetHeight, newHeight);
                    this.drawSpecificTank(tankIndex);
                    this.colorsInProgress[tankIndex][colorIndex] = requestAnimationFrame(animateIncrease);
                } else {
                    this.currentHeights[tankIndex][colorIndex] = targetHeight;
                    this.colorsInProgress[tankIndex][colorIndex] = null;
                    this.finishedDecreasing[tankIndex][colorIndex] = false;
                    this.drawSpecificTank(tankIndex);
                    this.restartDecreaseAnimation();
                }
            };

            this.colorsInProgress[tankIndex][colorIndex] = requestAnimationFrame(animateIncrease);
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
            const startTime = performance.now();

            // Use this.decreaseDuration instead of a fixed value or range
            const decreaseDuration = this.decreaseDuration;

            this.colorsInProgress[rectIndex][colorIndex] = true;
            this.finishedDecreasing[rectIndex][colorIndex] = false;

            // Add a flag to track if we've decreased the score for this animation
            let hasDecreasedScore = false;

            const animateDecrease = (currentTime) => {
                if (!this.colorsInProgress[rectIndex][colorIndex]) {
                    return;
                }

                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / decreaseDuration, 1);

                if (progress < 1) {
                    const currentHeight = startHeight - (progress * (startHeight - targetHeight));
                    this.currentHeights[rectIndex][colorIndex] = Math.max(this.minHeight, currentHeight);

                    // Check if the height is below the threshold and we haven't decreased the score yet
                    if (currentHeight < this.minRefillThreshold && !hasDecreasedScore) {
                        this.updateResults('color_tank', { final_score: -1 });
                        hasDecreasedScore = true; // Set the flag to true after decreasing the score
                    }


                    this.drawSpecificTank(rectIndex);

                    this.colorsInProgress[rectIndex][colorIndex] = requestAnimationFrame(animateDecrease);
                } else {
                    this.currentHeights[rectIndex][colorIndex] = this.minHeight;
                    this.colorsInProgress[rectIndex][colorIndex] = null;
                    this.finishedDecreasing[rectIndex][colorIndex] = true;
                    this.drawSpecificTank(rectIndex);
                }
            };

            this.colorsInProgress[rectIndex][colorIndex] = requestAnimationFrame(animateDecrease);
        },
    },
    components: {
        VirtualKeyboard
    }
}
</script>

<style scoped>
canvas {
    border: none;
}
</style>