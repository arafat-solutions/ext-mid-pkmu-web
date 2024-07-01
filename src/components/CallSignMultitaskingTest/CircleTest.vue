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
            circleConfig: [
                { x: 50, y: 100, radius: 40, fillColor: '#b75010', letter: 'T' },
                { x: 140, y: 100, radius: 40, fillColor: '#b75010', letter: 'Y' },
                { x: 230, y: 100, radius: 40, fillColor: '#b75010', letter: 'U' },
                { x: 320, y: 100, radius: 40, fillColor: '#b75010', letter: 'I' }
            ],
            indexLight: 0,
            timerInterval: null,
            alternateChange: false
        };
    },
    mounted() {
        this.initializeTest()
    },
    beforeUnmount() {
        clearInterval(this.timerInterval);
    },
    methods: {
        initializeTest() {
            this.initVisual();
            this.drawVisual();
            this.changeTheLightPosition()
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
            this.circleConfig.forEach((circle, i) => {
                const c = { ...circle, fillColor: i === this.indexLight ? 'yellow' : circle.fillColor }
                this.drawCircle(c)
            })
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
        getRandomNumber() {
            return Math.floor(Math.random() * 4);
        },
        changeTheLightPosition() {
            this.timerInterval = setInterval(() => {
                if (this.alternateChange) {
                    this.indexLight = 5;
                } else {
                    this.indexLight = this.getRandomNumber();
                }
                this.drawVisual();
                this.alternateChange = !this.alternateChange;
            }, 1000);
        },
        stopChangingLight() {
            clearInterval(this.timerInterval);
        }
    }
};
</script>

<style scoped>
canvas {
    border: none
}
</style>