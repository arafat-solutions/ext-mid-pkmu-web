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
      altitude: 8800,
      speed: 150,
      heading: 345,
      animationSpeed: 0.5,
      offset: { altitude: 0, speed: 0, heading: 0 },
      direction: { altitude: -1, speed: 1, heading: 1 },
      config: {}
    };
  },
  mounted() {
    const scheduleData = localStorage.getItem('scheduleData');
    const tests = JSON.parse(scheduleData).tests;
    const config = tests?.find((test) => {
      return test.name === 'PFD Tracking Test';
    });
    this.config = config?.config;
    console.log('config', this.config);
    this.canvas = this.$refs.canvas;
    this.context = this.canvas.getContext('2d');
    window.addEventListener('keydown', this.handleKeydown);
    this.startAnimation();
    window.addEventListener('resize', this.draw);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('resize', this.draw);
  },
  methods: {
    handleKeydown(event) {
      switch (event.key) {
        case 'ArrowUp':
          this.speed += 10;
          break;
        case 'ArrowDown':
          this.speed -= 10;
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
        this.updateIndicator('altitude', 8500, 9100);
        this.updateIndicator('speed', 0, 180);
        this.updateIndicator('heading', 0, 360);
        this.draw();
      }, 1000 / 60);
    },
    updateIndicator(indicator, min, max) {
      console.log('updateIndicator', indicator, min, max);
      // hey GPT, update this one. 
    },
    draw() {
      if (!this.context) return;
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;

      this.drawAltitude(50, centerY - 200, 50, 500);
      this.drawSpeed(this.canvas.width - 100, centerY - 200, 50, 500);
      this.drawHeading(centerX - 200, centerY + 200, 300, 50);
    },
    drawAltitude(x, y, width, height) {
      this.context.fillStyle = 'white';
      this.context.fillRect(x, y, width, height);

      this.context.fillStyle = 'black';
      this.context.font = '12px Arial';
      this.context.fillText('Altitude', x, y - 10);

      this.context.strokeStyle = 'black';
      this.context.lineWidth = 2;
      this.context.beginPath();
      this.context.moveTo(x, y);
      this.context.lineTo(x, y + height);
      this.context.lineTo(x + width, y + height);
      this.context.stroke();

      const scaleHeight = height - 20;
      const scaleY = y + 10;
      const interval = 5;
      const longLineLength = width / 1.5;
      const shortLineLength = width / 4;
      const labelInterval = Math.round((9100 - 8600) / 10);

      for (let i = 9100 + this.offset.altitude; i >= 8600 + this.offset.altitude - height / interval; i -= interval) {
        let posY = scaleY + (scaleHeight * (9100 - i + this.offset.altitude)) / (9100 - 8600);
        let distanceFromCenter = Math.abs(i - this.altitude);
        if (distanceFromCenter <= 50) {
          let color = this.getColorForDistanceAltitude(distanceFromCenter);
          this.context.strokeStyle = color;
        } else {
          this.context.strokeStyle = 'black';
        }
        if (i % labelInterval === 0) {
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

      this.drawGreenPositionText(x, y + height, width, this.altitude + this.offset.altitude);
    },
    drawSpeed(x, y, width, height) {
      this.context.fillStyle = 'white';
      this.context.fillRect(x, y, width, height);

      this.context.fillStyle = 'black';
      this.context.font = '12px Arial';
      this.context.fillText('Speed', x, y - 10);

      this.context.strokeStyle = 'black';
      this.context.lineWidth = 2;
      this.context.beginPath();
      this.context.moveTo(x, y);
      this.context.lineTo(x, y + height);
      this.context.lineTo(x + width, y + height);
      this.context.stroke();

      const scaleHeight = height - 20;
      const scaleY = y + 10;
      const interval = 2; // Smaller interval for finer control
      const longLineLength = width / 1.5;
      const shortLineLength = width / 4;
      const labelInterval = 18; // Ensure labels appear at regular intervals

      // Adjust the start and end values based on the range and height
      const maxValue = 180;
      const minValue = 0;
      const range = maxValue - minValue;

      for (let i = maxValue; i >= minValue - range / interval; i -= interval) {
        let posY = scaleY + (scaleHeight * (maxValue - i)) / range;
        let distanceFromCenter = Math.abs(i - (this.speed + this.offset.speed));
        if (distanceFromCenter <= 20) {
          let color = this.getColorForDistanceSpeed(distanceFromCenter);
          this.context.strokeStyle = color;
        } else {
          this.context.strokeStyle = 'black';
        }
        if (i % labelInterval === 0) {
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

      this.drawGreenPositionText(x, y + height, width, this.speed + this.offset.speed);
    },

    drawHeading(x, y, width, height) {
      this.context.fillStyle = 'white';
      this.context.fillRect(x, y, width, height);

      this.context.fillStyle = 'black';
      this.context.font = '12px Arial';
      this.context.fillText('Heading', x, y - 10);

      this.context.strokeStyle = 'black';
      this.context.lineWidth = 2;
      this.context.beginPath();
      this.context.moveTo(x, y);
      this.context.lineTo(x + width, y);
      this.context.lineTo(x + width, y + height);
      this.context.stroke();

      const scaleWidth = width - 20;
      const scaleX = x + 10;
      const interval = 5;
      const longLineLength = height / 1.5;
      const shortLineLength = height / 4;
      const labelInterval = Math.round((360 - 0) / 10);

      for (let i = 0 + this.offset.heading; i <= 360 + this.offset.heading + scaleWidth / interval; i += interval) {
        let posX = scaleX + (scaleWidth * (i - this.offset.heading)) / (360 - 0);
        let distanceFromCenter = Math.abs(i - this.heading);
        if (distanceFromCenter <= 20) {
          let color = this.getColorForDistanceHeading(distanceFromCenter);
          this.context.strokeStyle = color;
        } else {
          this.context.strokeStyle = 'black';
        }
        if (i % labelInterval === 0) {
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
    },

    getColorForDistanceAltitude(distance) {
      if (distance <= 20) {
        return 'green';
      } else if (distance <= 40) {
        return 'yellow';
      } else {
        return 'red';
      }
    },

    getColorForDistanceSpeed(distance) {
      if (distance <= 5) {
        return 'green';
      } else if (distance <= 10) {
        return 'yellow';
      } else {
        return 'red';
      }
    },

    getColorForDistanceHeading(distance) {
      if (distance <= 5) {
        return 'green';
      } else if (distance <= 10) {
        return 'yellow';
      } else {
        return 'red';
      }
    },
    drawGreenPositionText(x, y, width, value) {
      this.context.fillStyle = 'black';
      this.context.fillRect(x, y + 5, width, 20);

      this.context.fillStyle = 'green';
      this.context.font = '16px Arial';
      this.context.textAlign = 'center';
      this.context.fillText(value.toFixed(0), x + width / 2, y + 20);
    }
  },
};
</script>

<style scoped>
.canvas-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  height: 90vh;
}

canvas {
  background-color: #ffffff;
}
</style>
