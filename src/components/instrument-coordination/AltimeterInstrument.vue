<template>
  <div>
    <Altimeter id="altimeter" class="indicator-bg" :size="200" :altitude="altitude" />
    <div class="altitude-value">{{altitude}}</div>
    <canvas ref="targetCanvas" :width="200" :height="200" />
  </div>
</template>

<script>
import {Altimeter} from  'vue-flight-indicators';

export default {
  components: {
    Altimeter,
  },
  props: {
    isTimesUp: Boolean,
    isPause: Boolean,
    changeType: String,//inactive, keep_indicator, adjust_for_consistent_updates, adjust_for_irregular_updates
    speed: Number, // 0-100
  },
  data() {
    return {
      altitude: null,
      minimumAltitude: 10000,
      maximumAltitude: 20000,
      signRandoms: ['+', '-'],
      defaultIntervalTarget: 3000, //in ms
      minimumIntervalTarget: 2500, //in ms
      maximumIntervalTarget: 5000, //in ms
      target: null,
      targetIncrement: null,
      targetTolerance: 100,
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
  watch: {
    isTimesUp(newValue) {
      if (newValue) {
        this.checkDurationTarget();
        window.removeEventListener('keydown', this.handleKeyPress);
        cancelAnimationFrame(this.animationFrameId);
        console.log('altimeter', this.greenDuration);
      }
    },
  },
  computed: {
    changeValue() {
      // Map speed (0-100) to (10-50)
      let value = (this.speed / 100) * 40 + 10;

      // Ensure the value is a multiple of 10
      value = Math.round(value / 10) * 10;

      return value;
    },
  },
  mounted: function () {
    if (this.changeType !== 'inactive') {
      if (this.changeType !== 'keep_indicator') {
        this.initAltitude();
        this.initTarget();
      }
      this.executeAltitudeMovement();
    }
  },
  methods: {
    handleKeyPress(event) {
      if (this.isPause || this.isTimesUp || this.changeType === 'inactive' || this.changeType === 'keep_indicator') {
        return;
      }

      if (event.key === 'ArrowUp' && this.altitude <= this.maximumAltitude) {
        this.altitude += 10;
        this.checkDurationTarget();
      } else if (event.key === 'ArrowDown' && this.altitude >= this.minimumAltitude) {
        this.altitude -= 10;
        this.checkDurationTarget();
      }
    },
    getRandomInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    async executeAltitudeMovement() {
      if (this.isPause || this.isTimesUp) {
        return;
      }

      let intervalTarget = this.defaultIntervalTarget; //in ms
      if (this.changeType === 'adjust_for_irregular_updates') {
        intervalTarget = this.getRandomInterval(this.minimumIntervalTarget, this.maximumIntervalTarget);
      }
      const sign = this.getRandomOperator();
      for(let i=0;i<=this.changeValue;i+=10) {
        if (sign === '+' || ((this.altitude-10) < this.minimumAltitude)) {
          this.altitude += 10;
        } else {
          this.altitude -= 10;
        }
        await this.delay(intervalTarget/this.changeValue);
      }
      this.checkDurationTarget();
      return this.executeAltitudeMovement();
    },
    generateRandomNumber(min, max) {
      // Generate a random number between 10000 and 15020
      let number = Math.floor(Math.random() * (max - min + 1)) + 10000;

      // Ensure the number is divisible by 10
      if (number % 10 !== 0) {
        number = number - (number % 10) + 10;
      }

      return number;
    },
    getRandomOperator() {
      const randomIndex = Math.floor(Math.random() * this.signRandoms.length);
      return this.signRandoms[randomIndex];
    },
    initAltitude() {
      this.altitude = this.generateRandomNumber(this.minimumAltitude, this.maximumAltitude);
    },
    initTarget() {
      this.target = this.generateRandomNumber(this.altitude-250, this.altitude+250);
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
      const adjustedTarget = (((this.target - this.minimumAltitude) / 9999) * 360) - 90;

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

      const diff = Math.abs(this.altitude - this.target);

      if (diff > this.targetTolerance && !this.greenStartTime) {
        this.greenStartTime = new Date;
      } else if (
          diff <= this.targetTolerance && this.greenStartTime
          || (this.greenStartTime && this.isTimesUp)
      ) {
        const currentTime = Date.now();
        this.greenDuration += (currentTime - this.greenStartTime) / 1000;
        this.greenStartTime = null;
      }
    }
  }
}
</script>

<style scoped>
#altimeter {
  position: absolute;
  left: 780px;
  top: 200px;
}

canvas {
  border: 0px solid black;
  position: absolute;
  left: 780px;
  top: 200px;
  z-index: 999;
}

.altitude-value {
  position: absolute;
  left: 892px;
  top: 290px;
  color: #ffffff;
  padding: 0px;
  border:1px solid #ffffff;
  font-weight: bold;
  font-size: 13px;
  min-width: 50.7px;
}

.needleSmall {
  display: none;
}
</style>
