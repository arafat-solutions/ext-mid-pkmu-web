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
        },
        updateResults: Function,
        updateResultLightAvgTime: Function
    },
    data() {
        return {
            circleConfig: [],
            activeIndex: -1,
            timerInterval: null,
            alternateChange: false,
            setInterval: 0,
            redStartTime: null,
            correctResponseTimes: [],
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
            if (Math.random() < 0.6) {
                this.updateResults('alert_lights', { total_warning_count: 1 });
                return COLORS.YELLOW
            } else {
                this.updateResults('alert_lights', { total_alert_count: 1 });
                return COLORS.RED;
            }

        },
        changeActiveCircleColor() {
            if (this.activeIndex !== -1) {
                this.circleConfig[this.activeIndex].fillColor = COLORS.DEFAULT;
            }
            this.activeIndex = this.getRandomIndex();
            const newColor = this.getRandomColor()
            this.circleConfig[this.activeIndex].fillColor = newColor;

            if (newColor === COLORS.RED) {
                this.redStartTime = performance.now()
            } else {
                this.redStartTime = null
            }
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
            const key = event.key.toLowerCase();
            const letters = ['t', 'y', 'u', 'i']

            if (letters.includes(key)) {
                const index = letters.indexOf(event.key.toLowerCase());
                const fillColor = this.circleConfig[index].fillColor;

                if (index !== -1 && index === this.activeIndex) {
                    if (fillColor === COLORS.RED) {
                        this.updateResults('alert_lights', { correct_response: 1 });
                        // tracking the time just when user is right
                        if (this.redStartTime !== null) {
                            const responseTime = performance.now() - this.redStartTime
                            this.correctResponseTimes.push(responseTime)
                            this.updateAverageResponseTime();
                        }
                    } else if (fillColor === COLORS.YELLOW) {
                        this.updateResults('alert_lights', { wrong_response: 1 });
                    }
                } else {
                    if (this.activeIndex !== -1) {
                        this.updateResults('alert_lights', { wrong_response: 1 });
                    }
                }
            }
        },
        updateAverageResponseTime() {
            const avgTime = this.getAverageResponseTime();
            this.updateResultLightAvgTime(avgTime);
        },
        getAverageResponseTime() {
            if (this.correctResponseTimes.length === 0) {
                return 0;
            }
            const sum = this.correctResponseTimes.reduce((a, b) => a + b, 0);
            const avg = (sum / this.correctResponseTimes.length) / 1000;
            return Number(avg.toFixed(2))
        },
    }
};
</script>

<style scoped>
canvas {
    border: none;
}
</style>
