<template>
  <div class="horizon-section">
    <canvas ref="horizonCanvas" @mousemove="moveYellowLine" :width="horizonWidth" :height="horizonHeight" style="margin-bottom: 20px; margin-top: -20px"></canvas>
  </div>
</template>

<script>
export default {
  data() {
    return {
      tiltAngle: 10,
      yellowLinePositionY: 0,
      yellowLinePositionX: 0,
      circleShiftX: 0,
      horizonWidth: 400,
      horizonHeight: 300,
    };
  },
  async mounted() {
    this.initHorizon();
  },
  methods: {
    initHorizon() {
      const canvas = this.$refs.horizonCanvas;
      this.ctx = canvas.getContext("2d");

      this.yellowLinePositionX = this.horizonWidth / 2;
      this.yellowLinePositionY = this.horizonHeight / 2;

      this.circleShiftX = 0;
      this.circleRadius = Math.min(this.horizonWidth, this.horizonHeight) / 10; // Menentukan radius lingkaran

      this.updateHorizon();
      setInterval(this.randomTilt, 1000);

      // Menambahkan event listener untuk mouse move
      canvas.addEventListener('mousemove', this.checkMousePosition);
    },
    getRandomShift(maxShift) {
      // Menghasilkan nilai antara -maxShift dan maxShift
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

      // Start Garis Atas
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
      // End Garis Atas

      // Menggambar lingkaran di posisi acak di sekitar tengah
      ctx.beginPath();
      ctx.arc(this.circleShiftX, 0, this.circleRadius, 0, Math.PI * 2); // Menggambar lingkaran
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.fill();

      // Menggambar segitiga di dalam lingkaran
      ctx.beginPath();
      ctx.moveTo(this.circleShiftX, -this.circleRadius * 1.0); // Titik puncak atas (40% dari radius)
      ctx.lineTo(this.circleShiftX - this.circleRadius + 120 * 0.2, this.circleRadius - 250 * 0.2); // Titik kiri bawah (20% dari radius)
      ctx.lineTo(this.circleShiftX + this.circleRadius - 120 * 0.2, this.circleRadius - 250 * 0.2); // Titik kanan bawah (20% dari radius)
      ctx.closePath();
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Start Garis Bawah
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
      // End Garis Bawah

      ctx.restore();

      // Menggambar garis kuning horizontal
      const lineColor = this.isMouseInsideCircle ? 'green' : 'yellow';
      ctx.strokeStyle = lineColor;

      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, this.yellowLinePositionY);
      ctx.lineTo(this.horizonWidth, this.yellowLinePositionY);
      ctx.stroke();

      // Menggambar garis kuning vertikal
      ctx.beginPath();
      ctx.moveTo(this.yellowLinePositionX, 0);
      ctx.lineTo(this.yellowLinePositionX, this.horizonHeight);
      ctx.stroke();
    },
    randomTilt() {
      this.tiltAngle = Math.random() * 20 - 10; // Kemiringan acak antara -10 dan 10 derajat
      this.updateHorizon();
    },
    moveYellowLine(event) {
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
      } else {
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
