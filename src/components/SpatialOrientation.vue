<template>
  <div class="main-view" v-if="isConfigLoaded">
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <div class="text">submitting a result</div>
    </div>

    <div :class="isTrial ? 'timer-container-trial' : 'timer-container' ">
      Time: {{ formattedTime }}
      <button v-if="isPause && isTrial" @click="startAgain" class="ml-6" style="margin-right: 5px;">Start</button>
      <button v-if="!isPause && isTrial" @click="pause" class="ml-6" style="margin-right: 5px;">Pause</button>
      <button v-if="isTrial" @click="exit" class="ml-1">Exit</button>
    </div>

    <div class="line-container">

      <div class="left-content" style="width: 60%;">
        <div class="line-turns">
          <canvas ref="lineCanvas" :width="width" :height="height"></canvas>
        </div>
      </div>

      <div class="right-content" style="width: 40%;">
        <div class="question">
          <p v-if="question === 'left'">
            How many Left Turns in the line?
          </p>

          <p v-if="question === 'right'">
            How many Right Turns in the line?
          </p>

          <div class="answer-container" v-if="isShowAnswerBox">
            <div class="buttons">
              <button v-for="(x, index) in optionAnswers" :key="index" class="digit-number" @click="pressAnswer(x)">
                {{ x }}
              </button>
              <button class="digit-number next" @click="pressAnswer('next')">
                Next
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { removeTestByNameAndUpdateLocalStorage } from '@/utils/index'

