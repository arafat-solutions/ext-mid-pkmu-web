<template>
  <div class="horizon-section">
    <canvas
      ref="horizonCanvas"
      @mousemove="moveYellowLine"
      :width="horizonWidth"
      :height="horizonHeight"
      style="margin-bottom: 20px; margin-top: -20px"
    />
  </div>
</template>

<script>
export default {
  data() {
    return {
      isMouseInsideCircle: false,
      tiltAngle: 10,
      yellowLinePositionY: 0,
      yellowLinePositionX: 0,
      circleShiftX: 0,
      horizonWidth: 400,
      horizonHeight: 300,
      greenLineStartTime: null,
      greenLineDuration: 0,
      intervalRandomTilt: null,
      intervalRandomCircleShift: null,
      yellowLineMoved: false,
      result: {
        startTimes: [],
        endTimes: []
      }
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
      clearInterval(this.intervalRandomTilt)
			clearInterval(this.intervalRandomCircleShift)

      this.$emit('getResult', {
        accuracy: this.accuracy,
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
			if (type == 'random-tilt') {
				this.intervalRandomTilt = setInterval(() => {
					this.randomTilt();
				}, this.speedInterval());
			}

			if (type == 'circle-shift') {
				this.intervalRandomCircleShift = setInterval(() => {
					this.randomCircleShift();
				}, 1000);
			}
		},
    initHorizon() {
      const canvas = this.$refs.horizonCanvas;
      this.ctx = canvas.getContext("2d");

      this.yellowLinePositionX = this.horizonWidth / 2;
      this.yellowLinePositionY = this.horizonHeight / 2;

      this.circleShiftX = 0;
      this.circleRadius = Math.min(this.horizonWidth, this.horizonHeight) / 20;
      if (!this.isActive) {
				this.tiltAngle = 0;
			} else {
				this.runningInterval('random-tilt');
				this.runningInterval('circle-shift');
			}

      this.updateHorizon();
      //Random Tilt
      setInterval(this.randomTilt, this.speedInterval());

      //Random Circle X
      setInterval(this.randomCircleShift, this.speedInterval());

      // Menambahkan event listener untuk mouse move
      canvas.addEventListener('mousemove', this.checkMousePosition);
    },
    updateHorizon() {
      if (this.isPause || this.isTimesUp || !this.isActive) {
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
			ctx.arc(this.circleShiftX, 0, this.circleRadius, 0, Math.PI * 2);
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
      this.tiltAngle = this.smoothRandom(-80, 80, this.tiltAngle); // Kemiringan acak antara -80 dan 80 derajat
      this.updateHorizon();
    },
    randomCircleShift() {
      this.circleShiftX = this.smoothRandom(-125, 125, this.circleShiftX); // Kemiringan acak antara -125 dan 125 x position
      this.updateHorizon();
			this.checkMousePosition();
    },
    moveYellowLine(event) {
      if (this.isPause || this.isTimesUp || !this.isActive) {
        return;
      }

      // Update flag yellowLineMoved
      this.yellowLineMoved = true;

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
			if (distance <= this.circleRadius) {
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
    speedInterval() {
      switch (this.speed) {
        case 'very_slow':
          return 1250;
        case 'slow':
          return 1000;
        case 'medium':
          return 750;
        case 'fast':
          return 500;
        case 'very_fast':
          return 250;
        default:
          return 1000;
      }
    },
    smoothRandom(min, max, previousValue, smoothingFactor = 1) {
      let u = 0, v = 0;
      while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
      while(v === 0) v = Math.random();
      let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      num = num / 10.0 + 0.5; // Translate to 0 -> 1
      if (num > 1 || num < 0) return this.smoothRandom(min, max, smoothingFactor); // Resample between 0 and 1
      num *= max - min + 1;
      num += min;

      // Apply smoothing
      previousValue = previousValue + smoothingFactor * (num - previousValue);

      return previousValue;
    },
  },
};
</script>

<style scoped>
.fill-animation {
  transition: height 1s ease; /* Animation for height change */
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
