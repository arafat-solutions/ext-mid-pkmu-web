<template>
  <div class="radar-container">
    <canvas ref="radarCanvas" :width="width" :height="height"></canvas>
    <div class="counter">
      <p>Circles appeared: {{ circleCount }}</p>
      <p>User clicks: {{ userClickCount }}</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      width: 800,
      height: 600,
      scannerAngle: 0,
      objects: [],
      circleCount: 0,
      userClickCount: 0,
    };
  },
  mounted() {
    this.initRadar();
    this.startRadar();
    window.addEventListener("keydown", this.handleKeydown);
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.handleKeydown);
  },
  methods: {
    initRadar() {
      const canvas = this.$refs.radarCanvas;
      this.ctx = canvas.getContext("2d");
    },
    startRadar() {
      setInterval(this.updateRadar, 100);
      setInterval(this.addObject, 2000);
    },
    updateRadar() {
      this.clearRadar();
      this.drawRadar();
      this.scannerAngle += 0.05;
      if (this.scannerAngle > 2 * Math.PI) {
        this.scannerAngle = 0;
      }
    },
    clearRadar() {
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(0, 0, this.width, this.height);
    },
    drawRadar() {
      const ctx = this.ctx;
      const radius = Math.min(this.width, this.height) / 2;
      ctx.strokeStyle = "green";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.width / 2, this.height / 2, radius, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw scanner
      ctx.beginPath();
      ctx.moveTo(this.width / 2, this.height / 2);
      ctx.arc(
        this.width / 2,
        this.height / 2,
        radius,
        this.scannerAngle,
        this.scannerAngle + Math.PI / 6
      );
      ctx.closePath();
      ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
      ctx.fill();

      // Draw grid
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(
          this.width / 2,
          this.height / 2,
          (radius / 4) * i,
          0,
          2 * Math.PI
        );
        ctx.stroke();
      }

      // Draw objects
      for (let obj of this.objects) {
        const distance = Math.hypot(obj.x - this.width / 2, obj.y - this.height / 2);
        const angle = Math.atan2(obj.y - this.height / 2, obj.x - this.width / 2);

        // Only draw objects that are in the scanned area
        if (this.isInScannedArea(angle, distance, radius)) {
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, 5, 0, 2 * Math.PI);
          if (obj.type === "circle") {
            ctx.fillStyle = "white";
          } else {
            ctx.fillStyle = "red";
            ctx.fillRect(obj.x - 5, obj.y - 5, 10, 10);
            continue;
          }
          ctx.fill();
        }
      }
    },
    isInScannedArea(angle, distance, radius) {
      const scannerStartAngle = this.scannerAngle;
      const scannerEndAngle = this.scannerAngle + Math.PI / 6;
      return (
        distance <= radius &&
        (angle >= scannerStartAngle && angle <= scannerEndAngle)
      );
    },
    addObject() {
      const radius = Math.min(this.width, this.height) / 2;
      const angle = this.scannerAngle + Math.random() * Math.PI / 6;
      const distance = Math.random() * radius;
      const x = this.width / 2 + distance * Math.cos(angle);
      const y = this.height / 2 + distance * Math.sin(angle);
      const type = Math.random() < 0.5 ? "circle" : "square";
      this.objects.push({ x, y, type });

      if (type === "circle") {
        this.circleCount++;
        console.log(`Circles appeared: ${this.circleCount}`);
      }

      // Remove objects that are too old
      if (this.objects.length > 50) {
        this.objects.shift();
      }
    },
    handleKeydown(event) {
      if (event.code === "Space") {
        this.userClickCount++;
        console.log(`User clicks: ${this.userClickCount}`);
      }
    },
  },
};
</script>

<style scoped>
.radar-container {
  display: flex;
  align-items: center;
}

canvas {
  display: block;
  margin: 0 auto;
  background-color: black;
}

.counter {
  margin-left: 20px;
  color: black;
}
</style>
