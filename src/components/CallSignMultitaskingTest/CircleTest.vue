<template>
    <div class="circle-test">
        <canvas ref="circleCanvas"></canvas>
    </div>
</template>

<script>

const COLORS = {
    DEFAULT: '#b75010',
    YELLOW: 'yellow',
    RED: 'red'
};

const SPEED_INTERVALS = {
    slow: 500,
    medium: 400,
    fast: 300
};

const FREQUENCY_INTERVALS = {
    seldom: 500,
    medium: 400,
    often: 300
};

export default {
    name: 'CircleTest',
    props: {
        alertLightsData: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            circleConfig: [],
            activeIndex: -1,
            timerInterval: null,
            alternateChange: false,
            setInterval: 0,
            result: {
                right: 0,
                wrong: 0
            }
        };
    },
    mounted() {
        this.initializeTest();
        window.addEventListener('keydown', this.handleKeyPress);
    },
    beforeUnmount() {
        this.stopChangingLight();
        window.removeEventListener('keydown', this.handleKeyPress);
    },
    methods: {
        initializeTest() {
            this.calculateInterval();
            this.initCircleConfig();
            this.initCanvas();
            this.drawVisual();
            if (this.alertLightsData.play) {
                this.startChangingLight();
            }
        },
        calculateInterval() {
            const { speed, frequency } = this.alertLightsData;
            this.setInterval = SPEED_INTERVALS[speed] + FREQUENCY_INTERVALS[frequency];
        },
        initCircleConfig() {
            const letters = ['T', 'Y', 'U', 'I'];
            this.circleConfig = letters.map((letter, index) => ({
                x: 50 + index * 90,
                y: 100,
                radius: 40,
                fillColor: COLORS.DEFAULT,
                letter
            }));
        },
        initCanvas() {
            const canvas = this.$refs.circleCanvas;
            const container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            this.ctx = canvas.getContext("2d");
        },
        drawVisual() {
            this.clearCanvas();
            this.circleConfig.forEach(this.drawCircle);
        },
        clearCanvas() {
            const { width, height } = this.$refs.circleCanvas;
            this.ctx.clearRect(0, 0, width, height);
        },
        drawCircle({ x, y, radius, fillColor, letter }) {
            const ctx = this.ctx;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = fillColor;
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = 'black';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(letter, x, y);
        },
        getRandomColor() {
            return Math.random() < 0.6 ? COLORS.YELLOW : COLORS.RED;
        },
        changeActiveCircleColor() {
            if (this.activeIndex !== -1) {
                this.circleConfig[this.activeIndex].fillColor = COLORS.DEFAULT;
            }
            this.activeIndex = this.getRandomIndex();
            this.circleConfig[this.activeIndex].fillColor = this.getRandomColor();
        },
        getRandomIndex() {
            return Math.floor(Math.random() * this.circleConfig.length);
        },
        startChangingLight() {
            this.timerInterval = setInterval(() => {
                if (this.alternateChange) {
                    if (this.activeIndex !== -1) {
                        this.circleConfig[this.activeIndex].fillColor = COLORS.DEFAULT;
                        this.activeIndex = -1;
                    }
                } else {
                    this.changeActiveCircleColor();
                }
                this.drawVisual();
                this.alternateChange = !this.alternateChange;
            }, this.setInterval);
        },
        stopChangingLight() {
            clearInterval(this.timerInterval);
        },
        handleKeyPress(event) {
            const index = ['t', 'y', 'u', 'i'].indexOf(event.key.toLowerCase());
            if (index !== -1 && index === this.activeIndex) {
                const fillColor = this.circleConfig[index].fillColor;
                if (fillColor === COLORS.RED) {
                    this.result.right += 1;
                } else if (fillColor === COLORS.YELLOW) {
                    this.result.wrong += 1;
                }
            }
        }
    }
};
</script>

<style scoped>
canvas {
    border: none;
}
</style>
