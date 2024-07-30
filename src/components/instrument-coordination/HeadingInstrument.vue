<template>
  <div>
    <Heading id="heading" class="indicator-bg" :size="200" :heading="headingValue" />
    <canvas ref="targetCanvas" :width="width" :height="height" />
    <div class="target" v-show="false" />
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
    changeValue: Number,
  },
  data: function () {
    return {
      headingValue: 0,
      signRandoms: ['+', '-'],
      defaultIntervalTarget: 500, //in ms
      minimumIntervalTarget: 500, //in ms
      maximumIntervalTarget: 2000, //in ms
      target: 80,
      targetIncrement: null,
      width: 200,
      height: 200,
      animationFrameId: null,
      greenDotX: 0,
      greenDotY: 0,
      greenDotColor: 'green',
      radius: 75,
    }
  },
  created() {
    window.addEventListener('keyup', this.handleKeyPress);
  },
  beforeUnmount() {
    window.removeEventListener('keyup', this.handleKeyPress);
    clearInterval(this.intervalTarget);
    cancelAnimationFrame(this.animationFrameId);
  },
  computed: {
    rotationStyle() {
      return {
        transform: `rotate(${this.target}deg)`,
        transition: 'transform 1s ease-in-out',
      };
    },
  },
  mounted: function () {
    if (this.changeType !== 'inactive') {
      this.initTarget();
      // this.executeTargetMovement();
    }
  },
  methods: {
    handleKeyPress(event) {
      if (this.isPause || this.isTimesUp || this.changeType === 'inactive' || this.changeType === 'keep_indicator') {
        return;
      }

      if (event.key === 'ArrowRight') {
        this.headingValue += this.changeValue;
      } else if (event.key === 'ArrowLeft') {
        this.headingValue -= this.changeValue;
      }
    },
    getRandomInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    executeTargetMovement() {
      const sign = this.getRandomOperator();
      if (sign === '+') {
        this.target += this.changeValue;
      } else {
        this.target -= this.changeValue;
      }

      let intervalTarget = this.defaultIntervalTarget; //in ms
      if (this.changeType === 'adjust_for_irregular_updates') {
        intervalTarget = this.getRandomInterval(this.minimumIntervalTarget, this/this.maximumIntervalTarget);
      }
      setTimeout(this.executeTargetMovement, intervalTarget);
    },
    getRandomOperator() {
      const randomIndex = Math.floor(Math.random() * this.signRandoms.length);
      return this.signRandoms[randomIndex];
    },
    initTarget() {
      this.animate();
      this.greenDotX = this.width / 2;
      this.greenDotY = this.height / 2;
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

      // Set the fill color to rgb(72, 200, 68)
      ctx.fillStyle = 'rgb(72, 200, 68)';
      ctx.fill();
    },
    animate() {
      this.drawTarget();
      this.animationFrameId = requestAnimationFrame(this.animate);
    },
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

.circle-container {
  position: relative;
  width: 180px; /* 2 * radius */
  height: 180px; /* 2 * radius */
  border: 1px solid #ddd;
  border-radius: 50%;
  overflow: hidden;
}

.target {
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 8px solid rgb(72, 200, 68);
  position: absolute;
  left: 640px;
  top: 105px;
  transform: translate(-50%, -50%);
}

canvas {
  border: 0px solid black;
  margin-top: 75px;
  z-index: 999;
}
</style>
