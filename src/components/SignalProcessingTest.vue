<template>
  <div v-if="timeLeft > 0" :class="isTrial ? 'timer-container-trial' : 'timer-container' ">
    Time: {{ formattedTime }}
    <button v-if="isPause && isTrial" @click="startAgain" class="ml-4">Start</button>
    <button v-if="!isPause && isTrial" @click="pause" class="ml-4">Pause</button>
    <button v-if="isTrial" @click="exit" class="ml-1">Exit</button>
  </div>
  <div class="relative w-[1280px] m-auto" v-if="!isTimesUp && !isPause">
    <div class="flex items-center justify-center mt-[300px]">
      <div class="grid grid-cols-2 gap-4">
        <div class="h-24 w-24 hover:cursor-pointer" :class="(currentQuestion && currentQuestion.position === i) && !clickedAnswer ? `bg-${currentQuestion.color}-500` : 'bg-gray-500'" v-for="i in 4" :key="i" @click="checkAnswer(i)"/>
      </div>
    </div>
    <div class="text-red-600 font-bold text-lg text-center mt-5" v-if="isWrongAnswer">The wrong response</div>
  </div>
  <div v-if="isLoading" class="loading-container">
    <div class="loading-spinner"></div>
    <div class="loading-text">Your result is submitting</div>
  </div>
</template>
<script>
import { removeTestByNameAndUpdateLocalStorage } from '@/utils/index';

