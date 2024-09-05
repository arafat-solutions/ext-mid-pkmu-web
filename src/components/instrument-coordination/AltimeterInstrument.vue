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
      altitudeVariants: [9000, 10000, 11000],
      minimumAltitude: null,
      maximumAltitude: null,
      signRandoms: ['+', '-'],
      currenSignTarget: null,
      defaultIntervalTarget: 3000, //in ms
      minimumIntervalTarget: 3000, //in ms
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
      isPressed: false,
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
        this.executeAltitudeMovement();
        this.executeTargetMovement();
      }
    },
  },
  computed: {
    intervalMovement() {
      const minInput = 1;
      const maxInput = 100;
      const minOutput = 1;
      const maxOutput = 100;

      // Apply the conversion formula
      const output = maxOutput - ((this.speed - minInput) / (maxInput - minInput)) * (maxOutput - minOutput);
      return output;
    },
  },
  mounted: function () {
    if (this.changeType !== 'inactive') {
      if (this.changeType !== 'keep_indicator') {
        this.initAltitude();
        this.executeTargetMovement();
      }
      this.executeAltitudeMovement();
    }
  },
  methods: {
    handleKeyDownPress(event) {
      if (this.isPause || this.isTimesUp || this.changeType === 'inactive' || this.changeType === 'keep_indicator') {
        return;
      }

      if (event.key === 'ArrowUp' && this.altitude <= this.maximumAltitude) {
        this.isPressed = true;
        this.altitude += 3;
        this.checkDurationTarget();
      } else if (event.key === 'ArrowDown' && this.altitude >= this.minimumAltitude) {
        this.isPressed = true;
        this.altitude -= 3;
        this.checkDurationTarget();
      }
    },
    handleKeyUpPress(event) {
      if (this.isPause || this.isTimesUp || this.changeType === 'inactive' || this.changeType === 'keep_indicator') {
        return;
      }

      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        this.isPressed = false;
        this.executeAltitudeMovement();
      }
    },
    getRandomInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    async executeAltitudeMovement() {
      if (this.isPause || this.isTimesUp || this.isPressed) {
        return;
      }

      if (this.changeType === 'adjust_for_consistent_updates') {
        if (this.altitude < this.maximumAltitude) {
          this.altitude += 1;
        }
        await this.delay(this.intervalMovement);
      } else if (this.changeType === 'adjust_for_irregular_updates') {
        const randomAddedAltitude = Math.floor(Math.random() * 3) + 1;
        for (let i = 0;i < randomAddedAltitude;i++) {
          if (this.altitude < this.maximumAltitude) {
            this.altitude += 1;
          }
          await this.delay(this.intervalMovement/randomAddedAltitude);
        }
      }
      this.checkDurationTarget();
      return this.executeAltitudeMovement();
    },
    generateRandomNumber(min, max) {
      // Ensure the number is within the range [min, max]
      let number = Math.floor(Math.random() * (max - min + 1)) + min;

      // Adjust to the nearest multiple of 10
      if (number % 10 !== 0) {
        number = number - (number % 10) + 10;
      }

      // Ensure the adjusted number is still within the range [min, max]
      return Math.min(Math.max(number, min), max);
    },
    getRandomOperator() {
      const randomIndex = Math.floor(Math.random() * this.signRandoms.length);
      return this.signRandoms[randomIndex];
    },
    initAltitude() {
      this.minimumAltitude = this.altitudeVariants[Math.floor(Math.random() * this.altitudeVariants.length)];
      this.maximumAltitude = this.minimumAltitude + 1000;
      this.altitude = this.generateRandomNumber(this.minimumAltitude, this.maximumAltitude);
    },
    async executeTargetMovement() {
      if (this.isPause || this.isTimesUp) {
        return;
      }

      if (!this.currenSignTarget) {
        this.currenSignTarget = this.getRandomOperator();
      }
      if (this.target) {
        if (this.currenSignTarget === '+') {
          this.target++;
          if (this.target >= this.maximumAltitude) {
            this.currenSignTarget = '-';
          }
        } else {
          this.target--;
          if (this.target <= this.minimumAltitude) {
            this.currenSignTarget = '+';
          }
        }
      } else {
        this.target = this.generateRandomNumber(this.minimumAltitude+200, this.maximumAltitude-200);
      }
      this.animate();
      await this.delay(this.intervalMovement/2);

      return this.executeTargetMovement();
    },
    drawTarget() {
      const canvas = this.$refs.targetCanvas;
      const ctx = canvas.getContext('2d');

      // Clear canvas
      ctx.clearRect(0, 0, this.width, this.height);

      // Center coordinates
      const centerX = this.width / 2;
      const centerY = this.height / 2;

      // Calculate the target angle
      const adjustedTarget = ((this.target - this.minimumAltitude) / (this.maximumAltitude - this.minimumAltitude)) * 360 - 90;

      // Convert adjustedTarget from degrees to radians
      const targetRadians = adjustedTarget * (Math.PI / 180);

      // Coordinates for the yellow object
      const yellowX = centerX + this.radius * Math.cos(targetRadians);
      const yellowY = centerY + this.radius * Math.sin(targetRadians);

      // Calculate the points of the triangle
      const triangleSize = 12; // Size of the triangle
      const angleOffset = Math.PI / 6; // Angle offset for the triangle

      const point1X = yellowX;
      const point1Y = yellowY;

      const point2X = yellowX + triangleSize * Math.cos(targetRadians + angleOffset);
      const point2Y = yellowY + triangleSize * Math.sin(targetRadians + angleOffset);

      const point3X = yellowX + triangleSize * Math.cos(targetRadians - angleOffset);
      const point3Y = yellowY + triangleSize * Math.sin(targetRadians - angleOffset);

      // Draw the triangle
      ctx.beginPath();
      ctx.moveTo(point1X, point1Y); // Top point of the triangle
      ctx.lineTo(point2X, point2Y); // Bottom left point of the triangle
      ctx.lineTo(point3X, point3Y); // Bottom right point of the triangle
      ctx.closePath(); // Close the path to form the triangle

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
</style>
<style>
.needleSmall {
  display: none;
}
</style>
