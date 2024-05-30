<template>
    <div class="plane-simulation-container">
      <div class="instructions">Press 'Space bar' to switch tasks</div>
      <div class="instruments">
        <div class="instrument" v-for="(instrument, index) in instruments" :key="index">
          <div class="circle">
            <div class="needle" :style="{ transform: 'rotate(' + instrument.angle + 'deg)' }"></div>
          </div>
          <div>{{ instrument.key }}</div>
        </div>
      </div>
      <div class="simulation-box">
        <div class="obstacle" v-for="obstacle in obstacles" :key="obstacle.id" :style="{ top: obstacle.y + 'px' }"></div>
        <img src="@/assets/airplane-icon.png" alt="Airplane" :style="planeStyle" class="airplane" />
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'PlaneSimulation',
    data() {
      return {
        plane: {
          x: 100,
          y: 300
        },
        obstacles: [
          { id: 1, y: 400 },
          { id: 2, y: 600 }
        ],
        instruments: [
          { key: 'C', angle: 0 },
          { key: 'V', angle: 0 },
          { key: 'N', angle: 0 },
          { key: 'B', angle: 0 }
        ]
      };
    },
    computed: {
      planeStyle() {
        return {
          transform: `translate(${this.plane.x}px, ${this.plane.y}px)`,
        };
      }
    },
    methods: {
      handleKeydown(event) {
        switch (event.key) {
          case 'a':
          case 'A':
            this.plane.x -= 10;
            break;
          case 'd':
          case 'D':
            this.plane.x += 10;
            break;
          case ' ':
            this.$emit('switch-task');
            break;
          default:
            this.handleInstrumentKey(event.key.toUpperCase());
            break;
        }
        this.checkCollision();
      },
      handleInstrumentKey(key) {
        const instrument = this.instruments.find(i => i.key === key);
        if (instrument) {
          instrument.angle -= 10; // Adjust as necessary
          if (instrument.angle <= -90) {
            instrument.angle = -90;
            this.recordResponseTime(key);
          }
        }
      },
      recordResponseTime(key) {
        console.log(`Response time recorded for key ${key}`);
      },
      checkCollision() {
        const planeRect = {
          left: this.plane.x,
          right: this.plane.x + 60,
          top: this.plane.y,
          bottom: this.plane.y + 60
        };
        for (const obstacle of this.obstacles) {
          const obstacleRect = {
            left: 0,
            right: 400,
            top: obstacle.y,
            bottom: obstacle.y + 20
          };
          if (
            planeRect.left < obstacleRect.right &&
            planeRect.right > obstacleRect.left &&
            planeRect.top < obstacleRect.bottom &&
            planeRect.bottom > obstacleRect.top
          ) {
            console.log('Collision detected!');
            return;
          }
        }
      },
      moveObstacles() {
        for (const obstacle of this.obstacles) {
          obstacle.y -= 2; // Adjust speed as necessary
          if (obstacle.y < -20) {
            obstacle.y = 600; // Reset position
          }
        }
      }
    },
    mounted() {
      window.addEventListener('keydown', this.handleKeydown);
      this.obstacleInterval = setInterval(this.moveObstacles, 50);
    },
    beforeUnmount() {
      window.removeEventListener('keydown', this.handleKeydown);
      clearInterval(this.obstacleInterval);
    }
  };
  </script>
  
  <style>
  .plane-simulation-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .instructions {
    margin-bottom: 10px;
  }
  .instruments {
    display: flex;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 20px;
  }
  .instrument {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .circle {
    width: 60px;
    height: 60px;
    border: 2px solid black;
    border-radius: 50%;
    position: relative;
  }
  .needle {
    width: 2px;
    height: 30px;
    background: black;
    position: absolute;
    top: 15px;
    left: 29px;
    transform-origin: bottom center;
  }
  .simulation-box {
    position: relative;
    width: 400px;
    height: 400px;
    border: 2px solid black;
    overflow: hidden;
  }
  .obstacle {
    position: absolute;
    width: 100%;
    height: 20px;
    background: black;
  }
  .airplane {
    position: absolute;
    width: 60px;
    height: 60px;
    transition: transform 0.1s;
  }
  </style>
  