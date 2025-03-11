<template>
  <div class="arithmetic">
    <div class="question-container">
      <div class="question">
        <strong> Dengarkan dan masukkan jawaban Anda </strong>
      </div>
      <ul class="options">
        <li
          v-for="(option, index) in optionAnswerAudios"
          :key="index"
          class="option-item"
        >
          <div class="option-wrapper">
            <button
              class="option-button"
              :class="{
                clickable: isCanChooseAudio,
                selected: selectedAnswer === option.key,
                correct: hasAnswered && option.value === audio && isTraining,
                incorrect:
                  hasAnswered &&
                  selectedAnswer === option.key &&
                  option.value !== audio &&
                  isTraining,
              }"
              @click="handleOptionClick(option.key)"
              :disabled="!isCanChooseAudio"
            >
              <span class="option-answer">{{ option.key }}</span>
              <span class="option-value">{{ option.value }}</span>
            </button>
            <div
              v-if="hasAnswered && selectedAnswer === option.key && isTraining"
              class="result-text"
              :class="{
                'correct-text': option.value === audio,
                'incorrect-text': option.value !== audio,
              }"
            >
              {{ option.value === audio ? "Benar" : "Salah" }}
            </div>
            <!-- <button
              class="option-button"
              :class="{
                clickable: isCanChooseAudio,
                selected: selectedAnswer === option.key,
              }"
              @click="handleOptionClick(option.key)"
              :disabled="!isCanChooseAudio"
            >
              <span class="option-answer">{{ option.key }}</span>
              <span class="option-value">{{ option.value }}</span>
            </button> -->

            <!-- <div v-if="hasAnswered && selectedAnswer === option.key" class="result-text"
							:class="{ 'correct-text': option.value === audio, 'incorrect-text': option.value !== audio }">
							{{ option.value === audio ? 'Benar' : 'Salah' }}
						</div> -->
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: "ArithmeticsView",
  props: {
    isTimesUp: Boolean,
    difficulty: String,
    duration: Number,
    isPause: Boolean,
    isActive: Boolean,
    useSound: Boolean,
    isTraining: Boolean,
  },
  data() {
    return {
      isCanChooseAudio: false,
      audio: null,
      correctAnswer: 0,
      totalQuestion: 0,
      currentQuestion: "",
      optionAnswerAudios: [
        { key: 1, value: "" },
        { key: 2, value: "" },
        { key: 3, value: "" },
        { key: 4, value: "" },
      ],
      responseQuestion: 0,
      responseTime: 0,
      responseDurations: [],
      questionTimer: null,
      QUESTION_DURATION: 10000, // 20 seconds in milliseconds
      hasAnswered: false,
      currentUtterance: null,
      selectedAnswer: null,
      playAttempts: 0,
      MAX_PLAY_ATTEMPTS: 3,
      isPlaying: false,
    };
  },
  computed: {
    canPlayAudio() {
      return this.playAttempts < this.MAX_PLAY_ATTEMPTS && !this.hasAnswered;
    },
  },
  async mounted() {
    if (this.useSound && this.isActive) {
      await this.generateQuestion();
    }
  },
  created() {
    window.addEventListener("keyup", this.handleKeyPress);
  },
  beforeUnmount() {
    window.removeEventListener("keyup", this.handleKeyPress);
    this.cleanupQuestion();
  },
  watch: {
    isTimesUp: {
      handler(newValue) {
        if (newValue) {
          this.cleanupQuestion();
          this.$emit("getResult", {
            correctAnswer: this.correctAnswer,
            totalQuestion: this.totalQuestion,
            responseTime: this.averageResponseTime(),
          });
        }
      },
      immediate: true,
    },
    isPause(newValue) {
      if (newValue) {
        this.cleanupQuestion();
      } else if (this.isActive && !this.isTimesUp) {
        setTimeout(async () => {
          await this.generateQuestion();
        }, 500);
      }
    },
    difficulty: {
      handler() {
        this.resetGame();
      },
      immediate: true,
    },
  },
  methods: {
    resetGame() {
      this.correctAnswer = 0;
      this.totalQuestion = 0;
      this.responseDurations = [];
      this.cleanupQuestion();
    },
    averageResponseTime() {
      if (this.responseDurations.length > 0) {
        const sum = this.responseDurations.reduce((acc, curr) => acc + curr, 0);
        return sum / this.responseDurations.length / 1000;
      }
      return 0;
    },
    cleanupQuestion() {
      this.stop();
      if (this.questionTimer) {
        clearTimeout(this.questionTimer);
        this.questionTimer = null;
      }
      this.isCanChooseAudio = false;
      this.playAttempts = 0;
      this.isPlaying = false;
    },
    stop() {
      if (this.currentUtterance) {
        window.speechSynthesis.cancel();
        this.currentUtterance = null;
      }
    },
    handleOptionClick(key) {
      this.selectedAnswer = key;
      this.pressAnswerAudio(key);
    },
    generateNumbers() {
      let num1, num2;
      if (this.difficulty === "hard") {
        num1 = Math.floor(Math.random() * 90) + 10;
        num2 = Math.floor(Math.random() * 90) + 10;
      } else if (this.difficulty === "medium") {
        num1 = Math.floor(Math.random() * 90) + 10;
        num2 = Math.floor(Math.random() * 9) + 1;
      } else {
        num1 = Math.floor(Math.random() * 9) + 1;
        num2 = Math.floor(Math.random() * 9) + 1;
      }
      return [num1, num2];
    },
    generateOperation() {
      const operations =
        this.difficulty === "easy" ? ["+", "-"] : ["+", "-", "×"];
      return operations[Math.floor(Math.random() * operations.length)];
    },
    calculateResult(num1, num2, operation) {
      switch (operation) {
        case "+":
          return num1 + num2;
        case "-":
          return num1 - num2;
        case "×":
          return num1 * num2;
        default:
          return 0;
      }
    },
    getOperationText(operation) {
      switch (operation) {
        case "+":
          return "tambah";
        case "-":
          return "kurang";
        case "×":
          return "kali";
        default:
          return "";
      }
    },
    startQuestionTimer() {
      if (this.questionTimer) {
        clearTimeout(this.questionTimer);
      }

      this.questionTimer = setTimeout(() => {
        this.totalQuestion++;
        this.moveToNextQuestion();
      }, this.QUESTION_DURATION);
    },
    async moveToNextQuestion() {
      this.cleanupQuestion();
      if (!this.isTimesUp && !this.isPause && this.isActive) {
        setTimeout(async () => {
          await this.generateQuestion();
        }, 1000);
      }
    },
    async generateQuestion() {
      this.stop();
      this.hasAnswered = false;
      this.selectedAnswer = null;
      this.startQuestionTimer();

      let [num1, num2] = this.generateNumbers();
      const operation = this.generateOperation();

      if (operation === "-" && num1 < num2) {
        [num1, num2] = [num2, num1];
      }

      const result = this.calculateResult(num1, num2, operation);
      this.audio = result;

      const operationText = this.getOperationText(operation);
      this.currentQuestion = `${num1} ${operationText} ${num2}`;

      let correctLocationIndex = Math.floor(Math.random() * 4);

      const usedValues = new Set([result]); // Track unique values, starting with the correct one
      this.optionAnswerAudios = Array(4)
        .fill(null)
        .map((_, index) => {
          if (index === correctLocationIndex) {
            return { key: index + 1, value: result };
          }

          let wrongAnswer;
          do {
            wrongAnswer = result + (Math.floor(Math.random() * 21) - 10);
          } while (wrongAnswer < 0 || usedValues.has(wrongAnswer)); // Ensure uniqueness

          usedValues.add(wrongAnswer); // Store the used value

          return { key: index + 1, value: wrongAnswer };
        });
      await this.$nextTick();
      setTimeout(() => {
        this.startPlayback();
      }, 100);
    },
    async startPlayback() {
      if (this.isPlaying) return;
      this.isCanChooseAudio = false;
      this.isPlaying = true;

      try {
        if ("speechSynthesis" in window) {
          this.stop();

          this.currentUtterance = new SpeechSynthesisUtterance(
            this.currentQuestion
          );
          this.currentUtterance.rate = 1;
          this.currentUtterance.pitch = 1;
          this.currentUtterance.volume = 1;
          this.currentUtterance.lang = "id-ID";
          console.log(this.currentUtterance.lang);

          this.currentUtterance.onend = () => {
            if (!this.isTimesUp && !this.isPause && this.isActive) {
              this.isCanChooseAudio = true;
            }
            this.currentUtterance = null;
            this.isPlaying = false;
            this.playAttempts++;
          };

          this.currentUtterance.onerror = (event) => {
            console.error("Speech synthesis error:", event);
            this.isCanChooseAudio = true;
            this.currentUtterance = null;
            this.isPlaying = false;
            this.playAttempts++;
          };

          this.responseQuestion = Date.now();
          window.speechSynthesis.speak(this.currentUtterance);
        } else {
          console.error("Text-to-speech not supported");
          this.isCanChooseAudio = true;
          this.isPlaying = false;
        }
      } catch (error) {
        console.error("Error in startPlayback:", error);
        this.isCanChooseAudio = true;
        this.isPlaying = false;
      }
    },
    calculateResponseTime() {
      return this.responseDurations.push(
        this.responseTime - this.responseQuestion
      );
    },
    pressAnswerAudio(key) {
      if (
        this.isPause ||
        this.isTimesUp ||
        !this.isActive ||
        !this.isCanChooseAudio ||
        this.hasAnswered
      ) {
        return;
      }

      let value = 0;
      for (let i = 0; i < this.optionAnswerAudios.length; i++) {
        if (this.optionAnswerAudios[i].key === key) {
          value = this.optionAnswerAudios[i].value;
          break;
        }
      }

      this.hasAnswered = true;
      this.totalQuestion++;

      if (this.audio === value) {
        this.responseTime = Date.now();
        this.calculateResponseTime();
        this.correctAnswer++;
      }

      this.isCanChooseAudio = false;
    },
    handleKeyPress(event) {
      if (
        this.isPause ||
        this.isTimesUp ||
        !this.isActive ||
        !this.isCanChooseAudio ||
        this.hasAnswered
      ) {
        return;
      }

      if (event.key >= "1" && event.key <= "4") {
        const key = parseInt(event.key);
        this.selectedAnswer = key;
        this.pressAnswerAudio(key);
      }
    },
    replayAudio() {
      if (this.canPlayAudio && !this.isPlaying) {
        this.startPlayback();
      }
    },
  },
};
</script>

