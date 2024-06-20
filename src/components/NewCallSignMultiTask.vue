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

            this.drawRectangle({ x: 120, y: 60, width: 60, height: 100, fillColor: 'blue', letter: "Q" })
            this.drawRectangle({ x: 200, y: 60, width: 60, height: 100, fillColor: 'green', letter: "W" })
            this.drawRectangle({ x: 280, y: 60, width: 60, height: 100, fillColor: 'yellow', letter: "E" })
            this.drawRectangle({ x: 360, y: 60, width: 60, height: 100, fillColor: 'red', letter: "R" })

            this.drawRectangleColorize({ x: 120, y: 400, width: 60, height: 100, fillColor: ['yellow', 'green', 'blue'], letter: "A" })
            this.drawRectangleColorize({ x: 200, y: 400, width: 60, height: 100, fillColor: ['red', 'yellow', 'blue'], letter: "S" })
            this.drawRectangleColorize({ x: 280, y: 400, width: 60, height: 100, fillColor: ['green', 'blue', 'red'], letter: "D" })
            this.drawRectangleColorize({ x: 360, y: 400, width: 60, height: 100, fillColor: ['red', 'yellow', 'green'], letter: "F" })


        },
        drawRectangle({ x, y, width, height, fillColor, letter }) {
            const ctx = this.ctx
            ctx.fillStyle = fillColor;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.fillRect(x, y, width, height);
            ctx.strokeRect(x, y, width, height);

            // Calculate text position
            const textX = x + width / 2;
            const textY = y + height + 17;

            // Set text styles
            ctx.fillStyle = 'black'; // Text color
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Draw text in the center of the rectangle
            ctx.fillText(letter, textX, textY);

            // Calculate positions for the lines at the bottom
            const lineY = y + height; // Bottom of the rectangle
            const line1X = x + (width / 6);
            const line2X = x + width / 2;
            const line3X = x + (width * 5 / 6)
            ctx.lineWidth = 3;

            // Draw lines
            ctx.beginPath();
            ctx.moveTo(line1X, lineY);
            ctx.lineTo(line1X, lineY + 40); // Line 1
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(line2X, lineY + 30);
            ctx.lineTo(line2X, lineY + 40); // Line 2
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(line3X, lineY);
            ctx.lineTo(line3X, lineY + 40); // Line 3
            ctx.stroke();
        },
        drawRectangleColorize({ x, y, width, height, fillColor, letter }) {
            const ctx = this.ctx

            const w = width / 3

            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;

            ctx.fillStyle = fillColor[0];
            ctx.fillRect(x, y, w, height);
            ctx.strokeRect(x, y, w, height);

            ctx.fillStyle = fillColor[1];
            ctx.fillRect(x + w, y, w, height);
            ctx.strokeRect(x + w, y, w, height);

            ctx.fillStyle = fillColor[2];
            ctx.fillRect(x + 2 * w, y, w, height);
            ctx.strokeRect(x + 2 * w, y, w, height);

            // Calculate text position
            const textX = x + width / 2;
            const textY = y + height + 17;

            // Set text styles
            ctx.fillStyle = 'black'; // Text color
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Draw text in the center of the rectangle
            ctx.fillText(letter, textX, textY);
        }
    },
};
</script>

<style scoped>
.container {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: crimson;
}

canvas {
    display: block;
    /* margin: auto auto; */
    background-color: white;
    /* border: none */
}
</style>