<template>
  <div class="plane-simulation-wrapper">
    <div class="plane-simulation-container">
      <div class="timer" :style="{ width: timerWidth + '%' }">{{ formatTime(remainingTime) }}</div>
      <div class="instructions">Press 'Space bar' to switch tasks</div>
      <div class="game-content">
        <div class="instruments-left">
          <div class="instrument" v-for="(instrument, index) in instrumentsLeft" :key="index">
            <svg :ref="'gauge' + index" width="120" height="120" viewBox="0 0 120 120"></svg>
            <div class="instrument-key">{{ instrument.key }}</div>
          </div>
        </div>
        <div class="simulation-box">
          <canvas ref="simulationCanvas" width="800" height="500"></canvas>
        </div>
        <div class="instruments-right">
          <div class="instrument" v-for="(instrument, index) in instrumentsRight" :key="index">
            <svg :ref="'gauge' + (index + 2)" width="120" height="120" viewBox="0 0 120 120"></svg>
            <div class="instrument-key">{{ instrument.key }}</div>
          </div>
        </div>
      </div>
      <div class="collision-count">Collisions: {{ collisionCount }}</div>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3';

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
        { key: 'C', value: 0, targetValue: 0 },
        { key: 'V', value: 0, targetValue: 0 },
      ],
      instrumentsRight: [
        { key: 'N', value: 0, targetValue: 0 },
        { key: 'B', value: 0, targetValue: 0 },
      ],
      gaugeUpdateFunctions: [],
      collisionCount: 0,
      lastCollisionTime: 0,
      gamepadIndex: null,
      duration: 600, // in seconds
      remainingTime: 600,
      joystickState: {
        x: 0,
        y: 0
      }
    };
  },
  computed: {
    timerWidth() {
      return (this.remainingTime / this.duration) * 100;
    }
  },
  mounted() {
    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
    this.checkGamepad();

    window.addEventListener('keydown', this.handleKeydown);
    this.obstacleInterval = setInterval(this.moveObstacles, 30);
    this.generationInterval = setInterval(this.generateObstacles, 2000);
    this.gaugeInterval = setInterval(this.updateGauges, 50);
    this.randomGaugeInterval = setInterval(this.randomGaugeIncrease, 2000);
    this.animatePlane();
    this.startTimer();
    this.initGauges();
  },
  beforeUnmount() {
    window.removeEventListener('gamepadconnected', this.onGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.onGamepadDisconnected);
    window.removeEventListener('keydown', this.handleKeydown);
    clearInterval(this.obstacleInterval);
    clearInterval(this.generationInterval);
    clearInterval(this.gaugeInterval);
    clearInterval(this.randomGaugeInterval);
    clearInterval(this.timerInterval);
  },
  methods: {
    handleGamepadInput(gamepad) {
      const [leftStickX, leftStickY] = gamepad.axes;
      this.joystickState.x = leftStickX;
      this.joystickState.y = leftStickY;
    },
    updatePlanePosition() {
      const ease = 0.1;
      const movement = 2;

      if (Math.abs(this.joystickState.x) > 0.1) {
        this.plane.targetX += this.joystickState.x * movement;
        this.plane.targetX = Math.max(0, Math.min(this.plane.targetX, 740));
      }

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
      img.src = require('@/assets/top-view.png');
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
    initGauges() {
      const gauges = [...this.instrumentsLeft, ...this.instrumentsRight];
      this.gaugeUpdateFunctions = gauges.map((instrument, index) => {
        const svg = d3.select(this.$refs[`gauge${index}`][0]);
        return this.createGauge(svg, instrument);
      });
    },
    createGauge(svg, instrument) {
      const width = 120;
      const height = 120;
      const radius = Math.min(width, height) / 2;
      const centerX = width / 2;
      const centerY = height / 2;

      // Background circle
      svg.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', radius)
        .attr('fill', '#f0f0f0');

      // Color sections
      const sections = [
        { startAngle: -Math.PI / 2, endAngle: -Math.PI / 4, color: '#4CAF50' },  // Green
        { startAngle: -Math.PI / 4, endAngle: 0, color: '#FFEB3B' },             // Yellow
        { startAngle: 0, endAngle: Math.PI / 4, color: '#FF9800' },              // Orange
        { startAngle: Math.PI / 4, endAngle: Math.PI / 2, color: '#F44336' }     // Red
      ];

      const arc = d3.arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius * 0.8);

      sections.forEach(section => {
        svg.append('path')
          .attr('d', arc({ startAngle: section.startAngle, endAngle: section.endAngle }))
          .attr('fill', section.color)
          .attr('transform', `translate(${centerX},${centerY})`);
      });

      // Needle
      const needle = svg.append('line')
        .attr('x1', centerX)
        .attr('y1', centerY)
        .attr('x2', centerX)
        .attr('y2', centerY - radius * 0.7)
        .attr('stroke', 'black')
        .attr('stroke-width', 2)
        .attr('transform', `rotate(0, ${centerX}, ${centerY})`);

      // Value text
      const valueText = svg.append('text')
        .attr('x', centerX)
        .attr('y', centerY + 20)
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold');

      const updateGauge = (value) => {
        const angle = this.valueToAngle(value);
        needle.attr('transform', `rotate(${angle}, ${centerX}, ${centerY})`);
        valueText.text(Math.round(value));
      };

      updateGauge(instrument.value);
      return updateGauge;
    },

    valueToAngle(value) {
      // Convert value (0-100) to angle (-90 to 90 degrees)
      return ((value / 100) * 180) - 90;
    },

    updateGauges() {
      [...this.instrumentsLeft, ...this.instrumentsRight].forEach((instrument, index) => {
        if (Math.abs(instrument.value - instrument.targetValue) > 0.1) {
          instrument.value += (instrument.targetValue - instrument.value) * 0.1;
        } else {
          instrument.value = instrument.targetValue;
        }
        const updateGauge = this.gaugeUpdateFunctions[index];
        if (updateGauge) {
          updateGauge(instrument.value);
        }
      });
    },

    handleInstrumentKey(key) {
      const instrument = [...this.instrumentsLeft, ...this.instrumentsRight].find(i => i.key === key);
      if (instrument) {
        instrument.targetValue = Math.max(instrument.targetValue - 10, 0);
        this.updateGauges();
      }
    },

    randomGaugeIncrease() {
      [...this.instrumentsLeft, ...this.instrumentsRight].forEach(instrument => {
        if (Math.random() < 0.5) {
          instrument.targetValue = Math.min(instrument.targetValue + Math.random() * 5, 100);
        }
      });
    },
    handleKeydown(event) {
      switch (event.key) {
        case 'a':
        case 'A':
          this.plane.targetX = Math.max(this.plane.x - 20, 0);
          break;
        case 'd':
        case 'D':
          this.plane.targetX = Math.min(this.plane.x + 20, 740);
          break;
        case ' ':
          this.$emit('switch-task');
          break;
        case 'c':
        case 'C':
        case 'v':
        case 'V':
        case 'n':
        case 'N':
        case 'b':
        case 'B':
          this.handleInstrumentKey(event.key.toUpperCase());
          break;
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
          if (currentTime - this.lastCollisionTime > 2000) {
            this.collisionCount++;
            this.lastCollisionTime = currentTime;
          }
          return;
        }
      }
    },
    moveObstacles() {
      for (const obstacle of this.obstacles) {
        obstacle.y -= 2;
        if (obstacle.y < -20) {
          const index = this.obstacles.indexOf(obstacle);
          this.obstacles.splice(index, 1);
        }
      }
    },
    generateObstacles() {
      const numberOfObstacles = Math.floor(Math.random() * 3) + 1;
      const minGap = 100;
      const maxWidth = 150;
      const availableWidth = 800 - (numberOfObstacles * minGap);

      let obstacleWidths = [];
      for (let i = 0; i < numberOfObstacles; i++) {
        const maxPossibleWidth = Math.min(maxWidth, availableWidth / numberOfObstacles);
        obstacleWidths.push(Math.floor(Math.random() * (maxPossibleWidth - 20)) + 20);
      }

      let currentX = 0;
      for (let i = 0; i < numberOfObstacles; i++) {
        const width = obstacleWidths[i];
        const gap = (800 - obstacleWidths.reduce((a, b) => a + b, 0)) / (numberOfObstacles + 1);
        currentX += gap;
        this.obstacles.push({
          id: Date.now() + i,
          y: 500,
          x: currentX,
          width: width,
          height: 10,
        });
        currentX += width;
      }
    },
    startTimer() {
      this.timerInterval = setInterval(() => {
        if (this.remainingTime > 0) {
          this.remainingTime--;
        } else {
          clearInterval(this.timerInterval);
          this.$emit('time-up');
        }
      }, 1000);
    },
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  },
};
</script>

<style scoped>
.plane-simulation-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f0f0;
}

.plane-simulation-container {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.game-content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.timer {
  height: 30px;
  background-color: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: width 1s linear;
  border-radius: 5px;
  margin-bottom: 10px;
}

.instructions {
  text-align: center;
  margin-bottom: 20px;
}

.instruments-left,
.instruments-right {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  height: 500px;
}

.instrument {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.instrument-key {
  margin-top: 5px;
  font-weight: bold;
}

.simulation-box {
  position: relative;
  width: 800px;
  height: 500px;
  border: 2px solid black;
  overflow: hidden;
  margin: 0 20px;
}

.collision-count {
  text-align: center;
  margin-top: 20px;
  font-weight: bold;
}
</style>