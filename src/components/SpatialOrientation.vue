<template>
  <div v-if="isModalTrainingVisible" class="modal-overlay">
    <div class="modal-content">
      <p><strong>Apakah Anda Yakin <br>akan memulai pelatihan Spatial Orientation?</strong></p>
      <button @click="exit()" style="margin-right: 20px;">Batal</button>
      <button @click="closeModal('training')">Ya</button>
    </div>
  </div>

  <div v-if="isModalVisible" class="modal-overlay">
    <div class="modal-content">
      <p><strong>Apakah Anda Yakin <br>akan memulai ujian Spatial Orientation?</strong></p>
      <button @click="exit()" style="margin-right: 20px;">Batal</button>
      <button @click="closeModal('exam')">Ya</button>
    </div>
  </div>

  <div class="main-view" v-if="isConfigLoaded">
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <div class="text">submitting a result</div>
    </div>

    <div class="timer-container">
      Question: {{ config.current_question }} / {{ config.number_of_questions }}
    </div>

    <div class="line-container">
      <div class="left-content" style="width: 55%;">
        <div class="line-turns">
          <canvas class="center" ref="lineCanvas" :width="width" :height="height"></canvas>
        </div>
      </div>

      <div class="right-content" style="width: 45%;">
        <div class="question" style="padding-left: 30px">
          <p v-if="question === 'left'">
            How many Left Turns in the line?
          </p>

          <p v-if="question === 'right'">
            How many Right Turns in the line?
          </p>

          <div class="answer-container" v-if="isShowAnswerBox">
            <div class="buttons">
              <button v-for="(x, index) in optionAnswers" :key="index" class="digit-number"
                :class="{ 'selected': selectedAnswer === x }" @click="pressAnswer(x)">
                {{ x }}
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
import { getConfigs, getStoredIndices, getCurrentConfig } from '@/utils/configs';