<style scoped>
.arithmetic {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  margin-top: 10px;
}

.question-container {
  border: 2px solid black;
  padding: 20px;
  margin-bottom: 20px;
  width: 100%;
  max-width: 600px;
}

.question {
  font-size: 20px;
  margin-bottom: 20px;
  text-align: center;
}

.options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.option-item {
  display: flex;
  justify-content: center;
}

.option-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.option-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 120px;
  background-color: #f0f0f0;
  border: 2px solid #333;
  border-radius: 10px;
  transition: all 0.3s ease;
  cursor: pointer;
  padding: 10px;
  margin-bottom: 10px;
}

.option-button:disabled {
  cursor: default;
}

.option-button.selected {
  background-color: #d3d3d3;
  /* Light gray background for selected */
  border-color: #a0a0a0;
  /* A slightly darker gray border */
  color: #333;
}

.option-button.correct {
  background-color: #4caf50;
  border-color: #45a049;
  color: white;
}

.option-button.incorrect {
  background-color: #f44336;
  border-color: #d32f2f;
  color: white;
}

.option-button.selected:disabled {
  opacity: 1;
}

/* .option-button.selected .option-answer {
  background-color: #45a049;
} */

.option-answer {
  background-color: #333;
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 14px;
  margin-bottom: 10px;
  transition: background-color 0.3s ease;
}

.option-value {
  font-size: 40px;
  font-weight: bold;
}

.result-text {
  font-size: 16px;
  font-weight: bold;
  margin-top: 5px;
  padding: 5px 10px;
  border-radius: 5px;
  text-align: center;
}

.correct-text {
  color: #4caf50;
}

.incorrect-text {
  color: #f44336;
}

/* .clickable:not(:disabled):hover {
  background-color: #e0e0e0;
  transform: scale(1.05);
}

.clickable.selected:not(:disabled):hover {
  background-color: #45a049;
  transform: scale(1.05);
} */
</style>
