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
      altitude: 11000,
      altitudeVariants: [9000, 10000, 11000],
      minimumAltitude: 9000,
      maximumAltitude: 12000,
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
      gamepad: null,
      gamepadConnected: false,
      lastGamepadValue: 0,
    }
  },
  created() {
    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
  },
  beforeUnmount() {
    window.removeEventListener('gamepadconnected', this.onGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.onGamepadDisconnected);
    cancelAnimationFrame(this.animationFrameId);
  },
  watch: {
    isTimesUp(newValue) {
      if (newValue) {
        this.checkDurationTarget();
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
    this.initAltitude();
    if (this.changeType !== 'inactive') {
      if (this.changeType !== 'keep_indicator') {
        this.executeTargetMovement();
      }
      this.executeAltitudeMovement();
    }
    this.startGamepadPolling();
  },
  methods: {
    onGamepadConnected(e) {
      console.log('Connected:', e);
      if (e.gamepad.id === 'T.16000M (Vendor: 044f Product: b10a)') {
        console.log("Correct gamepad connected:", e.gamepad);
        this.gamepad = e.gamepad;
        this.gamepadConnected = true;
      } 
    },
    onGamepadDisconnected(e) {
      console.log('Disconnected:', e);
      if (e.gamepad.id === 'T.16000M (Vendor: 044f Product: b10a)') {
        console.log("Gamepad disconnected:", e.gamepad);
        this.gamepad = null;
        this.gamepadConnected = false;
      }
    },
    startGamepadPolling() {
      const pollGamepad = () => {
        if (this.gamepadConnected && !this.isPause && !this.isTimesUp && this.changeType !== 'inactive' && this.changeType !== 'keep_indicator') {
          const gamepad = navigator.getGamepads()[this.gamepad.index];
          const yAxis = gamepad.axes[1]; // Assuming Y-axis is at index 1
          
          // Only move if there's a significant change in the joystick position
          if (Math.abs(yAxis - this.lastGamepadValue) > 0.05) {
            // Invert the y-axis value for intuitive control (up is negative, down is positive)
            const movement = -yAxis * 10; // Adjust sensitivity as needed
            this.altitude = Math.max(this.minimumAltitude, Math.min(this.maximumAltitude, this.altitude + movement));
            this.checkDurationTarget();
            this.lastGamepadValue = yAxis;
          }
        }
        
        if (!this.isPause && !this.isTimesUp && this.changeType !== 'inactive' && this.changeType !== 'keep_indicator') {
          this.executeAutomaticMovement();
        }
        
        requestAnimationFrame(pollGamepad);
      };
      pollGamepad();
    },
    executeAutomaticMovement() {
      if (this.changeType === 'adjust_for_consistent_updates') {
        this.altitude = Math.min(this.altitude + 1, this.maximumAltitude);
      } else if (this.changeType === 'adjust_for_irregular_updates') {
        const randomAddedAltitude = Math.floor(Math.random() * 3) + 1;
        this.altitude = Math.min(this.altitude + randomAddedAltitude, this.maximumAltitude);
      }
      this.checkDurationTarget();
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
      let number = Math.floor(Math.random() * (max - min + 1)) + min;
      if (number % 10 !== 0) {
        number = number - (number % 10) + 10;
      }
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
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, this.width, this.height);

      const centerX = this.width / 2;
      const centerY = this.height / 2;

      const adjustedTarget = ((this.target - this.minimumAltitude) / (this.maximumAltitude - this.minimumAltitude)) * 360 - 90;

      const targetRadians = adjustedTarget * (Math.PI / 180);

      const yellowX = centerX + this.radius * Math.cos(targetRadians);
      const yellowY = centerY + this.radius * Math.sin(targetRadians);

      const triangleSize = 12;
      const angleOffset = Math.PI / 6;

      const point1X = yellowX;
      const point1Y = yellowY;

      const point2X = yellowX + triangleSize * Math.cos(targetRadians + angleOffset);
      const point2Y = yellowY + triangleSize * Math.sin(targetRadians + angleOffset);

      const point3X = yellowX + triangleSize * Math.cos(targetRadians - angleOffset);
      const point3Y = yellowY + triangleSize * Math.sin(targetRadians - angleOffset);

      ctx.beginPath();
      ctx.moveTo(point1X, point1Y);
      ctx.lineTo(point2X, point2Y);
      ctx.lineTo(point3X, point3Y);
      ctx.closePath();

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
