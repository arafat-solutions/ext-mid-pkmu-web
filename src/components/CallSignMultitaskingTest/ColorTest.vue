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
        }
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
            userAnswer: '',
            currentHeights: [  // Initialize the current heights for each rectangle
                [100, 100, 100],
                [100, 100, 100],
                [100, 100, 100],
                [100, 100, 100]
            ],
            decreaseInterval: 1000, // Time in ms between each decrease animation
            decreaseDuration: 3000, // Duration of each decrease animation
            minHeight: 4, // Minimum height before stopping the animation
            finishedDecreasing: [],
        };
    },
    mounted() {
        this.initializeTest()
    },
    beforeUnmount() {
    },
    methods: {
        initializeTest() {
            this.initVisual();
            this.drawVisual();
            this.startDecreaseAnimation()
        },
        initVisual() {
            const canvas = this.$refs.colorCanvas;
            this.ctx = canvas.getContext("2d");
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
            const lineY = y + (3 * height / 4);
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
                ctx.fillStyle = color;
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

            const animate = () => {
                if (this.finishedDecreasing.flat().every(Boolean)) {
                    clearInterval(animationInterval);
                    return;
                }

                let rectIndex;
                let colorIndex;

                // Find a rectangle and color that is not currently in progress and not finished
                let attempts = 0;
                do {
                    rectIndex = this.getRandomNumber(4);
                    colorIndex = this.getRandomNumber(3);
                    attempts++;
                    if (attempts > 100) {
                        console.warn('Could not find a non-finished and non-in-progress rectangle and color');
                        return;
                    }
                } while (this.colorsInProgress[rectIndex][colorIndex] || this.finishedDecreasing[rectIndex][colorIndex]);

                const startHeight = this.currentHeights[rectIndex][colorIndex];
                const targetHeight = this.minHeight;
                const startTime = Date.now();

                this.colorsInProgress[rectIndex][colorIndex] = true;

                const animateDecrease = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / this.decreaseDuration, 1);

                    if (startHeight > this.minHeight) {
                        const currentHeight = startHeight - (progress * (startHeight - targetHeight));
                        this.currentHeights[rectIndex][colorIndex] = currentHeight;

                        // Redraw only the affected rectangle
                        const rectToAnimate = this.rectanglesColorize[rectIndex];
                        const ctx = this.ctx;
                        const w = rectToAnimate.width / 3;
                        ctx.clearRect(rectToAnimate.x, rectToAnimate.y, rectToAnimate.width, rectToAnimate.height);

                        rectToAnimate.fillColor.forEach((color, index) => {
                            ctx.fillStyle = color;
                            const height = this.currentHeights[rectIndex][index];
                            ctx.fillRect(rectToAnimate.x + index * w, rectToAnimate.y + rectToAnimate.height - height, w, height);
                            ctx.strokeStyle = 'black';
                            ctx.lineWidth = 2;
                            ctx.strokeRect(rectToAnimate.x + index * w, rectToAnimate.y, w, rectToAnimate.height);
                        });

                        this.drawLetterAndLine(rectToAnimate);

                        if (progress < 1) {
                            requestAnimationFrame(animateDecrease);
                        } else {
                            this.finishedDecreasing[rectIndex][colorIndex] = true;
                            this.colorsInProgress[rectIndex][colorIndex] = false;
                        }
                    } else {
                        this.finishedDecreasing[rectIndex][colorIndex] = true;
                        this.colorsInProgress[rectIndex][colorIndex] = false;
                    }
                };

                animateDecrease();
            };

            const animationInterval = setInterval(animate, this.decreaseInterval);
        },
        drawLetterAndLine(rect) {
            const ctx = this.ctx;
            const textX = rect.x + rect.width / 2;
            const textY = rect.y + rect.height + 17;
            ctx.fillStyle = 'black';
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(rect.letter, textX, textY);

            this.drawHorizontalLineMinimum({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
        },
        getRandomNumber(max) {
            return Math.floor(Math.random() * max);
        },
    }
}
</script>

<style scoped>
canvas {
    border: none
}
</style>