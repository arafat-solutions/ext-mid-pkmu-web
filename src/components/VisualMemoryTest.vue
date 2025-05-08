<template>
  <div class="visual-container relative">
    <div>
      <canvas
        ref="visualCanvas"
        :width="canvasDimensions.width"
        :height="canvasDimensions.height"
      ></canvas>
      <p
        v-if="answerIsRight === true && isTraining"
        class="text-green-500 text-3xl mt-16"
      >
        Benar!
      </p>
      <p
        v-if="answerIsRight === false && isTraining"
        class="text-red-500 text-3xl mt-16"
      >
        Salah!
      </p>
    </div>
    <div class="timer" v-if="!isTraining">
      <p>Waktu:</p>
      <p>{{ formatTime(testTime) }}</p>
    </div>
    <input
      v-if="input.input1.visible"
      :style="input.input1.style"
      v-model="input.input1.userInput"
      ref="input1"
    />
    <input
      v-if="input.input2.visible"
      :style="input.input2.style"
      v-model="input.input2.userInput"
      ref="input2"
    />
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">Your result is submitting</div>
    </div>
    <div v-if="isTraining" class="training-message">
      <button @click="openModal" class="finish-button">Selesai Latihan</button>
    </div>
  </div>
  <div v-if="isShowModal === true" class="modal-overlay">
    <div class="modal-content">
      <p v-if="actualTestCount>=1">
        Tes pertama telah selesai, anda akan melakukan tes yang sama lagi untuk
        melihat perkembangan pemahaman Anda.
      </p>
      <p>
        <strong> Apakah Anda Yakin akan memulai tes </strong>
      </p>
      <button @click="startTest">Ya, Mulai tes</button>
    </div>
  </div>
</template>

<script>
import { patchWorkstation } from "@/utils/fetch";
import { removeTestByNameAndUpdateLocalStorage } from "@/utils/index";

