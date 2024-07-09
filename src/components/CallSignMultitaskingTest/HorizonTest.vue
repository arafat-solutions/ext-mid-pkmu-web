<template>
    <div class="horizon-test">
        <canvas ref="horizonCanvas" @mousemove="handleMouseEnter"></canvas>
    </div>
</template>

<script>
export default {
    name: 'HorizonTest',
    props: {
        horizonData: {
            type: Object,
            required: true
        },
        updateResults: Function,
    },
    data() {
        return {
            config: {
                width: 350,
                height: 350,
                x: 10,
                y: 5,
                blue: '#008bd4',
                brown: '#b75010',
                borderColor: 'black',
                whiteBorderHeight: 5,
                focusY: 300,
                focusX: 100,
                angle: 0,
                horizonOffsetY: 0,
                horizonOffsetX: 0
            },
            correct_time: 0,
            isCurrentlyCorrect: false,
            lastCorrectStartTime: null,
            maxAngleChange: 0,
            maxOffsetChange: 0,
            changeProb: 0,
            angleChangeProb: 0.3,
            heightChangeProb: 0.3,
            widthChangeProb: 0.3,
        };
    },
    mounted() {
        this.initializeTest();
    },
    methods: {
        initializeTest() {
            this.setSpeedParameters();
            this.initVisual();
            this.drawVisual();
            if (this.horizonData.play) {
                this.animate();
            }
        },
        initVisual() {
            const canvas = this.$refs.horizonCanvas;
            const container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = 400;
            this.ctx = canvas.getContext('2d');
        },
        drawVisual() {
            this.clearCanvas();
            this.drawHorizon();
        },
        clearCanvas() {
            const { width, height } = this.config;
            this.ctx.clearRect(0, 0, width, height);
        },
        drawHorizon() {
            const { ctx, config } = this;

            ctx.save();
            ctx.beginPath();
            ctx.rect(config.x, config.y, config.width, config.height);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 6;
            ctx.stroke();
            ctx.clip();

            const angleInRadians = config.angle * Math.PI / 180;

            ctx.translate(config.x + config.width / 2, config.y + config.height / 2);
            ctx.translate(config.horizonOffsetX, config.horizonOffsetY);
            ctx.rotate(angleInRadians);
            ctx.translate(-config.x - config.width / 2, -config.y - config.height / 2);

            ctx.fillStyle = config.blue;
            ctx.fillRect(config.x - config.width / 2, config.y - config.height, config.width * 2, config.height * 4);

            ctx.fillStyle = 'white';
            ctx.fillRect(config.x - config.width / 2, config.y + config.height / 2 - config.whiteBorderHeight, config.width * 2, config.whiteBorderHeight + config.height / 4);

            ctx.fillStyle = config.brown;
            ctx.fillRect(config.x - config.width / 2, config.y + config.height / 2, config.width * 2, config.height * 4);

            this.drawIndicator();
            ctx.restore();

            this.drawFocusLine();
        },
        drawIndicator() {
            const { ctx, config } = this;
            const centerX = config.x + config.width / 2;
            const centerY = config.y + config.height / 2;
            const radius = 60;

            ctx.beginPath();
            ctx.arc(centerX, centerY - 10, radius, 0, Math.PI, true);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 10;
            ctx.setLineDash([2, 24]);
            ctx.stroke();

            this.drawTriangle({ x: centerX, y: centerY - 30, width: 20, height: 15 });
            this.drawSkew(centerX, centerY);
        },
        drawSkew(centerX, centerY) {
            const { ctx, config } = this;

            const drawSkewShape = () => {
                ctx.beginPath();
                ctx.moveTo(centerX - 15, centerY + 20);
                ctx.lineTo(config.x + 120, centerY + 40);
                ctx.lineTo(config.x + 130, centerY + 40);
                ctx.lineTo(centerX - 10, centerY + 20);
                ctx.closePath();
                ctx.fill();
                ctx.setLineDash([0, 0]);
            };

            drawSkewShape();

            ctx.save();
            ctx.translate(this.config.width + 20, 0);
            ctx.scale(-1, 1);
            drawSkewShape();
            ctx.restore();
        },
        drawTriangle({ x, y, width, height }) {
            const { ctx } = this;
            ctx.fillStyle = 'white';
            ctx.save();
            ctx.translate(x, y);
            ctx.beginPath();
            ctx.moveTo(0, -height / 2);
            ctx.lineTo(-width / 2, height / 2);
            ctx.lineTo(width / 2, height / 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        },
        drawFocusLine() {
            const { ctx, config } = this;
            const { x, y, width, height, focusX, focusY, horizonOffsetX, horizonOffsetY } = config;

            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.clip();

            const centerX = x + width / 2;
            const centerY = y + height / 2;

            const circleX = centerX + horizonOffsetX;
            const circleY = centerY + horizonOffsetY;
            const radius = 15;

            const distanceToCircle = Math.sqrt((focusX - circleX) ** 2 + (focusY - circleY) ** 2);
            const isWithinRadius = distanceToCircle <= radius;

            this.updateCorrectTime(isWithinRadius);

            const lineColor = isWithinRadius ? 'green' : 'yellow';

            ctx.beginPath();
            ctx.arc(circleX, circleY, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = 'transparent';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x, focusY);
            ctx.lineTo(x + width, focusY);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(focusX, y);
            ctx.lineTo(focusX, y + height);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
        },
        setAngle() {
            if (Math.random() < this.changeProb) {
                const change = (Math.random() - 0.5) * 2 * this.maxAngleChange;
                this.config.angle = Math.max(-70, Math.min(70, this.config.angle + change));
            }
        },
        setHeight() {
            if (Math.random() < this.changeProb) {
                const change = (Math.random() - 0.5) * 2 * this.maxOffsetChange;
                this.config.horizonOffsetY = Math.max(-70, Math.min(70, this.config.horizonOffsetY + change));
            }
        },
        setWidth() {
            if (Math.random() < this.changeProb) {
                const change = (Math.random() - 0.5) * 2 * this.maxOffsetChange;
                this.config.horizonOffsetX = Math.max(-70, Math.min(70, this.config.horizonOffsetX + change));
            }
        },
        animate() {
            this.drawVisual();
            this.setAngle();
            this.setHeight();
            this.setWidth();
            requestAnimationFrame(this.animate);
        },
        handleMouseEnter(event) {
            const canvasRect = this.$refs.horizonCanvas.getBoundingClientRect();
            this.config.focusX = Math.max(0, Math.min(event.clientX - canvasRect.left, this.$refs.horizonCanvas.width));
            this.config.focusY = Math.max(0, Math.min(event.clientY - canvasRect.top, this.$refs.horizonCanvas.height));
            this.drawVisual();
        },
        updateCorrectTime(isCorrect) {
            const currentTime = performance.now() / 1000;

            if (isCorrect && !this.isCurrentlyCorrect) {
                this.isCurrentlyCorrect = true;
                this.lastCorrectStartTime = currentTime;
            } else if (!isCorrect && this.isCurrentlyCorrect) {
                this.isCurrentlyCorrect = false;
                // this.correct_time += currentTime - this.lastCorrectStartTime;
                this.updateResults('horizon', { correct_time: currentTime - this.lastCorrectStartTime });
                this.lastCorrectStartTime = null;
            }
        },
        setSpeedParameters() {
            const { speed } = this.horizonData;
            switch (speed) {
                case 'slow':
                    this.maxAngleChange = 2;
                    this.maxOffsetChange = 3;
                    this.changeProb = 0.3;
                    break;
                case 'medium':
                    this.maxAngleChange = 2;
                    this.maxOffsetChange = 3;
                    this.changeProb = 0.6;
                    break;
                case 'fast':
                    this.maxAngleChange = 2;
                    this.maxOffsetChange = 3;
                    this.changeProb = 0.9;
                    break;
                default:
                    console.warn('Invalid speed setting, defaulting to medium');
                    this.maxAngleChange = 1;
                    this.maxOffsetChange = 2;
                    this.changeProb = 0.2;
            }
        },
    },
    watch: {
        horizonData: {
            handler() {
                this.setSpeedParameters();
            },
            deep: true
        }
    },
};
</script>

<style scoped>
canvas {
    border: none;
    margin-top: -10px;
}
</style>