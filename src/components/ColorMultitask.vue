<template>
  <div class="horizon-tank">
    <div class="tank-section">
      <div class="upper-tanks">
        <div v-for="(color, index) in colors" :key="index" :style="{ backgroundColor: color }" :id="`upper-tank-${index}`" class="tank">
          <p style="color: black; font-weight: bolder;">{{ uppers[index] }}</p>
        </div>
      </div>

      <div class="line">
        <canvas ref="lineTankCanvas" :width="lineTankCanvasWidth" :height="lineTankCanvasHeight"></canvas>
      </div>

      <div class="lower-tanks">
        <div v-for="(lowerTank, index) in lowerTanks" :key="index" class="tank" :id="`lower-tank-${index}`">
          <p style="z-index: 1; position: absolute; color: black; font-weight: bolder;">{{ lowers[index] }}</p>
          <div v-for="(tankHeight, color) in lowerTank" :key="color" 
            :style="{ backgroundColor: color, height: tankHeight }"
            class="tank-fill fill-animation">
          </div>
        </div>
      </div>
    </div>

    <div class="horizon-section">
      <canvas ref="horizonCanvas" :width="horizonWidth" :height="horizonHeight" style="margin-bottom: 50px; margin-top: -20px"></canvas>
      
      <div class="arithmetic">
        <div class="question-container">
          <div class="question">
            <strong> Listen to task and enter your answer </strong>
          </div>
          <ul class="options">
            <div v-for="(light, index) in warningLights" :key="index">
              <li>
                  <label>
                    <button>
                      {{ (index + 1) }}
                    </button>
                    {{ light.key }}
                  </label>
              </li>
            </div>
          </ul>
        </div>  
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      keysPressed: {},
      colors: ['yellow', 'blue', 'red', 'green'],
      uppers: ['Q', 'W', 'E', 'R'],
      lowers: ['A', 'S', 'D', 'F'],
      lowerTanks: [
        { yellow: '100%', green: '100%', blue: '100%' },
        { blue: '100%', yellow: '100%', red: '100%' },
        { yellow: '100%', green: '100%', red: '100%' },
        { green: '100%', blue: '100%', red: '100%' },
      ],
      lineTankCanvasWidth: 320,
      lineTankCanvasHeight: 300,
      lines: [
        // Q
        { x1: 13, y1: 10, x2: 13, y2: 280 },
        { x1: 35, y1: 10, x2: 35, y2: 50, x3: 120, y3: 250, x4: 120, y4: 280 },
        { x1: 55, y1: 10, x2: 55, y2: 50, x3: 180, y3: 250, x4: 180, y4: 280},
        // W
        { x1: 100, y1: 10, x2: 100, y2: 50, x3: 60, y3: 250, x4: 60, y4: 280 },
        { x1: 120, y1: 10, x2: 95, y2: 280, },
        { x1: 140, y1: 10, x2: 140, y2: 50, x3: 290, y3: 250, x4: 290, y4: 280},
        // E
        { x1: 185, y1: 10, x2: 185, y2: 50, x3: 145, y3: 250, x4: 145, y4: 280 },
        { x1: 205, y1: 10, x2: 205, y2: 50, x3: 230, y3: 250, x4: 230, y4: 280 },
        { x1: 225, y1: 10, x2: 225, y2: 50, x3: 315, y3: 250, x4: 315, y4: 280 },
        // R
        { x1: 270, y1: 10, x2: 270, y2: 50, x3: 35, y3: 250, x4: 35, y4: 280 },
        { x1: 290, y1: 10, x2: 290, y2: 50, x3: 205, y3: 250, x4: 205, y4: 280 },
        { x1: 310, y1: 10, x2: 310, y2: 50, x3: 265, y3: 250, x4: 265, y4: 280 },
      ],
      intervalId: null, // Untuk menyimpan ID interval
      emptyTimers: [
        { yellow: 0, green: 0, blue: 0 },
        { blue: 0, yellow: 0, red: 0 },
        { yellow: 0, green: 0, red: 0 },
        { green: 0, blue: 0, red: 0 },
      ],
      timerTankInterval: null,
      config: {
        result: null,
        tank: {
          is_active: true,
          decreaseSpeed: 'slow' //slow, medium, fast
        },
        arithmetic: {
          is_active: true,
        }
      },
      horizonWidth: 400,
      horizonHeight: 300,
      warningLights: [
        { key: '999', active: false },
        { key: '999', active: false },
        { key: '999', active: false },
        { key: '999', active: false }
      ]
    };
  },
  mounted() {
    this.initLineTank();
    this.initTankToEmpty();

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  },
  methods: {
    initTankToEmpty() {
      this.intervalId = setInterval(this.decreaseTankLevels, 1000);
    },
    decreaseSpeed() {
      if (this.config.tank.decreaseSpeed === 'slow') {
        return Math.random() < 0.5 ? 1 : 5;
      } 
      if (this.config.tank.decreaseSpeed === 'medium') {
        return Math.random() < 0.5 ? 5 : 10;
      } 
      if (this.config.tank.decreaseSpeed === 'fast') {
        return Math.random() < 0.5 ? 10 : 15;
      } 
    },
    decreaseTankLevels() {
      for (let i = 0; i < this.lowerTanks.length; i++) {
        const tank = this.lowerTanks[i];
        for (const color in tank) {
          if (tank[color] !== '0%') {
            tank[color] = this.decreaseHeight(tank[color], i, color);
          }
        }
      }
    },
    decreaseHeight(currentHeight, tankIndex, color) {
      const current = parseFloat(currentHeight.replace('%', ''));
      const newHeight = Math.max(0, current - this.decreaseSpeed()) + '%';

      if (newHeight === '0%') {
        this.startEmptyTimer();
      } else {
        this.stopEmptyTimer(tankIndex, color);
      }
    
      return newHeight;
    },
    startEmptyTimer() {
      if (!this.timerTankInterval) {
        this.timerTankInterval = setInterval(() => {
          for (let i = 0; i < this.emptyTimers.length; i++) {
            const tank = this.lowerTanks[i];
            for (const color in tank) {
              if (tank[color] === '0%') {
                this.emptyTimers[i][color]++;
                // console.log(`Tank ${i} with color ${color} has been empty for ${this.emptyTimers[i][color]} seconds.`);
              }
            }
          }
        }, 1000);
      }
    },
    stopEmptyTimer(tankIndex, color) {
      this.emptyTimers[tankIndex][color] = 0;
      let anyTankEmpty = false;
      for (let i = 0; i < this.lowerTanks.length; i++) {
        const tank = this.lowerTanks[i];
        for (const color in tank) {
          if (tank[color] === '0%') {
            anyTankEmpty = true;
            break;
          }
        }
        if (anyTankEmpty) break;
      }
      if (!anyTankEmpty && this.timerTankInterval) {
        clearInterval(this.timerTankInterval);
        this.timerTankInterval = null;
      }
    },
    fillTank(tankIndex, color) {
      const increment = 10;
      const tank = this.lowerTanks[tankIndex];
      let currentFill = parseFloat(tank[color].replace('%', ''));

      if (tank[color] < '100%') {
        currentFill += increment;
        tank[color] = currentFill + '%';
      }

      if (tank[color] >= '100%') {
        tank[color] = '100%';
      }
    },
    handleKeyDown(event) {
      this.keysPressed[event.key.toUpperCase()] = true;
      
      if (this.keysPressed['Q'] && this.keysPressed['A']) {
        this.fillTank(0, 'yellow');
      }
      if (this.keysPressed['Q'] && this.keysPressed['S']) {
        this.fillTank(1, 'yellow');
      }
      if (this.keysPressed['Q'] && this.keysPressed['D']) {
        this.fillTank(2, 'yellow');
      }

      if (this.keysPressed['W'] && this.keysPressed['A']) {
        this.fillTank(0, 'blue');
      }
      if (this.keysPressed['W'] && this.keysPressed['S']) {
        this.fillTank(1, 'blue');
      }
      if (this.keysPressed['W'] && this.keysPressed['F']) {
        this.fillTank(3, 'blue');
      }

      if (this.keysPressed['E'] && this.keysPressed['S']) {
        this.fillTank(1, 'red');
      }
      if (this.keysPressed['E'] && this.keysPressed['D']) {
        this.fillTank(2, 'red');
      }
      if (this.keysPressed['E'] && this.keysPressed['F']) {
        this.fillTank(3, 'red');
      }

      if (this.keysPressed['R'] && this.keysPressed['A']) {
        this.fillTank(0, 'green');
      }
      if (this.keysPressed['R'] && this.keysPressed['D']) {
        this.fillTank(2, 'green');
      }
      if (this.keysPressed['R'] && this.keysPressed['F']) {
        this.fillTank(3, 'green');
      }
    },
    handleKeyUp(event) {
      delete this.keysPressed[event.key.toUpperCase()];
    },
    initLineTank() {
      const canvas = this.$refs.lineTankCanvas;
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, this.lineTankCanvasWidth, this.lineTankCanvasHeight);
      ctx.save();

      for (let i=0; i < this.lines.length; i++) {
        this.drawLine(this.lines[i]);
      }
    },
    drawLine(lines) {
      const canvas = this.$refs.lineTankCanvas;
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(lines.x1, lines.y1);
      ctx.lineTo(lines.x2, lines.y2);

      if (lines.x3 && lines.y3) {
        ctx.lineTo(lines.x3, lines.y3);
      }
      if (lines.x4 && lines.y4) {
        ctx.lineTo(lines.x4, lines.y4);
      }

      ctx.strokeStyle = '#574e4e';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();
    },
  },
};
</script>

<style scoped>
.question-container {
  border: 2px solid black;
  padding: 20px;
  margin-bottom: 20px;
}
.question {
  font-size: 18px;
  margin-bottom: 10px;
}
.options {
  list-style-type: none;
  padding: 0;
}
.options li {
  margin-bottom: 8px;
}
.horizon-tank {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  height: 100vh;
}
.tank-section {
  display: flex;
  flex-direction: column;
}
.upper-tanks {
  margin-left: 15px;
}
.lower-tanks {
  margin-left: 15px;
  margin-top: 10px;
}
.upper-tanks, .lower-tanks {
  display: flex;
  flex-direction: row;
  margin-bottom: 10px;
}
.tank {
  width: 69px;
  height: 100px;
  border: 3px solid black;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 10px;
  position: relative; /* Positioning for absolute elements inside */
}
.tank-fill {
  height: 100%;
  width: 100%;
  top: 0%;
  bottom: 0%;
  background-color: white;
}

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

.arithmetic {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  margin-top: 10px;
}
.warning-light {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: brown;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
  margin-right: 10px;
}
.warning-light.active {
  background-color: red;
}
</style>
