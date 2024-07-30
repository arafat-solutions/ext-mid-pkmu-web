<template>
  <canvas ref="dartCanvas" :width="width" :height="height"></canvas>
</template>

<script>
	export default {
		name: 'DartView',
		data() {
			return {
				width: 250,
        height: 250,
        radius: 80,
        angle: 0,
        angleIncrement: 0.005,
        changeDirectionInterval: 2000,
        greenDotX: 0,
        greenDotY: 0,
        greenDotColor: 'green',
        animationFrameId: null,
			}
		},
		async mounted() {
			this.initDart();
		},
    beforeUnmount() {
      clearInterval(this.countdownInterval);
      cancelAnimationFrame(this.animationFrameId);
    },
		methods: {
      initDart() {
        this.animate();

        this.greenDotX = this.width / 2;
        this.greenDotY = this.height / 2;
      },
      drawDart() {
        const canvas = this.$refs.dartCanvas;
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.clearRect(0, 0, this.width, this.height);

        // Center coordinates
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // Draw main circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'blue';
        ctx.stroke();

        // Draw axes
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, this.height);
        ctx.moveTo(0, centerY);
        ctx.lineTo(this.width, centerY);
        ctx.strokeStyle = 'grey';
        ctx.stroke();

        // Koordinat objek kuning
        const yellowX = centerX + this.radius * Math.cos(this.angle);
        const yellowY = centerY + this.radius * Math.sin(this.angle);

        // Hitung titik-titik segitiga
        const triangleSize = 20; // Ukuran segitiga
        const angleOffset = Math.PI / 6; // Offset sudut untuk segitiga

        const point1X = yellowX;
        const point1Y = yellowY;

        const point2X = yellowX + triangleSize * Math.cos(this.angle + angleOffset);
        const point2Y = yellowY + triangleSize * Math.sin(this.angle + angleOffset);

        const point3X = yellowX + triangleSize * Math.cos(this.angle - angleOffset);
        const point3Y = yellowY + triangleSize * Math.sin(this.angle - angleOffset);

        // Gambar segitiga
        ctx.beginPath();
        ctx.moveTo(point1X, point1Y); // Titik puncak segitiga
        ctx.lineTo(point2X, point2Y); // Titik kiri bawah segitiga
        ctx.lineTo(point3X, point3Y); // Titik kanan bawah segitiga
        ctx.closePath(); // Menghubungkan titik terakhir dengan titik pertama

        ctx.fillStyle = 'green';
        ctx.fill();
      },
      animate() {
        this.angle += this.angleIncrement;
        this.drawDart();
        this.animationFrameId = requestAnimationFrame(this.animate);
      },
		},
	};
</script>

<style scoped>
	canvas {
    border: 0px solid black;
    margin-top: 20px;
  }
</style>
