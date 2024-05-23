<template>
    <div class="line-turns">
      <div class="line-container">
        <canvas ref="lineCanvas" width="500" height="500"></canvas>
        <div class="question">How many right turns in the line?</div>
      </div>
      <div class="buttons-container">
        <button v-for="num in 10" :key="num" @click="checkAnswer(num - 1)">{{ num - 1 }}</button>
      </div>
      <div v-if="result !== null" class="result">{{ result }}</div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'SpatialOrientation',
    data() {
      return {
        result: null,
        rightTurns: 0,
      };
    },
    mounted() {
      this.drawRandomLine();
    },
    methods: {
      drawRandomLine() {
        const canvas = this.$refs.lineCanvas;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
  
        let x = canvas.width / 2;
        let y = canvas.height / 2;
        const length = 50;
        const turns = 10;
        let direction = 0;
        const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  
        ctx.beginPath();
        ctx.moveTo(x, y);
  
        this.rightTurns = 0;
  
        for (let i = 0; i < turns; i++) {
          const turn = Math.random() < 0.5 ? -1 : 1;
          direction = (direction + turn + 4) % 4;
          x += directions[direction][0] * length;
          y += directions[direction][1] * length;
          ctx.lineTo(x, y);
  
          if (turn === 1) {
            this.rightTurns++;
          }
        }
  
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
  
        // Draw arrowhead
        ctx.fillStyle = 'black';
        const headlen = 10;
        const angle = Math.atan2(directions[direction][1], directions[direction][0]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - headlen * Math.cos(angle - Math.PI / 6), y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x - headlen * Math.cos(angle + Math.PI / 6), y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      },
      checkAnswer(num) {
        if (num === this.rightTurns) {
          this.result = 'Correct!';
        } else {
          this.result = 'Wrong!';
        }
        setTimeout(() => {
          this.result = null;
          this.drawRandomLine();
        }, 2000);
      }
    },
    watch: {
      $route() {
        this.drawRandomLine();
      }
    }
  };
  </script>
  
  <style scoped>
  .line-turns {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
  }
  .line-container {
    position: relative;
    margin-bottom: 20px;
  }
  canvas {
    border: 1px solid #000;
    background-color: white;
  }
  .question {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 1.2em;
    font-weight: bold;
  }
  .buttons-container {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }
  button {
    padding: 10px 20px;
    font-size: 1em;
  }
  .result {
    margin-top: 20px;
    font-size: 1.5em;
    font-weight: bold;
  }
  </style>
  