export default {
  name: 'SpatialOrientation',
  data() {
    return {
      isConfigLoaded: false,
      isLoading: false,
      isTrial: this.$route.query.isTrial ?? false,
      isPause: false,
      isShowAnswerBox: false,
      width: 480,
      height: 480,
      rightTurns: 0,
      leftTurns: 0,
      collisions: 0,
      direction: 0,
      drawIndex: 0,
      drawIndexRemoval: 0,
      lines: [],
      optionAnswers: [],
      directions: [[1, 0], [0, 1], [-1, 0], [0, -1]],
      question: null,
      answer: null,
      drawLineinterval: null,
      timeoutIdRemoveInterval: null,
      tailRemoveInterval: null,
      countdownInterval: null,
      config: {
        crash: null,
        duration: null,
        full_image: null, //true or false
        left_turn: null, //true or false
        right_turn: null, //true or false
        speed: null,
        speed_increasing: null, //true or false,
      },
      totalQuestion: 0,
      correctAnswer: 0,
      responseQuestion: 0,
      responseTime: 0,
      responseDurations: [],
      result: {
        total_question: 0,
        correct_answer: 0,
        avg_response_time: 0,
      },
    };
  },
  async mounted() {
    this.initConfig();
  },
  methods: {
    pause() {
      clearInterval(this.countdownInterval);

      if (this.drawLineinterval) {
        clearInterval(this.drawLineinterval);
      }

      if (this.drawIndexRemoval > 0) {
        clearInterval(this.tailRemoveInterval);
      }

      this.isPause = true;
    },
    startAgain() {
      this.startCountdown();
      if (!this.config.full_image) {
        this.drawLineOneByOne(this.drawIndex);
      }

      if (this.drawIndexRemoval > 0) {
        this.startTailDisappearance(this.drawIndexRemoval);
      }

      this.isPause = false;
    },
    exit() {
      this.$router.push('module');
    },
    setSpeed(speed) {
      return speed * 3000;
    },
    initConfig() {
      try {
        let config = JSON.parse(localStorage.getItem('scheduleData'));

        if (config) {
          const spatialOrientation = config.tests.find(test => test.testUrl === 'spatial-orientation-test').config;

          this.config.duration = spatialOrientation.duration * 60;
          this.config.batteryTestConfigId = spatialOrientation.id;
          this.config.sessionId = config.sessionId;
          this.config.userId = config.userId;

          this.config.crash = 0
          // this.config.crash = spatialOrientation.crash

          this.config.full_image = spatialOrientation.full_image, //true or false
          this.config.left_turn = spatialOrientation.left_turn, //true or false
          this.config.right_turn = spatialOrientation.right_turn, //true or false
          this.config.speed = this.setSpeed(spatialOrientation.speed),
          this.config.speed_increasing = spatialOrientation.speed_increasing, //true or false,

          this.isConfigLoaded = true;

          setTimeout(() => {
            this.generateCoordinat();
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
          clearInterval(this.drawLineinterval);
          clearInterval(this.tailRemoveInterval)

          // Submit Answer
          setTimeout(() => {
            this.calculatedResult();
          }, 1000);
        }
      }, 1000);
    },
    calculatedResult() {
      this.result.total_question = this.totalQuestion;
      this.result.correct_answer = this.correctAnswer;

      const resultTimeResonded = this.averageResponseTime()
      this.result.avg_response_time = resultTimeResonded.toFixed(2);

      this.submitResult()
    },
    async submitResult() {
      try {
        this.isLoading = true;

        const API_URL = process.env.VUE_APP_API_URL;
        const payload = {
          testSessionId: this.config.sessionId,
          userId: this.config.userId,
          batteryTestConfigId: this.config.batteryTestConfigId,
          result: this.result,
        }

        const res = await fetch(`${API_URL}api/submission`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          }
        )

        if (!res.ok) {
          throw new Error('Failed Submit Test');
        }
      } catch (error) {
        console.error(error), "error";
      } finally {
        this.isLoading = false;

        removeTestByNameAndUpdateLocalStorage('Spatial Orientation')
        this.$router.push('/module');
      }
    },
    async generateLines() {
      this.optionAnswers = [];
      this.rightTurns = 0;
      this.leftTurns = 0;
      this.responseQuestion = 0;
      this.responseTime = 0;
      this.answer = null;
      this.isShowAnswerBox = false

      if (this.config.full_image) {
        await this.drawLineFull();
      } else {
        await this.drawLineOneByOne();
      }
    },
    async checkLines() {
      try {
        if (this.lines.length > 0) {
          // Start Reset Coordinat If Not Keep in The Bounds
          for (let i = 0; i < this.lines.length; i++) {
            if (this.lines[i].x < 39 || this.lines[i].x > 441 || this.lines[i].y < 39 || this.lines[i].y > 441) {
              return false;
            }
          }
          // End Reset Coordinat If Not Keep in The Bounds

          if (this.config.crash > 0) {
            // Start Reset Coordinat Same More than Two
            const frequencyMap = {};

            this.lines.forEach(coord => {
              const key = `${coord.x},${coord.y}`;
              if (frequencyMap[key]) {
                frequencyMap[key]++;
              } else {
                frequencyMap[key] = 1;
              }
            });

            for (const key in frequencyMap) {
              if (frequencyMap[key] > 2) {
                return false;
              }
            }
            // End Reset Coordinat Same More than Two
          }
        }

        // Start Reset Coordinat If Line Go Back Previous
        if (this.lines.length > 4) {
          if (
            (this.lines[this.lines.length - 1].x === this.lines[this.lines.length - 4].x && this.lines[this.lines.length - 1].y === this.lines[this.lines.length - 4].y) ||
            (this.lines[this.lines.length - 1].x === this.lines[this.lines.length - 2].x && this.lines[this.lines.length - 1].y === this.lines[this.lines.length - 2].y)
          ) {
            return false;
          }
        }
        // End Reset Coordinat If Line Go Back Previous

        return true;
      } catch (error) {
        return false;
      }
    },
    async generateCoordinat() {
      this.lines = [];
      this.collisions = 0;

      const length = 40;
      const visitedCoordinates = new Set();

      let x = this.width / 2;
      let y = this.height / 2;
      this.lines.push({ x, y });
      visitedCoordinates.add(`${x},${y}`);

      if (this.config.crash === 0) {
        const totalLength = Math.floor(Math.random() * (20 - 10 + 1)) + 10;
        for (let i = 0; i < totalLength; i++) {
          let newX, newY, validCoordinate;

          do {
            const turn = Math.random() < 0.5 ? -1 : 1;
            this.direction = (this.direction + turn + 4) % 4;

            newX = x + this.directions[this.direction][0] * length;
            newY = y + this.directions[this.direction][1] * length;

            validCoordinate = !visitedCoordinates.has(`${newX},${newY}`) && !(newX === x && newY === y);
          } while (!validCoordinate);

          x = newX;
          y = newY;
          this.lines.push({ x, y });
          visitedCoordinates.add(`${x},${y}`);
        }
      }

      if (this.config.crash > 0) {
        this.collisions = 0;

        while (this.collisions < this.config.crash) {
          let newX, newY, validCoordinate;

          do {
            const turn = Math.random() < 0.5 ? -1 : 1;
            this.direction = (this.direction + turn + 4) % 4;

            newX = x + this.directions[this.direction][0] * length;
            newY = y + this.directions[this.direction][1] * length;

            validCoordinate = visitedCoordinates.has(`${newX},${newY}`);

            if (validCoordinate) {
              this.collisions++;
              this.lines.push({ x: newX, y: newY });
            } else {
              x = newX;
              y = newY;
              this.lines.push({ x, y });
              visitedCoordinates.add(`${x},${y}`);
            }
          } while (!validCoordinate);

          if (this.collisions >= this.config.crash) {
            break;
          }
        }
      }

      let checkLines = await this.checkLines();
      if (!checkLines) {
        this.generateCoordinat();
      } else {
        this.generateLines()
      }
    },
    async drawLineFull() {
      const canvas = this.$refs.lineCanvas;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, this.width, this.height);

      for (let i = 0; i < this.lines.length - 1; i++) {
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(this.lines[i].x, this.lines[i].y);
        } else {
          ctx.lineTo(this.lines[i].x, this.lines[i].y);
          this.countTurns(i);
        }
      }

      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.stroke();

      this.drawArrowHead('init');

      this.totalQuestion++;
      this.responseQuestion = Date.now();
      this.setAnswerOption();

      this.timeoutIdRemoveInterval = setTimeout(() => {
        this.startTailDisappearance();
      }, 3000);
    },
    async drawLineOneByOne(startIndex = 0) {
      const canvas = this.$refs.lineCanvas;
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, this.width, this.height);

      let i = startIndex;
      this.drawLineinterval = setInterval(() => {
        if (this.isPause) {
          clearInterval(this.drawLineinterval);
          return;
        }

        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(this.lines[i].x, this.lines[i].y);
        } else {
          ctx.lineTo(this.lines[i].x, this.lines[i].y);
          this.countTurns(i);
        }

        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();

        if (i < this.lines.length - 1) {
          i++
        } else {
          this.stopInterval();
          this.drawArrowHead('init');

          this.totalQuestion++;
          this.responseQuestion = Date.now();
          this.setAnswerOption();

          this.timeoutIdRemoveInterval = setTimeout(() => {
            this.startTailDisappearance();
          }, 3000);
        }
        this.drawIndex = i;
      }, this.config.speed);
    },
    countTurns(index) {
      if (index <= 0 || index >= this.lines.length - 1) return;

      const prevDirection = this.lines[index - 1];
      const currDirection = this.lines[index];

      if (prevDirection.x < currDirection.x) {
        this.rightTurns++;
      }
      if (prevDirection.x > currDirection.x) {
        this.leftTurns++;
      }
    },
    setAnswerOption() {
      if (this.config.left_turn && this.config.right_turn) {
        this.question = Math.random() < 0.5 ? 'right' : 'left';
      } else if (this.config.left_turn) {
        this.question = 'left'
      } else if (this.config.right_turn) {
        this.question = 'right'
      }

      if (this.question === 'left') {
        this.answer = this.leftTurns
      }

      if (this.question === 'right') {
        this.answer = this.rightTurns
      }

      console.log(this.answer, 'answer')

      const totalNumbers = 11;
      const halfBefore = Math.min(this.answer - 1, Math.floor((totalNumbers - 1) / 2));
      const halfAfter = totalNumbers - 1 - halfBefore;

      for (let i = 0; i < halfBefore; i++) {
        this.optionAnswers.push(this.answer - halfBefore + i);
      }
      this.optionAnswers.push(this.answer);

      for (let i = 1; i <= halfAfter; i++) {
        this.optionAnswers.push(this.answer + i);
      }

      this.isShowAnswerBox = true
    },
    drawArrowHead(isInit = false) {
      const canvas = this.$refs.lineCanvas;
      const ctx = canvas.getContext('2d');

      if (this.lines.length < 2) return;

      const end = this.lines[this.lines.length-1];
      const start = this.lines[this.lines.length - 2];

      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const headlen = 10;

      const leftX = end.x - headlen * Math.cos(angle - Math.PI / 6);
      const leftY = end.y - headlen * Math.sin(angle - Math.PI / 6);
      const rightX = end.x - headlen * Math.cos(angle + Math.PI / 6);
      const rightY = end.y - headlen * Math.sin(angle + Math.PI / 6);

      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(leftX, leftY);
      ctx.lineTo(rightX, rightY);
      ctx.closePath();
      ctx.fill();

      if (isInit) {
        if (start.x < end.x) {
          this.rightTurns++
        }

        if (start.x > end.x) {
          this.leftTurns++
        }
      }
    },
    stopInterval() {
      clearInterval(this.drawLineinterval);
      this.drawLineinterval = null;
    },
    startTailDisappearance(startIndex = 0) {
      const canvas = this.$refs.lineCanvas;
      const ctx = canvas.getContext('2d');

      let i = startIndex;
      const halfLength = Math.floor(this.lines.length/2);

      const tailRemove = () => {
        if (this.isPause) {
          clearInterval(this.tailRemoveInterval);
          return;
        }

        if (i < halfLength) {
          ctx.clearRect(0, 0, this.width, this.height);

          ctx.beginPath();
          ctx.moveTo(this.lines[i + 1].x, this.lines[i + 1].y);

          for (let j = i + 2; j < this.lines.length - 1; j++) {
            ctx.lineTo(this.lines[j].x, this.lines[j].y);
          }

          ctx.strokeStyle = "black";
          ctx.lineWidth = 2;
          ctx.stroke();

          this.drawArrowHead();

          i++;
        } else if (i < this.lines.length - 2 && i >= halfLength) {
          ctx.clearRect(0, 0, this.width, this.height);

          ctx.beginPath();
          ctx.moveTo(this.lines[i + 1].x, this.lines[i + 1].y);

          for (let j = i + 2; j < this.lines.length - 1; j++) {
            ctx.lineTo(this.lines[j].x, this.lines[j].y);
          }

          ctx.strokeStyle = "black";
          ctx.lineWidth = 2;
          ctx.stroke();

          this.drawArrowHead();

          i++;
        } else {
          clearInterval(this.tailRemoveInterval);
          this.tailRemoveInterval = null;
        }

        if (i === halfLength && this.config.speed_increasing) {
          clearInterval(this.tailRemoveInterval);
          this.tailRemoveInterval = setInterval(tailRemove, 2000/2);
        }

        this.drawIndexRemoval = i;
      };

      this.tailRemoveInterval = setInterval(tailRemove, 2000);
    },
    pressAnswer(value) {
      if (this.isPause) {
        return;
      }

      if (value !== 'next') {
        if (this.answer === value) {
          this.correctAnswer++;
          this.responseTime = Date.now();
          this.calculateResponseTime();
        }
      }

      clearTimeout(this.timeoutIdRemoveInterval);
      this.timeoutIdRemoveInterval = null;

      clearInterval(this.tailRemoveInterval);
      this.tailRemoveInterval = null;

      clearInterval(this.drawLineinterval);
      this.drawLineinterval = null;

      setTimeout(() => {
        this.generateCoordinat();
      }, 1500);
    },
    averageResponseTime() {
      if (this.responseDurations.length > 0) {
        const sum = this.responseDurations.reduce((acc, curr) => acc + curr, 0);

        return (sum / this.responseDurations.length) / 1000;
      }

      return 0;
    },
    calculateResponseTime() {
      return this.responseDurations.push(this.responseTime - this.responseQuestion);
    },
  },
  computed: {
    formattedTime() {
      const minutes = Math.floor(this.config.duration / 60).toString().padStart(2, '0');
      const seconds = (this.config.duration % 60).toString().padStart(2, '0');
      return `${minutes}:${seconds}`;
    },
  },
};
</script>

