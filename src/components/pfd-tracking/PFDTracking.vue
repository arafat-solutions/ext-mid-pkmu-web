<template>
  <div class="canvas-container">
    <canvas ref="canvas" width="1000" height="600"></canvas>
  </div>
  {{ this.altitude }} to {{ this.targetAltitude }} <br>
  {{ this.speed }} to {{ this.targetSpeed }} <br>
  {{ this.heading }} to {{ this.targetHeading }}
</template>

<script>
export default {
  data() {
    return {
      canvas: null,
      context: null,
      altitude: 8800,
      targetAltitude: 8800,
      speed: 150,
      targetSpeed: 150,
      heading: 345,
      targetHeading: 180,
      animationSpeed: 0.5,
      offset: { altitude: 0, speed: 0, heading: 0 },
      direction: { altitude: -1, speed: 1, heading: 1 },
      config: {
        control: {
          invert_throttle: false,
          invert_y_axis: false
        }
      },
      gamepadIndex: null,
      
    };
  },
  mounted() {
    const scheduleData = localStorage.getItem('scheduleData');
    const tests = JSON.parse(scheduleData).tests;
    const config = tests?.find((test) => {
      return test.name === 'PFD Tracking Test';
    });
    this.config = config?.config || { altimeter: [], compass: [], speed: [] };
    this.canvas = this.$refs.canvas;
    this.context = this.canvas.getContext('2d');

    // check gamepad
    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
    this.checkGamepad();
    window.addEventListener('keydown', this.handleKeydown);
    this.startAnimation();
    window.addEventListener('resize', this.draw);
    this.playAltitude();
    this.playHeading();
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('resize', this.draw);
  },
  methods: {
    // gamepad related
    onGamepadConnected(event) {
      this.gamepadIndex = event.gamepad.index;
      this.checkGamepad();
    },
    onGamepadDisconnected(event) {
      if (this.gamepadIndex === event.gamepad.index) {
        this.gamepadIndex = null;
      }
    },
    checkGamepad() {
      if (this.gamepadIndex !== null) {
        const gamepad = navigator.getGamepads()[this.gamepadIndex];
        if (gamepad) {
          this.handleGamepadInput(gamepad);
        }
      }
      requestAnimationFrame(this.checkGamepad);
    },
    handleGamepadInput(gamepad) {
      const [leftStickX, leftStickY, rightStickY] = gamepad.axes;
      console.log(leftStickX, leftStickY, rightStickY);
      let movement = 2;
      if (leftStickY < -0.5) {
        this.config.control.invert_throttle ? this.altitudeDown(movement) : this.altitudeUp(movement);
      } else if (leftStickY > 0.5) {
        this.config.control.invert_throttle ? this.altitudeUp(movement) : this.altitudeDown(movement);
      }

      if (leftStickX < -0.5) {
        this.headingLeft(movement);
      } else if (leftStickX > 0.5) {
        this.headingRight(movement);
      }

      if (rightStickY < -0.5) {
        this.config.control.invert_y_axis ? this.altitudeDown(movement) : this.altitudeUp(movement);
      } else if (rightStickY > 0.5) {
        this.config.control.invert_y_axis ? this.altitudeUp(movement) : this.altitudeDown(movement);
      }

      this.draw();
    },
    // 
    playAltitude() {
      if (this.config.altimter == 'adjust_for_consistent_update') {
        // set interval to randomly increase OR decrease the target altitude between 100 - 1000 of the current altitude
        setInterval(() => {
          const setNewAltitude = Math.floor(Math.random() * (this.altitude + 1000 - this.altitude + 100) + this.altitude + 100);
          // const setNewAltitude = this.altitude + 200;
          if (this.altitude < setNewAltitude) {
            this.ascend(setNewAltitude);
          } else {
            this.descend(setNewAltitude);
          }
        }, 15000);
      } else if (this.config.altimeter == 'adjust_for_irregular_updates') {
        // with a 50% chance, increase or decrease the target altitude between 100 - 1000 of the current altitude
        setInterval(() => {
          if (Math.random() > 0.5) {
            const setNewAltitude = Math.floor(Math.random() * (this.altitude + 1000 - this.altitude + 100) + this.altitude + 100);
            // const setNewAltitude = this.altitude + 200;
            if (this.altitude < setNewAltitude) {
              this.ascend(setNewAltitude);
            } else {
              this.descend(setNewAltitude);
            }
          }
        }, 10000);
      }
    },
    playHeading() {
      if (this.config.compass == 'adjust_for_consistent_update') {
        // set interval to randomly increase OR decrease the target heading between 0 - 360
        setInterval(() => {
          const newHeading = Math.floor(Math.random() * (360 - 0) + 0);
          if (this.heading < 180) {
            this.yawRight(newHeading);
          } else {
            this.yawLeft(newHeading);
          }
        }, 10000);
      } else if (this.config.compass == 'adjust_for_irregular_updates') {
        // with a 50% chance, increase or decrease the target heading between 0 - 360
        setInterval(() => {
          if (Math.random() > 0.5) {
            const newHeading = Math.floor(Math.random() * (360 - 0) + 0);
            if (this.heading < 180) {
              this.yawRight(newHeading);
            } else {
              this.yawLeft(newHeading);
            }
          }
        }, 1000);
      }
    },
    handleKeydown(event) {
      switch (event.key) {
        case 'ArrowUp':
          if (this.config.control.invert_throttle)
            this.speedDown();
          else
            this.speedUp();
          break;
        case 'ArrowDown':
          if (this.config.control.invert_throttle)
            this.speedUp();
          else
            this.speedDown();
          break;
        case 'ArrowLeft':
          this.headingLeft();
          break;
        case 'ArrowRight':
          this.headingRight();
          break;
        case 'w':
          if (this.config.control.invert_y_axis)
            this.altitudeDown();
          else
            this.altitudeUp();
          break;
        case 's':
          if (this.config.control.invert_y_axis)
            this.altitudeUp();
          else
            this.altitudeDown();
          break;
      }
      this.draw();
    },
    speedUp(speed = 10) {
      this.speed += speed;
      this.offset.speed += speed;
    },
    speedDown(speed = 10) {
      this.speed -= speed;
      this.offset.speed -= speed;
    },
    headingRight(speed = 10) {
      this.heading -= speed;
      this.offset.heading -= speed;
    },
    headingLeft(speed = 10) {
      this.heading += speed;
      this.offset.heading += speed;
    },
    altitudeUp(speed = 10) {
      this.altitude += speed;
      this.offset.altitude += speed;
    },
    altitudeDown(speed = 10) {
      this.altitude -= speed;
      this.offset.altitude -= speed;
    },
    ascend(targetAltitude) {
      console.log('ascend to', targetAltitude, 'from', this.altitude);
      const x = setInterval(() => {
        if (this.altitude < targetAltitude) {
          this.altitude += 10;
          this.offset.altitude += 10;
        } else {
          console.log('reached target altitude');
          clearInterval(x);
        }
      }, 100);
    },
    descend(targetAltitude) {
      console.log('descend to', targetAltitude, 'from', this.altitude);
      const x = setInterval(() => {
        if (this.altitude > targetAltitude) {
          this.altitude -= 10;
          this.offset.altitude -= 10;
        } else {
          console.log('reached target altitude');
          clearInterval(x);
        }
      }, 100);
    },
    yawRight(targetHeading) {
      console.log('yaw right to', targetHeading, 'from', this.heading);
      const x = setInterval(() => {
        if (this.heading < targetHeading) {
          this.heading += 10;
          this.offset.heading += 10;
        } else {
          console.log('reached target heading');
          clearInterval(x);
        }
      }, 100);
    },
    yawLeft(targetHeading) {
      console.log('yaw left to', targetHeading, 'from', this.heading);
      const x = setInterval(() => {
        if (this.heading > targetHeading) {
          this.heading -= 10;
          this.offset.heading -= 10;
        } else {
          console.log('reached target heading');
          clearInterval(x);
        }
      }, 100);
    },
    startAnimation() {
      const animate = () => {
        this.draw();
        requestAnimationFrame(animate);

      };
      requestAnimationFrame(animate);
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

        this.colorAltiRuler(i);

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

      this.drawTriangleIndicatorAltitude(x, y, scaleHeight, scaleY);

      this.context.strokeStyle = 'blue';
      this.context.beginPath();
      this.context.moveTo(x, y + 50 + height / 2);
      this.context.lineTo(x + width, y + 50 + height / 2);
      this.context.stroke();

      this.drawGreenPositionText(x, y + height, width, this.altitude);
    },
    colorAltiRuler(i) {
      if (i >= this.targetAltitude - 50 && i <= this.targetAltitude + 50) {
        if (i >= this.targetAltitude - 10 && i <= this.targetAltitude + 10) {
          this.context.strokeStyle = 'green';
        } else if (i >= this.targetAltitude - 30 && i <= this.targetAltitude + 30) {
          this.context.strokeStyle = 'yellow';
        } else {
          this.context.strokeStyle = 'red';
        }
      }
    },
    drawTriangleIndicatorAltitude(x, y, scaleHeight, scaleY) {
      let trianglePosY = y + (scaleHeight * (9100 - this.targetAltitude + this.offset.altitude)) / (9100 - 8600) + 10;
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

        this.colorSpeedRuler(i);

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

      this.drawTriangleIndicatorSpeed(x, y, scaleHeight, scaleY);
      this.context.strokeStyle = 'blue';
      this.context.beginPath();
      this.context.moveTo(x, y + height / 2);
      this.context.lineTo(x + width, y + height / 2);
      this.context.stroke();

      this.drawGreenPositionText(x, y + height, width, this.speed);
    },
    colorSpeedRuler(i) {
      // coloring the ruler
      if (i >= this.targetSpeed - 15 && i <= this.targetSpeed + 15) {
        // if i is between 8840 - 8860
        if (i >= this.targetSpeed - 5 && i <= this.targetSpeed + 5) {
          this.context.strokeStyle = 'green';
        } else if (i >= this.targetSpeed - 10 && i <= this.targetSpeed + 10) {
          this.context.strokeStyle = 'yellow';
        } else {
          this.context.strokeStyle = 'red';
        }
      }
    },
    drawTriangleIndicatorSpeed(x, y, scaleHeight, scaleY) {
      let trianglePosY = y + (scaleHeight * (180 - this.targetSpeed + this.offset.speed)) / 180 + 10;
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
      const longLineLength = height / 2;
      const shortLineLength = height / 5;
      const labelInterval = 30; // Label every 30 degrees

      const startHeading = this.heading - Math.floor(width / 2 / interval) * interval;

      for (let i = startHeading; i <= startHeading + width; i += interval) {
        let posX = scaleX + (scaleWidth * (i - startHeading)) / width;

        if (i === this.heading) {
          this.context.strokeStyle = 'blue';
        } else {
          this.context.strokeStyle = 'black';
        }

        this.colorHeadingRuler(i);

        if ((i - startHeading) % labelInterval === 0) {
          this.context.fillText((i + 360) % 360, posX, y + height + 20);
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

      this.drawTriangleIndicatorHeading(x, y, scaleWidth, scaleX, startHeading, width);

      this.context.strokeStyle = 'blue';
      this.context.beginPath();
      this.context.moveTo(x + width / 2, y);
      this.context.lineTo(x + width / 2, y + height);
      this.context.stroke();
    },

    colorHeadingRuler(i) {
      if (i >= this.targetHeading - 50 && i <= this.targetHeading + 50) {
        if (i >= this.targetHeading - 10 && i <= this.targetHeading + 10) {
          this.context.strokeStyle = 'green';
        } else if (i >= this.targetHeading - 30 && i <= this.targetHeading + 30) {
          this.context.strokeStyle = 'yellow';
        } else {
          this.context.strokeStyle = 'red';
        }
      }
    },
    drawTriangleIndicatorHeading(x, y, scaleWidth, scaleX, startHeading, width) {
      let trianglePosX = scaleX + (scaleWidth * (this.targetHeading - startHeading)) / width;
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
