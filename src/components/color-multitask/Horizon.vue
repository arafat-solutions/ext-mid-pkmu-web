<template>
    <canvas ref="horizonCanvas" @mousemove="moveYellowLine" :width="horizonWidth" :height="horizonHeight" style="margin-bottom: 20px; margin-top: -20px"></canvas>
</template>

<script>
	export default {
		name: 'HorizonView',
		data() {
			return {
				isMouseInsideCircle: false,
				horizonWidth: 400,
				horizonHeight: 300,
				tiltAngle: 10,
				yellowLinePositionY: 0,
				yellowLinePositionX: 0,
				circleShiftX: 0,
				correctTime: 0,
				intervalRandomTilt: null,
				intervalRandomCircleShift: null,
			}
		},
		props: {
      isTimesUp: Boolean,
      speed: String,
      isPause: Boolean,
      isActive: Boolean
    },
		async mounted() {
			this.initHorizon();
		},
		watch: {
      isTimesUp() {
				clearInterval(this.intervalRandomTilt)
				clearInterval(this.intervalRandomCircleShift)

        this.$emit('getResult', {
          score: this.correctTime,
        });
      },
			isPause() {
				if (this.isPause) {
					clearInterval(this.intervalRandomTilt)
					clearInterval(this.intervalRandomCircleShift)
				} else {
					this.runningInterval('random-tilt')
					this.runningInterval('circle-shift')
				}
			},
    },
		methods: {
			runningInterval(type = null) {
				if (type == 'random-tilt') {
					this.intervalRandomTilt = setInterval(() => {
						this.randomTilt()
					}, this.setSpeed());
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
				this.circleRadius = Math.min(this.horizonWidth, this.horizonHeight) / 10; // Set Circle Radius

				if (!this.isActive) {
					this.tiltAngle = 0
				} else {
					this.runningInterval('random-tilt')
					this.runningInterval('circle-shift')
				}

				this.updateHorizon();
				canvas.addEventListener('mousemove', this.checkMousePosition);
			},
			getRandomShift(maxShift) {
				return (Math.random() * 2 - 1) * maxShift;
			},
			updateHorizon() {
				const canvas = this.$refs.horizonCanvas;
				const ctx = canvas.getContext("2d");

				ctx.clearRect(0, 0, this.horizonWidth, this.horizonHeight);
				ctx.save();

				ctx.translate(this.horizonWidth / 2, this.horizonHeight / 2);
				ctx.rotate((this.tiltAngle * Math.PI) / 180);

				ctx.fillStyle = '#87CEEB';
				ctx.fillRect(-this.horizonWidth, -this.horizonHeight, this.horizonWidth * 2, this.horizonHeight);

				ctx.strokeStyle = '#FFFFFF'; 
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(-this.horizonWidth, 0);
				ctx.lineTo(this.horizonWidth, 0);
				ctx.stroke();

				ctx.fillStyle = '#8B4513';
				ctx.fillRect(-this.horizonWidth, 0, this.horizonWidth * 2, this.horizonHeight);

				// Start Lines Front
				ctx.moveTo(this.circleShiftX + 50, -this.circleRadius * 1.2 - 15);
				ctx.lineTo(this.circleShiftX + 40, -this.circleRadius * 1.2);
				ctx.strokeStyle = '#FFFFFF';
				ctx.lineWidth = 3;
				ctx.stroke();

				ctx.beginPath();
				ctx.moveTo(this.circleShiftX + 25, -this.circleRadius * 1.2 - 20);
				ctx.lineTo(this.circleShiftX + 20, -this.circleRadius * 1.2 - 9);
				ctx.strokeStyle = '#FFFFFF';
				ctx.lineWidth = 3;
				ctx.stroke();

				ctx.beginPath();
				ctx.moveTo(this.circleShiftX, -this.circleRadius * 1.2 - 24);
				ctx.lineTo(this.circleShiftX, -this.circleRadius * 1.2 - 11);
				ctx.strokeStyle = '#FFFFFF';
				ctx.lineWidth = 3;
				ctx.stroke();

				ctx.beginPath();
				ctx.moveTo(this.circleShiftX - 25, -this.circleRadius * 1.2 - 20);
				ctx.lineTo(this.circleShiftX - 20, -this.circleRadius * 1.2 - 9);
				ctx.strokeStyle = '#FFFFFF';
				ctx.lineWidth = 3;
				ctx.stroke();

				ctx.beginPath();
				ctx.moveTo(this.circleShiftX - 50, -this.circleRadius * 1.2 - 15);
				ctx.lineTo(this.circleShiftX - 40, -this.circleRadius * 1.2);
				ctx.strokeStyle = '#FFFFFF';
				ctx.lineWidth = 3;
				ctx.stroke();
				// End Lines Front

				// Draw Circle in the Middle
				ctx.beginPath();
				ctx.arc(this.circleShiftX, 0, this.circleRadius, 0, Math.PI * 2); // Menggambar lingkaran
				ctx.closePath();
				ctx.fillStyle = 'rgba(0, 0, 0, 0)';
				ctx.fill();

				// Draw Triangle
				ctx.beginPath();
				ctx.moveTo(this.circleShiftX, -this.circleRadius * 1.0); // Titik puncak atas (40% dari radius)
				ctx.lineTo(this.circleShiftX - this.circleRadius + 120 * 0.2, this.circleRadius - 250 * 0.2); // Titik kiri bawah (20% dari radius)
				ctx.lineTo(this.circleShiftX + this.circleRadius - 120 * 0.2, this.circleRadius - 250 * 0.2); // Titik kanan bawah (20% dari radius)
				ctx.closePath();
				ctx.fillStyle = '#FFFFFF';
				ctx.fill();

				// Start Bottom Line
				ctx.beginPath();
				ctx.moveTo(this.circleShiftX - 10, this.circleRadius - 250 * 0.2 + 30);
				ctx.lineTo(this.circleShiftX - 40, this.circleRadius - 250 * 0.2 + 300 * 0.2);
				ctx.strokeStyle = '#FFFFFF';
				ctx.lineWidth = 3;
				ctx.stroke();

				ctx.beginPath();
				ctx.moveTo(this.circleShiftX + 10, this.circleRadius - 250 * 0.2 + 30);
				ctx.lineTo(this.circleShiftX + 40, this.circleRadius - 250 * 0.2 + 300 * 0.2);
				ctx.strokeStyle = '#FFFFFF';
				ctx.lineWidth = 3;
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
				this.tiltAngle = Math.random() * 20 - 15; // Slope degrees
				this.updateHorizon();
			},
			randomCircleShift() {
				const maxShift = 100; // Maximum shift for circle
				this.circleShiftX = this.getRandomShift(maxShift); // Generates random shifts for circles
				this.updateHorizon();
			},
			moveYellowLine(event) {
				if (this.isPause || this.isTimesUp || !this.isActive) {
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
				const canvas = this.$refs.horizonCanvas;
				const rect = canvas.getBoundingClientRect();
				const x = event.clientX - rect.left - this.horizonWidth / 2;
				const y = event.clientY - rect.top - this.horizonHeight / 2;

				// Memeriksa apakah mouse berada dalam radius lingkaran
				const distance = Math.sqrt(Math.pow(x - this.circleShiftX, 2) + Math.pow(y, 2));
				if (distance <= this.circleRadius) {
					this.isMouseInsideCircle = true;
					console.log('Mouse berada di dalam lingkaran');
				} else {
					this.isMouseInsideCircle = false;
					console.log('Mouse berada di luar lingkaran');
				}

				this.updateHorizon();
			},
			setSpeed() {
				if (this.speed == 'very_slow') {
					return 2500;
				}
				if (this.speed == 'slow') {
					return 2000;
				}
				if (this.speed == 'medium') {
					return 1500;
				}
				if (this.speed == 'fast') {
					return 1000;
				}
				if (this.speed == 'very_fast') {
					return 500;
				}
			}
		},
	};
</script>

<style scoped>
	canvas {
    border: 2px solid black;
  }
</style>


