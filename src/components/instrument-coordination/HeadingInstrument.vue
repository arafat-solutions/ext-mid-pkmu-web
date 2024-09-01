<template>
  <div>
    <Heading id="heading" class="indicator-bg" :size="200" :heading="headingValue" />
    <canvas ref="targetCanvas" :width="200" :height="200" />
  </div>
</template>

<script>
import {Heading} from  'vue-flight-indicators';

export default {
  components: {
    Heading,
  },
  props: {
    isTimesUp: Boolean,
    isPause: Boolean,
    changeType: String,//inactive, keep_indicator, adjust_for_consistent_updates, adjust_for_irregular_updates
    speed: Number, // 0-100
  },
  data: function () {
    return {
      headingValue: 0,
      signRandoms: ['+', '-'],
      target: null,
      targetIncrement: null,
      targetTolerance: 3,
      width: 200,
      height: 200,
      animationFrameId: null,
      radius: 75,
      greenStartTime: null,
      greenDuration: 0,
      isPressed: false,
      currentOperator: null,
    }
  },
  created() {
    window.addEventListener('keydown', this.handleKeyDownPress);
    window.addEventListener('keyup', this.handleKeyUpPress);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyDownPress);
    window.removeEventListener('keyup', this.handleKeyUpPress);
    cancelAnimationFrame(this.animationFrameId);
  },
  mounted: function () {
    if (this.changeType !== 'inactive') {
      if (this.changeType !== 'keep_indicator') {
        this.initTarget();
      }
      this.executeTargetMovement();
    }
  },
  watch: {
    isTimesUp(newValue) {
      if (newValue) {
        this.checkDurationTarget();
        window.removeEventListener('keydown', this.handleKeyDownPress);
        window.removeEventListener('keyup', this.handleKeyUpPress);
        cancelAnimationFrame(this.animationFrameId);
        this.$emit('getResult', this.greenDuration);
      }
    },
    isPause(newValue) {
      if (!newValue) {
        this.executeTargetMovement();
      }
    },
  },
  computed: {
    intervalMovement() {
      const minInput = 1;
      const maxInput = 100;
      const minOutput = 50;
      const maxOutput = 150;

      // Apply the conversion formula
      const output = maxOutput - ((this.speed - minInput) / (maxInput - minInput)) * (maxOutput - minOutput);
      return output;
    },
  },
  methods: {
    handleKeyDownPress(event) {
      if (this.isPause || this.isTimesUp || this.changeType === 'inactive' || this.changeType === 'keep_indicator') {
        return;
      }

      if (event.key === 'ArrowRight') {
        this.isPressed = true;
        this.headingValue += 1;
        this.target += 1;
        this.checkDurationTarget();
      } else if (event.key === 'ArrowLeft') {
        this.isPressed = true;
        this.headingValue -= 1;
        this.target -= 1;
        this.checkDurationTarget();
      }
    },
    handleKeyUpPress(event) {
      if (this.isPause || this.isTimesUp || this.changeType === 'inactive' || this.changeType === 'keep_indicator') {
        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        this.isPressed = false;
        this.executeTargetMovement();
      }
    },
    getRandomInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    async executeTargetMovement() {
      if (this.isPause || this.isTimesUp || this.isPressed) {
        return;
      }

      if (!this.currentOperator) {
        this.currentOperator = this.getRandomOperator();
      }
      const randomNumber = Math.random();
      if (this.currentOperator === '+' && (this.changeType === 'adjust_for_consistent_updates' || this.changeType === 'keep_indicator')) {
        this.target += randomNumber;
        this.headingValue += randomNumber;
      }
      if (this.currentOperator === '-' && (this.changeType === 'adjust_for_consistent_updates' || this.changeType === 'keep_indicator')) {
        this.target -= randomNumber;
        this.headingValue -= randomNumber;
      }

      if (this.currentOperator === '+' && this.changeType === 'adjust_for_irregular_updates') {
        this.target += randomNumber;
      }
      if (this.currentOperator === '-' && this.changeType === 'adjust_for_irregular_updates') {
        this.target -= randomNumber;
      }

      this.checkDurationTarget();
      await this.delay(this.intervalMovement);
      return this.executeTargetMovement();
    },
    getRandomOperator() {
      const randomIndex = Math.floor(Math.random() * this.signRandoms.length);
      return this.signRandoms[randomIndex];
    },
    initTarget() {
      this.target = Math.floor(Math.random() * 361);
      this.animate();
    },
    drawTarget() {
      const canvas = this.$refs.targetCanvas;
      const ctx = canvas.getContext('2d');

      // Clear canvas
      ctx.clearRect(0, 0, this.width, this.height);

      // Center coordinates
      const centerX = this.width / 2;
      const centerY = this.height / 2;

      // Adjust the target angle to make 0 degrees point upwards
      const adjustedTarget = this.target - 90;

      // Convert adjustedTarget from degrees to radians
      const targetRadians = adjustedTarget * (Math.PI / 180);

      // Koordinat objek kuning
      const yellowX = centerX + this.radius * Math.cos(targetRadians);
      const yellowY = centerY + this.radius * Math.sin(targetRadians);

      // Hitung titik-titik segitiga
      const triangleSize = 12; // Ukuran segitiga
      const angleOffset = Math.PI / 6; // Offset sudut untuk segitiga

      const point1X = yellowX;
      const point1Y = yellowY;

      const point2X = yellowX + triangleSize * Math.cos(targetRadians + angleOffset);
      const point2Y = yellowY + triangleSize * Math.sin(targetRadians + angleOffset);

      const point3X = yellowX + triangleSize * Math.cos(targetRadians - angleOffset);
      const point3Y = yellowY + triangleSize * Math.sin(targetRadians - angleOffset);

      // Gambar segitiga
      ctx.beginPath();
      ctx.moveTo(point1X, point1Y); // Titik puncak segitiga
      ctx.lineTo(point2X, point2Y); // Titik kiri bawah segitiga
      ctx.lineTo(point3X, point3Y); // Titik kanan bawah segitiga
      ctx.closePath(); // Menghubungkan titik terakhir dengan titik pertama

      ctx.fillStyle = 'rgb(72, 200, 68)';
      ctx.fill();
    },
    animate() {
      this.drawTarget();
      this.animationFrameId = requestAnimationFrame(this.animate);
    },
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    checkDurationTarget() {
      if (this.isPause) {
        return;
      }

      if (this.changeType === 'inactive' || this.changeType == 'keep_indicator') {
        this.greenStartTime = null;
        this.greenDuration = 0;

        return;
      }

      const target = Math.abs(this.target) % 360;

      if (target > this.targetTolerance && !this.greenStartTime) {
        this.greenStartTime = new Date;
      } else if (((target <= this.targetTolerance) && this.greenStartTime) || (this.greenStartTime && this.isTimesUp)) {
        const currentTime = Date.now();
        this.greenDuration += (currentTime - this.greenStartTime) / 1000;
        this.greenStartTime = null;
      }
    }
  }
}
</script>

<style scoped>
#heading {
  position: absolute;
  left: 540px;
  top: 75px;
  z-index: -99;
}

canvas {
  border: 0px solid black;
  margin-top: 75px;
  z-index: 999;
}
</style>
