<template>
  <div class="simulation-container">
    <div class="timer" v-if="timeRemaining > 0">{{ formattedTime }}</div>
    <canvas ref="canvas" :width="canvasWidth" :height="canvasHeight"></canvas>

    <!-- <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>Simulation Results</h2>
        <p>Average Response Time: {{ averageResponseTime.toFixed(2) }} ms</p>
        <p>Mispresses: {{ mispresses }}</p>
        <p>Correct Presses: {{ correctPresses }}</p>
        <p>Correct Answers: {{ correctAnswers }}</p>
        <p>Incorrect Answers: {{ incorrectAnswers }}</p>
        <p>Left Segment Aimed Time: {{ leftAimedTime.toFixed(2) }} seconds</p>
        <p>Right Segment Aimed Time: {{ rightAimedTime.toFixed(2) }} seconds</p>
        <button @click="closeModal">Close</button>
      </div>
    </div> -->
    <div v-if="showInstructionModal" class="instruction-modal">
      <div class="instruction-modal-content">
        <h2 style="font-size: 24px">
          <b v-if="!trainingCompleted">{{
            currentTrainingTask
              ? "Latihan: " + getTitleModal(currentTrainingTask)
              : "Instruksi"
          }}</b>
        </h2>
        <p
          style="font-size: 20px"
          class="flex flex-col items-center"
          v-html="instructionModalContent"
        ></p>
        <button @click="startTest">
          {{ trainingCompleted ? "Mulai Tes" : "Mulai Latihan" }}
        </button>
      </div>
    </div>
  </div>
  <div
    v-if="feedbackMessage && !trainingCompleted"
    :class="{ feedback: true, correct: isCorrect, wrong: !isCorrect }"
  >
    {{ feedbackMessage }}
  </div>
  <button
    v-if="!trainingCompleted"
    @click="endTrainingTask"
    class="finish-button"
  >
    Selesai Latihan
  </button>
</template>

<script>
import { removeTestByNameAndUpdateLocalStorage } from "@/utils";

