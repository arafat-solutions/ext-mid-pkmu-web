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
        }
    },
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
                focusY: 300,
                focusX: 100,
                angle: -60,
                horizonOffsetY: -20,
                horizonOffsetX: -30
            },
            horizonFrame: 0,
            angleFrames: 2, // tetap
            heightFrames: 3, // tetap
            heightChangeSize: 0, // config perubahan height
            widthFrames: 30,
            animationFrameId: null,
            lastFrameTime: 0
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
            const { speed } = this.horizonData
            if (speed === 'slow') {
                this.heightChangeSize = 2
            } else if (speed === 'medium') {
                this.heightChangeSize = 4
            } else if (speed === 'fast') {
                this.heightChangeSize = 8
            }

            this.initVisual();
            this.drawVisual();
            if (this.horizonData.play === true) {
                this.animate()
            }
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
            this.drawHorizon();
        },
        clearCanvas() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        },
        drawHorizon() {
            const ctx = this.ctx;
            const config = this.config;

            // Save the current context state
            ctx.save();

            // Define the clipping region
            ctx.beginPath();
            ctx.rect(config.x, config.y, config.width, config.height);
            ctx.strokeStyle = 'black'
            ctx.lineWidth = 6;
            ctx.stroke()
            ctx.clip();

            // Convert rotation angle from degrees to radians
            const angleInRadians = config.angle * Math.PI / 180;

            // Move to the center of the inner content
            ctx.translate(config.x + config.width / 2, config.y + config.height / 2);

            // Apply the vertical offset for the horizon
            ctx.translate(config.horizonOffsetX, config.horizonOffsetY);

            // Rotate the context
            ctx.rotate(angleInRadians);

            // Move back to the top-left corner of the inner content
            ctx.translate(-config.x - config.width / 2, -config.y - config.height / 2);

            // Draw the extended blue top half
            ctx.fillStyle = config.blue;
            ctx.fillRect(config.x - (config.width / 2), config.y - config.height, config.width * 2, config.height * 4);

            // Draw the extended white border at the bottom of the blue section
            ctx.fillStyle = 'white';
            ctx.fillRect(config.x - (config.width / 2), config.y + config.height / 2 - config.whiteBorderHeight, config.width * 2, config.whiteBorderHeight + config.height / 4);

            // Draw the extended brown bottom half
            ctx.fillStyle = config.brown;
            ctx.fillRect(config.x - (config.width / 2), config.y + config.height / 2, config.width * 2, config.height * 4);

            // draw indicator traingle
            this.drawIndicator()
            // Restore the context to its original state
            ctx.restore();

            this.drawFocusLine()
        },
        drawIndicator() {
            const ctx = this.ctx;
            const config = this.config
            const centerX = config.x + config.width / 2;
            const centerY = config.y + config.height / 2
            const radius = 60;

            ctx.beginPath();
            ctx.arc(centerX, centerY - 10, radius, 0, Math.PI, true);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 10;
            ctx.setLineDash([2, 24]);
            ctx.stroke()

            this.drawTriangle({ x: centerX, y: centerY - 30, width: 20, height: 15 })

            // draw skew line left
            this.drawSkew({ centerX, centerY, config })
        },
        drawSkew({ centerX, centerY, config }) {
            const ctx = this.ctx
            ctx.beginPath()
            ctx.moveTo(centerX - 15, centerY + 20)
            ctx.lineTo(config.x + 120, centerY + 40);
            ctx.lineTo(config.x + 130, centerY + 40);
            ctx.lineTo(centerX - 10, centerY + 20);
            ctx.closePath();
            ctx.fill();
            ctx.setLineDash([0, 0]);

            ctx.save();

            // Apply vertical flip transformation
            ctx.translate(this.config.width + 20, 0);
            ctx.scale(-1, 1);

            ctx.beginPath()
            ctx.moveTo(centerX - 15, centerY + 20)
            ctx.lineTo(config.x + 120, centerY + 40);
            ctx.lineTo(config.x + 130, centerY + 40);
            ctx.lineTo(centerX - 10, centerY + 20);
            ctx.closePath();
            ctx.fill();
            ctx.setLineDash([0, 0]);


            ctx.restore()
        },
        drawTriangle({ x, y, width, height }) {
            const ctx = this.ctx
            ctx.fillStyle = 'white'
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
            const ctx = this.ctx;
            const config = this.config;

            ctx.beginPath();
            ctx.rect(config.x, config.y, config.width, config.height);
            ctx.clip();

            ctx.setLineDash([0, 0]);

            // Calculate the center of the canvas
            const centerX = config.x + config.width / 2;
            const centerY = config.y + config.height / 2;

            // Convert angle to radians
            const angleInRadians = config.angle * Math.PI / 180;

            // Calculate the rotated and offset position
            const offsetX = config.horizonOffsetX;
            const offsetY = config.horizonOffsetY;

            // Rotate the offset point around the center
            const rotatedOffsetX = offsetX * Math.cos(angleInRadians) - offsetY * Math.sin(angleInRadians);
            const rotatedOffsetY = offsetX * Math.sin(angleInRadians) + offsetY * Math.cos(angleInRadians);

            // Calculate the final position of the circle center
            const circleCenterX = centerX + rotatedOffsetX;
            const circleCenterY = centerY + rotatedOffsetY;

            // Define the radius for the green zone
            const radius = 15; // You can adjust this value as needed

            // Calculate the distance from the focus point to the circle center
            const distanceToCenter = Math.sqrt(
                Math.pow(config.focusX - circleCenterX, 2) + Math.pow(config.focusY - circleCenterY, 2)
            );

            // Determine if the focus is within the radius of the center
            const isWithinRadius = distanceToCenter <= radius;

            // Set line color based on whether it's within the radius of the center
            const lineColor = isWithinRadius ? 'green' : 'yellow';

            // Draw the circle representing the "green zone"
            ctx.beginPath();
            ctx.arc(circleCenterX, circleCenterY, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)'; // Semi-transparent green
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw horizontal line
            ctx.beginPath();
            ctx.moveTo(config.x, config.focusY);
            ctx.lineTo(config.x + config.width, config.focusY);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw vertical line
            ctx.beginPath();
            ctx.moveTo(config.focusX, config.y);
            ctx.lineTo(config.focusX, config.y + config.height);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2;
            ctx.stroke();
        },
        setAngle() {
            const change = Math.random() < 0.5 ? -2 : 2
            let newAngle = this.config.angle + change
            newAngle = Math.max(-43, Math.min(43, newAngle));

            this.config.angle = newAngle;
        },
        setHeight() {
            const change = Math.random() < 0.5 ? -this.heightChangeSize : this.heightChangeSize

            let newY = this.config.horizonOffsetY + change
            newY = Math.max(-70, Math.min(70, newY));
            this.config.horizonOffsetY = newY;
        },
        setWidth() {
            const change = Math.random() < 0.5 ? -10 : 10

            let newX = this.config.horizonOffsetX + change
            newX = Math.max(-70, Math.min(70, newX));
            this.config.horizonOffsetX = newX;
        },
        animate() {
            this.drawVisual()
            if (this.horizonFrame % this.angleFrames == 0) {
                this.setAngle()
            }

            if (this.horizonFrame % this.heightFrames == 0) {
                this.setHeight()
            }

            if (this.horizonFrame % this.widthFrames == 0) {
                this.setWidth()
            }


            this.horizonFrame += 1
            requestAnimationFrame(this.animate)
        },
        handleMouseEnter(event) {
            const canvasRect = this.$refs.horizonCanvas.getBoundingClientRect();
            let focusX = event.clientX - canvasRect.left;
            let focusY = event.clientY - canvasRect.top;

            // Ensure focusX and focusY are within the canvas boundaries
            focusX = Math.max(0, Math.min(focusX, this.$refs.horizonCanvas.width));
            focusY = Math.max(0, Math.min(focusY, this.$refs.horizonCanvas.height));

            this.config.focusX = focusX;
            this.config.focusY = focusY;

            this.drawVisual();
        }
    }
};
</script>

<style scoped>
canvas {
    border: none;
    margin-top: -10px;
}
</style>