export default {
  name: 'SpatialOrientation',
  data() {
    return {
      isModalTrainingVisible: false,
      isModalVisible: false,
      isButtonDisabled: false,
      isConfigLoaded: false,
      isLoading: false,
      isShowAnswerBox: false,
      width: 480,
      height: 480,
      rightTurns: 0,
      leftTurns: 0,
      drawIndex: 0,
      drawIndexRemoval: 0,
      data: [],
      lines: [],
      linesUsed: [],
      optionAnswers: [],
      question: null,
      answer: null,
      drawLineinterval: null,
      timeoutIdRemoveInterval: null,
      tailRemoveInterval: null,
      countdownInterval: null,
      configs: [],
      indexTrainingConfig: 0,
      indexConfig: 0,
      trainingConfigs: [],
      config: {
        crash: null,
        number_of_questions: null,
        current_question: 1,
        full_image: null,
        left_turn: null,
        right_turn: null,
        speed: null,
        speed_increasing: null,
        max_turns: 10,
      },
      moduleId: null,
      sessionId: null,
      userId: null,
      testId: null,
      totalQuestion: 0,
      correctAnswer: 0,
      responseQuestion: 0,
      responseTime: 0,
      responseDurations: [],
      result: {
        total_question: 0,
        correct_answer: 0,
        avg_response_time: 0,
        graph_data: [],
        response_times: 0
      },
      userInputs: [],
      questionStartTime: null,
      selectedAnswer: null,
      questionDuration: 1000,
      isTraining: true,
    };
  },
  mounted() {
    let reloadCount = parseInt(localStorage.getItem('reloadCountSpatialOrientation') || '0')
    reloadCount++
    localStorage.setItem('reloadCountSpatialOrientation', reloadCount.toString())

    window.addEventListener('beforeunload', () => {
      localStorage.setItem('reloadCountSpatialOrientation', reloadCount.toString())
    })

    this.initConfig();
  },
  methods: {
    closeModal(mode) {
      if (mode === 'training') {
        this.isTraining = true;
        this.config = this.trainingConfigs[this.indexTrainingConfig];
      } else if (mode === 'exam') {
        this.isTraining = false;
        this.config = this.configs[this.indexConfig];
      }

      this.setConfig(this.config);
      localStorage.setItem("index-config-spatial-orientation", JSON.stringify({ indexTrainingConfig: this.indexTrainingConfig, indexConfig: this.indexConfig }));

      this.isModalTrainingVisible = false;
      this.isModalVisible = false;

      setTimeout(() => {
        this.generateCoordinat();
      }, 1000);
    },
    endGame() {
      clearInterval(this.tailRemoveInterval);
      this.tailRemoveInterval = null;

      clearInterval(this.drawLineinterval);
      this.drawLineinterval = null;

      clearTimeout(this.timeoutIdRemoveInterval);
      this.timeoutIdRemoveInterval = null;

      if (this.isTraining) {
        this.startExam();
      } else {
        this.calculatedResult();
      }
    },
    startExam() {
      this.isModalVisible = true;
      this.indexConfig = 0;
      this.config = this.configs[this.indexConfig];
      // reset progress
      this.correctAnswer = 0;
      this.responseDurations = [];
      this.userInputs = [];
      
      this.setConfig(this.config);
    },
    exit() {
      if (confirm("Apakah Anda yakin ingin keluar dari tes? Semua progres akan hilang.")) {
        this.$router.push('module');
      }
    },
    initConfig() {
      const configData = getConfigs('spatial-orientation-test');
      if (!configData) {
        this.$router.push('/module');
        return;
      }
      console.log(configData, 'configData');
      this.configs = configData.configs;
      this.trainingConfigs = configData.trainingConfigs;
      this.moduleId = configData.moduleId;
      this.sessionId = configData.sessionId;
      this.userId = configData.userId;
      this.testId = configData.testId;

      const savedIndices = getStoredIndices('spatial-orientation');
      if (savedIndices) {
        this.indexTrainingConfig = savedIndices.indexTrainingConfig;
        this.indexConfig = savedIndices.indexConfig;
      }

      if (this.indexTrainingConfig < this.trainingConfigs.length) {
        this.isModalTrainingVisible = true;
      } else {
        this.isModalVisible = true;
      }
      this.setConfig(getCurrentConfig(this.configs, this.trainingConfigs, this.indexTrainingConfig, this.indexConfig));
    },
    setConfig(config) {
      const {
        crash,
        difficulty_level,
        full_image,
        id,
        left_turn,
        number_of_question,
        right_turn,
        speed,
        speed_increasing,
        subtask,
        max_turns
      } = config
      console.log(max_turns, 'set config');
      this.$nextTick(() => {
        this.config.difficultyLevel = difficulty_level
        this.config.speed = speed * 3000
        this.config.subtask = subtask
        this.config.testId = id
        this.config = {
          full_image: full_image,
          left_turn: left_turn,
          right_turn: right_turn,
          speed: speed * 3000,
          speed_increasing: speed_increasing,
          max_turns: 15,
          crash: crash,
          number_of_questions: number_of_question,
          current_question: 0
        }

        this.isConfigLoaded = true;
      });
    },
    calculatedResult() {
      this.result.total_question = this.configs.reduce((total, obj) => {
        return total + parseInt(obj.number_of_question);
      }, 0);
      this.result.correct_answer = this.correctAnswer;

      const resultTimeResponded = this.averageResponseTime()
      this.result.avg_response_time = resultTimeResponded.toFixed(2);

      this.result.response_times = this.responseDurations.map(duration => ({
        responseTime: duration,
        timestamp: Date.now()
      }));

      this.result.graph_data = this.userInputs;

      this.submitResult()
    },
    async submitResult() {
      try {
        this.isLoading = true;

        const API_URL = process.env.VUE_APP_API_URL;
        const payload = {
          testSessionId: this.sessionId,
          userId: this.userId,
          batteryTestId: this.testId,
          refreshCount: parseInt(localStorage.getItem('reloadCountSpatialOrientation')),
          result: this.result,
        }

        const res = await fetch(`${API_URL}/api/submission`,
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

        removeTestByNameAndUpdateLocalStorage('Spatial Orientation');
        localStorage.removeItem('reloadCountSpatialOrientation');
        localStorage.removeItem('index-config-spatial-orientation')
        this.$router.push('/module');
      }
    },
    startQuestionTimer() {
      this.questionTimer = setTimeout(() => {
        this.handleQuestionTimeout();
      }, this.questionDuration);
    },
    handleQuestionTimeout() {
      if (this.selectedAnswer === null) {
        const responseTime = this.questionDuration;
        this.userInputs.push({
          type: 'wrong',
          responseTime: responseTime,
          timestamp: Date.now(),
        });
        this.responseDurations.push(responseTime);
      }

      this.moveToNextQuestion();
    },
    moveToNextQuestion() {
      clearTimeout(this.questionTimer);
      clearInterval(this.tailRemoveInterval);
      clearInterval(this.drawLineinterval);
      clearTimeout(this.timeoutIdRemoveInterval);

      this.config.current_question++;

      if (this.config.current_question > this.config.number_of_questions) {
        this.endGame();
      } else {
        setTimeout(() => {
          this.generateCoordinat();
          this.selectedAnswer = null;
        }, this.questionDuration - (Date.now() - this.questionStartTime));
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

      this.question = null;
      if (this.config.left_turn && this.config.right_turn) {
        this.question = Math.random() < 0.5 ? 'right' : 'left';
      } else if (this.config.left_turn) {
        this.question = 'left';
      } else if (this.config.right_turn) {
        this.question = 'right';
      }

      if (this.config.full_image) {
        await this.drawLineFull();
      } else {
        await this.drawLineOneByOne();
      }
      this.questionStartTime = Date.now();
    },
    async generateCoordinat() {
      try {
        if (this.data.length === 0) {
          const res = await fetch('/scenario.json',
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
            }
          )
          this.data = await res.json();
        }

        const choosenlines = this.linesUsed.length + 1 === this.data[this.config.crash] ?
          this.data[this.config.crash - 1] :
          this.data[this.config.crash];

        let randomIndex = Math.floor(Math.random() * choosenlines.length);

        this.linesUsed.push(randomIndex)
        this.lines = choosenlines[randomIndex]

        this.lines = this.limitTurns(this.lines, this.config.max_turns);

        this.generateLines()
        this.startQuestionTimer()
      } catch (error) {
        console.log(error)
      }
    },
    limitTurns(lines, maxTurns) {
      let turns = 0;
      let limitedLines = [lines[0]];

      for (let i = 1; i < lines.length - 1; i++) {
        const prevDirection = lines[i - 1];
        const currDirection = lines[i];
        const nextDirection = lines[i + 1];

        if (
          (prevDirection.x !== currDirection.x && currDirection.x !== nextDirection.x) ||
          (prevDirection.y !== currDirection.y && currDirection.y !== nextDirection.y)
        ) {
          turns++;
        }

        limitedLines.push(currDirection);

        if (turns >= maxTurns) {
          limitedLines.push(lines[lines.length - 1]);
          break;
        }
      }

      if (turns < maxTurns) {
        limitedLines.push(lines[lines.length - 1]);
      }

      return limitedLines;
    },

    async drawLineFull() {
      const canvas = this.$refs.lineCanvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, this.width, this.height);

      for (let i = 0; i < this.lines.length - 1; i++) {
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(this.lines[i].x, this.lines[i].y);
        } else {
          ctx.lineTo(this.lines[i].x, this.lines[i].y);
          this.countTurns(i)
        }
      }

      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.stroke();

      this.drawArrowHead('init');
      this.responseQuestion = Date.now();
      this.setAnswerOption();

      this.timeoutIdRemoveInterval = setTimeout(() => {
        this.startTailDisappearance();
      }, 2000);
    },
    async drawLineOneByOne(startIndex = 0) {
      const canvas = this.$refs.lineCanvas;
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, this.width, this.height);

      let i = startIndex;

      this.drawLineinterval = setInterval(() => {
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(this.lines[i].x, this.lines[i].y);
          i++;
        } else if (i === 1 || i === 2 || i === 3) {
          ctx.lineTo(this.lines[i].x, this.lines[i].y);
          this.countTurns(i);
          i++;
        } else if (i === 4 || i < this.lines.length) {
          ctx.clearRect(0, 0, this.width, this.height);
          ctx.beginPath();
          ctx.moveTo(this.lines[i - 4].x, this.lines[i - 4].y);
          ctx.lineTo(this.lines[i - 3].x, this.lines[i - 3].y);
          ctx.lineTo(this.lines[i - 2].x, this.lines[i - 2].y);
          ctx.lineTo(this.lines[i - 1].x, this.lines[i - 1].y);
          ctx.lineTo(this.lines[i].x, this.lines[i].y);
          this.countTurns(i);
          i++;
        }

        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();

        if (i === this.lines.length) {
          clearInterval(this.drawLineinterval);
          this.drawArrowHead('init');
          this.responseQuestion = Date.now();
          this.setAnswerOption();
        } else {
          this.drawIndex = i;
        }
      }, this.config.speed);
    },
    countTurns(index) {
      if (index <= 0 || index >= this.lines.length - 1) return;

      const prevDirection = this.lines[index - 1];
      const currDirection = this.lines[index];
      const nextDirection = this.lines[index + 1];

      if (prevDirection.x < currDirection.x) {
        this.rightTurns++;
      }
      if (prevDirection.x > currDirection.x) {
        this.leftTurns++;
      }

      if (
        (prevDirection.x < currDirection.x) &&
        ((prevDirection.y === currDirection.y) && (currDirection.y === nextDirection.y))
      ) {
        this.rightTurns--;
      }

      if (
        (prevDirection.x > currDirection.x) &&
        ((prevDirection.y === currDirection.y) && (currDirection.y === nextDirection.y))
      ) {
        this.leftTurns--;
      }
    },
    setAnswerOption() {
      if (this.config.left_turn && this.config.right_turn) {
        this.question = Math.random() < 0.5 ? 'right' : 'left';
      } else if (this.config.left_turn) {
        this.question = 'left';
      } else if (this.config.right_turn) {
        this.question = 'right';
      }

      this.answer = this.question === 'left' ? this.leftTurns : this.rightTurns;

      const totalOptions = 10;
      this.optionAnswers = [];

      const minOption = Math.max(0, this.answer - 2);
      const maxOption = this.answer + 2;

      const possibleOptions = [];
      for (let i = minOption; i <= maxOption; i++) {
        if (i !== this.answer) {
          possibleOptions.push(i);
        }
      }

      for (let i = possibleOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [possibleOptions[i], possibleOptions[j]] = [possibleOptions[j], possibleOptions[i]];
      }

      while (this.optionAnswers.length < totalOptions - 1) {
        if (possibleOptions.length > 0) {
          this.optionAnswers.push(possibleOptions.pop());
        } else {
          this.optionAnswers.push(maxOption + this.optionAnswers.length + 1);
        }
      }

      const correctAnswerIndex = Math.floor(Math.random() * totalOptions);
      this.optionAnswers.splice(correctAnswerIndex, 0, this.answer);

      this.isButtonDisabled = false;
      this.isShowAnswerBox = true;
    },
    drawArrowHead(isInit = false) {
      const canvas = this.$refs.lineCanvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      if (this.lines.length < 2) return;

      const end = this.lines[this.lines.length - 1];
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
    startTailDisappearance(startIndex = 0) {
      const canvas = this.$refs.lineCanvas;
      const ctx = canvas.getContext('2d');

      let i = startIndex;

      if (this.config.full_image) {
        const halfLength = Math.floor(this.lines.length / 2);

        const tailRemove = () => {
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
            this.tailRemoveInterval = setInterval(tailRemove, 2000 / 2);
          }

          this.drawIndexRemoval = i;
        };

        this.tailRemoveInterval = setInterval(tailRemove, 2000);
      }

      if (!this.config.full_image) {
        const tailRemove = () => {
          if (i < this.lines.length - 2) {
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

          this.drawIndexRemoval = i;
        };

        this.tailRemoveInterval = setInterval(tailRemove, 1000);
      }
    },
    pressAnswer(value) {
      if (!this.isButtonDisabled) {
        this.selectedAnswer = value;
      }

      this.isButtonDisabled = true;
      this.responseTime = Date.now();

      if (this.answer === this.selectedAnswer) {
        this.correctAnswer++;
        this.userInputs.push({
          type: 'correct',
          responseTime: this.responseTime - this.questionStartTime,
          timestamp: Date.now(),
        });
      } else {
        this.userInputs.push({
          type: 'wrong',
          responseTime: this.responseTime - this.questionStartTime,
          timestamp: Date.now(),
        });
      }

      this.responseDurations.push(this.responseTime - this.questionStartTime);

      // Don't move to the next question immediately
      // The moveToNextQuestion method will be called when the fixed interval is over
    },
    averageResponseTime() {
      if (this.responseDurations.length > 0) {
        const sum = this.responseDurations.reduce((acc, curr) => acc + curr, 0);
        return (sum / this.responseDurations.length) / 1000;
      }
      return 0;
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

.modal-overlay {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
}

.modal-content button {
  background-color: #6200ee;
  color: white;
  padding: 10px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
}

.modal-content button:hover {
  background-color: #5e37a6;
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

.center {
  margin-left: auto;
  margin-right: auto;
  display: block;
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

.digit-number {
  padding: 15px;
  font-size: 18px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #505250;
  color: white;
  transition: background-color 0.3s ease;
}

.digit-number.selected {
  background-color: #4CAF50;
  /* Green color for selected button */
}

.digit-number.next {
  background-color: #0349D0;
}

.digit-number.next:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>