<style scoped>
  .main-view {
    justify-content: center;
    align-items: flex-start;
    gap: 20px;
    margin: 60px auto;
  }
  .timer-container-trial {
    position: absolute;
    right: 0;
    top: 0;
    background-color: #0349D0;
    padding: 0.75rem;
    color: #ffffff;
    font-weight: bold;
    border-bottom-left-radius: 15px;
  }
  .timer-container-trial button {
    color: #000000;
    font-weight: bold;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    border-radius: 5px;
    border-color: transparent;
    min-width: 100px;
    cursor: pointer;
  }
  .timer-container {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    background-color: #0349D0;
    padding: 1.5rem 5rem;
    color: #ffffff;
    font-weight: bold;
    border-bottom-left-radius: 15px;
    border-bottom-right-radius: 15px;
  }
  .loading-container {
    /* Add your loading indicator styles here */
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    /* Black background with 80% opacity */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    /* Ensure it is above other content */
  }
  .spinner {
    border: 8px solid rgba(255, 255, 255, 0.3);
    /* Light border */
    border-top: 8px solid #ffffff;
    /* White border for the spinning part */
    border-radius: 50%;
    width: 60px;
    height: 60px;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
  .text {
    color: #ffffff;
    margin-top: 20px;
    font-size: 1.2em;
  }
  .line-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .line-turns {
    padding: 10px;
    position: relative;
    margin-bottom: 10px;
    margin-top: 10px;
  }
  canvas {
    border: 1px solid #000;
    background-color: white;
  }
  .question {
    padding: 30px;
    font-size: 1em;
    font-weight: bold;
  }
  .answer-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }
  .buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 10px;
  }
  .digit-number {
    padding: 15px;
    font-size: 18px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background-color: #505250;
    color: white;
  }
  .next {
    background-color: #0349D0;
  }
</style>
