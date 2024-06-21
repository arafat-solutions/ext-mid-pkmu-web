<template>
    <div class="container">
        <canvas ref="myCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
    </div>
</template>

<script>
export default {
    data() {
        return {
            canvasWidth: 1200,
            canvasHeight: 600,
            rectangles: [
                { x: 120, y: 60, width: 60, height: 100, fillColor: 'blue', letter: "Q" },
                { x: 200, y: 60, width: 60, height: 100, fillColor: 'green', letter: "W" },
                { x: 280, y: 60, width: 60, height: 100, fillColor: 'yellow', letter: "E" },
                { x: 360, y: 60, width: 60, height: 100, fillColor: 'red', letter: "R" },
            ],
            lines: [
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
            ],
            linesBelow: [
                { x: 120, y: 350, width: 60 },
                { x: 200, y: 350, width: 60 },
                { x: 280, y: 350, width: 60 },
                { x: 360, y: 350, width: 60 },
            ],
            rectanglesColorize: [
                { x: 120, y: 400, width: 60, height: 100, fillColor: ['yellow', 'green', 'blue'], letter: "A" },
                { x: 200, y: 400, width: 60, height: 100, fillColor: ['red', 'yellow', 'blue'], letter: "S" },
                { x: 280, y: 400, width: 60, height: 100, fillColor: ['green', 'blue', 'red'], letter: "D" },
                { x: 360, y: 400, width: 60, height: 100, fillColor: ['red', 'yellow', 'green'], letter: "F" },
            ],
            horizonConfig: {
                width: 350,
                height: 350,
                x: 600, // X position of the rectangle
                y: 150, // Y position of the rectangle
                blue: '#008bd4',
                brown: '#b75010',
                borderColor: 'black',
                whiteBorderHeight: 5,
                angle: -10,
                focusY: 400,
                focusX: 700
            },
        };
    },
    mounted() {
        this.initCanvas();
        this.drawCanvas();
    },
    beforeUnmount() {
    },
    methods: {
        initCanvas() {
            const canvas = this.$refs.myCanvas;
            this.ctx = canvas.getContext("2d");
        },
        drawCanvas() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

            // Save the current context state
            ctx.save();

            this.rectangles.forEach(rect => this.drawRectangle(rect));
            this.lines.forEach(line => this.drawLineAskew({ ...line, color: 'red', lineWidth: 2 }));
            this.linesBelow.forEach(line => this.drawLine(line));
            this.rectanglesColorize.forEach(rect => this.drawRectangleColorize(rect));

            // Draw the stationary rectangle border

            this.drawCircle({ x: this.horizonConfig.x + 40, y: this.horizonConfig.y - 45, radius: 40, fillColor: 'yellow', letter: 'T' });
            this.drawCircle({ x: this.horizonConfig.x + 130, y: this.horizonConfig.y - 45, radius: 40, fillColor: this.horizonConfig.brown, letter: 'Y' });
            this.drawCircle({ x: this.horizonConfig.x + 220, y: this.horizonConfig.y - 45, radius: 40, fillColor: this.horizonConfig.brown, letter: 'U' });
            this.drawCircle({ x: this.horizonConfig.x + 310, y: this.horizonConfig.y - 45, radius: 40, fillColor: this.horizonConfig.brown, letter: 'I' });

            this.drawRectangleBorder();
            // Draw the rotating inner content
            this.drawHorizon();

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

            this.drawLineAbove({ x, y, width, height });
        },
        drawRectangleColorize({ x, y, width, height, fillColor, letter }) {
            const ctx = this.ctx;
            const w = width / 3;

            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            fillColor.forEach((color, index) => {
                ctx.fillStyle = color;
                ctx.fillRect(x + index * w, y, w, height);
                ctx.strokeRect(x + index * w, y, w, height);
            });

            const textX = x + width / 2;
            const textY = y + height + 17;
            ctx.fillStyle = 'black';
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(letter, textX, textY);

            this.drawLine({ x, y, width });
        },
        drawLineAbove({ x, y, width, height }) {
            const ctx = this.ctx;
            const lineY = y + height;
            const positions = [x + width / 6, x + width / 2, x + width * 5 / 6];

            ctx.lineWidth = 4;
            ctx.strokeStyle = '#574e4e';
            positions.forEach((pos, i) => {
                ctx.beginPath();
                ctx.moveTo(pos, i === 1 ? lineY + 30 : lineY);
                ctx.lineTo(pos, lineY + 40);
                ctx.stroke();
            });
        },
        drawLine({ x, y, width }) {
            const ctx = this.ctx;
            const lineY = y;
            const positions = [x + width / 6, x + width / 2, x + width * 5 / 6];

            ctx.lineWidth = 4;
            ctx.strokeStyle = '#574e4e';
            ctx.lineCap = 'butt'
            positions.forEach(pos => {
                ctx.beginPath();
                ctx.moveTo(pos, lineY);
                ctx.lineTo(pos, lineY - 20);
                ctx.stroke();
            });
        },
        drawLineAskew({ x1, y1, x2, y2 }) {
            const ctx = this.ctx;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = '#574e4e';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.stroke();
        },
        drawRectangleBorder() {
            const ctx = this.ctx;
            const config = this.horizonConfig;

            // Draw the black border around the entire rectangle
            ctx.strokeStyle = config.borderColor;
            ctx.lineWidth = 4;
            ctx.strokeRect(config.x, config.y, config.width, config.height);
        },
        drawHorizon() {
            const ctx = this.ctx;
            const config = this.horizonConfig;

            // Save the current context state
            ctx.save();

            // Define the clipping region
            ctx.beginPath();
            ctx.rect(config.x, config.y, config.width, config.height);
            ctx.clip();

            // Convert rotation angle from degrees to radians
            const angleInRadians = config.angle * Math.PI / 180;

            // Move to the center of the inner content
            ctx.translate(config.x + config.width / 2, config.y + config.height / 2);

            // Rotate the context
            ctx.rotate(angleInRadians);

            // Move back to the top-left corner of the inner content
            ctx.translate(-config.x - config.width / 2, -config.y - config.height / 2);

            // Draw the extended blue top half
            ctx.fillStyle = config.blue;
            ctx.fillRect(config.x - (config.width / 2), config.y - config.height / 4, config.width * 2, config.height / 2 + config.height / 4);

            // Draw the extended white border at the bottom of the blue section
            ctx.fillStyle = 'white';
            ctx.fillRect(config.x - (config.width / 2), config.y + config.height / 2 - config.whiteBorderHeight, config.width * 2, config.whiteBorderHeight + config.height / 4);

            // Draw the extended brown bottom half
            ctx.fillStyle = config.brown;
            ctx.fillRect(config.x - (config.width / 2), config.y + config.height / 2, config.width * 2, config.height / 2 + config.height / 4);

            // Restore the context to its original state
            ctx.restore();

            this.drawFocusLine()

        },
        drawFocusLine() {
            const ctx = this.ctx
            const config = this.horizonConfig;

            ctx.beginPath();
            ctx.rect(config.x, config.y, config.width, config.height);
            ctx.clip();

            // Draw horizontal yellow line
            ctx.beginPath();
            ctx.moveTo(config.x - (config.width / 2), config.focusY);
            ctx.lineTo(config.x + (config.width * 3 / 2), config.focusY);
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw vertical yellow line
            ctx.beginPath();
            ctx.moveTo(config.focusX, config.y - (config.height / 2));
            ctx.lineTo(config.focusX, config.y + (config.height * 3 / 2));
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 2;
            ctx.stroke();
        },
        drawCircle({ x, y, radius, fillColor, letter }) {
            const ctx = this.ctx;

            // Draw filled circle
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = fillColor;
            ctx.fill();

            // Draw border
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw letter in the center
            ctx.fillStyle = 'black';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(letter, x, y);
        },
    },
};
</script>

<style scoped>
.container {
    display: flex;
    align-items: center;
    justify-content: center;
}

canvas {
    display: block;
    /* margin: auto auto; */
    background-color: white;
    border: none
}
</style>