export default {
  data() {
    return {
      canvasWidth: 0,
      isShowModal: false,
      canvasHeight: 0,
      canvasRect: null,
      timerConfig: {
        timerPosition: { top: "20px", left: `${this.canvasWidth / 2}px` },
      },
      loading: false,
      memoryTime: 0,
      testTime: 0,
      actualTestCount: 0,
      renderInput: 0,
      taskNo: 0,
      input: {
        input1: {
          visible: false,
          style: {
            position: "absolute",
            top: "0px",
            left: "0px",
            width: "0px",
            height: "0px",
          },
          userInput: "",
        },
        input2: {
          visible: false,
          style: {
            position: "absolute",
            top: "0px",
            left: "0px",
            width: "0px",
            height: "0px",
          },
          userInput: "",
        },
      },
      innerConfig: [],
      questions: [],
      questionMarkPositions: [],
      canAnswer: false,
      result: {
        noOfQuestionDisplayed: 1,
        unansweredQuestion: 0,
        correctAnswer: 0,
      },
      configBe: {
        duration: 5,
        display: {
          alphanumeric: true,
          shape: true,
        },
        questionInterval: 45,
        testId: "",
        moduleId: "",
        sessionId: "",
        userId: "",
      },
      timerInterval: null,
      tesInterval: null,
      refreshCount: 0,
      tempFirstResult: 0,
      questionMarkTimer: null,
      questionMarkStartTime: null,
      questionMarkDuration: 45,
      isQuestionMarkActive: false,
      userInputs: [],
      answerIsRight: null,
      isTraining: true, // New state variable for training phase
    };
  },
  async mounted() {
    this.updateCanvasDimensions();
    window.addEventListener("resize", this.handleResize);
    this.startTraining(); // Start the training phase
    document.addEventListener("keydown", this.handleGlobalKeydown);

    this.$refs.visualCanvas.addEventListener("click", this.handleTouchOrClick);
    this.$refs.visualCanvas.addEventListener(
      "touchstart",
      this.handleTouchOrClick
    );

    // Load the refresh count from localStorage
    this.refreshCount = parseInt(
      localStorage.getItem("refreshCountVisualMemoryTest") || "0"
    );
    // Increment the refresh count
    this.refreshCount++;
    // Save the updated count to localStorage
    localStorage.setItem(
      "refreshCountVisualMemoryTest",
      this.refreshCount.toString()
    );
    // Add event listener for beforeunload
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.handleGlobalKeydown);
    window.removeEventListener("resize", this.handleResize);
    clearInterval(this.tesInterval);
    clearInterval(this.timerInterval);

    this.clearQuestionMarkTimer();

    this.$refs.visualCanvas.removeEventListener(
      "click",
      this.handleTouchOrClick
    );
    this.$refs.visualCanvas.removeEventListener(
      "touchstart",
      this.handleTouchOrClick
    );
    // Remove the beforeunload event listener
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
  },
  methods: {
    setAnswerIsRight(value) {
      this.answerIsRight = value;
      setTimeout(() => {
        this.answerIsRight = null;
      }, 4000);
    },
    initVisual() {
      const canvas = this.$refs.visualCanvas;
      this.ctx = canvas.getContext("2d");
    },

    cleanUp() {
      clearInterval(this.tesInterval);
      clearInterval(this.timerInterval);
      this.clearQuestionMarkTimer();
    },
    startTest() {
      const updatePayload = {
        status: "IN_TESTING",
        name: "Time Sharing Test",
      };
      patchWorkstation(updatePayload);
      this.isShowModal = false;
      this.cleanUp();
      this.isTraining = false;
      this.initializeTest();
    },
    openModal() {
      this.isShowModal = true;
    },
    startTraining() {
      const updatePayload = {
        status: "IN_TRAINING",
        name: "Time Sharing Test",
      };
      patchWorkstation(updatePayload);
      this.isTraining = true;
      this.createRandomQuestion();
      this.initConfig();
      this.initVisual();
      this.drawVisual();
      this.countDownMemoryTime();
      this.countDownTestTime();
    },
    initializeTest() {
      this.questions = [];
      this.taskNo = 0;
      this.createRandomQuestion();
      this.initConfig();
      this.initVisual();
      this.drawVisual();
      this.countDownMemoryTime();
      this.countDownTestTime();
      this.userInputs = [];
    },
    initConfig() {
      const scheduleData = JSON.parse(localStorage.getItem("scheduleData"));
      // @TODO: Config Flow
      const test = scheduleData.tests.find(
        (t) => t.name === "Visual Memory Test"
      );
      const { display, number_of_question, interval } = test.configs[0];

      this.configBe = {
        duration: number_of_question * 60,
        questionInterval: interval,
        testId: test.id,
        sessionId: scheduleData.sessionId,
        userId: scheduleData.userId,
        display: {
          alphanumeric: display ? display.alphanumeric : true,
          shape: display ? display.shape : true,
        },
      };

      if (this.isTraining) {
        this.testTime = 99999;
      } else {
        this.testTime = 360;
      }
      this.memoryTime = 45;
    },
    updateCanvasDimensions() {
      this.canvasWidth = this.canvasDimensions.width;
      this.canvasHeight = this.canvasDimensions.height;
      this.updateCanvasRect();
    },

    drawVisual() {
      this.clearCanvas();
      this.drawVerticalLines();
      this.drawHorizontalLine();
      this.drawInnerBox();
    },
    clearCanvas() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    },
    drawVerticalLines() {
      const ctx = this.ctx;
      const lines = [
        { position: (this.canvasWidth * 3) / 10, width: 1 },
        { position: this.canvasWidth / 2, width: 8 },
        { position: (this.canvasWidth * 8) / 10, width: 1 },
      ];
      lines.forEach((line) => {
        ctx.beginPath();
        ctx.lineWidth = line.width;
        ctx.moveTo(line.position, 0);
        ctx.lineTo(line.position, this.canvasHeight);
        ctx.stroke();
      });
    },
    drawHorizontalLine() {
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.moveTo(0, this.canvasHeight / 2);
      ctx.lineTo(this.canvasWidth, this.canvasHeight / 2);
      ctx.stroke();
    },
    calculatePositions() {
      const { canvasWidth, canvasHeight } = this;
      const firstLine = (canvasWidth * 3) / 10;
      const middleLine = canvasWidth / 2;
      const lastLine = (canvasWidth * 8) / 10;
      return [
        { x: firstLine / 2, y: canvasHeight / 4 },
        { x: (firstLine + middleLine) / 2, y: canvasHeight / 4 },
        { x: (middleLine + lastLine) / 2, y: canvasHeight / 4 },
        { x: (lastLine + canvasWidth) / 2, y: canvasHeight / 4 },
        { x: firstLine / 2, y: (canvasHeight * 3) / 4 },
        { x: (firstLine + middleLine) / 2, y: (canvasHeight * 3) / 4 },
        {
          x: middleLine + (lastLine - middleLine) / 2,
          y: (canvasHeight * 3) / 4,
        },
        { x: (lastLine + canvasWidth) / 2, y: (canvasHeight * 3) / 4 },
      ];
    },
    drawInnerBox() {
      const ctx = this.ctx;
      const positions = this.calculatePositions();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      this.innerConfig.forEach((item, i) => {
        const pos = positions[i];
        if (item.type === "text" || item.type === "number") {
          this.drawText({
            ctx,
            text: item.text,
            x: pos.x,
            y: pos.y,
            bold: item.type === "text",
          });
        } else if (item.type === "shape") {
          switch (item.shapeName) {
            case "rectangle":
              this.drawRectangle({ ctx, shape: item, x: pos.x, y: pos.y });
              break;
            case "questionMark":
              this.drawQuestionMark({ ctx, x: pos.x, y: pos.y });
              break;
            case "circle":
              this.drawCircle({ ctx, shape: item, x: pos.x, y: pos.y });
              break;
            case "triangle":
              this.drawTriangle({ ctx, shape: item, x: pos.x, y: pos.y });
              break;
            case "arrow":
              this.drawArrow({ ctx, shape: item, x: pos.x, y: pos.y });
              break;
            case "octagon":
              this.drawOctagon({ ctx, shape: item, x: pos.x, y: pos.y });
              break;
            case "star":
              this.drawStar({ ctx, shape: item, x: pos.x, y: pos.y });
              break;
            case "parallelogram":
              this.drawParallelogram({ ctx, shape: item, x: pos.x, y: pos.y });
              break;
            case "leftArrow":
              this.drawLeftArrow({ ctx, shape: item, x: pos.x, y: pos.y });
              break;
            case "hexagon":
              this.drawHexagon({ ctx, shape: item, x: pos.x, y: pos.y });
              break;
            case "chevronLeft":
              this.drawChevronLeft({ ctx, shape: item, x: pos.x, y: pos.y });
              break;
            case "plane":
              this.drawPlane({ ctx, shape: item, x: pos.x, y: pos.y });
              break;
            case "returnArrow":
              this.drawReturnArrow({ ctx, shape: item, x: pos.x, y: pos.y });
              break;
            case "heart":
              this.drawHeart({ ctx, shape: item, x: pos.x, y: pos.y });
              break;
            case "s":
              this.drawS({ ctx, shape: item, x: pos.x, y: pos.y });
              break;
            case "l":
              this.drawL({ ctx, shape: item, x: pos.x, y: pos.y });
              break;
            case "t":
              this.drawT({ ctx, shape: item, x: pos.x, y: pos.y });
              break;
          }
        }
      });
    },
    drawText({ ctx, text, x, y, bold = false }) {
      ctx.font = bold ? "bold 50px Arial" : "50px Arial";
      ctx.fillStyle = "black";
      ctx.fillText(text, x, y);
    },
    drawRectangle({ ctx, shape, x, y }) {
      ctx.fillStyle = shape.color;
      ctx.fillRect(
        x - shape.width / 2,
        y - shape.height / 2,
        shape.width,
        shape.height
      );
    },
    drawQuestionMark({ ctx, x, y }) {
      ctx.fillStyle = "black";
      ctx.font = "bold 100px Arial";
      ctx.fillText("?", x, y);
    },
    drawCircle({ ctx, shape, x, y }) {
      ctx.fillStyle = shape.color;
      ctx.beginPath();
      ctx.arc(x, y, shape.width / 2, 0, Math.PI * 2);
      ctx.fill();
    },
    drawTriangle({ ctx, shape, x, y }) {
      ctx.fillStyle = shape.color;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((shape.angle * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(0, -shape.height / 2);
      ctx.lineTo(-shape.width / 2, shape.height / 2);
      ctx.lineTo(shape.width / 2, shape.height / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    drawArrow({ ctx, shape, x, y }) {
      ctx.fillStyle = shape.color;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((shape.angle * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(0, -shape.height / 2);
      ctx.lineTo(-shape.width / 2, shape.height / 2);
      ctx.lineTo(0, shape.height / 4);
      ctx.lineTo(shape.width / 2, shape.height / 2);
      ctx.lineTo(0, -shape.height / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    // new
    drawOctagon({ ctx, shape, x, y }) {
      ctx.fillStyle = shape.color;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((shape.angle * Math.PI) / 180);
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const px = 40 * Math.cos(angle);
        const py = 40 * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    drawStar({ ctx, shape, x, y }) {
      ctx.fillStyle = shape.color;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((shape.angle * Math.PI) / 180);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5;
        const px = 40 * Math.cos(angle);
        const py = 40 * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    drawParallelogram({ ctx, shape, x, y }) {
      ctx.fillStyle = shape.color;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((shape.angle * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(-40, -20);
      ctx.lineTo(20, -20);
      ctx.lineTo(40, 20);
      ctx.lineTo(-20, 20);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    drawLeftArrow({ ctx, shape, x, y }) {
      ctx.fillStyle = shape.color;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((shape.angle * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(20, -30);
      ctx.lineTo(-20, 0);
      ctx.lineTo(20, 30);
      ctx.lineTo(20, 15);
      ctx.lineTo(40, 15);
      ctx.lineTo(40, -15);
      ctx.lineTo(20, -15);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    drawHexagon({ ctx, shape, x, y }) {
      ctx.fillStyle = shape.color;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((shape.angle * Math.PI) / 180);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const px = 35 * Math.cos(angle);
        const py = 35 * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    drawChevronLeft({ ctx, shape, x, y }) {
      ctx.fillStyle = shape.color;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((shape.angle * Math.PI) / 180);
      ctx.scale(0.8, 0.8);
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(-40, -50);
      ctx.lineTo(-40, -20);
      ctx.lineTo(-10, 0);
      ctx.lineTo(-40, 20);
      ctx.lineTo(-40, 50);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    drawPlane({ ctx, shape, x, y }) {
      ctx.fillStyle = shape.color;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((shape.angle * Math.PI) / 180);
      ctx.scale(0.8, 0.8);
      ctx.beginPath();
      ctx.moveTo(-30, -30);
      ctx.lineTo(40, -20);
      ctx.lineTo(50, 0);
      ctx.lineTo(40, 20);
      ctx.lineTo(10, 10);
      ctx.lineTo(20, 40);
      ctx.lineTo(0, 50);
      ctx.lineTo(-20, 40);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    drawReturnArrow({ ctx, shape, x, y }) {
      ctx.fillStyle = shape.color;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((shape.angle * Math.PI) / 180);
      ctx.scale(0.6, 0.6);
      ctx.beginPath();
      ctx.moveTo(-60, -50);
      ctx.lineTo(50, -50);
      ctx.lineTo(70, -30);
      ctx.lineTo(70, 30);
      ctx.lineTo(50, 50);
      ctx.lineTo(-60, 50);
      ctx.lineTo(-60, 20);
      ctx.lineTo(20, 20);
      ctx.lineTo(40, 0);
      ctx.lineTo(20, -20);
      ctx.lineTo(-60, -20);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    drawHeart({ ctx, shape, x, y }) {
      ctx.fillStyle = shape.color;
      ctx.save();
      ctx.translate(x, y - 50);
      ctx.rotate((shape.angle * Math.PI) / 180);
      const width = 80;
      const height = 90;
      const topCurveHeight = height * 0.3;
      ctx.beginPath();
      ctx.moveTo(0, topCurveHeight);
      ctx.bezierCurveTo(0, 0, -width / 2, 0, -width / 2, topCurveHeight);
      ctx.bezierCurveTo(
        -width / 2,
        (height + topCurveHeight) / 2,
        0,
        (height + topCurveHeight) / 2,
        0,
        height
      );
      ctx.bezierCurveTo(
        0,
        (height + topCurveHeight) / 2,
        width / 2,
        (height + topCurveHeight) / 2,
        width / 2,
        topCurveHeight
      );
      ctx.bezierCurveTo(width / 2, 0, 0, 0, 0, topCurveHeight);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    drawS({ ctx, shape, x, y }) {
      ctx.fillStyle = shape.color;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((shape.angle * Math.PI) / 180);
      ctx.scale(0.8, 0.8);
      ctx.beginPath();
      ctx.moveTo(-50, 40);
      ctx.lineTo(20, 40);
      ctx.lineTo(20, 10);
      ctx.lineTo(shape.variant ? 90 : 60, 10);
      ctx.lineTo(shape.variant ? 90 : 60, -20);
      ctx.lineTo(-10, -20);
      ctx.lineTo(-10, 10);
      ctx.lineTo(-50, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    drawL({ ctx, shape, x, y }) {
      ctx.fillStyle = shape.color;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((shape.angle * Math.PI) / 180);
      ctx.scale(0.8, 0.8);
      ctx.beginPath();
      ctx.moveTo(-40, 40);
      ctx.lineTo(20, 40);
      ctx.lineTo(20, 10);
      ctx.lineTo(-10, 10);
      ctx.lineTo(-10, -40);
      ctx.lineTo(-40, -40);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    drawT({ ctx, shape, x, y }) {
      ctx.fillStyle = shape.color;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((shape.angle * Math.PI) / 180);
      ctx.scale(0.6, 0.8);
      ctx.beginPath();
      ctx.moveTo(-60, 40);
      ctx.lineTo(60, 40);
      ctx.lineTo(60, 10);
      ctx.lineTo(20, 10);
      ctx.lineTo(20, -20);
      ctx.lineTo(-20, -20);
      ctx.lineTo(-20, 10);
      ctx.lineTo(-60, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    // new
    calculateInputPositions() {
      if (!this.canvasRect) {
        return null;
      }

      const canvasTop = this.canvasRect.top;
      const canvasLeft = this.canvasRect.left;
      const inputWidth = 100;
      const verticalOffset = 40;

      const positions = this.calculatePositions();

      return {
        input1: {
          top:
            positions[this.questionMarkPositions[0]].y +
            canvasTop +
            verticalOffset,
          left:
            positions[this.questionMarkPositions[0]].x +
            canvasLeft -
            inputWidth / 2,
        },
        input2: {
          top:
            positions[this.questionMarkPositions[1]].y +
            canvasTop +
            verticalOffset,
          left:
            positions[this.questionMarkPositions[1]].x +
            canvasLeft -
            inputWidth / 2,
        },
      };
    },
    drawInput({ input, inputType }) {
      const positions = this.calculateInputPositions();
      if (!positions) {
        return;
      }

      const position = positions[inputType];

      input.style.position = "fixed";
      input.style.top = `${position.top}px`;
      input.style.left = `${position.left}px`;
      input.style.width = `100px`;
      input.style.height = `20px`;
      input.visible = true;
    },
    countDownTestTime() {
      this.tesInterval = setInterval(async () => {
        if (this.testTime > 0) {
          this.testTime--;
          this.drawVisual();
        } else {
          clearInterval(this.tesInterval);
          this.actualTestCount += 1;
          if (this.actualTestCount < 2) {
            this.tempFirstResult = {
              ...this.result,
              graph_data: this.userInputs,
            };
            this.openModal();
          } else {
            await this.submitResult();
          }
        }
      }, 1000);
    },
    countDownMemoryTime() {
      this.clearQuestionMarkTimer();
      this.timerInterval = setInterval(() => {
        if (this.memoryTime > 0) {
          this.memoryTime--;
          this.drawVisual();
        } else {
          if (this.taskNo < 2) {
            this.memoryTime = 45;
            this.createRandomQuestion();
          } else {
            this.startQuestionMark();
          }
        }
      }, 1000);
    },
    startQuestionMark() {
      clearInterval(this.timerInterval);
      const newQuestion = this.createQuestion(4);
      //get random 2 question
      const randomQuestion = this.questions.splice(0, 4);
      const targetIndexesQuestions = [0, 1, 4, 5];
      const targetIndexesNewQuestions = [2, 3, 6, 7];
      targetIndexesQuestions.forEach((index, i) => {
        this.innerConfig[index] = newQuestion[i];
      });
      targetIndexesNewQuestions.forEach((index, i) => {
        this.innerConfig[index] = randomQuestion[i];
      });
      this.questions.push(...newQuestion);
      while (this.questionMarkPositions.length < 2) {
        const randomIndex = Math.random() < 0.5 ? 3 : 7;
        if (
          this.innerConfig[randomIndex].type === "text" ||
          this.innerConfig[randomIndex].type === "number"
        ) {
          this.innerConfig[randomIndex] = {
            type: "shape",
            shapeName: "questionMark",
            answer: this.innerConfig[randomIndex].text,
          };
          this.questionMarkPositions.push(randomIndex);
        }
      }
      this.questionMarkPositions = this.questionMarkPositions.sort(
        (a, b) => a - b
      );
      this.canAnswer = true;
      this.isQuestionMarkActive = true;
      this.questionMarkStartTime = Date.now();
      this.startQuestionMarkTimer();
      this.drawVisual();
    },
    startQuestionMarkTimer() {
      this.clearQuestionMarkTimer();

      if (this.testTime > 0) {
        this.questionMarkTimer = setTimeout(() => {
          if (this.isQuestionMarkActive) {
            this.autoProcessQuestion();
          }
        }, this.questionMarkDuration * 1000);
      }
    },
    clearQuestionMarkTimer() {
      if (this.questionMarkTimer) {
        clearTimeout(this.questionMarkTimer);
        this.questionMarkTimer = null;
      }
    },
    autoProcessQuestion() {
      this.userInputs.push({
        type: "wrong",
        responseTime: this.questionMarkDuration * 1000,
        timestamp: Date.now(),
      });

      // Reset question mark related states
      this.isQuestionMarkActive = false;
      this.renderInput = 0;
      this.input.input1.visible = false;
      this.input.input2.visible = false;
      this.input.input1.userInput = "";
      this.input.input2.userInput = "";

      // Count as unanswered
      this.result.unansweredQuestion += 1;

      // Clear positions and move to next question
      this.questionMarkPositions = [];
      this.questionMarkStartTime = null;

      if (this.testTime > 0) {
        this.startQuestionMark();
      }
    },
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainderSeconds = seconds % 60;
      return `${minutes}:${
        remainderSeconds < 10 ? "0" : ""
      }${remainderSeconds}`;
    },
    handleGlobalKeydown(event) {
      if (this.memoryTime === 0 && this.canAnswer) {
        if (event.key === "Enter") {
          this.clearQuestionMarkTimer();

          const input1 = this.input.input1;
          const input2 = this.input.input2;
          const responseTime = Date.now() - this.questionMarkStartTime;

          if (this.renderInput === 0) {
            this.renderInput = 1;

            this.drawInput({ input: this.input.input1, inputType: "input1" });

            this.$nextTick(() => {
              if (this.$refs.input1) {
                this.$refs.input1.focus();
              }
            });
          } else if (this.renderInput === 1) {
            this.renderInput = 2;

            this.drawInput({ input: this.input.input2, inputType: "input2" });

            this.$nextTick(() => {
              if (this.$refs.input2) {
                this.$refs.input2.focus();
              }
            });
          } else if (this.renderInput === 2) {
            if (
              this.input.input1.userInput === "" &&
              this.input.input2.userInput === ""
            ) {
              return;
            }
            let resultQuestion1 = false;
            let resultQuestion2 = false;

            // check if the answer is empty
            if (input1.userInput === "" && input2.userInput === "") {
              this.result.unansweredQuestion += 1;
            }

            // check if answer is correct
            const answer1 = this.innerConfig[3].answer;
            const answer2 = this.innerConfig[7].answer;
            if (Number(input1.userInput) === answer1) {
              resultQuestion1 = true;
            }

            if (Number(input2.userInput) === answer2) {
              resultQuestion2 = true;
            }

            if (resultQuestion1 && resultQuestion2) {
              this.result.correctAnswer += 1;
              this.userInputs.push({
                type: "correct",
                responseTime,
                timestamp: Date.now(),
              });
              this.setAnswerIsRight(true);
            } else {
              this.userInputs.push({
                type: "wrong",
                responseTime,
                timestamp: Date.now(),
              });
              this.setAnswerIsRight(false);
            }

            this.renderInput = 0;
            input1.visible = false;
            input2.visible = false;
            input1.userInput = "";
            input2.userInput = "";
            resultQuestion1 = false;
            resultQuestion2 = false;
            this.questionMarkPositions = [];

            if (this.testTime > 0) {
              this.startQuestionMark();
            }
          }
        }
      }
    },
    createQuestion(count = 1) {
      const arrQuestion = [];

      for (let i = 0; i < count; i++) {
        //if index odd assign number else assign either text or symbol
        if (i % 2 !== 0) {
          arrQuestion.push(this.generateRandomNumbers());
        } else {
          if (Math.random() < 0.5) {
            arrQuestion.push(this.getRandomShape());
          } else {
            arrQuestion.push(this.generateRandomLetters());
          }
        }
      }
      return arrQuestion;
    },

    createRandomQuestion() {
      //const { display } = this.configBe;
      const arrQuestion = this.createQuestion(8);

      // Ensure at least 2 text or number elements
      //while (textOrNumberCount < 2) {
      //  const randomIndex = Math.floor(Math.random() * 8);
      //  if (arrQuestion[randomIndex].type === "shape") {
      //    if (Math.random() < 0.5) {
      //      arrQuestion[randomIndex] = this.generateRandomNumbers();
      //    } else {
      //      arrQuestion[randomIndex] = this.generateRandomLetters();
      //    }
      //    textOrNumberCount++;
      //  }
      //}

      this.innerConfig = JSON.parse(JSON.stringify(arrQuestion));
      this.questions.push(...arrQuestion);
      this.taskNo += 1;
    },
    generateRandomLetters() {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let result = "";
      for (let i = 0; i < 2; i++) {
        result += letters.charAt(Math.floor(Math.random() * letters.length));
      }

      return { type: "text", text: result };
    },
    generateRandomNumbers() {
      const number = Math.floor(Math.random() * 90) + 10; // Generates a number between 10 and 99
      return { type: "number", text: number };
    },
    //getRandomShape() {
    //  const shapes = [
    //    "triangle",
    //    "rectangle",
    //    "arrow",
    //    "circle",
    //    "octagon",
    //    "star",
    //    "parallelogram",
    //    "leftArrow",
    //    "hexagon",
    //    "chevronLeft",
    //    "plane",
    //    "returnArrow",
    //    "heart",
    //    "s",
    //    "l",
    //    "t",
    //  ];
    //  const shape = shapes[Math.floor(Math.random() * shapes.length)];
    //  const commonAttributes = {
    //    type: "shape",
    //    shapeName: shape,
    //    color: this.getRandomColor(),
    //  };
    //
    //  return { type: "text", text: result };
    //},
    //generateRandomNumbers() {
    //  const number = Math.floor(Math.random() * 90) + 10; // Generates a number between 10 and 99
    //  return { type: "number", text: number };
    //},
    getRandomShape() {
      const shapes = [
        "triangle",
        "rectangle",
        "arrow",
        "circle",
        "octagon",
        "star",
        "parallelogram",
        "leftArrow",
        "hexagon",
        "chevronLeft",
        "plane",
        "returnArrow",
        "heart",
        "s",
        "l",
        "t",
      ];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const commonAttributes = {
        type: "shape",
        shapeName: shape,
        color: this.getRandomColor(),
      };

      const isSquare = Math.random() < 0.5;
      switch (shape) {
        case "rectangle":
          return {
            ...commonAttributes,
            width: isSquare ? 100 : 130,
            height: isSquare ? 100 : 50,
          };
        case "heart":
          return { ...commonAttributes, width: 80, height: 80 };
        case "triangle":
        case "arrow":
        case "circle":
        case "octagon":
        case "star":
        case "parallelogram":
        case "leftArrow":
        case "hexagon":
        case "chevronLeft":
        case "plane":
        case "returnArrow":
        case "l":
        case "t":
          return {
            ...commonAttributes,
            width: 80,
            height: 80,
            angle: this.getRandomAngle(),
          };
        case "s":
          return {
            ...commonAttributes,
            width: 80,
            height: 80,
            variant: Math.random() < 0.5,
            angle: this.getRandomAngle(),
          };
        default:
          throw new Error("Unknown shape type");
      }
    },
    getRandomColor() {
      const colors = ["blue", "red", "green", "yellow"];
      return colors[Math.floor(Math.random() * colors.length)];
    },
    getRandomAngle() {
      return Math.floor(Math.random() * 361); // Generates a random angle between 0 and 360 (inclusive)
    },
    updateCanvasRect() {
      if (this.$refs.visualCanvas) {
        this.canvasRect = this.$refs.visualCanvas.getBoundingClientRect();
      }
    },
    handleResize() {
      this.updateCanvasDimensions();
      this.drawVisual();
      if (this.input.input1.visible) {
        this.drawInput({ input: this.input.input1, inputType: "input1" });
      }
      if (this.input.input2.visible) {
        this.drawInput({ input: this.input.input2, inputType: "input2" });
      }
    },
    async submitResult() {
      try {
        this.loading = true;
        const API_URL = process.env.VUE_APP_API_URL;

        const payload = {
          testSessionId: this.configBe.sessionId,
          userId: this.configBe.userId,
          batteryTestId: this.configBe.testId,
          result: this.tempFirstResult,
          result2: { ...this.result, graph_data: this.userInputs },
          refreshCount: this.refreshCount,
        };
        const response = await fetch(`${API_URL}/api/submission`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
          removeTestByNameAndUpdateLocalStorage("Visual Memory Test");
        // Remove the refresh count in localStorage after successful submission
        localStorage.removeItem("refreshCountVisualMemoryTest");
        this.$router.push("/module");
      } catch (error) {
        console.log(error, "<< error");
      } finally {
        this.loading = false; // Set loading to false when the submission is complete
      }
    },
    // for touchscreen
    handleTouchOrClick() {
      if (this.memoryTime === 0 && this.canAnswer) {
        if (this.renderInput === 0) {
          this.renderInput = 1;
          this.drawInput({ input: this.input.input1, inputType: "input1" });
          this.$nextTick(() => {
            if (this.$refs.input1) {
              this.$refs.input1.focus();
            }
          });
        } else if (this.renderInput === 1) {
          this.renderInput = 2;
          this.drawInput({ input: this.input.input2, inputType: "input2" });
          this.$nextTick(() => {
            if (this.$refs.input2) {
              this.$refs.input2.focus();
            }
          });
        }
      }
    },
    processAnswers() {
      if (this.questionMarkTimer) {
        clearTimeout(this.questionMarkTimer);
      }
      this.isQuestionMarkActive = false;

      const input1 = this.input.input1;
      const input2 = this.input.input2;
      const responseTime = Date.now() - this.questionMarkStartTime;

      let resultQuestion1 = false;
      let resultQuestion2 = false;

      // Check if the answer is empty
      if (input1.userInput === "" && input2.userInput === "") {
        this.result.unansweredQuestion += 1;
        this.userInputs.push({
          type: "wrong",
          responseTime,
          timestamp: Date.now(),
        });
      }

      // Check if answers are correct
      if (this.questions[this.questionMarkPositions[0]].type === "number") {
        if (
          Number(input1.userInput) ===
          this.questions[this.questionMarkPositions[0]].text
        ) {
          resultQuestion1 = true;
        }
      } else if (
        this.questions[this.questionMarkPositions[0]].type === "text"
      ) {
        if (
          input1.userInput.toUpperCase() ===
          this.questions[this.questionMarkPositions[0]].text
        ) {
          resultQuestion1 = true;
        }
      }

      if (this.questions[this.questionMarkPositions[1]].type === "number") {
        if (
          Number(input2.userInput) ===
          this.questions[this.questionMarkPositions[1]].text
        ) {
          resultQuestion2 = true;
        }
      } else if (
        this.questions[this.questionMarkPositions[1]].type === "text"
      ) {
        if (
          input2.userInput.toUpperCase() ===
          this.questions[this.questionMarkPositions[1]].text
        ) {
          resultQuestion2 = true;
        }
      }

      if (resultQuestion1 && resultQuestion2) {
        this.result.correctAnswer += 1;
        this.userInputs.push({
          type: "correct",
          responseTime,
          timestamp: Date.now(),
        });
        this.setAnswerIsRight(true);
      } else {
        this.userInputs.push({
          type: "wrong",
          responseTime: responseTime,
          timestamp: Date.now(),
        });
        this.setAnswerIsRight(false);
      }

      this.renderInput = 0;
      input1.visible = false;
      input2.visible = false;
      input1.userInput = "";
      input2.userInput = "";
      this.questionMarkPositions = [];
      this.questionMarkStartTime = null;

      if (this.testTime > 0) {
        this.startQuestionMark();
      }
    },
    handleBeforeUnload() {
      // Save the current refresh count to localStorage before the page unloads
      localStorage.setItem(
        "refreshCountVisualMemoryTest",
        this.refreshCount.toString()
      );
    },
  },
  computed: {
    canvasDimensions() {
      return {
        width: Math.min(1000, window.innerWidth * 0.9),
        height: Math.min(400, window.innerHeight * 0.7),
      };
    },
  },
};
</script>

<style scoped>
.visual-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  /* width: 100vw; */
  position: relative;
  flex-direction: column;
}

canvas {
  display: block;
  margin: 0 auto;
  background-color: white;
  border: 2px solid black;
}

.timer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  margin: 0 auto;
  font-size: 24px;
  font-weight: bold;
  width: 300px;
  height: 60px;
  background-color: #6757dc;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
}

.timer p {
  margin: 0;
  padding: 0;
}

.timer :nth-child(1) {
  font-size: 12px;
}

.timer :nth-child(2) {
  font-size: 24px;
  margin-top: 4px;
}

input {
  border: 1px solid black;
  padding: 5px;
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

.loading-spinner {
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

.loading-text {
  color: #ffffff;
  margin-top: 20px;
  font-size: 1.2em;
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
</style>
