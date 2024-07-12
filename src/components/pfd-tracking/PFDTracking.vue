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
    this.config = config?.config || { altimeter: [], compass: [], speed: [] };
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
          this.speedUp();
          break;
        case 'ArrowDown':
          this.speedDown();
          break;
        case 'ArrowLeft':
          this.headingLeft();
          break;
        case 'ArrowRight':
          this.headingRight();
          break;
        case 'w':
          this.altitudeUp();
          break;
        case 's':
          this.altitudeDown();
          break;
      }
      this.draw();
    },
    speedUp() {
      this.speed += 10;
      this.offset.speed += 10;
    },
    speedDown() {
      this.speed -= 10;
      this.offset.speed -= 10;
    },
    headingRight() {
      this.heading -= 10;
      this.offset.heading -= 10;
    },
    headingLeft() {
      this.heading += 10;
      this.offset.heading += 10;
    },
    altitudeUp() {
      this.altitude += 10;
      this.offset.altitude += 10;
    },
    altitudeDown() {
      this.altitude -= 10;
      this.offset.altitude -= 10;
    },
    ascend(targetAltitude) {
      if (this.altitude < targetAltitude) {
        this.altitude += 10;
        this.offset.altitude += 10;
      }
    },
    descend(targetAltitude) {
      if (this.altitude > targetAltitude) {
        this.altitude -= 10;
        this.offset.altitude -= 10;
      }
    },

    startAnimation() {
      const animate = () => {
        this.updateIndicator('altimeter', 'altitude', 8500, 9100);
        this.updateIndicator('compass', 'heading', 0, 360);
        this.updateIndicator('speed', 'speed', 0, 180);
        this.draw();
        requestAnimationFrame(animate);

      };
      requestAnimationFrame(animate);
    },
    updateIndicator(configKey, indicator, min, max) {
      const config = this.config[configKey];
      if (!config) return;

      if (config.includes('inactive')) {
        return; // Do nothing
      }

      if (config.includes('keep_indication')) {
        // Do not change the value, just keep the blue line
        return;
      }

      const randomChange = (range) => (Math.random() * range * 2) - range;

      if (config.includes('adjust_for_consistent_updates')) {
        // Move at a fixed interval
        this[indicator] += this.direction[indicator] * this.animationSpeed;
        if (this[indicator] < min) {
          this[indicator] = min;
          this.direction[indicator] *= -1;
        } else if (this[indicator] > max) {
          this[indicator] = max;
          this.direction[indicator] *= -1;
        }
      }

      if (config.includes('adjust_for_irregular_updates')) {
        // Move at random intervals
        this[indicator] += randomChange(0.5); // Adjust range as needed
        if (this[indicator] < min) {
          this[indicator] = min;
        } else if (this[indicator] > max) {
          this[indicator] = max;
        }
      }
    },
    draw() {
      if (!this.context) return;
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;

      // x, y is starting point, width, height is the size of the ruler
      this.drawAltitude(50, centerY - 200, 50, 500);
      this.drawSpeed(this.canvas.width - 100, centerY - 200, 50, 500);
      this.drawHeading(centerX - 300, centerY + 200, 500, 50);
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

        if (i === this.altitude) {
          this.context.strokeStyle = 'blue';
        } else {
          this.context.strokeStyle = 'black';
        }

        // coloring the ruler
        // if i is between 8800 - 8900
        if (i >= 8800 && i <= 8900) {
          // if i is between 8840 - 8860
          if (i >= 8840 && i <= 8860) {
            this.context.strokeStyle = 'green';
          } else if (i >= 8820 && i <= 8880) {
            this.context.strokeStyle = 'yellow';
          } else {
            this.context.strokeStyle = 'red';
          }
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

      // draw triangle indicator at 8850 altitude
      let trianglePosY = y + (scaleHeight * (9100 - 8850 + this.offset.altitude)) / (9100 - 8600) + 10;
      if (trianglePosY < scaleY) {
        trianglePosY = scaleY;
      } else if (trianglePosY > scaleY + scaleHeight) {
        trianglePosY = scaleY + scaleHeight;
      }

      this.context.strokeStyle = 'green';
      this.context.fillStyle = 'white';
      this.context.beginPath();
      this.context.moveTo(x - 20, trianglePosY); // Starting point
      this.context.lineTo(x - 30, trianglePosY + 10); // Bottom point
      this.context.lineTo(x - 30, trianglePosY - 10); // Top point

      this.context.closePath();
      this.context.fill();
      this.context.stroke();

      this.context.strokeStyle = 'blue';
      this.context.beginPath();
      this.context.moveTo(x, y + height / 2);
      this.context.lineTo(x + width, y + height / 2);
      this.context.stroke();

      this.drawGreenPositionText(x, y + height, width, this.altitude);
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
      const labelInterval = 10; // Ensure labels appear at regular intervals

      // Adjust the start and end values based on the range and height
      const maxValue = 180;
      const minValue = 0;
      const range = maxValue - minValue;

      for (let i = maxValue + this.offset.speed; i >= minValue + this.offset.speed - range / interval; i -= interval) {
        let posY = scaleY + (scaleHeight * (maxValue - i + this.offset.speed)) / range;
        if (i === this.speed) {
          this.context.strokeStyle = 'blue';
        } else {
          this.context.strokeStyle = 'black';
        }

        // coloring the ruler
        // if i is between 8800 - 8900
        if (i >= 72 && i <= 108) {
          // if i is between 8840 - 8860
          if (i >= 85 && i <= 95) {
            this.context.strokeStyle = 'green';
          } else if (i >= 80 && i <= 100) {
            this.context.strokeStyle = 'yellow';
          } else {
            this.context.strokeStyle = 'red';
          }
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

      // draw triangle indicator at 90 speed
      let trianglePosY = y + (scaleHeight * (maxValue - 90 + this.offset.speed)) / range + 10;
      if (trianglePosY < scaleY) {
        trianglePosY = scaleY;
      } else if (trianglePosY > scaleY + scaleHeight) {
        trianglePosY = scaleY + scaleHeight;
      }

      this.context.strokeStyle = 'green';
      this.context.fillStyle = 'white';
      this.context.beginPath();
      this.context.moveTo(x - 20, trianglePosY);
      this.context.lineTo(x - 30, trianglePosY + 10);
      this.context.lineTo(x - 30, trianglePosY - 10);
      this.context.closePath();
      this.context.fill();
      this.context.stroke();

      this.context.strokeStyle = 'blue';
      this.context.beginPath();
      this.context.moveTo(x, y + height / 2);
      this.context.lineTo(x + width, y + height / 2);
      this.context.stroke();

      this.drawGreenPositionText(x, y + height, width, this.speed);
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
      this.context.lineTo(x + width + 120, y);
      this.context.lineTo(x + width, y);
      this.context.stroke();

      const scaleWidth = width - 20;
      const scaleX = x + 10;
      const interval = 5;
      const longLineLength = height / 2;
      const shortLineLength = height / 5;
      const labelInterval = Math.round((360 - 0) / 100);

      // This loop generates the stripes based on the ruler width
      for (let i = 0 + this.offset.heading; i <= 360 + this.offset.heading + scaleWidth / interval; i += interval) {
        let posX = scaleX + (scaleWidth * (i - this.offset.heading)) / (360 - 0);
        if (i === this.heading) {
          this.context.strokeStyle = 'blue';
        } else {
          this.context.strokeStyle = 'black';
        }

        // Coloring the ruler
        if (i >= 100 && i <= 270) {
          if (i >= 160 && i <= 200) {
            this.context.strokeStyle = 'green';
          } else if (i >= 120 && i <= 240) {
            this.context.strokeStyle = 'yellow';
          } else {
            this.context.strokeStyle = 'red';
          }
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

      // Draw triangle indicator
      let trianglePosX = x + (scaleWidth * (180 - this.offset.heading)) / (360 - 0) + 10;
      if (trianglePosX < scaleX) {
        trianglePosX = scaleX;
      } else if (trianglePosX > scaleX + scaleWidth) {
        trianglePosX = scaleX + scaleWidth;
      }
      this.context.strokeStyle = 'green';
      this.context.fillStyle = 'white';
      this.context.beginPath();
      this.context.moveTo(trianglePosX, y + 30);
      this.context.lineTo(trianglePosX + 10, y + 40);
      this.context.lineTo(trianglePosX - 10, y + 40);
      this.context.closePath();
      this.context.fill();
      this.context.stroke();

      this.context.strokeStyle = 'blue';
      this.context.beginPath();
      this.context.moveTo(x + width / 2, y);
      this.context.lineTo(x + width / 2, y + 30);
      this.context.stroke();
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
