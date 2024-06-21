<template>
    <div class="container">
        <canvas ref="circleCanvas" :width="this.canvasWidth" :height="this.canvasHeight"></canvas>
        <canvas ref="focusCanvas" :width="this.canvasWidth" :height="this.canvasHeight" @mouseenter="hideCursor"
            @mouseleave="showCursor" @click="canvasClickHandler"></canvas>
        <p>Score: {{ score }}</p>
    </div>
</template>

<script>
export default {
    name: 'MultiMonitoringTest',
    data() {
        return {
            canvasWidth: 600,
            canvasHeight: 300,
            score: 0,
            circle: {
                x: Math.random() * 600,
                y: Math.random() * 300,
                visible: true
            },
            timer: null,
            interval: 2000 // Time in milliseconds
        };
    },
    mounted() {
        this.initCanvas();
        this.startTimer();
        this.drawCircle();
        window.addEventListener('mousemove', this.mouseMoveHandler);
    },
    methods: {
        initCanvas() {
            const circleCanvas = this.$refs.circleCanvas;
            const focusCanvas = this.$refs.focusCanvas;
            this.circleCtx = circleCanvas.getContext("2d");
            this.focusCtx = focusCanvas.getContext("2d");
        },
        drawCircle() {
            const ctx = this.circleCtx;
            const { x, y, visible } = this.circle;

            ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

            if (visible) {
                ctx.beginPath();
                ctx.arc(x, y, 10, 0, 2 * Math.PI);
                ctx.fillStyle = 'white';
                ctx.fill();
            }
        },
        drawFocus({ x, y }) {
            const ctx = this.focusCtx;

            ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

            // Draw outer circle
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, 2 * Math.PI);
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw inner cross lines
            ctx.beginPath();
            ctx.moveTo(x - 14, y);
            ctx.lineTo(x + 14, y);
            ctx.moveTo(x, y - 14);
            ctx.lineTo(x, y + 14);
            ctx.stroke();
        },
        mouseMoveHandler(event) {
            const canvas = this.$refs.focusCanvas;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            this.drawFocus({ x: mouseX, y: mouseY });
        },
        hideCursor() {
            this.$refs.focusCanvas.style.cursor = 'none';
        },
        showCursor() {
            this.$refs.focusCanvas.style.cursor = 'default';
        },
        canvasClickHandler(event) {
            const rect = this.$refs.focusCanvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            const { x, y } = this.circle;
            const dx = mouseX - x;
            const dy = mouseY - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 10) {
                this.score += 1;
                this.repositionCircle();
            }
        },
        startTimer() {
            this.timer = setInterval(() => {
                this.repositionCircle();
            }, this.interval);
        },
        repositionCircle() {
            this.circle.x = Math.random() * this.canvasWidth;
            this.circle.y = Math.random() * this.canvasHeight;
            this.circle.visible = true;
            this.drawCircle();
        },
        beforeUnmount() {
            window.removeEventListener('mousemove', this.mouseMoveHandler);
            clearInterval(this.timer);
        }
    }
};
</script>

<style scoped>
.container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
    background-color: black;
    margin: 0;
    padding: 0;
}

canvas {
    position: absolute;
    border: 1px solid white;
}

canvas:nth-child(1) {
    z-index: 1;
}

canvas:nth-child(2) {
    z-index: 2;
}
</style>

<!-- <template>
    <div class="container">
        <canvas ref="circleCanvas" :width="this.canvasWidth" :height="this.canvasHeight"></canvas>
        <canvas ref="focusCanvas" :width="this.canvasWidth" :height="this.canvasHeight" @mouseenter="hideCursor"
            @mouseleave="showCursor" @click="canvasClickHandler"></canvas>
        <p>Score: {{ score }}</p>
    </div>
</template>

<script>
export default {
    name: 'MultiMonitoringTest',
    data() {
        return {
            canvasWidth: 600,
            canvasHeight: 300,
            score: 0,
            circle: {
                x: Math.random() * 600,
                y: Math.random() * 300
            }
        };
    },
    mounted() {
        this.initCanvas();
        this.drawCircle();
        window.addEventListener('mousemove', this.mouseMoveHandler);
    },
    methods: {
        initCanvas() {
            const circleCanvas = this.$refs.circleCanvas;
            const focusCanvas = this.$refs.focusCanvas;
            this.circleCtx = circleCanvas.getContext("2d");
            this.focusCtx = focusCanvas.getContext("2d");
        },
        drawCircle() {
            const ctx = this.circleCtx;
            const { x, y } = this.circle;

            ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

            ctx.beginPath();
            ctx.arc(x, y, 10, 0, 2 * Math.PI);
            ctx.fillStyle = 'white';
            ctx.fill();
        },
        drawFocus({ x, y }) {
            const ctx = this.focusCtx;

            ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

            // Draw outer circle
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, 2 * Math.PI);
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw inner cross lines
            ctx.beginPath();
            ctx.moveTo(x - 14, y);
            ctx.lineTo(x + 14, y);
            ctx.moveTo(x, y - 14);
            ctx.lineTo(x, y + 14);
            ctx.stroke();
        },
        mouseMoveHandler(event) {
            const canvas = this.$refs.focusCanvas;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            this.drawFocus({ x: mouseX, y: mouseY });
        },
        hideCursor() {
            this.$refs.focusCanvas.style.cursor = 'none';
        },
        showCursor() {
            this.$refs.focusCanvas.style.cursor = 'default';
        },
        canvasClickHandler(event) {
            const rect = this.$refs.focusCanvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            const { x, y } = this.circle;
            const dx = mouseX - x;
            const dy = mouseY - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 10) {
                this.score += 1;
                this.circle.x = Math.random() * this.canvasWidth;
                this.circle.y = Math.random() * this.canvasHeight;
                this.drawCircle();
            }
        },
    },
    beforeUnmount() {
        window.removeEventListener('mousemove', this.mouseMoveHandler);
    }
};
</script>

<style scoped>
.container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    background-color: black;
    margin: 0;
    padding: 0;
}

canvas {
    position: absolute;
    top: 50%;
    left: 50%;
    border: 1px solid white;
}

canvas:nth-child(1) {
    z-index: 1;
}

canvas:nth-child(2) {
    z-index: 2;
}
</style> -->