export default {
  data() {
    return {
      testName: 'Signal Processing Test',
      currentIndexQuestion: 0,
      isLoading: false,
      minuteTime: null,
      timeLeft: null, // Countdown time in seconds
      isPause: false,
      isConfigLoaded: false,
      intervalCountdownId: null,
      intervalQuestionId: null,
      displayDuration: null, // in seconds
      clickedAnswer: false,
      isWrongAnswer: false,
      isTrial: this.$route.query.isTrial ?? false,
      colors: ['red', 'green', 'blue'],
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
    let reloadCount = parseInt(localStorage.getItem('reloadCountSignalProcessing') || '0');
    reloadCount++;
    localStorage.setItem('reloadCountSignalProcessing', reloadCount.toString());
    window.addEventListener('beforeunload', () => {
      localStorage.setItem('reloadCountSignalProcessing', reloadCount.toString());
    });

    this.loadConfig();
  },
  computed: {
    isTimesUp() {
      return this.timeLeft < 1;
    },
    formattedTime() {
      const minutes = Math.floor(this.timeLeft / 60);
      const seconds = this.timeLeft % 60;
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    },
    intervalChangeQuestion() {
      const intervalMap = {
        never: null, // or a very high number, or skip entirely
        very_rarely: 10, // 10 seconds
        rarely: 8,       // 8 seconds
        normal: 6,       // 6 seconds
        often: 4,        // 4 seconds
        very_often: 2    // 2 seconds
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
      return this.currentIndexQuestion + 1 - this.result.correct - this.result.wrong;
    },
    averageAnswerTime() {
      if (this.result.answerTimes.length === 0) return 0; // Handle empty this.result.answerTimesay case
      const sum = this.result.answerTimes.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
      const average = sum / this.result.answerTimes.length;
      return parseFloat(average.toFixed(2));
    }
  },
  watch: {
    isTimesUp(value) {
      if (value) {
        clearInterval(this.intervalCountdownId);
        clearInterval(this.intervalQuestionId);
        this.submitResult();
      }
    }
  },
  methods: {
    loadConfig() {
      const data = localStorage.getItem('scheduleData');
      if (data) {
        try {
          const scheduleData = JSON.parse(data);
          // @TODO: Config Flow
          const config = scheduleData.tests.find((t) => t.name === this.testName).configs[0];
          this.minuteTime = Number(config.duration);
          this.timeLeft = this.minuteTime * 60;
          this.level = config.difficulty;
          this.displayDuration = config.display_duration;
          // this.frequent = config.frequency_change;
          this.isConfigLoaded = true;
          this.generateQuestions();
          this.startCountdown();
          this.startChangeQuestion();
        } catch (e) {
          console.error('Error parsing schedule data:', e);
        }
      }

      console.warn('No schedule data found in localStorage.');
    },
    startCountdown() {
      if (this.isPause) {
        return;
      }

      this.intervalCountdownId = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft -= 1;
        }
      }, 1000);
    },
    startChangeQuestion() {
      if (this.isPause || !this.displayDuration) {
        return;
      }

      this.intervalQuestionId = setInterval(() => {
        this.startTimeAnswer = new Date();
        this.isWrongAnswer = false;
        this.currentIndexQuestion++;
        this.clickedAnswer = false;
      }, (this.displayDuration * 1000));
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
      const totalWeight = Object.values(levelWeights).reduce((a, b) => a + b, 0);
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
        return this.positions[Math.floor(Math.random() * this.positions.length)];
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
        } while (i > 0 && newQuestion.color === questions[i - 1].color && newQuestion.position === questions[i - 1].position);

        questions.push(newQuestion);
      }

      this.questions = questions;
    },
    checkAnswer(n) {
      if (this.clickedAnswer) {
        return;
      }

      // calculate diff answer
      if (this.startTimeAnswer) {
        const endTime = new Date(); // End time after operation
        const differenceInMilliseconds = endTime.getTime() - this.startTimeAnswer.getTime();
        this.result.answerTimes.push(differenceInMilliseconds);
        this.startTimeAnswer = null;
      }

      this.clickedAnswer = true;
      if (this.currentQuestion.color === 'red' && this.currentQuestion.position === n) {
        this.result.correct++;
      } else if (this.currentQuestion.color === 'green' && this.greenCorrectAnswer[this.currentQuestion.position] === n) {
        this.result.correct++;
      } else if (this.currentQuestion.color === 'blue' && this.blueCorrectAnswer[this.currentQuestion.position] === n) {
        this.result.correct++;
      } else {
        this.result.wrong++;
        this.isWrongAnswer = true;
      }
    },
    exit() {
      this.$router.push('module');
    },
    pause() {
      this.isPause = true;
      clearInterval(this.intervalCountdownId);
      clearInterval(this.intervalQuestionId);
    },
    startAgain() {
      this.isPause = false;
      this.startCountdown();
      this.startChangeQuestion();
    },
    generatePayloadForSubmit() {
      const scheduleData = JSON.parse(localStorage.getItem('scheduleData'));
      const test = scheduleData.tests.find((t) => t.name === this.testName);
      const totalQuestion = this.currentIndexQuestion + 1;
      const payload = {
        'testSessionId': scheduleData.sessionId,
        'userId': scheduleData.userId,
        'moduleId': scheduleData.moduleId,
        'batteryTestConfigId': test.config.id,
        'refreshCount': parseInt(localStorage.getItem('reloadCountSignalProcessing')),
        'result': {
          'totalQuestion': totalQuestion,
          'correctAnswer': this.result.correct,
          'avgResponseTIme': this.averageAnswerTime
        }
      }

      return payload;
    },
    async submitResult() {
      try {
        if (this.isTrial) {
          this.$router.push('/module');
          return;
        }

        this.isLoading = true;
        const API_URL = process.env.VUE_APP_API_URL;
        const payload = this.generatePayloadForSubmit();
        const response = await fetch(`${API_URL}/api/submission`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
        removeTestByNameAndUpdateLocalStorage(this.testName);
        localStorage.removeItem('reloadCountSignalProcessing');
        this.$router.push('/module');// Set isLoading to false when the submission is complete
      }
    }
  },
};
</script>
<style scoped>
  .timer-container-trial {
    @apply absolute right-0 top-0 bg-[#0349D0] p-3 text-white font-bold rounded-bl-[15px];

    button {
      @apply text-black font-bold py-2 rounded-md border-transparent min-w-[100px] cursor-pointer bg-gray-200;
    }
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
    background-color: #6B7280;
  }

  .bg-green-500 {
    background-color: #22C55E;
  }

  .bg-blue-500 {
    background-color: #3B82F6;
  }

  .bg-red-500 {
    background-color: #EF4444;
  }
</style>
