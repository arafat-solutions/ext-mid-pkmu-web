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
      defaultIntervalTarget: 1000, //in ms
      minimumIntervalTarget: 1000, //in ms
      maximumIntervalTarget: 3000, //in ms
      target: null,
      targetIncrement: null,
      width: 200,
      height: 200,
      animationFrameId: null,
      radius: 75,
      greenStartTime: null,
      greenDuration: 0,
    }
  },
  created() {
    window.addEventListener('keydown', this.handleKeyPress);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyPress);
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
        console.log('greenDuration', this.greenDuration);
        window.removeEventListener('keydown', this.handleKeyPress);
        cancelAnimationFrame(this.animationFrameId);
      }
    },
  },
  computed: {
    changeValue() {
      return (this.speed / 100) * 19 + 1;
    },
  },
  methods: {
    handleKeyPress(event) {
      if (this.isPause || this.isTimesUp || this.changeType === 'inactive' || this.changeType === 'keep_indicator') {
        return;
      }

      if (event.key === 'ArrowRight') {
        this.headingValue += 1;
        this.target += 1;
      } else if (event.key === 'ArrowLeft') {
        this.headingValue -= 1;
        this.target -= 1;
      }

      this.checkDurationTarget();
    },
    getRandomInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    async executeTargetMovement() {
      if (this.isPause || this.isTimesUp) {
        return;
      }

      let intervalTarget = this.defaultIntervalTarget; //in ms
      if (this.changeType === 'adjust_for_irregular_updates') {
        intervalTarget = this.getRandomInterval(this.minimumIntervalTarget, this.maximumIntervalTarget);
      }
      const sign = this.getRandomOperator();
      for(let i=1;i<=this.changeValue;i++) {
        if (sign === '+') {
          this.target++;
          this.headingValue++;
        } else {
          this.target--;
          this.headingValue--;
        }
        this.checkDurationTarget();
        await this.delay(intervalTarget/this.changeValue);
      }
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

      if ((this.target < -3 || this.target > 3) && !this.greenStartTime) {
        this.greenStartTime = new Date;
      } else if ((this.target > -3 && this.target < 3) && this.greenStartTime || (this.greenStartTime && this.isTimesUp)) {
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
