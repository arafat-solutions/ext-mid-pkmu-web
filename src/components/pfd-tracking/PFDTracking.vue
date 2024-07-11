<template>
  <div class="canvas-container">
    <canvas ref="canvas" width="1000" height="600"></canvas>
  </div>
</template>

<script>
export default {
  data() {
    return {
      canvas: null,
      context: null,
      altitude: 8050,
      speed: 150,
      heading: 345,
      animationSpeed: 0.5,
      offset: { altitude: 0, speed: 0, heading: 0 },
    };
  },
  mounted() {
    this.canvas = this.$refs.canvas;
    this.context = this.canvas.getContext('2d');
    window.addEventListener('keydown', this.handleKeydown);
    this.startAnimation();
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    handleKeydown(event) {
      switch (event.key) {
        case 'ArrowUp':
          this.offset.speed += 10;
          break;
        case 'ArrowDown':
          this.offset.speed -= 10;
          break;
        case 'ArrowLeft':
          this.offset.heading -= 10;
          break;
        case 'ArrowRight':
          this.offset.heading += 10;
          break;
        case 'w':
          this.offset.altitude += 10;
          break;
        case 's':
          this.offset.altitude -= 10;
          break;
      }
      this.draw();
    },
    startAnimation() {
      setInterval(() => {
        this.altitude += (Math.random() * 2 - 1) * this.animationSpeed;
        this.heading += (Math.random() * 2 - 1) * this.animationSpeed;
        this.speed += (Math.random() * 2 - 1) * this.animationSpeed;
        this.draw();
      }, 1000 / 60);
    },
    draw() {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.drawIndicator(50, 150, 'Altitude', this.altitude, 8200, 7900, 50, 400, true, this.offset.altitude);
      this.drawIndicator(450, 300, 'Heading', this.heading, 0, 360, 400, 50, false, this.offset.heading);
      this.drawIndicator(800, 150, 'Speed', this.speed, 180, 0, 50, 400, true, this.offset.speed);
    },
    drawIndicator(x, y, label, value, minValue, maxValue, width, height, isVertical, offset) {
      this.context.fillStyle = 'white';
      this.context.fillRect(x, y, width, height);
      
      this.context.fillStyle = 'black';
      this.context.font = '12px Arial';
      this.context.fillText(label, x, y - 10);

      this.context.strokeStyle = 'black';
      this.context.lineWidth = 2;
      if (isVertical) {
        this.context.beginPath();
        this.context.moveTo(x, y);
        this.context.lineTo(x, y + height);
        this.context.lineTo(x + width, y + height);
        this.context.stroke();

        this.drawVerticalScale(x, y, width, height, value, minValue, maxValue, offset);
      } else {
        this.context.beginPath();
        this.context.moveTo(x, y);
        this.context.lineTo(x + width, y);
        this.context.lineTo(x + width, y + height);
        this.context.stroke();

        this.drawHorizontalScale(x, y, width, height, value, minValue, maxValue, offset);
      }
    },
    drawVerticalScale(x, y, width, height, value, minValue, maxValue, offset) {
      const scaleHeight = height - 20;
      const scaleY = y + 10;
      const interval = 10;
      const longLineLength = width / 2;
      const shortLineLength = width / 4;

      let currentMinValue = minValue + offset;
      let currentMaxValue = maxValue + offset;

      for (let i = currentMinValue; i >= currentMaxValue; i -= interval) {
        let posY = scaleY + (scaleHeight * (minValue - i + offset)) / (minValue - maxValue);
        if (i % 100 === 0) {
          this.context.fillText(i.toFixed(0), x + width + 5, posY);
          this.context.beginPath();
          this.context.moveTo(x, posY);
          this.context.lineTo(x + longLineLength, posY);
          this.context.stroke();
        } else {
          this.context.beginPath();
          this.context.moveTo(x, posY);
          this.context.lineTo(x + shortLineLength, posY);
          this.context.stroke();
        }
      }

      this.context.strokeStyle = 'blue';
      this.context.beginPath();
      this.context.moveTo(x, y + height / 2);
      this.context.lineTo(x + width, y + height / 2);
      this.context.stroke();

      this.drawGreenLine(x, y, width, height, value, minValue, maxValue, offset, scaleHeight);
    },
    drawHorizontalScale(x, y, width, height, value, minValue, maxValue, offset) {
      const scaleWidth = width - 20;
      const scaleX = x + 10;
      const interval = 10;
      const longLineLength = height / 2;
      const shortLineLength = height / 4;

      let currentMinValue = minValue + offset;
      let currentMaxValue = maxValue + offset;

      for (let i = currentMinValue; i <= currentMaxValue; i += interval) {
        let posX = scaleX + (scaleWidth * (i - minValue + offset)) / (maxValue - minValue);
        if (i % 30 === 0) {
          this.context.fillText(i.toFixed(0), posX, y + height + 20);
          this.context.beginPath();
          this.context.moveTo(posX, y);
          this.context.lineTo(posX, y + longLineLength);
          this.context.stroke();
        } else {
          this.context.beginPath();
          this.context.moveTo(posX, y);
          this.context.lineTo(posX, y + shortLineLength);
          this.context.stroke();
        }
      }

      this.context.strokeStyle = 'blue';
      this.context.beginPath();
      this.context.moveTo(x + width / 2, y);
      this.context.lineTo(x + width / 2, y + height);
      this.context.stroke();

      this.drawGreenLine(x, y, width, height, value, minValue, maxValue, offset, scaleWidth);
    },
    drawGreenLine(x, y, width, height, value, minValue, maxValue, offset, scaleSize) {
      const pointerPos = y + height / 2 + (height / 2 - ((value - minValue + offset) / (minValue - maxValue)) * scaleSize);
      const gradient = this.context.createLinearGradient(x, pointerPos - 50, x, pointerPos + 50);
      gradient.addColorStop(0, 'red');
      gradient.addColorStop(0.25, 'orange');
      gradient.addColorStop(0.5, 'yellow');
      gradient.addColorStop(0.75, 'green');
      gradient.addColorStop(1, 'green');

      this.context.strokeStyle = gradient;
      this.context.beginPath();
      this.context.moveTo(x, pointerPos);
      this.context.lineTo(x + width, pointerPos);
      this.context.stroke();

      this.context.fillStyle = 'green';
      this.context.beginPath();
      this.context.arc(x + width / 2, pointerPos, 5, 0, 2 * Math.PI);
      this.context.fill();
    },
  },
};
</script>

<style scoped>
.canvas-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  height: 100vh;
}
canvas {
  border: 1px solid #000;
  background-color: #f0f0f0;
}
</style>
