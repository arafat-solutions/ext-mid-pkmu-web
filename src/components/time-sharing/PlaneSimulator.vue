<template>
  <div class="plane-simulation-container">
    <div class="instructions">Press 'Space bar' to switch tasks</div>
    <div class="instruments-left">
      <div class="instrument" v-for="(instrument, index) in instrumentsLeft" :key="index">
        <canvas :ref="'gauge' + index" width="80" height="80"></canvas>
        <div>{{ instrument.key }}</div>
      </div>
    </div>
    <div class="simulation-box">
      <canvas ref="simulationCanvas" width="800" height="400"></canvas>
    </div>
    <div class="instruments-right">
      <div class="instrument" v-for="(instrument, index) in instrumentsRight" :key="index">
        <canvas :ref="'gauge' + (index + 2)" width="80" height="80"></canvas>
        <div>{{ instrument.key }}</div>
      </div>
    </div>
    <div class="collision-count">Collisions: {{ collisionCount }}</div>
  </div>
</template>

<script>
export default {
  name: 'PlaneSimulation',
  data() {
    return {
      plane: {
        x: 400,
        targetX: 400,
        y: 200,
        angle: 0,
      },
      obstacles: [],
      instrumentsLeft: [
        { key: 'C', value: 0 },
        { key: 'V', value: 0 },
      ],
      instrumentsRight: [
        { key: 'N', value: 0 },
        { key: 'B', value: 0 },
      ],
      gaugeIntervals: [],
      collisionCount: 0,
      lastCollisionTime: 0,
      gamepadIndex: null,
      duration: 600, // in minute
      joystickState: {
        x: 0,
        y: 0
      }
    };
  },
  mounted() {
    // check gamepad
    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
    this.checkGamepad();

    window.addEventListener('keydown', this.handleKeydown);
    this.obstacleInterval = setInterval(this.moveObstacles, 30); // Faster interval
    this.generationInterval = setInterval(this.generateObstacles, 2000);
    this.gaugeIntervals = this.setupGaugeIntervals();
    this.animatePlane();
  },
  beforeUnmount() {
    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
    this.checkGamepad();

    window.removeEventListener('keydown', this.handleKeydown);
    clearInterval(this.obstacleInterval);
    clearInterval(this.generationInterval);
    this.gaugeIntervals.forEach(interval => clearInterval(interval));
  },
  methods: {
    handleGamepadInput(gamepad) {
      console.log(gamepad);
      const [leftStickX, leftStickY] = gamepad.axes;
      this.joystickState.x = leftStickX;
      this.joystickState.y = leftStickY;
    },
    updatePlanePosition() {
      const ease = 0.1;
      const movement = 2;
      
      // Continuous horizontal movement
      if (Math.abs(this.joystickState.x) > 0.1) {
        this.plane.targetX += this.joystickState.x * movement;
        this.plane.targetX = Math.max(0, Math.min(this.plane.targetX, 740));
      }
      
      // Continuous vertical movement (already implemented)
      if (Math.abs(this.joystickState.y) > 0.1) {
        this.plane.y += this.joystickState.y * movement;
        this.plane.y = Math.max(30, Math.min(this.plane.y, 370));
      }
      
      this.plane.x += (this.plane.targetX - this.plane.x) * ease;
    },
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
    animatePlane() {
      const canvas = this.$refs.simulationCanvas;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = require('@/assets/top-view.png'); // Use a top view airplane image
      img.onload = () => {
        const animate = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          ctx.translate(this.plane.x, this.plane.y);
          ctx.rotate((this.plane.angle * Math.PI) / 180);
          ctx.drawImage(img, -30, -30, 60, 60);
          ctx.restore();
          this.drawObstacles(ctx);
          this.updatePlanePosition();
          this.checkCollision();
          requestAnimationFrame(animate);
        };
        animate();
      };
    },
    drawObstacles(ctx) {
      for (const obstacle of this.obstacles) {
        ctx.fillStyle = 'black';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      }
    },
    drawGauge(canvas, value) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 10;

      // Draw gauge background
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#eee';
      ctx.fill();

      // Draw color indicator
      ctx.beginPath();
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (value / 100) * 2 * Math.PI;
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fillStyle = this.getColorForValue(value);
      ctx.fill();

      // Draw gauge needle
      ctx.beginPath();
      const angle = (value / 100) * 2 * Math.PI - Math.PI / 2;
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    getColorForValue(value) {
      if (value <= 33) return 'green';
      if (value <= 66) return 'orange';
      return 'red';
    },
    handleKeydown(event) {
      switch (event.key) {
        case 'a':
        case 'A':
          this.plane.targetX = Math.max(this.plane.x - 20, 0); // Smaller distance per key press
          break;
        case 'd':
        case 'D':
          this.plane.targetX = Math.min(this.plane.x + 20, 740); // Smaller distance per key press
          break;
        case ' ':
          this.$emit('switch-task');
          break;
        default:
          this.handleInstrumentKey(event.key.toUpperCase());
          break;
      }
    },
    handleInstrumentKey(key) {
      const instrument = [...this.instrumentsLeft, ...this.instrumentsRight].find(i => i.key === key);
      if (instrument) {
        instrument.value = Math.max(instrument.value - 10, 0); // Reduce value by 10, but not below 0
        this.updateGauges();
      }
    },
    checkCollision() {
      const currentTime = Date.now();
      const planeRect = {
        left: this.plane.x - 30,
        right: this.plane.x + 30,
        top: this.plane.y - 30,
        bottom: this.plane.y + 30,
      };
      for (const obstacle of this.obstacles) {
        const obstacleRect = {
          left: obstacle.x,
          right: obstacle.x + obstacle.width,
          top: obstacle.y,
          bottom: obstacle.y + obstacle.height,
        };
        if (
          planeRect.left < obstacleRect.right &&
          planeRect.right > obstacleRect.left &&
          planeRect.top < obstacleRect.bottom &&
          planeRect.bottom > obstacleRect.top
        ) {
          if (currentTime - this.lastCollisionTime > 2000) { // 2 second delay between collision counts
            this.collisionCount++;
            this.lastCollisionTime = currentTime;
            console.log('Collision detected! Total collisions:', this.collisionCount);
          }
          return;
        }
      }
    },
    moveObstacles() {
      for (const obstacle of this.obstacles) {
        obstacle.y -= 2; // Adjust speed as necessary
        if (obstacle.y < -20) {
          const index = this.obstacles.indexOf(obstacle);
          this.obstacles.splice(index, 1);
        }
      }
    },
    generateObstacles() {
      const numberOfObstacles = Math.floor(Math.random() * 5) + 1; // Generate 1 to 5 obstacles
      for (let i = 0; i < numberOfObstacles; i++) {
        const width = Math.floor(Math.random() * 100) + 20; // Random width between 20 and 120
        const x = Math.floor(Math.random() * (800 - width)); // Random x position within the simulation box
        this.obstacles.push({
          id: Date.now() + i,
          y: 400, // Start at the bottom of the simulation box
          x: x,
          width: width,
          height: 10, // Reduce height of obstacles
        });
      }
    },
    setupGaugeIntervals() {
      const intervals = [];
      [...this.instrumentsLeft, ...this.instrumentsRight].forEach((instrument, index) => {
        const interval = setInterval(() => {
          instrument.value = Math.min(instrument.value + 1, 100); // Increase value by 1, but not above 100
          this.drawGauge(this.$refs[`gauge${index}`][0], instrument.value);
        }, 100);
        intervals.push(interval);
      });
      return intervals;
    },
    updateGauges() {
      [...this.instrumentsLeft, ...this.instrumentsRight].forEach((instrument, index) => {
        this.drawGauge(this.$refs[`gauge${index}`][0], instrument.value);
      });
    },
  },
};
</script>

<style>
.plane-simulation-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  position: relative;
}

.instructions {
  position: absolute;
  top: 10px;
}

.instruments-left,
.instruments-right {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 400px;
  /* Match the height of the simulation box */
}

.instruments-left {
  margin-right: 10px;
}

.instruments-right {
  margin-left: 10px;
}

.instrument {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.simulation-box {
  position: relative;
  width: 800px;
  height: 400px;
  border: 2px solid black;
  overflow: hidden;
}

.collision-count {
  position: absolute;
  bottom: 10px;
}
</style>
