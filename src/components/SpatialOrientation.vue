<template>
  <div v-if="isModalTrainingVisible" class="modal-overlay">
    <div class="modal-content">
      <p style="font-size: 24px">
        <strong>Apakah anda yakin akan memulai latihan?</strong>
      </p>
      <p style="font-size: 20px; max-width: 80%">
        Pada tes ini Anda akan menggunakan Touch Screen. Anda diminta untuk
        menghitung JUMLAH BELOKAN KANAN atau KIRI yang ada pada gambar sesuai
        dengan soal. Lalu pilih jawaban yang benar dengan cara menyentuh LAYAR
        MONITOR.
      </p>

      <img src="devices/spatial.png" />
      <div class="button-container">
        <button @click="startTest()">Mulai Latihan</button>
      </div>
    </div>
  </div>

  <div v-if="isModalVisible" class="modal-overlay">
    <div class="modal-content">
      <p v-if="actualTestCount >= 1">
        <strong style="font-size: 24px">
          Tes pertama telah selesai, anda akan melakukan tes yang sama lagi
          untuk melihat perkembangan pemahaman Anda.
        </strong>
      </p>
      <p>
        <strong style="font-size: 24px"
          >Apakah anda yakin akan memulai tes?</strong
        >
      </p>
      <div>
        <button @click="startTest()">Mulai Tes</button>
      </div>
    </div>
  </div>

  <div class="main-view" v-if="isConfigLoaded">
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <div class="text">submitting a result</div>
    </div>

    <div class="timer-container" v-if="isTrainingCompleted">
      Pertanyaan: {{ config.current_question }} / {{ totalQuestion }}
    </div>

    <div class="line-container">
      <div class="left-content" style="width: 55%">
        <div class="line-turns">
          <canvas
            class="center"
            ref="lineCanvas"
            :width="width"
            :height="height"
          ></canvas>
        </div>
      </div>

      <div class="right-content" style="width: 45%">
        <div class="question" style="padding-left: 30px">
          <p v-if="question === 'left'">
            Berapa banyak belokan kiri pada garis tersebut?
          </p>

          <p v-if="question === 'right'">
            Berapa banyak belokan ke kanan pada garis tersebut?
          </p>

          <div class="answer-container" v-if="isShowAnswerBox">
            <div class="buttons">
              <button
                v-for="(x, index) in optionAnswers"
                :key="index"
                class="digit-number"
                :class="{
                  correct:
                    selectedAnswer &&
                    !isTrainingCompleted &&
                    ((selectedAnswer === x && x === answer) ||
                      (selectedAnswer !== x && x === answer)),
                  wrong:
                    selectedAnswer &&
                    !isTrainingCompleted &&
                    selectedAnswer === x &&
                    x !== answer,
                  selected:
                    selectedAnswer &&
                    isTrainingCompleted &&
                    selectedAnswer === x,
                }"
                @click="pressAnswer(x)"
              >
                {{ x }}
              </button>
            </div>
          </div>
        </div>
        <p
          v-if="answerIsRight === true && !isTrainingCompleted"
          class="text-green-500 text-2xl"
        >
          Benar!
        </p>
        <p
          v-else-if="answerIsRight === false && !isTrainingCompleted"
          class="text-red-500 text-2xl"
        >
          Salah!
        </p>
      </div>
    </div>
    <button v-if="!isTrainingCompleted" @click="endGame" class="finish-button">
      Selesai Latihan
    </button>
  </div>
</template>

<script>
import {
  completeTrainingTestAndUpdateLocalStorage,
  removeTestByNameAndUpdateLocalStorage,
} from "@/utils/index";
import { getConfigs } from "@/utils/configs";
import { patchWorkstation } from "@/utils/fetch";