export default {
  data() {
    return {
      feedbackMessage: "",
      isCorrect: null,
      isPressed: null,
      canvasWidth: 1000,
      canvasHeight: 600,
      backgroundColor: "black",
      separatorColor: "#333",
      textColor: "white",
      leftTarget: { x: 75, y: 450 },
      rightTarget: { x: 700, y: 300 },
      leftCursor: { x: 75, y: 450 },
      rightCursor: { x: 700, y: 300 },
      config: {
        sessionId: "",
        userId: "",
        testId: "",
      },
      gamepad: null,
      gamepadIndex: 0,
      thruster: null,
      thrustIndex: 0,
      animationFrameId: null,
      gamepadConnected: false,
      thrustConnected: false,
      navigationResponses: [],
      lastDeviationCheck: 0,
      deviationCheckInterval: 1000, // 1 second in milliseconds
      mathQuestionInterval: 15000, // 15 seconds in milliseconds (adjust as needed)
      lastQuestionTime: 0,
      answerState: null, // null, 'correct', or 'incorrect'
      deviationThreshold: 20,
      targetSpeed: 0.7,
      lights: [
        { id: 1, state: "off", timer: null },
        { id: 2, state: "off", timer: null },
        { id: 3, state: "off", timer: null },
        { id: 4, state: "off", timer: null },
      ],
      alertResponses: [],
      question: "",
      userAnswer: "",
      mathResponses: [],
      currentAnswer: 0,
      questionTimer: null,
      timeRemaining: 0,
      timerInterval: null,
      duration: 300,
      showModal: false,
      drawInterval: null,
      mispresses: 0,
      correctPresses: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      leftAimedTime: 0,
      rightAimedTime: 0,
      showVirtualKeyboard: false,
      leftTargetDirection: { x: 0, y: 1 }, // Initially moving down
      rightTargetDirection: { x: 1, y: 1 }, // Initially moving down-right
      directionChangeInterval: 5000, // Change direction every 3 seconds
      targetRadius: 10, // Increased target size
      topSectionHeight: 150, // Reduced top section height
      cursorRadius: 15, // Increased cursor size
      nearThreshold: 30, // Distance threshold for "near" cursor state
      trainingCompleted: false,
      currentTrainingTask: null,
      trainingTasks: ["navigation", "math", "alertLight", "combined"],
      showInstructionModal: false,
      instructionModalContent: "",
      trainingDuration: 99999989, // 15 seconds for each training task
      activeTasks: {
        navigation: false,
        math: false,
        alertLight: false,
      },
      answerSubmitted: false,
    };
  },
  computed: {
    averageResponseTime() {
      const allResponses = [
        ...this.alertResponses,
        ...this.mathResponses,
        ...this.navigationResponses,
      ];
      return allResponses.length
        ? allResponses.reduce((a, b) => a + b.responseTime, 0) /
            allResponses.length
        : 0;
    },
    formattedTime() {
      const minutes = Math.floor(this.timeRemaining / 60);
      const seconds = this.timeRemaining % 60;
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    },
  },
  methods: {
    draw() {
      const canvas = this.$refs.canvas;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

      ctx.strokeStyle = this.separatorColor;
      ctx.lineWidth = 2;

      // Always draw the vertical separator
      ctx.beginPath();
      ctx.moveTo(this.canvasWidth * 0.15, 0);
      ctx.lineTo(this.canvasWidth * 0.15, this.canvasHeight);
      ctx.stroke();

      // Only draw the horizontal separator if more than one task is active
      if (Object.values(this.activeTasks).filter(Boolean).length > 1) {
        ctx.beginPath();
        ctx.moveTo(0, this.topSectionHeight);
        ctx.lineTo(this.canvasWidth, this.topSectionHeight);
        ctx.stroke();
      }

      if (this.activeTasks.alertLight) {
        this.drawAlertLights(ctx);
      }
      if (this.activeTasks.math) {
        this.drawMathTask(ctx);
      }
      if (this.activeTasks.navigation) {
        this.drawNavigationTasks(ctx);
      }
    },
    getTitleModal(string) {
      switch (string) {
        case "navigation":
          return "navigasi";
        case "math":
          return "Matematika";
        case "alertLight":
          return "Lampu Peringatan";
        case "combined":
          return "Gabungan";
      }
    },

    drawAlertLights(ctx) {
      const lightSize = 60;
      const padding = 10;

      this.lights.forEach((light, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        const x = padding + col * (lightSize + padding);
        const y = padding + row * (lightSize + padding);

        ctx.fillStyle =
          light.state === "red"
            ? "red"
            : light.state === "yellow"
            ? "yellow"
            : "grey";
        ctx.fillRect(x, y, lightSize, lightSize);

        if (
          this.isPressed &&
          (light.state === "yellow" || light.state === "red")
        ) {
          ctx.strokeStyle = "grey"; // Border color
          ctx.lineWidth = 4; // Border thickness
          ctx.strokeRect(x, y, lightSize, lightSize);
        }
      });
    },
    drawMathTask(ctx) {
      const keyboardHeight = this.topSectionHeight;

      // Draw answer box with color based on answer state
      let boxColor = "#222"; // Default color
      if(this.trainingCompleted&&this.answerState){
        //light grey
        boxColor = "grey";
      }else if (this.answerState === "correct") {
        boxColor = "green";
      } else if (this.answerState === "incorrect") {
        boxColor = "red";
      }

      const leftSectionWidth = this.canvasWidth * 0.15;
      const mathSectionWidth = this.canvasWidth - leftSectionWidth;
      const keyboardWidth = mathSectionWidth * 0.6;

      ctx.fillStyle = boxColor;
      ctx.fillRect(
        leftSectionWidth + keyboardWidth + 20,
        70,
        mathSectionWidth - keyboardWidth - 40,
        40
      );
      ctx.fillStyle = "white";
      ctx.fillText(
        `${this.userAnswer}`,
        leftSectionWidth + keyboardWidth + 50,
        95
      );
      // Draw question
      ctx.fillStyle = this.textColor;
      ctx.font = "24px Arial";
      ctx.textAlign = "left";
      ctx.fillText(this.question, leftSectionWidth + keyboardWidth + 20, 40);

      this.drawVirtualKeyboard(
        ctx,
        leftSectionWidth,
        keyboardWidth,
        keyboardHeight
      );
    },

    drawVirtualKeyboard(ctx, startX, keyboardWidth, keyboardHeight) {
      const numRows = 2;
      const numCols = 6;
      const keyWidth = keyboardWidth / numCols - 10; // 5px gap on each side
      const keyHeight = keyboardHeight / numRows - 10; // 5px gap on top and bottom
      const startY = 5; // Top padding

      const keys = [
        ["7", "8", "9", "4", "5", "6"],
        ["1", "2", "3", "0", "Hapus", "Kirim"],
      ];

      ctx.textAlign = "center"; // Center text horizontally
      ctx.textBaseline = "middle"; // Center text vertically

      keys.forEach((row, rowIndex) => {
        row.forEach((key, colIndex) => {
          const x = startX + colIndex * (keyWidth + 10) + 5;
          const y = startY + rowIndex * (keyHeight + 10);

          ctx.fillStyle =
            key === "Hapus" || key === "Kirim" ? "#4a4a4a" : "#333";
          ctx.fillRect(x, y, keyWidth, keyHeight);

          // Adjust font size for numbers and text buttons
          ctx.fillStyle = "white";
          ctx.font =
            key === "Hapus" || key === "Kirim"
              ? "bold 20px Arial"
              : "bold 28px Arial";

          // Draw text centered both horizontally and vertically
          ctx.fillText(key, x + keyWidth / 2, y + keyHeight / 2);
        });
      });
    },
    handleCanvasClick(event) {
      const canvas = this.$refs.canvas;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const leftSectionWidth = this.canvasWidth * 0.15;
      const mathSectionWidth = this.canvasWidth - leftSectionWidth;
      const keyboardWidth = mathSectionWidth * 0.6;

      // Check if the click is within the virtual keyboard area
      if (
        y < this.topSectionHeight &&
        x > leftSectionWidth &&
        x < leftSectionWidth + keyboardWidth
      ) {
        this.handleVirtualKeyboardClick(x - leftSectionWidth, y);
      } else if (y < this.topSectionHeight && x < leftSectionWidth) {
        this.handleLightClick(x, y);
      }
    },

    handleVirtualKeyboardClick(x, y) {
      if (this.answerState) return;
      const keyboardWidth = (this.canvasWidth - this.canvasWidth * 0.15) * 0.6;
      const keyboardHeight = this.topSectionHeight;
      const numRows = 2;
      const numCols = 6;
      const keyWidth = keyboardWidth / numCols - 10;
      const keyHeight = keyboardHeight / numRows - 10;
      const startY = 5;

      const col = Math.floor(x / (keyWidth + 10));
      const row = Math.floor((y - startY) / (keyHeight + 10));

      if (row >= 0 && row < 2 && col >= 0 && col < 6) {
        const keys = [
          ["7", "8", "9", "4", "5", "6"],
          ["1", "2", "3", "0", "Hapus", "Kirim"],
        ];
        const key = keys[row][col];

        if (key === "Kirim") {
          this.submitAnswer();
        } else if (key === "Hapus") {
          this.clearAnswer();
        } else {
          this.addToAnswer(key);
        }
      }
    },

    drawNavigationTasks(ctx) {
      // Draw targets
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(
        this.leftTarget.x,
        this.leftTarget.y,
        this.targetRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.beginPath();
      ctx.arc(
        this.rightTarget.x,
        this.rightTarget.y,
        this.targetRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Draw aim cursors
      this.drawAimCursor(ctx, this.leftCursor, this.leftTarget);
      this.drawAimCursor(ctx, this.rightCursor, this.rightTarget);
    },

    drawAimCursor(ctx, cursor, target) {
      const distance = Math.sqrt(
        Math.pow(cursor.x - target.x, 2) + Math.pow(cursor.y - target.y, 2)
      );
      ctx.strokeStyle = distance <= this.nearThreshold ? "green" : "red";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cursor.x, cursor.y, this.cursorRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cursor.x - this.cursorRadius, cursor.y);
      ctx.lineTo(cursor.x + this.cursorRadius, cursor.y);
      ctx.moveTo(cursor.x, cursor.y - this.cursorRadius);
      ctx.lineTo(cursor.x, cursor.y + this.cursorRadius);
      ctx.stroke();
    },

    moveTargets() {
      // Move left target
      this.leftTarget.y += this.leftTargetDirection.y * this.targetSpeed;

      // Move right target
      this.rightTarget.x += this.rightTargetDirection.x * this.targetSpeed;
      this.rightTarget.y += this.rightTargetDirection.y * this.targetSpeed;

      // Constrain targets within bounds
      const leftSectionWidth = this.canvasWidth * 0.15;
      this.leftTarget.y = Math.max(
        this.topSectionHeight + this.targetRadius,
        Math.min(this.canvasHeight - this.targetRadius, this.leftTarget.y)
      );
      this.rightTarget.x = Math.max(
        leftSectionWidth + this.targetRadius,
        Math.min(this.canvasWidth - this.targetRadius, this.rightTarget.x)
      );
      this.rightTarget.y = Math.max(
        this.topSectionHeight + this.targetRadius,
        Math.min(this.canvasHeight - this.targetRadius, this.rightTarget.y)
      );
    },

    changeTargetDirections() {
      // Change left target direction (only vertical)
      this.leftTargetDirection.y = Math.random() < 0.5 ? 1 : -1;

      // Change right target direction (both horizontal and vertical)
      this.rightTargetDirection.x = Math.random() < 0.5 ? 1 : -1;
      this.rightTargetDirection.y = Math.random() < 0.5 ? 1 : -1;
    },

    checkDeviation() {
      const leftDeviation = Math.abs(this.leftCursor.y - this.leftTarget.y);
      const rightDeviation = Math.sqrt(
        Math.pow(this.rightCursor.x - this.rightTarget.x, 2) +
          Math.pow(this.rightCursor.y - this.rightTarget.y, 2)
      );

      this.navigationResponses.push({
        type: leftDeviation <= this.deviationThreshold ? "correct" : "wrong",
        deviation: leftDeviation,
        responseTime: this.deviationCheckInterval,
        timestamp: Date.now(),
      });

      this.navigationResponses.push({
        type: rightDeviation <= this.deviationThreshold ? "correct" : "wrong",
        deviation: rightDeviation,
        responseTime: this.deviationCheckInterval,
        timestamp: Date.now(),
      });

      this.leftAimedTime += leftDeviation <= this.deviationThreshold ? 1 : 0;
      this.rightAimedTime += rightDeviation <= this.deviationThreshold ? 1 : 0;
    },

    stopSimulation() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
      // Clear other intervals
      // ... (clear intervals for activateRandomLight, moveTargets, etc.)
    },

    onGamepadConnected(e) {
      if (e.gamepad.id === "T.16000M (Vendor: 044f Product: b10a)") {
        this.gamepadIndex = e.gamepad.index;
        this.gamepadConnected = true;
      } else if (
        e.gamepad.id === "TWCS Throttle (Vendor: 044f Product: b687)"
      ) {
        this.thrusterIndex = e.gamepad.index;
        this.thrustConnected = true;
      }
    },

    onGamepadDisconnected(e) {
      if (e.gamepad.id === "T.16000M (Vendor: 044f Product: b10a)") {
        this.gamepadIndex = null;
        this.gamepadConnected = false;
      } else if (
        e.gamepad.id === "TWCS Throttle (Vendor: 044f Product: b687)"
      ) {
        this.thrusterIndex = null;
        this.thrustConnected = false;
      }
    },

    checkGamepadConnection() {
      const gamepads = navigator.getGamepads();
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
          this.onGamepadConnected({ gamepad: gamepads[i] });
        }
      }
    },

    activateRandomLight() {
      this.isPressed = false;
      // Turn off all lights
      this.lights.forEach((light) => {
        light.state = "off";
        clearTimeout(light.timer);
      });

      // Activate one random light
      const randomIndex = Math.floor(Math.random() * this.lights.length);
      const light = this.lights[randomIndex];
      const isRed = Math.random() < 0.5;

      light.state = isRed ? "red" : "yellow";
      light.timer = setTimeout(() => {
        if (light.state === "red") {
          this.recordAlertResponse(light.id, "wrong", 10000);
        }
        light.state = "off";
      }, 10000);
    },
    showFeedback() {
      this.feedbackMessage = this.isCorrect ? "✔ Benar!" : "✖ Salah!";

      // Clear existing timeout (if any) to prevent overlapping feedbacks
      if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);

      // Hide feedback after 1.5 seconds
      this.feedbackTimeout = setTimeout(() => {
        this.isCorrect = null;
        this.feedbackMessage = "";
      }, 1500);
    },
    handleLightClick(x, y) {
      this.isPressed = true;
      const canvas = this.$refs.canvas;
      const rect = canvas.getBoundingClientRect();
      //const x = event.clientX - rect.left;
      //const y = event.clientY - rect.top;
      console.log(rect);

      const lightSize = 60;
      const padding = 10;

      this.lights.forEach((light, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        const lightX = padding + col * (lightSize + padding);
        const lightY = padding + row * (lightSize + padding);

        if (
          x >= lightX &&
          x <= lightX + lightSize &&
          y >= lightY &&
          y <= lightY + lightSize
        ) {
          if (light.state === "red") {
            this.recordAlertResponse(light.id, "correct", Date.now());
            this.correctPresses++;
            this.isCorrect = true;
          } else if (light.state === "yellow") {
            this.recordAlertResponse(light.id, "wrong", Date.now());
            this.mispresses++;
            this.isCorrect = false;
          }

          // Show feedback
          setTimeout(() => {
            this.showFeedback();
            clearTimeout(light.timer);
            light.state = "off";
          }, 1500);
        }
      });
    },

    recordAlertResponse(lightId, type, responseTime) {
      this.alertResponses.push({
        type,
        responseTime,
        timestamp: Date.now(),
      });
    },

    handleMathQuestionInterval(timestamp) {
      if (timestamp - this.lastQuestionTime >= this.mathQuestionInterval) {
        this.generateNewQuestion();
        this.lastQuestionTime = timestamp;
        this.answerState = null;
      }
    },

    generateNewQuestion() {
      let num1 = Math.floor(Math.random() * 99) + 1;
      let num2 = Math.floor(Math.random() * 99) + 1 || 1; // Avoid division by zero
      const operators = ["+", "-", "*", "/"];
      const operator = operators[Math.floor(Math.random() * operators.length)];

      let correctAnswer;

      switch (operator) {
        case "+":
          correctAnswer = num1 + num2;
          break;
        case "-":
          if (num1 < num2) [num1, num2] = [num2, num1]; // Ensure non-negative result
          correctAnswer = num1 - num2;
          break;
        case "*":
          correctAnswer = num1 * num2;
          break;
        case "/":
          num2 = Math.floor(Math.random() * 9) + 1; // num2 between 1-9
          num1 = num2 * Math.floor(Math.random() * Math.floor(99 / num2));
          correctAnswer = num1 / num2;
          break;
      }

      this.question = `${num1} ${operator} ${num2} = ?`;
      this.currentAnswer = correctAnswer;
      this.userAnswer = "";
    },
    addToAnswer(digit) {
      if (this.userAnswer.length < 4) {
        this.userAnswer += digit;
      }
    },

    clearAnswer() {
      this.userAnswer = "";
    },

    submitAnswer() {
      const answer = parseInt(this.userAnswer);
      if (answer === this.currentAnswer) {
        this.answerState = "correct";
        this.correctAnswers++;
      } else {
        this.answerState = "incorrect";
        this.incorrectAnswers++;
      }
      this.recordMathResponse(
        this.answerState,
        Date.now() - this.lastQuestionTime
      );
    },

    recordMathResponse(type, responseTime) {
      this.mathResponses.push({
        type,
        responseTime,
        timestamp: Date.now(),
      });
    },

    startSimulation() {
      if (!this.trainingCompleted) {
        this.startTraining();
      } else {
        this.startActualTest();
      }
    },

    startTraining() {
      this.currentTrainingTask = this.trainingTasks[0];
      this.showTrainingInstructions();
    },

    showTrainingInstructions() {
      const instructions = {
        navigation:
          "Pada latihan ini Anda akan diminta untuk menggerakan THRUSTER dan JOYSTICK mengikuti objek berupa TITIK PUTIH hingga GARIS BIDIK menunjukkan warna HIJAU.<img src='devices/omt_4.png'/>",
        math: "Pada latihan ini Anda akan diminta untuk menggerakan THRUSTER dan JOYSTICK mengikuti objek berupa TITIK PUTIH hingga GARIS BIDIK menunjukkan warna HIJAU ditambah dengan menjawab SOAL ARITMATIKA DASAR dengan benar. <img src='devices/omt_3.png'/>",
        alertLight:
          "Pada latihan ini anda  akan diminta menekan LAMPU PERINGATAN yang menyala dengan warna MERAH. <img src='devices/omt_2.png'/>",
        combined: "Latihan gabungan dari ketiga tugas sebelumnya.",
      };

      this.instructionModalContent = instructions[this.currentTrainingTask];
      this.showInstructionModal = true;
    },

    startTest() {
      if (!this.trainingCompleted) {
        this.startTrainingTask();
      } else {
        this.startActualTest();
      }
    },

    startTrainingTask() {
      this.showInstructionModal = false;
      switch (this.currentTrainingTask) {
        case "navigation":
          this.startNavigationTraining();
          break;
        case "math":
          this.startMathTraining();
          break;
        case "alertLight":
          this.startAlertLightTraining();
          break;
        case "combined":
          this.startCombinedTraining();
          break;
      }
    },

    startNavigationTraining() {
      this.resetSimulation();
      this.activeTasks = { navigation: true, math: false, alertLight: false };
      setInterval(this.moveTargets, 50);
      setInterval(this.changeTargetDirections, this.directionChangeInterval);
      this.gameLoop(performance.now());
      setTimeout(() => this.endTrainingTask(), this.trainingDuration);
    },

    startMathTraining() {
      this.resetSimulation();
      this.activeTasks = { navigation: false, math: true, alertLight: false };
      this.generateNewQuestion();
      this.lastQuestionTime = performance.now();
      this.gameLoop(performance.now());
      setTimeout(() => this.endTrainingTask(), this.trainingDuration);
    },

    startAlertLightTraining() {
      this.resetSimulation();
      this.activeTasks = { navigation: false, math: false, alertLight: true };
      setInterval(this.activateRandomLight, 10000);
      this.gameLoop(performance.now());
      setTimeout(() => this.endTrainingTask(), this.trainingDuration);
    },

    startCombinedTraining() {
      this.resetSimulation();
      this.activeTasks = { navigation: true, math: true, alertLight: true };
      setInterval(this.activateRandomLight, 10000);
      setInterval(this.moveTargets, 50);
      setInterval(this.changeTargetDirections, this.directionChangeInterval);
      this.generateNewQuestion();
      this.lastQuestionTime = performance.now();
      this.gameLoop(performance.now());
      setTimeout(() => this.endTrainingTask(), 120000); // 2 minutes for combined training
    },

    resetSimulation() {
      this.stopSimulation();
      this.leftCursor = { x: 75, y: 450 };
      this.rightCursor = { x: 700, y: 300 };
      this.alertResponses = [];
      this.mathResponses = [];
      this.navigationResponses = [];
      this.activeTasks = { navigation: false, math: false, alertLight: false };
      // ... reset other necessary variables ...
    },

    endTrainingTask() {
      this.answerState = null;
      this.stopSimulation();
      const currentTaskIndex = this.trainingTasks.indexOf(
        this.currentTrainingTask
      );
      if (currentTaskIndex < this.trainingTasks.length - 1) {
        this.currentTrainingTask = this.trainingTasks[currentTaskIndex + 1];
        this.showTrainingInstructions();
      } else {
        this.completeTraining();
      }
    },

    completeTraining() {
      this.trainingCompleted = true;
      this.updateLocalStorage();
      this.showInstructionModal = true;
      this.instructionModalContent =
        "Latihan selesai! Tes akan dimulai sekarang.";
    },

    updateLocalStorage() {
      let scheduleData = JSON.parse(localStorage.getItem("scheduleData"));
      const testIndex = scheduleData.tests.findIndex(
        (test) => test.name === "Test For Operative Multitasking"
      );
      if (testIndex !== -1) {
        scheduleData.tests[testIndex].trainingCompleted = true;
        localStorage.setItem("scheduleData", JSON.stringify(scheduleData));
      }
    },

    startActualTest() {
      this.showInstructionModal = false;
      this.resetSimulation();
      this.activeTasks = { navigation: true, math: true, alertLight: true };
      setInterval(this.activateRandomLight, 10000);
      setInterval(this.moveTargets, 50);
      setInterval(this.changeTargetDirections, this.directionChangeInterval);
      this.generateNewQuestion();
      this.lastQuestionTime = performance.now();
      this.lastDeviationCheck = performance.now();
      this.gameLoop(performance.now());
      this.startTimer();
    },

    gameLoop(timestamp) {
      this.animationFrameId = requestAnimationFrame(this.gameLoop);

      this.handleGamepadInput();
      this.draw();

      // Check deviation every 1 second
      if (timestamp - this.lastDeviationCheck >= this.deviationCheckInterval) {
        this.checkDeviation();
        this.lastDeviationCheck = timestamp;
      }

      // Handle math question intervals
      this.handleMathQuestionInterval(timestamp);
    },

    handleGamepadInput() {
      const gamepads = navigator.getGamepads();

      if (this.gamepadIndex !== null && gamepads[this.gamepadIndex]) {
        const gamepad = gamepads[this.gamepadIndex];
        const [joystickX, joystickY] = gamepad.axes;

        this.rightCursor.x += joystickX * 5;
        this.rightCursor.y += joystickY * 5;

        // Constrain right cursor within its quadrant
        const leftSectionWidth = this.canvasWidth * 0.15;
        this.rightCursor.x = Math.max(
          leftSectionWidth,
          Math.min(this.canvasWidth - 10, this.rightCursor.x)
        );
        this.rightCursor.y = Math.max(
          this.topSectionHeight + 10,
          Math.min(this.canvasHeight - 10, this.rightCursor.y)
        );
      }

      if (this.thrusterIndex !== null && gamepads[this.thrusterIndex]) {
        const thruster = gamepads[this.thrusterIndex];

        // throttleY range: -1 to 1
        const throttleY = thruster.axes[2];

        // Define limits
        const minimumLimit = this.topSectionHeight + 10;
        const maximumLimit = this.canvasHeight - 10;

        // Sensitivity factor (0 < sensitivity <= 1 for slower response)
        const sensitivity = 0.1; // Lower = smoother, but still reaches min/max

        // Apply smooth scaling function
        const adjustedThrottle =
          Math.tanh(throttleY * sensitivity) / Math.tanh(sensitivity);

        // Map adjustedThrottle to range [160, 590]
        this.leftCursor.y =
          minimumLimit +
          ((adjustedThrottle + 1) / 2) * (maximumLimit - minimumLimit);
      }
    },

    getSpeed(speed) {
      if (speed === "slow") {
        return 1;
      } else if (speed === "medium") {
        return 2;
      } else if (speed === "fast") {
        return 3;
      }
    },

    startTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
      this.timeRemaining = this.duration;
      this.timerInterval = setInterval(() => {
        if (this.timeRemaining > 0) {
          this.timeRemaining--;
        } else {
          clearInterval(this.timerInterval);
          this.endSimulation();
        }
      }, 1000);
    },

    async endSimulation() {
      //if (!this.trainingCompleted) {
      //  this.trainingCompleted = true;
      //  completeTrainingTestAndUpdateLocalStorage(
      //    "Test For Operative Multitasking"
      //  );
      //  // start over for actual test
      //}
      clearInterval(this.drawInterval);
      // this.showModal = true;
      try {
        const API_URL = process.env.VUE_APP_API_URL;
        const payload = {
          testSessionId: this.config.sessionId,
          userId: this.config.userId,
          batteryTestConfigId: this.config.batteryTestConfigId,
          result: {
            averageResponseTime: this.averageResponseTime,
            mispresses: this.mispresses,
            correctPresses: this.correctPresses,
            correctAnswers: this.correctAnswers,
            incorrectAnswers: this.incorrectAnswers,
            leftAimedTime: this.leftAimedTime,
            rightAimedTime: this.rightAimedTime,
            graph_data: {
              alert: this.alertResponses,
              math: this.mathResponses,
              navigation: this.navigationResponses,
            },
          },
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
        removeTestByNameAndUpdateLocalStorage(
          "Test For Operative Multitasking"
        );
        localStorage.removeItem("reloadCountRadarVigilance");
        window.location.href = "/module";
      }
    },

    closeModal() {
      this.showModal = false;
    },
  },
  mounted() {
    window.addEventListener("gamepadconnected", this.onGamepadConnected);
    window.addEventListener("gamepaddisconnected", this.onGamepadDisconnected);
    window.addEventListener("keydown", this.handleKeyPress);
    this.$refs.canvas.addEventListener("click", this.handleCanvasClick);

    // Check for gamepads periodically
    setInterval(this.checkGamepadConnection, 5000);

    const scheduleData = JSON.parse(localStorage.getItem("scheduleData"));
    const tests = scheduleData.tests;
    const operativeTest = tests?.find((test) => {
      return test.name === "Test For Operative Multitasking";
    });
    this.trainingCompleted = operativeTest?.trainingCompleted; //default false
    const config = operativeTest?.configs[0];
    this.config = scheduleData;
    this.config.sessionId = scheduleData.sessionId;
    this.config.userId = scheduleData.userId;
    this.config.batteryTestConfigId = config?.id;
    this.targetSpeed = this.getSpeed("medium");
    this.duration = config.duration * 60; // Default to 5 minutes if not specified

    console.log(
      config,
      "config",
      this.targetSpeed,
      "speed",
      this.duration,
      "duration"
    );
    this.startSimulation();
  },

  beforeUnmount() {
    window.removeEventListener("gamepadconnected", this.onGamepadConnected);
    window.removeEventListener(
      "gamepaddisconnected",
      this.onGamepadDisconnected
    );
    window.removeEventListener("keydown", this.handleKeyPress);
    this.$refs.canvas.removeEventListener("click", this.handleCanvasClick);
    clearInterval(this.drawInterval);
    this.stopSimulation();
  },
};
</script>

<style scoped>
.simulation-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: grey;
}

.timer {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(0, 0, 255, 0.7);
  color: white;
  padding: 10px;
  font-size: 24px;
  border-radius: 5px;
  z-index: 1000;
  /* Ensure it's above the canvas */
}

canvas {
  border: 1px solid #333;
}

.math-input {
  position: absolute;
  top: 110px;
  left: 530px;
  width: 300px;
  height: 40px;
  font-size: 20px;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid #333;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.8);
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

button {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}

.instruction-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.instruction-modal-content {
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

.instruction-modal-content h2 {
  margin-top: 0;
}

.instruction-modal-content button {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.instruction-modal-content button:hover {
  background-color: #0056b3;
}

.feedback.correct {
  background-color: #4caf50;
  font-weight: bold;
  margin-top: 10px;
  font-size: 1.2em;
  padding: 8px;
  border-radius: 5px;
}

.feedback.wrong {
  padding: 8px;
  border-radius: 5px;
  background-color: #f44336;
  font-weight: bold;
  margin-top: 10px;
  font-size: 1.2em;
}

.feedback {
  position: fixed;
  bottom: 100px;
  left: 48%;
}

@keyframes fadeOut {
  0% {
    opacity: 1;
  }

  80% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}
</style>
