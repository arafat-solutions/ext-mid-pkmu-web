<template>
  <div v-if="isModalVisible" class="modal-overlay">
    <div class="modal-content">
      <h2 class="text-xl font-bold mb-4" style="font-size: 24px">
        {{ isTrainingCompleted ? "Konfirmasi Ujian" : "Konfirmasi latihan" }}
      </h2>

      <div class="mb-4" style="font-size: 20px">
        <p class="mb-2">
          <strong>Untuk blok merah:</strong>
          {{ ruleOptions[currentRuleSet.red] }}
        </p>
        <p class="mb-2">
          <strong>Untuk blok hijau:</strong>
          {{ ruleOptions[currentRuleSet.green] }}
        </p>
        <p class="mb-2">
          <strong>Untuk blok biru:</strong>
          {{ ruleOptions[currentRuleSet.blue] }}
        </p>
      </div>

      <p class="mb-4 text-center" style="font-size: 20px">
        <strong>
          Apakah Anda yakin akan memulai
          {{ isTrainingCompleted ? "ujian" : "latihan" }} Signal Processing?
        </strong>
      </p>

      <div class="flex justify-center space-x-4">
        <button
          @click="startTest()"
          class="bg-green-500 text-white px-4 py-2 rounded"
        >
          Ya
        </button>
        <button @click="exit()" class="bg-red-500 text-white px-4 py-2 rounded">
          Batal
        </button>
      </div>
    </div>
  </div>

  <div v-if="timeLeft > 0 && isTrainingCompleted" class="timer-container">
    Waktu: {{ formattedTime }}
  </div>

  <div
    class="relative flex justify-center items-center min-h-screen"
    v-if="!isTimesUp"
  >
    <div class="flex flex-col items-center justify-center">
      <div class="grid grid-cols-2 gap-4">
        <div
          class="h-24 w-24 hover:cursor-pointer"
          :class="
            currentQuestion && currentQuestion.position === i && !clickedAnswer
              ? `bg-${currentQuestion.color}-500`
              : 'bg-gray-500'
          "
          v-for="i in 4"
          :key="i"
          @click="checkAnswer(i)"
        />
      </div>
      <div class="font-bold text-lg text-center mt-5">
        <span class="text-red-600" v-if="isWrongAnswer && !isTrainingCompleted"
          >Salah</span
        >
        <span
          class="text-green-600"
          v-if="isCorrectAnswer && !isTrainingCompleted"
          >Benar</span
        >
      </div>
    </div>
  </div>
  <button
    v-if="!isTrainingCompleted"
    @click="finishTraining"
    class="finish-button"
  >
    Selesai Latihan
  </button>
  <div v-if="isLoading" class="loading-container">
    <div class="loading-spinner"></div>
    <div class="loading-text">Your result is submitting</div>
  </div>
</template>

<script>
import {
  completeTrainingTestAndUpdateLocalStorage,
  removeTestByNameAndUpdateLocalStorage,
} from "@/utils/index";
import { getConfigs } from "@/utils/configs";

