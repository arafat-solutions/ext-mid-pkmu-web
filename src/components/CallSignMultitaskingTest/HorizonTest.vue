<template>
    <div class="horizon-test">
        <canvas ref="horizonCanvas"></canvas>
    </div>
</template>

<script>
export default {
    name: 'HorizonTest',
    data() {
        return {
            config: {
                width: 350,
                height: 350,
                x: 10, // X position of the rectangle
                y: 5, // Y position of the rectangle
                blue: '#008bd4',
                brown: '#b75010',
                borderColor: 'black',
                whiteBorderHeight: 5,
                angle: 0,
                focusY: 300,
                focusX: 100
            },
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
        },
        initVisual() {
            const canvas = this.$refs.horizonCanvas;
            const container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = 400;
            this.ctx = canvas.getContext("2d");
        },
        drawVisual() {
            this.clearCanvas();
            this.drawRectangleBorder();
            // Draw the rotating inner content
            this.drawHorizon();
        },
        clearCanvas() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        },
        drawRectangleBorder() {
            const ctx = this.ctx;
            const config = this.config;

            // Draw the black border around the entire rectangle
            ctx.strokeStyle = config.borderColor;
            ctx.lineWidth = 6;
            ctx.strokeRect(config.x, config.y, config.width, config.height);
        },
        drawHorizon() {
            const ctx = this.ctx;
            const config = this.config;

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
            const config = this.config;

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
    }
};
</script>

<style scoped>
canvas {
    border: none;
    margin-top: -10px;
}
</style>
