<template>
  <div class="horizon-section">
    <canvas ref="horizonCanvas" @mousemove="moveYellowLine" :width="horizonWidth" :height="horizonHeight"
      style="margin-bottom: 20px; margin-top: -20px" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      isMouseInsideCircle: false,
      tiltAngle: 0,
      yellowLinePositionY: 0,
      yellowLinePositionX: 0,
      circleShiftX: 0,
      horizonWidth: 400,
      horizonHeight: 300,
      greenLineStartTime: null,
      greenLineDuration: 0,
      targetTiltAngle: 0,
      targetCircleShiftX: 0,
      currentTilt: 0,
      currentShiftX: 0,
      intervalRandomTilt: null,
      intervalRandomCircleShift: null,
      yellowLineMoved: false,
      result: {
        startTimes: [],
        endTimes: []
      },
      gamepadIndex: null,
      gamepadSensitivity: 10,
    };
  },
  props: {
    speed: String,
    minuteTime: Number,
    isTimesUp: Boolean,
    isPause: Boolean,
    isActive: Boolean,
  },
  mounted() {
    this.initHorizon();
  },
  computed: {
    accuracy() {
      return Number(((this.greenLineDuration / (this.minuteTime * 60)) * 100).toFixed(2));
    },
  },
  watch: {
    isTimesUp() {
      clearInterval(this.intervalRandomTilt);
      clearInterval(this.intervalRandomCircleShift);
      if (this.greenLineStartTime) {
        const currentTime = Date.now();
        this.greenLineDuration += (currentTime - this.greenLineStartTime) / 1000; // Calculate duration in seconds
        this.greenLineStartTime = null; // Reset start time when exiting circle
      }

      this.$emit('getResult', {
        accuracy: this.accuracy,
        correctTime: Number(this.greenLineDuration.toFixed(2)),
      });
    },
    isPause() {
      if (this.isPause) {
        clearInterval(this.intervalRandomTilt);
        clearInterval(this.intervalRandomCircleShift);
      } else {
        this.runningInterval('random-tilt');
        this.runningInterval('circle-shift');
      }
    },
  },
  methods: {
    runningInterval(type = null) {
      if (type === 'random-tilt') {
        this.intervalRandomTilt = setInterval(() => {
          this.randomTilt();
        }, this.setSpeed());
      }

      if (type === 'circle-shift') {
        this.intervalRandomCircleShift = setInterval(() => {
          this.randomCircleShift();
        }, this.setSpeed());
      }
    },
    initHorizon() {
      if (!this.$refs.horizonCanvas) {
        return;
      }
      const canvas = this.$refs.horizonCanvas;
      this.ctx = canvas.getContext("2d");

      this.yellowLinePositionX = this.horizonWidth / 2;
      this.yellowLinePositionY = this.horizonHeight / 2;

      this.circleShiftX = 0;
      this.tiltAngle = 0;
      this.circleRadius = Math.min(this.horizonWidth, this.horizonHeight) / 20;
      if (this.isActive) {
        this.runningInterval('random-tilt');
        this.runningInterval('circle-shift');
      }

      this.updateHorizon();

      // Adding event listener for mouse move
      canvas.addEventListener('mousemove', this.checkMousePosition);

      window.addEventListener('gamepadconnected', this.onGamepadConnected);
      window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
      this.checkGamepad();
    },
    // for gamepad
    onGamepadConnected(event) {
      console.log('connected', event)
      if (event.gamepad.id !== 'T.16000M (Vendor: 044f Product: b10a)') {
        return;
      }
      this.gamepadIndex = event.gamepad.index;
      this.checkGamepad();
    },
    onGamepadDisconnected(event) {
      console.log('disconnected', event)
      if (this.gamepadIndex === event.gamepad.index) {
        this.gamepadIndex = null;
      }
    },
    checkGamepad() {
      if (this.gamepadIndex !== null) {
        const gamepad = navigator.getGamepads()[this.gamepadIndex];
        if (gamepad) {
          this.handleGamepadInput(gamepad);
        }
      }
      requestAnimationFrame(this.checkGamepad);
    },

    handleGamepadInput(gamepad) {
      if (this.isPause || this.isTimesUp || !this.isActive) {
        return;
      }

      const [leftStickX, leftStickY] = gamepad.axes;

      // Update yellow line position based on flightstick input
      this.yellowLinePositionX += leftStickX * this.gamepadSensitivity;
      this.yellowLinePositionY += leftStickY * this.gamepadSensitivity;

      // Ensure the yellow line stays within the canvas boundaries
      this.yellowLinePositionX = Math.max(0, Math.min(this.horizonWidth, this.yellowLinePositionX));
      this.yellowLinePositionY = Math.max(0, Math.min(this.horizonHeight, this.yellowLinePositionY));

      this.yellowLineMoved = true;
      this.updateHorizon();
      this.checkMousePosition();
    },
    updateHorizon() {
      if (this.isPause || this.isTimesUp) {
        return;
      }

      if (!this.$refs.horizonCanvas) {
        return;
      }
      const canvas = this.$refs.horizonCanvas;
      const ctx = canvas.getContext("2d");

      ctx.clearRect(0, 0, this.horizonWidth, this.horizonHeight);
      ctx.save();

      ctx.translate(this.horizonWidth / 2, this.horizonHeight / 2);
      ctx.rotate((this.tiltAngle * Math.PI) / 180);

      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(-this.horizonWidth, -this.horizonHeight, this.horizonWidth * 2, this.horizonHeight);

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-this.horizonWidth, 0);
      ctx.lineTo(this.horizonWidth, 0);
      ctx.stroke();

      ctx.fillStyle = '#8B4513';
      ctx.fillRect(-this.horizonWidth, 0, this.horizonWidth * 2, this.horizonHeight);

      // Start Lines Front
      ctx.beginPath();
      ctx.moveTo(this.circleShiftX + 65, -this.circleRadius * 1.5 + 15);
      ctx.lineTo(this.circleShiftX + 50, -this.circleRadius * 1.5 + 15);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.circleShiftX + 55, -this.circleRadius * 1.5 - 10);
      ctx.lineTo(this.circleShiftX + 45, -this.circleRadius * 1.5 - 4);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.circleShiftX + 35, -this.circleRadius * 1.5 - 30);
      ctx.lineTo(this.circleShiftX + 25, -this.circleRadius * 1.5 - 20);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.circleShiftX, -this.circleRadius * 1.5 - 40);
      ctx.lineTo(this.circleShiftX, -this.circleRadius * 1.5 - 25);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.circleShiftX - 35, -this.circleRadius * 1.5 - 30);
      ctx.lineTo(this.circleShiftX - 25, -this.circleRadius * 1.5 - 20);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.circleShiftX - 55, -this.circleRadius * 1.5 - 10);
      ctx.lineTo(this.circleShiftX - 45, -this.circleRadius * 1.5 - 4);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.circleShiftX - 65, -this.circleRadius * 1.5 + 15);
      ctx.lineTo(this.circleShiftX - 50, -this.circleRadius * 1.5 + 15);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();
      // End Lines Front

      // Draw Circle in the Middle
      ctx.beginPath();
      ctx.arc(this.circleShiftX, 0, this.circleRadius + 5, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.fill();

      // Draw Triangle
      ctx.beginPath();
      ctx.moveTo(this.circleShiftX, -this.circleRadius - (this.circleRadius * 0.8));
      ctx.lineTo(this.circleShiftX - (this.circleRadius * 0.8), -this.circleRadius);
      ctx.lineTo(this.circleShiftX + (this.circleRadius * 0.8), -this.circleRadius);
      ctx.closePath();
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Start Bottom Line
      ctx.beginPath();
      ctx.moveTo(this.circleShiftX - 20, this.circleRadius - 250 * 0.2 + 50);
      ctx.lineTo(this.circleShiftX - 50, this.circleRadius + 20);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.circleShiftX + 20, this.circleRadius - 250 * 0.2 + 50);
      ctx.lineTo(this.circleShiftX + 50, this.circleRadius + 20);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 5;
      ctx.stroke();
      // End Bottom Line

      ctx.restore();

      // Draw horizontal yellow/green line
      const lineColor = this.isMouseInsideCircle ? 'green' : 'yellow';
      ctx.strokeStyle = lineColor;

      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, this.yellowLinePositionY);
      ctx.lineTo(this.horizonWidth, this.yellowLinePositionY);
      ctx.stroke();

      // Draw vertical yellow/green line
      ctx.beginPath();
      ctx.moveTo(this.yellowLinePositionX, 0);
      ctx.lineTo(this.yellowLinePositionX, this.horizonHeight);
      ctx.stroke();
    },
    randomTilt() {
      const targetTilt = this.isActive ? this.getRandom(-80, 80) : 0;
      this.animateValue(this.currentTilt, targetTilt, this.setSpeed(), (value) => {
        this.currentTilt = value;
        this.tiltAngle = value;
        this.updateHorizon();
      });
    },
    randomCircleShift() {
      const targetShift = this.isActive ? this.getRandom(-125, 125) : 0;
      this.animateValue(this.currentShiftX, targetShift, this.setSpeed(), (value) => {
        this.currentShiftX = value;
        this.circleShiftX = value;
        this.updateHorizon();
      });

      this.checkMousePosition();
    },
    moveYellowLine(event) {
      if (this.isPause || this.isTimesUp || !this.isActive) {
        return;
      }

      // Update flag yellowLineMoved
      this.yellowLineMoved = true;

      if (!this.$refs.horizonCanvas) {
        return;
      }

      const canvas = this.$refs.horizonCanvas;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      this.yellowLinePositionX = x;
      this.yellowLinePositionY = y;

      this.updateHorizon();
    },
    checkMousePosition(event) {
      if (!this.yellowLineMoved) {
        return;
      }

      if (!this.$refs.horizonCanvas) {
        return;
      }
      const canvas = this.$refs.horizonCanvas;
      const rect = canvas.getBoundingClientRect();

      let x = this.yellowLinePositionX - this.horizonWidth / 2;
      let y = this.yellowLinePositionY - this.horizonHeight / 2;

      if (event) {
        x = event.clientX - rect.left - this.horizonWidth / 2;
        y = event.clientY - rect.top - this.horizonHeight / 2;
      }

      // Memeriksa apakah mouse berada dalam radius lingkaran
      const distance = Math.sqrt(Math.pow(x - this.circleShiftX, 2) + Math.pow(y, 2));
      if (distance <= (this.circleRadius + 5)) {
        if (!this.greenLineStartTime) {
          this.greenLineStartTime = Date.now();
        }

        this.isMouseInsideCircle = true;
      } else {
        if (this.greenLineStartTime) {
          const currentTime = Date.now();
          this.greenLineDuration += (currentTime - this.greenLineStartTime) / 1000; // Calculate duration in seconds
          this.greenLineStartTime = null; // Reset start time when exiting circle
        }

        this.isMouseInsideCircle = false;
      }

      this.updateHorizon();
    },
    startCountdown() {
      this.countdownInterval = setInterval(() => {
        if (this.config.duration > 0) {
          this.config.duration--;
        } else {
          clearInterval(this.countdownInterval);
          this.calculatedResult();
        }
      }, 1000);
    },
    setSpeed() {
      if (this.speed === 'very_slow') {
        return 6000;
      }
      if (this.speed === 'slow') {
        return 5000;
      }
      if (this.speed === 'medium') {
        return 4000;
      }
      if (this.speed === 'fast') {
        return 3000;
      }
      if (this.speed === 'very_fast') {
        return 2000;
      }
    },
    getRandom(min, max) {
      return Math.random() * (max - min) + min;
    },
    animateValue(start, end, duration, callback) {
      const startTime = performance.now();

      const step = (currentTime) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const easedProgress = this.easeInOutCubic(progress);

        const value = start + (end - start) * easedProgress;
        callback(value);

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    },
    easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },
  },
};
</script>

<style scoped>
.fill-animation {
  transition: height 1s ease;
  /* Animation for height change */
}

.line canvas {
  border: 0px !important;
}

.horizon-section {
  position: relative;
}

canvas {
  border: 2px solid black;
}

.warning-light.active {
  background-color: red;
}
</style>
