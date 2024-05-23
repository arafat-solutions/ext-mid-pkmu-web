<template>
    <div class="horizon-container">
      <canvas ref="horizonCanvas" @mousemove="moveYellowLine"></canvas>
    </div>
  </template>
  
  <script>
  export default {
    name: 'HorizonView',
    data() {
      return {
        tiltAngle: 0,
        yellowLinePosition: 50
      };
    },
    mounted() {
      this.canvas = this.$refs.horizonCanvas;
      this.ctx = this.canvas.getContext('2d');
      this.canvas.width = 300;
      this.canvas.height = 300;
      this.updateHorizon();
      setInterval(this.randomTilt, 1000);
    },
    methods: {
      updateHorizon() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.rotate((this.tiltAngle * Math.PI) / 180);
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(-this.canvas.width, -this.canvas.height / 2, this.canvas.width * 2, this.canvas.height / 2);
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(-this.canvas.width, 0, this.canvas.width * 2, this.canvas.height / 2);
        this.ctx.restore();
  
        // Draw yellow line
        this.ctx.strokeStyle = 'yellow';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.yellowLinePosition, 0);
        this.ctx.lineTo(this.yellowLinePosition, this.canvas.height);
        this.ctx.stroke();
      },
      randomTilt() {
        this.tiltAngle = Math.random() * 20 - 10; // Random tilt between -10 and 10 degrees
        this.updateHorizon();
      },
      moveYellowLine(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        this.yellowLinePosition = x;
        this.updateHorizon();
      }
    }
  };
  </script>
  
  <style scoped>
  .horizon-container {
    border: 1px solid #000;
    width: 300px;
    height: 300px;
  }
  </style>
  