export default {
  name: "SpatialOrientation",
  data() {
    return {
      isModalTrainingVisible: false,
      isModalVisible: false,
      isButtonDisabled: false,
      isConfigLoaded: false,
      questionTimer: null,
      isLoading: false,
      isShowAnswerBox: false,
      isTrainingCompleted: false,
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
      indexConfig: 0,
      config: {},
      configs: [],
      moduleId: null,
      actualTestCount: 0,
      tempFirstResult: {
        total_question: 0,
        correct_answer: 0,
        avg_response_time: 0,
        graph_data: [],
        response_times: 0,
      },
      sessionId: null,
      userId: null,
      testId: null,
      totalQuestion: 0,
      totalQuestionConfig: 1,
      correctAnswer: 0,
      responseQuestion: 0,
      responseTime: 0,
      responseDurations: [],
      result: {
        total_question: 0,
        correct_answer: 0,
        avg_response_time: 0,
        graph_data: [],
        response_times: 0,
      },
      userInputs: [],
      questionStartTime: null,
      selectedAnswer: null,
      questionDuration: 25000,
      answerIsRight: null,
    };
  },
  mounted() {
    let reloadCount = parseInt(
      localStorage.getItem("reloadCountSpatialOrientation") || "0"
    );
    reloadCount++;
    localStorage.setItem(
      "reloadCountSpatialOrientation",
      reloadCount.toString()
    );

    window.addEventListener("beforeunload", () => {
      localStorage.setItem(
        "reloadCountSpatialOrientation",
        reloadCount.toString()
      );
    });

    this.initConfig();
  },
  methods: {
    startTest() {
      const updatePayload = {
        status: "",
        name: "Spatial Orientation",
      };
      this.totalQuestionConfig = 1;
      this.answerIsRight = null;
      this.selectedAnswer = null;
      this.answer = null;
      if (!this.isTrainingCompleted) {
        updatePayload.status = "IN_TRAINING";
        this.setConfig(this.configs[0]);

        this.config.current_question = 1;
        this.totalQuestion = 9999;
        this.questionDuration = 25000;
      } else {
        updatePayload.status = "IN_TESTING";
        this.setConfig(this.configs[this.indexConfig]);

        this.config.current_question = 1;
        this.totalQuestion = 0;
        for (const i in this.configs) {
          this.totalQuestion += parseInt(this.configs[i].number_of_question);
        }
      }

      patchWorkstation(updatePayload);

      this.isModalTrainingVisible = false;
      this.isModalVisible = false;

      this.generateCoordinat();
    },
    endGame() {
      clearTimeout(this.questionTimer);
      this.questionTimer = null;

      clearInterval(this.tailRemoveInterval);
      this.tailRemoveInterval = null;

      clearInterval(this.drawLineinterval);
      this.drawLineinterval = null;

      clearTimeout(this.timeoutIdRemoveInterval);
      this.timeoutIdRemoveInterval = null;

      if (!this.isTrainingCompleted) {
        this.isTrainingCompleted = true;
        completeTrainingTestAndUpdateLocalStorage("Spatial Orientation");

        this.startExam();
      } else {
        this.calculatedResult();
      }
    },
    startExam() {
      this.correctAnswer = 0;
      this.responseDurations = [];
      this.userInputs = [];

      this.isModalVisible = true;
    },
    exit() {
      if (
        confirm(
          "Apakah Anda yakin ingin keluar dari tes? Semua progres akan hilang.asdasd"
        )
      ) {
        this.$router.push("module");
      }
    },
    initConfig() {
      const configData = getConfigs("spatial-orientation-test");
      if (!configData) {
        this.$router.push("/module");
        return;
      }

      this.configs = configData.configs;
      this.trainingConfigs = configData.trainingConfigs;
      this.moduleId = configData.moduleId;
      this.sessionId = configData.sessionId;
      this.userId = configData.userId;
      this.testId = configData.testId;

      //For Training
      this.isTrainingCompleted = configData.trainingCompleted;

      if (!this.isTrainingCompleted) {
        this.isModalTrainingVisible = true;
      } else {
        this.isModalVisible = true;
      }
    },
    setConfig(config) {
      //console.log("Setting Config", config);
      this.config.difficultyLevel = config?.difficulty_level;
      this.config.full_image = config?.full_image;
      this.config.left_turn = config?.left_turn;
      this.config.right_turn = config?.right_turn;
      this.config.speed_increasing = config?.speed_increasing;
      this.config.speed = config?.speed * 3000;
      this.config.max_turns = 15;
      this.config.crash = config?.crash;
      this.config.number_of_question = config?.number_of_question;

      this.config.subtask = config.subtask;
      this.config.testId = config.id;

      this.isConfigLoaded = true;
    },
    calculatedResult() {
      this.actualTestCount += 1;
      if (this.actualTestCount < 2) {
        this.tempFirstResult.total_question = this.totalQuestion;
        this.tempFirstResult.correct_answer = this.correctAnswer;

        const resultTimeResponded = this.averageResponseTime();
        this.tempFirstResult.avg_response_time = resultTimeResponded.toFixed(2);

        this.tempFirstResult.response_times = this.responseDurations.map(
          (duration) => ({
            responseTime: duration,
            timestamp: Date.now(),
          })
        );

        this.tempFirstResult.graph_data = this.userInputs;
        this.startExam();
      } else {
        this.submitResult();
      }
    },
    async submitResult() {
      try {
        this.isLoading = true;
        this.result.total_question = this.totalQuestion;
        this.result.correct_answer = this.correctAnswer;

        const resultTimeResponded = this.averageResponseTime();
        this.result.avg_response_time = resultTimeResponded.toFixed(2);

        this.result.response_times = this.responseDurations.map((duration) => ({
          responseTime: duration,
          timestamp: Date.now(),
        }));

        this.result.graph_data = this.userInputs;

        const API_URL = process.env.VUE_APP_API_URL;
        const payload = {
          testSessionId: this.sessionId,
          userId: this.userId,
          batteryTestId: this.testId,
          refreshCount: parseInt(
            localStorage.getItem("reloadCountSpatialOrientation")
          ),
          result: this.tempFirstResult,
          result2: this.result,
        };

        const res = await fetch(`${API_URL}/api/submission`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error("Failed Submit Test");
        }
      } catch (error) {
        console.error(error), "error";
      } finally {
        this.isLoading = false;

        removeTestByNameAndUpdateLocalStorage("Spatial Orientation");
        localStorage.removeItem("reloadCountSpatialOrientation");
        this.$router.push("/module");
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
          type: "wrong",
          responseTime: responseTime,
          timestamp: Date.now(),
        });

        this.responseDurations.push(responseTime);
      }

      this.moveToNextQuestion();
    },
    cleanUp() {
      clearTimeout(this.questionTimer);
      clearInterval(this.tailRemoveInterval);
      clearInterval(this.drawLineinterval);
      clearTimeout(this.timeoutIdRemoveInterval);
    },
    moveToNextQuestion() {
      this.cleanUp();
      if (this.config.current_question >= this.totalQuestion) {
        this.endGame();
      } else {
        if (this.isTrainingCompleted) {
          this.setConfig(this.configs[this.indexConfig]);
        }
        setTimeout(() => {
          this.generateCoordinat();
          this.selectedAnswer = null;
        }, this.questionDuration - (Date.now() - this.questionStartTime));
      }

      this.config.current_question++;
      this.totalQuestionConfig++;
      this.answerIsRight = null;
    },
    async generateLines() {
      this.optionAnswers = [];
      this.rightTurns = 0;
      this.leftTurns = 0;
      this.responseQuestion = 0;
      this.responseTime = 0;
      this.answer = null;
      this.isShowAnswerBox = false;

      this.question = null;
      if (this.config.left_turn && this.config.right_turn) {
        this.question = Math.random() < 0.5 ? "right" : "left";
      } else if (this.config.left_turn) {
        this.question = "left";
      } else if (this.config.right_turn) {
        this.question = "right";
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
          const res = await fetch("/scenario.json", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });
          this.data = await res.json();
        }

        const choosenlines =
          this.linesUsed.length + 1 === this.data[this.config.crash]
            ? this.data[this.config.crash - 1]
            : this.data[this.config.crash];

        let randomIndex = Math.floor(Math.random() * choosenlines.length);

        this.linesUsed.push(randomIndex);
        this.lines = choosenlines[randomIndex];

        this.lines = this.limitTurns(this.lines, this.config.max_turns);
        //console.log(this.lines)

        this.generateLines();
        this.startQuestionTimer();
      } catch (error) {
        console.log(error);
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
          (prevDirection.x !== currDirection.x &&
            currDirection.x !== nextDirection.x) ||
          (prevDirection.y !== currDirection.y &&
            currDirection.y !== nextDirection.y)
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
      const ctx = canvas.getContext("2d");
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

      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.stroke();

      this.drawArrowHead("init");
      this.responseQuestion = Date.now();
      this.setAnswerOption();

      this.timeoutIdRemoveInterval = setTimeout(() => {
        this.startTailDisappearance();
      }, 2000);
    },
    async drawLineOneByOne(startIndex = 0) {
      const canvas = this.$refs.lineCanvas;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

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
          this.drawArrowHead("init");
          this.responseQuestion = Date.now();
          this.setAnswerOption();
        } else {
          this.drawIndex = i;
        }
      }, this.config.speed);
    },
    countTurns(index) {
      if (index <= 0 || index >= this.lines.length - 1) return;

      const prev = this.lines[index - 1];
      const curr = this.lines[index];
      const next = this.lines[index + 1];

      const crossProduct =
        (curr.x - prev.x) * (next.y - curr.y) -
        (curr.y - prev.y) * (next.x - curr.x);

      if (crossProduct > 0) {
        this.rightTurns += 1;
      } else if (crossProduct < 0) {
        this.leftTurns += 1;
      }
      //console.log(crossProduct,crossProduct > 0 ?'belok kanan':'belok kiri',this.leftTurns,this.rightTurns)
    },
    setAnswerOption() {
      if (this.config.left_turn && this.config.right_turn) {
        this.question = Math.random() < 0.5 ? "right" : "left";
      } else if (this.config.left_turn) {
        this.question = "left";
      } else if (this.config.right_turn) {
        this.question = "right";
      }

      this.answer = this.question === "left" ? this.leftTurns : this.rightTurns;
      console.log(
        "jawaban",
        this.answer,
        this.question === "left" ? this.leftTurns : this.rightTurns
      );

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
        [possibleOptions[i], possibleOptions[j]] = [
          possibleOptions[j],
          possibleOptions[i],
        ];
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
      const ctx = canvas.getContext("2d");

      if (this.lines.length < 2) return;

      const end = this.lines[this.lines.length - 1];
      const start = this.lines[this.lines.length - 2];

      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const headlen = 10;

      const leftX = end.x - headlen * Math.cos(angle - Math.PI / 6);
      const leftY = end.y - headlen * Math.sin(angle - Math.PI / 6);
      const rightX = end.x - headlen * Math.cos(angle + Math.PI / 6);
      const rightY = end.y - headlen * Math.sin(angle + Math.PI / 6);

      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(leftX, leftY);
      ctx.lineTo(rightX, rightY);
      ctx.closePath();
      ctx.fill();

      //if (isInit) {
      //  if (start.x < end.x) {
      //    this.rightTurns++;
      //  }
      //
      //  if (start.x > end.x) {
      //    this.leftTurns++;
      //  }
      //}
      console.log(isInit);
    },
    startTailDisappearance(startIndex = 0) {
      const canvas = this.$refs.lineCanvas;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

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
          type: "correct",
          responseTime: this.responseTime - this.questionStartTime,
          timestamp: Date.now(),
        });
        this.answerIsRight = true;
      } else {
        this.userInputs.push({
          type: "wrong",
          responseTime: this.responseTime - this.questionStartTime,
          timestamp: Date.now(),
        });
        this.answerIsRight = false;
      }

      this.responseDurations.push(this.responseTime - this.questionStartTime);

      // Don't move to the next question immediately
      // The moveToNextQuestion method will be called when the fixed interval is over
    },
    averageResponseTime() {
      if (this.responseDurations.length > 0) {
        const sum = this.responseDurations.reduce((acc, curr) => acc + curr, 0);
        return sum / this.responseDurations.length / 1000;
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
  width: 100%;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.modal-content button {
  padding: 10px 20px;
  background-color: #5e37a6;
  color: white;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  font-size: 1em;
}

.modal-content button:hover {
  background-color: #5e37a6;
}

.timer-container {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  background-color: #0349d0;
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
  font-size: 24px;
  font-weight: bold;
}

.answer-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 20px;
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
  background-color: #0349d0;
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

.digit-number.correct {
  background-color: #4caf50;
  /* Green color for selected button */
}

.digit-number.wrong {
  background-color: #e62f2f;
  /* Green color for selected button */
}

.digit-number.next {
  background-color: #0349d0;
}

.digit-number.next:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.finish-button {
  position: fixed;
  bottom: 20px;
  left: 50%;
  /* Center horizontally */
  transform: translateX(-50%);
  /* Adjust to truly center */
  padding: 10px 20px;
  font-size: 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.selected {
  background-color: #007bff;
  color: white;
}
</style>
