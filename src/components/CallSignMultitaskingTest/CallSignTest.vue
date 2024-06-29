<template>
    <div class="callsign-test">
        <input class="input" />
        <canvas ref="callsignCanvas"></canvas>
    </div>
</template>

<script>
export default {
    name: 'CallSignTest',
    data() {
        return {
            callsign: "NA782"
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
            const canvas = this.$refs.callsignCanvas;
            const container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            this.ctx = canvas.getContext("2d");
        },
        drawVisual() {
            this.clearCanvas();
            this.drawText()
        },
        clearCanvas() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        },
        drawText() {
            const ctx = this.ctx
            ctx.fillStyle = 'black';
            ctx.font = '12px Arial';
            ctx.fillText("Your callsign:", 5, 13);

            ctx.fillStyle = 'green';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(this.callsign, 90, 15);

            ctx.fillStyle = 'black';
            ctx.font = '12px Arial';
            ctx.fillText('New heading:', 200, 15);
        }
    }
};
</script>

<style scoped>
.callsign-test {
    position: relative;
}

.input {
    position: absolute;
    top: -32%;
    right: 28%;
    width: 70px;
    height: 24px;
    background-color: white;
    border: 1px solid black;
}

canvas {
    border: none;
    margin-top: -30px;
    /* background-color: aqua; */
}
</style>