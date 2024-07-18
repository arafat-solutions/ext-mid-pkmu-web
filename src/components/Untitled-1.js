<template>
  <div class="main-view" v-if="isConfigLoaded">
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <div class="text">submitting a result</div>
    </div>

    <div :class="isTrial ? 'timer-container-trial' : 'timer-container'">
      Time: {{ formattedTime }}
      <button v-if="isPause && isTrial" @click="startAgain" class="ml-6" style="margin-right: 5px;">Start</button>
      <button v-if="!isPause && isTrial" @click="pause" class="ml-6" style="margin-right: 5px;">Pause</button>
      <button v-if="isTrial" @click="exit" class="ml-1">Exit</button>
    </div>

    <div class="line-container">
      <div class="line-turns">
        <canvas ref="lineCanvas" :width="width" :height="height"></canvas>
        <div class="question">
          <p v-if="config.left_turn && config.right_turn">
            How many Left Turns and Right Turns in the line?
          </p>
          <p v-else-if="config.left_turn">
            How many Left Turns in the line?
          </p>
          <p v-else-if="config.right_turn">
            How many Right Turns in the line?
          </p>
        </div>
      </div>
      <div class="answer-container" v-if="isShowAnswerBox">
        <input type="number" v-model="answer" required>
        <button @click="submitAnswer()">Submit</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SpatialOrientation',
  data() {
    return {
      isConfigLoaded: false,
      isLoading: false,
      isTrial: this.$route.query.isTrial ?? false,
      isPause: false,
      isShowAnswerBox: false,
      width: 500,
      height: 500,
      answer: null,
      rightTurns: 0,
      leftTurns: 0,
      lines: [],
      collisions: 0,
      direction: 0,
      directions: [[1, 0], [0, 1], [-1, 0], [0, -1]],
      drawLineAnimation: null,
      tailRemoveAnimation: null,
      countdownInterval: null,
      config: {
        crash: null,
        duration: null,
        full_image: null, // true or false
        left_turn: null, // true or false
        right_turn: null, // true or false
        speed: null,
        speed_increasing: null, // true or false
      },
    };
  },
  async mounted() {
    await this.initConfig();
  },
  methods: {
    pause() {
      this.isPause = true;
      cancelAnimationFrame(this.drawLineAnimation);
      cancelAnimationFrame(this.tailRemoveAnimation);
    },
    startAgain() {
      this.startCountdown();
      this.isPause = false;
    },
    exit() {
      this.$router.push('module');
    },
    setSpeed(speed) {
      return speed * 4000;
    },
    async initConfig() {
      try {
        let config = JSON.parse(localStorage.getItem('scheduleData'));

        if (config) {
          const spatialOrientation = await config.tests.find(test => test.testUrl === 'spatial-orientation-test').config;

          this.config.duration = spatialOrientation.duration * 60;
          this.config.batteryTestConfigId = spatialOrientation.id;
          this.config.sessionId = config.sessionId;
          this.config.userId = config.userId;

          this.config.crash = 10,
          this.config.full_image = spatialOrientation.full_image, // true or false
          this.config.left_turn = spatialOrientation.left_turn, // true or false
          this.config.right_turn = spatialOrientation.right_turn, // true or false
          this.config.speed = this.setSpeed(spatialOrientation.speed),
          this.config.speed_increasing = spatialOrientation.speed_increasing, // true or false

          this.isConfigLoaded = true;

          setTimeout(() => {
            this.generateLines();
            this.startCountdown();
          }, 1000);
        }
      } catch (error) {
        console.log(error, 'error')
      }
    },
    startCountdown() {
      this.countdownInterval = setInterval(() => {
        if (this.config.duration > 0) {
          this.config.duration--;
        } else {
          clearInterval(this.countdownInterval);
          cancelAnimationFrame(this.drawLineAnimation);
          cancelAnimationFrame(this.tailRemoveAnimation);

          // Submit Answer
          // setTimeout(() => {
          //   this.calculatedResult();
          // }, 1000);
        }
      }, 1000);
    },
    generateLines() {
      this.lines = [];
      this.rightTurns = 0;
      this.leftTurns = 0;
      this.collisions = 0;
      this.answer = null;
      this.isShowAnswerBox = false;

      this.generateCoordinat();
      if (this.config.full_image) {
        this.drawLineAll();
      } else {
        this.drawLineSlow();
      }
    },
    generateCoordinat() {
      const length = 50;

      let x = this.width / 2;
      let y = this.height / 2;
      this.lines.push({'x': x, 'y': y});

      if (this.config.crash === 0) {
        for (let i = 0; i < 10; i++) {
          const turn = Math.random() < 0.5 ? -1 : 1;
          this.direction = (this.direction + turn + 4) % 4;

          let newX = x + this.directions[this.direction][0] * length;
          let newY = y + this.directions[this.direction][1] * length;

          // Keep Within Bounds
          newX = Math.max(0, Math.min(this.width, newX));
          newY = Math.max(0, Math.min(this.height, newY));

          // Prevent Same Value
          if (newX === x && newY === y) continue;

          x = newX;
          y = newY;
          this.lines.push({'x': x, 'y': y});
        }
      }

      if (this.config.crash > 0) {
        do {
          const turn = Math.random() < 0.5 ? -1 : 1;
          this.direction = (this.direction + turn + 4) % 4;

          let newX = x + this.directions[this.direction][0] * length;
          let newY = y + this.directions[this.direction][1] * length;

          // Keep Within Bounds
          newX = Math.max(0, Math.min(this.width, newX));
          newY = Math.max(0, Math.min(this.height, newY));

          // Prevent Same Value
          if (newX === x && newY === y) continue;

          x = newX;
          y = newY;
          this.lines.push({'x': x, 'y': y});

          // Check for collisions
          if (this.lines.slice(0, -1).some(point => point.x === x && point.y === y)) {
            this.collisions++;
          }

        } while (this.collisions < this.config.crash)
      }

    },
    drawLineAll() {
      const canvas = this.$refs.lineCanvas;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, this.width, this.height);

      for (let i = 0; i < this.lines.length - 1; i++) {
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(this.lines[i].x, this.lines[i].y);
        } else {
          ctx.lineTo(this.lines[i].x, this.lines[i].y);

          // Count Turns
          this.countTurns(i);
        }
      }

      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.stroke();

      this.drawArrowHead();
      this.startTailDisappearance();
    },
    drawLineSlow() {
      const canvas = this.$refs.lineCanvas;
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let i = 0;
      const drawLineFrame = () => {
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(this.lines[i].x, this.lines[i].y);
        } else {
          ctx.lineTo(this.lines[i].x, this.lines[i].y);
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        this.drawLineAnimation = requestAnimationFrame(drawLineFrame);
        this.countTurns(i);

        if (++i >= this.lines.length - 1) {
          cancelAnimationFrame(this.drawLineAnimation);
          this.drawArrowHead();
          this.startTailDisappearance();
        }
      };

      this.drawLineAnimation = requestAnimationFrame(drawLineFrame);
    },
    drawArrowHead() {
      const canvas = this.$refs.lineCanvas;
      const ctx = canvas.getContext('2d');

      const x = this.lines[this.lines.length - 1].x;
      const y = this.lines[this.lines.length - 1].y;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 10, y - 10);
      ctx.moveTo(x, y);
      ctx.lineTo(x + 10, y - 10);
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.stroke();

      setTimeout(() => {
        this.isShowAnswerBox = true;
      }, 1000);
    },
    startTailDisappearance() {
      const tailLength = 15;
      const tailDisappearSpeed = 1000;

      const tailRemoveFrame = () => {
        if (this.lines.length > tailLength) {
          this.lines.shift();
        }
        this.drawLineSlow();
        this.tailRemoveAnimation = requestAnimationFrame(tailRemoveFrame);
      };

      this.tailRemoveAnimation = setTimeout(tailRemoveFrame, tailDisappearSpeed);
    },
    countTurns(i) {
      if (i < 1 || i >= this.lines.length - 1) {
        return;
      }

      const prevDirection = (this.direction - 1 + 4) % 4;
      const nextDirection = (this.direction + 1) % 4;

      const prevDiffX = this.lines[i].x - this.lines[i - 1].x;
      const prevDiffY = this.lines[i].y - this.lines[i - 1].y;
      const nextDiffX = this.lines[i + 1].x - this.lines[i].x;
      const nextDiffY = this.lines[i + 1].y - this.lines[i].y;

      if (
        (prevDiffX === this.directions[prevDirection][0] && prevDiffY === this.directions[prevDirection][1]) &&
        (nextDiffX === this.directions[nextDirection][0] && nextDiffY === this.directions[nextDirection][1])
      ) {
        this.rightTurns++;
      } else if (
        (prevDiffX === this.directions[nextDirection][0] && prevDiffY === this.directions[nextDirection][1]) &&
        (nextDiffX === this.directions[prevDirection][0] && nextDiffY === this.directions[prevDirection][1])
      ) {
        this.leftTurns++;
      }
    },
    submitAnswer() {
      const answer = Number(this.answer);

      // Logik untuk mengirim jawaban pengguna

      console.log(`User Answer: ${answer}`);
      console.log(`Right Turns: ${this.rightTurns}`);
      console.log(`Left Turns: ${this.leftTurns}`);
    },
  },
  computed: {
    formattedTime() {
      const minutes = Math.floor(this.config.duration / 60);
      const seconds = this.config.duration % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },
  },
};
</script>

<style scoped>
.main-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.timer-container, .timer-container-trial {
  margin: 10px;
  font-size: 18px;
}

.line-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.line-turns {
  position: relative;
}

.answer-container {
  margin-top: 20px;
}

button {
  margin: 5px;
}
</style>
