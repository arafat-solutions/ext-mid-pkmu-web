<template>
    <div class="circle-test">
        <canvas ref="circleCanvas"></canvas>
    </div>
</template>

<script>
export default {
    name: 'CircleTest',
    data() {
        return {

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
            const canvas = this.$refs.circleCanvas;
            const container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            this.ctx = canvas.getContext("2d");
        },
        drawVisual() {
            this.clearCanvas();
            const brown = '#b75010'
            this.drawCircle({ x: 50, y: 100, radius: 40, fillColor: 'yellow', letter: 'T' });
            this.drawCircle({ x: 140, y: 100, radius: 40, fillColor: brown, letter: 'Y' });
            this.drawCircle({ x: 230, y: 100, radius: 40, fillColor: brown, letter: 'U' });
            this.drawCircle({ x: 320, y: 100, radius: 40, fillColor: brown, letter: 'I' });
        },
        clearCanvas() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
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
    }
};
</script>

<style scoped>
canvas {
    border: none
}
</style>