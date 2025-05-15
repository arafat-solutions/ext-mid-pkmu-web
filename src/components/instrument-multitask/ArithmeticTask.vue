<template>
  <div v-if="problem" class="problem-section">
    <p class="problem">{{ isActive ? problem.num1 : '?' }} {{ problem.operator }} {{ isActive ? problem.num2 : '?' }} =
      ?</p>
    <div class="choices">
      <div v-for="(choice, index) in problem.choices" :key="index" class="choice">
        <button class="btn-answer" :class="{
          'correct': showFeedback && choice === problem.correctAnswer&&isTraining,
          'incorrect': showFeedback && selectedAnswer === index && choice !== problem.correctAnswer&&isTraining,
          'selected': showFeedback && selectedAnswer === index && !isTraining,
          'disabled': !canAnswer
        }" @click="chooseAnswer(index)" :disabled="!canAnswer">
          {{ isActive ? choice : '?' }}
        </button>
      </div>
    </div>
    <div v-if="showFeedback&& isTraining" class="feedback">
      <p v-if="selectedAnswer === null">Waktu Habis! Jawaban yang benar adalah {{ problem.correctAnswer }}</p>
      <p v-else-if="problem.choices[selectedAnswer] === problem.correctAnswer">Benar!</p>
      <p v-else>Salah! Jawaban yang benar adalah {{ problem.correctAnswer }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ArithmeticTask',
  data() {
    return {
      minNumber: 1,
      maxNumber: 99,
      signRandoms: ['+', '-', ':', 'x'],
      problem: null,
      result: {
        correct: 0,
        wrong: 0,
        answerTimes: [],
        problems: [],
      },
      questionTimer: null,
      intervalTimer: null,
      intervalCycle:null,
      isQuestionActive: false,
      canAnswer: true,
      selectedAnswer: null,
      showFeedback: false
    };
  },
  props: {
    difficulty: String,
    isTimesUp: Boolean,
    isPause: Boolean,
    minuteTime: Number,
    isActive: Boolean,
    isTraining: Boolean,
    useSound: Boolean,
    allowSound: Boolean,
    canPressAnswer: Boolean,
  },
  mounted() {
    if ((this.useSound && this.allowSound) || (!this.useSound || !this.isActive)) {
      this.startQuestionCycle();
    }
    window.addEventListener('keyup', this.handleKeyPress);
  },
  beforeUnmount() {
    if (this.questionTimer) clearTimeout(this.questionTimer);
    if (this.intervalTimer) clearTimeout(this.intervalTimer);
    if(this.intervalCycle) clearTimeout(this.intervalCycle);
    window.removeEventListener('keyup', this.handleKeyPress);
    if (this.useSound) {
      window.speechSynthesis.cancel();
    }
  },
  created() {
    window.addEventListener('keyup', this.handleKeyPress);
  },
  computed: {
    correctResponse() {
      return Number((this.result.correct / this.minuteTime).toFixed(2));
    },
    responseTime() {
      let totalResponse = 0;
      for (let i = 0; i < this.result.answerTimes.length; i++) {
        totalResponse += this.getTimeDifferenceInSeconds(
          this.result.problems[i].createdAt,
          this.result.answerTimes[i]
        )
      }

      return Number((totalResponse / this.result.problems.length).toFixed(2));
    },
  },
  watch: {
    isTimesUp() {
      this.$emit('getResult', {
        correctResponse: this.correctResponse,
        responseTime: this.responseTime,
        correctAnswer: this.result.correct,
        totalQuestion: this.result.problems.length,
      });
    },
  },
  methods: {
    startQuestionCycle() {
      // Don't start if test is paused or ended
      if (this.isPause || this.isTimesUp || !this.isActive) return;

      // Clear any existing timers
      if (this.questionTimer) clearTimeout(this.questionTimer);
      if (this.intervalTimer) clearTimeout(this.intervalTimer);

      // Reset state for new question
      this.isQuestionActive = true;
      this.canAnswer = true;
      this.selectedAnswer = null;
      this.showFeedback = false;

      // Generate new problem
      this.generateProblem();

      // Question display timer (15 seconds)
      this.questionTimer = setTimeout(() => {
        if (this.canAnswer) {
          this.handleNoAnswer();
        }
        this.showFeedback = true;

        // Wait 5 seconds to show feedback, then start next question
       this.intervalCycle = setTimeout(() => {
          this.startQuestionCycle();
        }, 5000);
      }, 15000);
    },

    // Update chooseAnswer to respect props:
    chooseAnswer(index) {
      if (!this.canAnswer || !this.isQuestionActive || this.isPause || this.isTimesUp || !this.isActive) return;

      this.canAnswer = false;
      this.selectedAnswer = index;

      if (this.useSound) {
        window.speechSynthesis.cancel();
      }

      this.result.answerTimes.push(Date.now());
      if (this.problem.choices[index] === this.problem.correctAnswer) {
        this.result.correct++;
      } else {
        this.result.wrong++;
      }
      this.result.problems.push(this.problem);
      this.showFeedback = true;

      // Clear current question timer and set timeout for next question
      clearTimeout(this.questionTimer);
      this.intervalCycle= setTimeout(() => {
        this.startQuestionCycle();
      }, 5000);
    },

    // Add method to restart questions
    restartQuestions() {
      this.result = {
        correct: 0,
        wrong: 0,
        answerTimes: [],
        problems: [],
      };
      this.startQuestionCycle();
    },

    handleNoAnswer() {
      this.canAnswer = false;
      this.result.wrong++;
      this.result.answerTimes.push(Date.now());
      this.result.problems.push(this.problem);
      this.showFeedback = true;
    },

    handleKeyPress(event) {
      if (this.isPause || this.isTimesUp || !this.isActive || this.canPressAnswer) {
        return;
      }

      // Check if the pressed key is '1', '2', '3', or '4'
      if (event.key === '1' || event.key === '2' || event.key === '3' || event.key === '4') {
        // Perform any specific action based on the key pressed
        switch (event.key) {
          case '1':
            this.chooseAnswer(0);
            break;
          case '2':
            this.chooseAnswer(1);
            break;
          case '3':
            this.chooseAnswer(2);
            break;
          case '4':
            this.chooseAnswer(3);
            break;
          default:
            break;
        }
      }
    },
    handleAnswer(index) {
      if (this.canPressAnswer || (!this.isPause && !this.isTimesUp && this.isActive)) {
        this.chooseAnswer(index);
      }
    },

    getRandomNumber(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    getRandomOperator() {
      const randomIndex = Math.floor(Math.random() * this.signRandoms.length);
      return this.signRandoms[randomIndex];
    },
    generateProblem() {
      let num1, num2;

      // Adjust ranges based on difficulty level
      switch (this.difficulty) {
        case 'easy':
          num1 = this.getRandomNumber(this.minNumber, 10);
          num2 = this.getRandomNumber(this.minNumber, 10);
          break;
        case 'medium':
          num1 = this.getRandomNumber(this.minNumber, 20);
          num2 = this.getRandomNumber(11, 50);
          break;
        case 'difficult':
          num1 = this.getRandomNumber(this.minNumber, this.maxNumber); // 0-99
          num2 = this.getRandomNumber(this.minNumber, 9); // 0-9
          break;
        default:
          num1 = this.getRandomNumber(this.minNumber, this.maxNumber);
          num2 = this.getRandomNumber(this.minNumber, this.maxNumber);
      }

      const operator = this.getRandomOperator();

      // Ensure non-zero divisor for division and integer result
      if (operator === ':') {
        num2 = this.getRandomNumber(1, 10); // Ensure divisor is not zero
        num1 = num2 * this.getRandomNumber(1, 10); // Ensure num1 is a multiple of num2
      }

      const correctAnswer = this.calculateAnswer(num1, num2, operator);
      const choices = this.generateChoices(correctAnswer);
      const createdAt = Date.now();

      this.problem = { num1, num2, operator, choices, correctAnswer, createdAt };
      this.checkSound();
    },
    checkSound() {
      if (!this.useSound) {
        return;
      }

      if ('speechSynthesis' in window && this.allowSound) {
        const utterance = new SpeechSynthesisUtterance(`${this.problem.num1} ${this.getSoundOperator(this.problem.operator)} ${this.problem.num2} =`);
        utterance.lang = 'id-ID';
        utterance.rate = 1.0; // Atur kecepatan bicara ke nilai yang lebih tinggi jika perlu
        utterance.pitch = 1.2; // Atur pitch bicara
        utterance.volume = 1; // Atur volume (maksimal 1.0)
        window.speechSynthesis.speak(utterance);
      } else {
        console.error('Sorry, your browser does not support text-to-speech.');
      }
    },
    calculateAnswer(num1, num2, operator) {
      switch (operator) {
        case '+':
          return num1 + num2;
        case '-':
          return num1 - num2;
        case 'x':
          return num1 * num2;
        case ':':
          return num1 / num2;
        default:
          return null;
      }
    },
    generateChoices(correctAnswer) {
      const choices = new Set();
      choices.add(correctAnswer);
      while (choices.size < 4) {
        const randomChoice = correctAnswer + this.getRandomNumber(-10, 10);
        choices.add(randomChoice);
      }
      return Array.from(choices).sort(() => Math.random() - 0.5);
    },
    getTimeDifferenceInSeconds(dateTime1, dateTime2) {
      let differenceInMilliseconds = Math.abs(dateTime2 - dateTime1);
      return differenceInMilliseconds / 1000;
    },
    getSoundOperator(operator) {
      if (operator === '+') {
        return 'tambah';
      } else if (operator === '-') {
        return 'kurang';
      } else if (operator === ':') {
        return 'bagi';
      } else if (operator === 'x') {
        return 'kali';
      }

      return operator;
    },
    stop() {
      window.speechSynthesis.cancel();
    },
    cleanup() {
      if (this.questionTimer) clearTimeout(this.questionTimer);
      if (this.intervalTimer) clearTimeout(this.intervalTimer);
      if(this.intervalCycle) clearTimeout(this.intervalCycle);
      window.removeEventListener('keyup', this.handleKeyPress);
      if (this.useSound) {
        window.speechSynthesis.cancel();
      }
    },
  }
};
</script>

<style scoped>
.problem-section {
  margin-top: 20px;
  /* Reduced from 100px to move it higher */
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.problem {
  font-size: 28px;
  /* Slightly increased for better visibility */
  margin-bottom: 20px;
  font-weight: bold;
}

.choices {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  /*width: 200px;*/
  /* Limit maximum width for larger screens */
}

.choice {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.btn-answer {
  padding: 15px 25px;
  font-size: 18px;
  margin-bottom: 10px;
  border: 0;
  font-weight: bold;
  background-color: #e0e0e0;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-answer.can-press {
  background-color: #4CAF50;
  color: white;
}

.btn-answer:hover,
.btn-answer:active {
  background-color: #2196F3;
}

.label-choice {
  font-size: 16px;
  min-width: 20px;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .problem {
    font-size: 24px;
  }

  .choices {
    gap: 10px;
  }

  .btn-answer {
    padding: 12px 20px;
    font-size: 16px;
  }

  .btn-answer.answered {
    background-color: #d0d0d0;
    cursor: not-allowed;
    opacity: 0.7;
  }
}

.btn-answer.correct {
  background-color: #4CAF50 !important;
  color: white;
}

.btn-answer.incorrect {
  background-color: #f44336 !important;
  color: white;
}

.btn-answer.selected {
  background-color: #2196F3 !important;
  color: white;
}

.btn-answer.disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.feedback {
  margin-top: 20px;
  text-align: center;
  font-weight: bold;
  font-size: 18px;
}

.feedback p {
  margin: 0;
  padding: 10px;
  border-radius: 5px;
}
</style>
