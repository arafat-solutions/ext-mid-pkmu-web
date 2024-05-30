<template>
    <div class="horizon-tank">
      <div class="tank-section">
        <div class="upper-tanks">
          <div v-for="(color, index) in colors" :key="index" :style="{ backgroundColor: color }" class="tank">
            <p>{{ keys[index] }}</p>
          </div>
        </div>
        <div class="lower-tanks">
          <div v-for="(tank, index) in lowerTanks" :key="index" class="tank">
            <div v-for="(color, i) in colors" :key="i" :style="{ height: `${tank[color]}%`, backgroundColor: color }" class="tank-fill"></div>
          </div>
        </div>
      </div>
      <div class="horizon-section">
        <canvas ref="horizonCanvas" :width="horizonWidth" :height="horizonHeight"></canvas>
        <div class="warning-lights">
          <div v-for="(light, index) in warningLights" :key="index" :class="{ 'warning-light': true, active: light.active }">{{ light.key }}</div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        colors: ['yellow', 'red', 'blue', 'green'],
        keys: ['Q', 'W', 'E', 'R'],
        lowerTanks: [
          { yellow: 0, red: 0, blue: 0, green: 0 },
          { yellow: 0, red: 0, blue: 0, green: 0 },
          { yellow: 0, red: 0, blue: 0, green: 0 },
          { yellow: 0, red: 0, blue: 0, green: 0 }
        ],
        horizonWidth: 400,
        horizonHeight: 300,
        warningLights: [
          { key: 'T', active: false },
          { key: 'Y', active: false },
          { key: 'U', active: false },
          { key: 'I', active: false }
        ]
      };
    },
    mounted() {
      this.initHorizon();
      window.addEventListener('keydown', this.handleKeyPress);
      setInterval(this.randomizeWarningLights, 3000);
    },
    methods: {
      handleKeyPress(event) {
        const key = event.key.toUpperCase();
        const colorIndex = this.keys.indexOf(key);
        if (colorIndex !== -1) {
          this.fillLowerTank(colorIndex);
        }
        const warningLight = this.warningLights.find(light => light.key === key);
        if (warningLight && warningLight.active) {
          warningLight.active = false;
        }
      },
      fillLowerTank(index) {
        const color = this.colors[index];
        const tank = this.lowerTanks[index];
        if (tank[color] < 100) {
          tank[color] += 20;
        }
      },
      randomizeWarningLights() {
        this.warningLights.forEach(light => {
          light.active = Math.random() > 0.5;
        });
      },
      initHorizon() {
        const canvas = this.$refs.horizonCanvas;
        this.ctx = canvas.getContext('2d');
        this.drawHorizon();
      },
      drawHorizon() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.horizonWidth, this.horizonHeight);
        // Draw horizon
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, this.horizonWidth, this.horizonHeight / 2);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, this.horizonHeight / 2, this.horizonWidth, this.horizonHeight / 2);
        // Draw aim
        ctx.strokeStyle = 'yellow';
        ctx.beginPath();
        ctx.moveTo(this.horizonWidth / 2 - 20, this.horizonHeight / 2);
        ctx.lineTo(this.horizonWidth / 2 + 20, this.horizonHeight / 2);
        ctx.moveTo(this.horizonWidth / 2, this.horizonHeight / 2 - 20);
        ctx.lineTo(this.horizonWidth / 2, this.horizonHeight / 2 + 20);
        ctx.stroke();
      }
    },
    beforeUnmount() {
      window.removeEventListener('keydown', this.handleKeyPress);
    }
  };
  </script>
  
  <style>
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
  .upper-tanks, .lower-tanks {
    display: flex;
    flex-direction: row;
    margin-bottom: 20px;
  }
  .tank {
    width: 50px;
    height: 100px;
    border: 2px solid black;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 10px;
  }
  .tank-fill {
    width: 100%;
  }
  .horizon-section {
    position: relative;
  }
  canvas {
    border: 2px solid black;
  }
  .warning-lights {
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
  