export default {
  data() {
    return {
      currentRules: {
        red: "",
        green: "",
        blue: "",
      },
      ruleOptions: [
        "Klik blok yang menyala",
        "Klik blok yang sejajar vertikal",
        "Klik blok yang sejajar horizontal",
      ],
      currentRuleSet: {
        red: 0,
        green: 2,
        blue: 1,
      },
      isModalTrainingVisible: false,
      isModalVisible: true,
      indexConfig: 0,
      configs: [],
      duration: 0,
      isNextLevel: false,
      currentIndexQuestion: 0,
      isLoading: false,
      minuteTime: null,
      timeLeft: null, // Countdown time in seconds
      isConfigLoaded: false,
      intervalCountdownId: null,
      intervalQuestionId: null,
      displayDuration: null, // in seconds
      batteryTestConfigId: null,
      clickedAnswer: false,
      isWrongAnswer: false,
      isCorrectAnswer: false,
      colors: ["red", "green", "blue"],
      positions: [1, 2, 3, 4],
      level: null, //very_easy, easy, medium, difficult, very_difficult
      frequent: null, //never, very_rarely, rarely, normal, often, very_often
      questions: [],
      startTimeAnswer: null,
      result: {
        correct: 0,
        wrong: 0,
        answerTimes: [],
      },
      userInputs: [],
      greenCorrectAnswer: {
        1: 3,
        2: 4,
        3: 1,
        4: 2,
      },
      blueCorrectAnswer: {
        1: 2,
        2: 1,
        3: 4,
        4: 3,
      },
    };
  },
  mounted() {
    let reloadCount = parseInt(
      localStorage.getItem("reloadCountSignalProcessing") || "0"
    );
    reloadCount++;
    localStorage.setItem("reloadCountSignalProcessing", reloadCount.toString());

    window.addEventListener("beforeunload", () => {
      localStorage.setItem(
        "reloadCountSignalProcessing",
        reloadCount.toString()
      );
    });

    this.initConfig();
  },
  computed: {
    isTimesUp() {
      return this.timeLeft < 1;
    },
    formattedTime() {
      const minutes = Math.floor(this.timeLeft / 60);
      const seconds = this.timeLeft % 60;
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    },
    intervalChangeQuestion() {
      const intervalMap = {
        never: null, // or a very high number, or skip entirely
        very_rarely: 10, // 10 seconds
        rarely: 8, // 8 seconds
        normal: 6, // 6 seconds
        often: 4, // 4 seconds
        very_often: 2, // 2 seconds
      };

      return intervalMap[this.frequent];
    },
    lengthQuestion() {
      if (!this.displayDuration) {
        return 1;
      }

      return Math.ceil((this.minuteTime * 60) / this.displayDuration);
    },
    currentQuestion() {
      if (!this.displayDuration) {
        return this.questions[0];
      }

      return this.questions[this.currentIndexQuestion];
    },
    resultMissed() {
      return (
        this.currentIndexQuestion + 1 - this.result.correct - this.result.wrong
      );
    },
    averageAnswerTime() {
      if (this.result.answerTimes.length === 0) return 0; // Handle empty this.result.answerTimesay case
      const sum = this.result.answerTimes.reduce(
        (accumulator, currentValue) => accumulator + currentValue,
        0
      );
      const average = sum / this.result.answerTimes.length;
      return parseFloat(average.toFixed(2));
    },
  },
  watch: {
    isTimesUp(value) {
      if (value) {
        this.cleanUp();

        if (!this.isTrainingCompleted) {
          this.finishTraining;
        } else {
          this.submitResult();
        }
      }
    },
  },
  methods: {
    finishTraining() {
      this.isTrainingCompleted = true;
      completeTrainingTestAndUpdateLocalStorage("Signal Processing Test");

      //Start Exam After Training
      this.isModalVisible = true;
      this.currentIndexQuestion = 0;
      this.userInputs = [];
      this.result.correct = 0;
      this.result.wrong = 0;
      this.result.answerTimes = [];
    },
    generateUniqueRules() {
      const colors = ["red", "green", "blue"];
      const usedRuleIndices = new Set();

      // Shuffle colors to randomize rule assignment
      const shuffledColors = [...colors].sort(() => Math.random() - 0.5);

      shuffledColors.forEach((color) => {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * this.ruleOptions.length);
        } while (usedRuleIndices.has(randomIndex));

        usedRuleIndices.add(randomIndex);
        this.currentRuleSet[color] = randomIndex;
        this.currentRules[color] = this.ruleOptions[randomIndex];
      });

      this.isModalVisible = true;
    },

    startTest() {
      if (!this.isTrainingCompleted) {
        this.setConfig(this.configs[0]);
        this.minuteTime = 9999;
        this.timeLeft = this.minuteTime;
      } else {
        this.setConfig(this.configs[this.indexConfig]);
        this.minuteTime = this.configs.reduce(
          (acc, config) => acc + Number(config.duration),
          0
        );
        this.timeLeft = this.minuteTime * 60;
      }

      this.isModalVisible = false;

      setTimeout(() => {
        this.generateQuestions();
        this.startChangeQuestion();
      }, 500);

      this.startCountdown();
    },

    acknowledgeRules() {
      this.isRuleModalVisible = false;

      // Start the timer and questions after rules are acknowledged
      this.startCountdown();
      this.generateQuestions();
      this.startChangeQuestion();
    },

    checkAnswer(n) {
      if (this.clickedAnswer) {
        return;
      }

      const now = Date.now();
      const responseTime = now - this.startTimeAnswer?.getTime();

      this.clickedAnswer = true;
      let isCorrect = false;

      // Check answer based on current rules
      switch (this.currentQuestion.color) {
        case "red":
          isCorrect = this.checkRedAnswer(n);
          break;
        case "green":
          isCorrect = this.checkGreenAnswer(n);
          break;
        case "blue":
          isCorrect = this.checkBlueAnswer(n);
          break;
      }

      if (isCorrect) {
        this.result.correct++;
        this.userInputs.push({
          type: "correct",
          responseTime: responseTime,
          timestamp: Date.now(),
        });
        this.isCorrectAnswer = true;
      } else {
        this.result.wrong++;
        this.userInputs.push({
          type: "wrong",
          responseTime: responseTime,
          timestamp: Date.now(),
        });
        this.isWrongAnswer = true;
      }

      if (this.startTimeAnswer) {
        const endTime = new Date();
        const differenceInMilliseconds =
          endTime.getTime() - this.startTimeAnswer.getTime();
        this.result.answerTimes.push(differenceInMilliseconds);
        this.startTimeAnswer = null;
      }
    },

    // New helper methods for checking answers based on rules
    checkRedAnswer(n) {
      const ruleIndex = this.currentRuleSet.red;
      switch (ruleIndex) {
        case 0: // Click lit block
          return this.currentQuestion.position === n;
        case 1: // Click vertical
          return this.getVerticalPosition(this.currentQuestion.position) === n;
        case 2: // Click horizontal
          return (
            this.getHorizontalPosition(this.currentQuestion.position) === n
          );
        default:
          return false;
      }
    },

    checkGreenAnswer(n) {
      const ruleIndex = this.currentRuleSet.green;
      switch (ruleIndex) {
        case 0: // Click lit block
          return this.currentQuestion.position === n;
        case 1: // Click vertical
          return this.getVerticalPosition(this.currentQuestion.position) === n;
        case 2: // Click horizontal
          return (
            this.getHorizontalPosition(this.currentQuestion.position) === n
          );
        default:
          return false;
      }
    },

    checkBlueAnswer(n) {
      const ruleIndex = this.currentRuleSet.blue;
      switch (ruleIndex) {
        case 0: // Click lit block
          return this.currentQuestion.position === n;
        case 1: // Click vertical
          return this.getVerticalPosition(this.currentQuestion.position) === n;
        case 2: // Click horizontal
          return (
            this.getHorizontalPosition(this.currentQuestion.position) === n
          );
        default:
          return false;
      }
    },

    // Helper methods for position calculations
    getVerticalPosition(position) {
      const verticalMap = {
        1: 3, // Top left to bottom left
        2: 4, // Top right to bottom right
        3: 1, // Bottom left to top left
        4: 2, // Bottom right to top right
      };
      return verticalMap[position];
    },

    getHorizontalPosition(position) {
      const horizontalMap = {
        1: 2, // Top left to top right
        2: 1, // Top right to top left
        3: 4, // Bottom left to bottom right
        4: 3, // Bottom right to bottom left
      };
      return horizontalMap[position];
    },

    cleanUp() {
      clearInterval(this.intervalCountdownId);
      clearInterval(this.intervalQuestionId);
    },
    exit() {
      if (
        confirm(
          "Apakah Anda yakin ingin keluar dari tes? Semua progres akan hilang."
        )
      ) {
        this.$router.push("module");
      }
    },
    // Modify initConfig() to not generate rules immediately
    initConfig() {
      const configData = getConfigs("signal-processing-test");
      if (!configData) {
        this.$router.push("/module");
        return;
      }

      this.configs = configData.configs;
      this.isTrainingCompleted = configData.trainingCompleted;

      // Only show the modal, don't generate rules yet
      if (!this.isTrainingCompleted) {
        this.isModalTrainingVisible = true;
      } else {
        this.isModalVisible = true;
      }
    },

    // Modify setConfig() to not generate rules
    setConfig(config) {
      this.level = config.difficulty;
      this.displayDuration = config.display_duration;
      this.duration = config.duration * 60;
      this.isConfigLoaded = true;

      if (this.intervalCountdownId) {
        clearInterval(this.intervalCountdownId);
      }
      if (this.intervalQuestionId) {
        clearInterval(this.intervalQuestionId);
      }

      // Generate rules only once per config level
      // if (
      //   !this.currentRules.red &&
      //   !this.currentRules.green &&
      //   !this.currentRules.blue
      // ) {
      //   this.generateUniqueRules();
      // }
    },
    startCountdown() {
      this.intervalCountdownId = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft -= 1;
        }

        //Check timer for next level exam
        if (this.isTrainingCompleted) {
          if (this.duration >= 0) {
            this.duration--;

            if (this.duration === 0) {
              this.isNextLevel = true;
            }
          } else {
            if (this.isNextLevel) {
              if (this.indexConfig === this.configs.length - 1) {
                this.submitResult();
              } else {
                this.cleanUp();
                this.isNextLevel = false;
                this.indexConfig++;
                this.setConfig(this.configs[this.indexConfig]);
                setTimeout(() => {
                  this.startCountdown();
                  this.startChangeQuestion();
                }, 500);
              }
            }
          }
        }
      }, 1000);
    },
    startChangeQuestion() {
      if (!this.displayDuration) {
        return;
      }

      this.intervalQuestionId = setInterval(() => {
        this.startTimeAnswer = new Date();
        this.isWrongAnswer = false;
        this.isCorrectAnswer = false;
        this.currentIndexQuestion++;
        this.clickedAnswer = false;
      }, this.displayDuration * 1000);
    },
    getRandomWeightedColor(level) {
      const weights = {
        very_easy: { red: 5, green: 3, blue: 2 },
        easy: { red: 3, green: 4, blue: 3 },
        medium: { red: 2, green: 5, blue: 3 },
        difficult: { red: 1, green: 6, blue: 3 },
        very_difficult: { red: 1, green: 7, blue: 4 },
      };

      const levelWeights = weights[level];
      const totalWeight = Object.values(levelWeights).reduce(
        (a, b) => a + b,
        0
      );
      const randomNum = Math.random() * totalWeight;

      let weightSum = 0;
      for (const color in levelWeights) {
        weightSum += levelWeights[color];
        if (randomNum <= weightSum) {
          return color;
        }
      }
    },
    getRandomPosition(level) {
      const levelChangeProbability = {
        very_easy: 0.1,
        easy: 0.2,
        medium: 0.3,
        difficult: 0.4,
        very_difficult: 0.5,
      };

      const changeChance = levelChangeProbability[level];
      if (Math.random() < changeChance) {
        return this.positions[
          Math.floor(Math.random() * this.positions.length)
        ];
      }

      return this.positions[0];
    },
    generateQuestions() {
      const questions = [];

      for (let i = 0; i < this.lengthQuestion; i++) {
        let newQuestion;

        do {
          newQuestion = {
            color: this.getRandomWeightedColor(this.level),
            position: this.getRandomPosition(this.level),
          };
        } while (
          i > 0 &&
          newQuestion.color === questions[i - 1].color &&
          newQuestion.position === questions[i - 1].position
        );

        questions.push(newQuestion);
      }

      this.questions = questions;
    },

    generatePayloadForSubmit() {
      const scheduleData = JSON.parse(localStorage.getItem("scheduleData"));
      const totalQuestion = this.currentIndexQuestion + 1;
      const payload = {
        testSessionId: scheduleData.sessionId,
        userId: scheduleData.userId,
        moduleId: scheduleData.moduleId,
        batteryTestConfigId: this.batteryTestConfigId,
        batteryTestId: scheduleData.testId,
        refreshCount: parseInt(
          localStorage.getItem("reloadCountSignalProcessing")
        ),
        result: {
          totalQuestion: totalQuestion,
          correctAnswer: this.result.correct,
          avgResponseTIme: this.averageAnswerTime,
          graph_data: this.userInputs,
        },
      };

      return payload;
    },
    async submitResult() {
      try {
        this.isLoading = true;
        const API_URL = process.env.VUE_APP_API_URL;
        const payload = this.generatePayloadForSubmit();
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
      } catch (error) {
        console.error(error);
      } finally {
        this.isLoading = false;
        removeTestByNameAndUpdateLocalStorage("Signal Processing Test");
        localStorage.removeItem("reloadCountSignalProcessing");
        this.$router.push("/module"); // Set isLoading to false when the submission is complete
      }
    },
  },
};
</script>

<style scoped>
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
  @apply absolute top-0 left-1/2 transform -translate-x-1/2 bg-[#0349D0] px-20 py-3 text-white font-bold rounded-bl-[15px] rounded-br-[15px];
}

.loading-container {
  @apply absolute inset-0 w-full h-full bg-black bg-opacity-80 flex flex-col justify-center items-center z-[1000];
}

.loading-spinner {
  @apply border-[8px] border-solid border-[rgba(255,255,255,0.3)] border-t-white rounded-full w-[60px] h-[60px] animate-spin;
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
  @apply text-white mt-5 text-[1.2em];
}

.bg-gray-500 {
  background-color: #6b7280;
}

.bg-green-500 {
  background-color: #22c55e;
}

.bg-blue-500 {
  background-color: #3b82f6;
}

.bg-red-500 {
  background-color: #ef4444;
}
</style>
