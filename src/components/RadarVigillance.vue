<template>
  <div>
    <canvas ref="radarCanvas" :width="width" :height="height"></canvas>
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
    };
  },
  mounted() {
    this.initRadar();
    this.startRadar();
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
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "white";
        ctx.fill();
      }
    },
    addObject() {
      const radius = Math.min(this.width, this.height) / 2;
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radius;
      const x = this.width / 2 + distance * Math.cos(angle);
      const y = this.height / 2 + distance * Math.sin(angle);
      this.objects.push({ x, y });

      // Remove objects that are too old
      if (this.objects.length > 50) {
        this.objects.shift();
      }
    },
  },
};
</script>

<style>
canvas {
  display: block;
  margin: 0 auto;
  background-color: black;
}
</style>
