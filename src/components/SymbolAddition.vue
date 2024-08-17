<template>
  <div v-if="!isTimesUp">
    <div :class="isTrial ? 'timer-container-trial' : 'timer-container' ">
      Task: {{ currentTask }} / {{ numberOfTask }}
      <button v-if="isPause && isTrial" @click="startAgain" class="ml-4">Start</button>
      <button v-if="!isPause && isTrial" @click="pause" class="ml-4">Pause</button>
      <button v-if="isTrial" @click="exit" class="ml-1">Exit</button>
    </div>
    <div class="relative text-center justify-center items-start gap-5 w-[1280px] m-auto mt-24" v-if="isConfigLoaded">
      <h2 class="font-bold">Query Bar</h2>
      <div class="border w-3/5 mx-auto mt-4 border-violet-500 rounded" v-if="queryBars.length > 0">
        <div class="grid grid-rows-2 grid-cols-16 gap-2 p-2">
          <div v-for="(queryBar, index) in currentQueryBar" :key="index + '_query_symbol'">{{ queryBar.symbol }}</div>
          <div v-for="(queryBar, index) in currentQueryBar" :key="index + '_query_points'" class="font-bold">{{ queryBar.points }}</div>
        </div>
      </div>
      <div class="w-4/5 mx-auto mt-5">
        <div class="grid grid-rows-2 grid-cols-17 gap-2 mb-3 p-2" v-for="(questionRows, indexRow) in questions.slice((currentPage-1) * totalRow, (currentPage-1) * totalRow + totalRow)" :key="indexRow + '_grid'" :class="(indexRow+1) === currentRow ? 'border border-violet-500 rounded' : ''">
          <div v-for="(question, indexColumn) in questionRows" :key="indexColumn + '_question'" :class="indexColumn % 2 === 0 ? '' : 'font-bold'">{{ indexColumn % 2 === 0 ? question.symbol : question }}</div>
          <div v-for="(_, indexColumn) in questionRows" :key="indexColumn + '_answer'">
            <div v-if="indexColumn % 2 === 0">&nbsp;</div>
            <div v-else>
              <input
                :name="`answer-${indexRow}-${indexColumn}`"
                type="radio"
                class="accent-violet-500"
                v-for="n in 3"
                :key="n"
                :class="n % 2 === 0 ? 'mx-1' : ''"
                :value="n"
                :disabled="(indexRow+1) !== currentRow"
                v-model="radioValues[indexRow][indexColumn]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      testName: 'Symbol Addition',
      currentTask: 1,
      numberOfTask: null,
      selectedSymbols: null,
      resetQueryBarPerRow: null,
      varianceSymbols: null,
      isPause: false,
      isTrial: this.$route.query.isTrial ?? false,
      isConfigLoaded: false,
      radioValues: [],
      totalRow: 8,
      choicesLength: 8,
      queryBarLength: 16,
      durationAnswer: 5, // in seconds
      timeLeftAnswer: 5, // in seconds
      queryBars: [],
      questions: [],
      answers: [],
      intervalId: null,
      result: {
        correct: 0,
        missed: 0,
        wrong: 0,
      }
    }
  },
  mounted() {
    this.loadConfig();
  },
  computed: {
    isTimesUp() {
      return this.currentTask === this.numberOfTask && this.timeLeftAnswer < 1;
    },
    symbols() {
      return this.selectedSymbols.split(/\s+/);
    },
    currentQueryBar() {
      if (this.resetQueryBarPerRow) {
        return this.queryBars[this.currentTask-1];
      }

      return this.queryBars[Math.floor(this.currentTask/this.numberOfTask)];
    },
    currentPage() {
      return Math.ceil(this.currentTask/this.totalRow);
    },
    currentRow() {
      return (((this.currentTask - 1) % this.totalRow) + 1);
    }
  },
  watch: {
    currentPage() {
      this.initiateRadioValues();
    }
  },
  methods: {
    loadConfig() {
      const data = localStorage.getItem('scheduleData');
      if (data) {
        try {
          const scheduleData = JSON.parse(data);
          const config = scheduleData.tests.find((t) => t.name === this.testName).config;
          this.numberOfTask = config.numberOfQuestion
          this.selectedSymbols = config.symbols
          this.resetQueryBarPerRow = config.resetQueryBar
          this.varianceSymbols = config.variation
          this.isConfigLoaded = true;
        } catch (e) {
          console.error('Error parsing schedule data:', e);
        } finally {
          this.initiateRadioValues();
          this.generateQueryBar();
          this.generateQuestion();
          this.startCountdown();
        }
      }
      console.warn('No schedule data found in localStorage.');
    },
    initiateRadioValues() {
      this.radioValues = Array.from({ length: this.totalRow }, () => Array(this.choicesLength).fill(null));
    },
    generateQueryBar() {
      let totalQueryBar = this.numberOfTask;
      if (!this.resetQueryBarPerRow) {
        totalQueryBar = Math.ceil(this.numberOfTask / this.totalRow);
      }

      for (let i=0;i<totalQueryBar;i++) {
        let tempSymbols = [...this.symbols];
        let points = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        let tempResult = [];

        while (tempResult.length < this.queryBarLength && tempSymbols.length > 0) {
          let symbolIndex = Math.floor(Math.random() * tempSymbols.length);
          let pointsIndex = Math.floor(Math.random() * points.length);

          tempResult.push({
            symbol: tempSymbols[symbolIndex],
            points: points[pointsIndex]
          });

          // Remove the used symbol and point
          tempSymbols.splice(symbolIndex, 1);
          points.splice(pointsIndex, 1);

          // Reset points array if empty
          if (points.length === 0) {
            points = [1, 2, 3, 4, 5, 6, 7, 8, 9];
          }
        }

        this.queryBars.push(tempResult);
      }
    },
    generateQuestion() {
      for (let i = 0; i < this.numberOfTask; i++) {
        // Initialize each row as an empty array
        this.questions[i] = [];
        const symbolsLength = this.currentQueryBar.length;

        for (let j = 0; j < this.totalRow; j++) {
          // Add a random symbol
          const randomSymbolIndex = Math.floor(Math.random() * symbolsLength);
          this.questions[i].push(this.currentQueryBar[randomSymbolIndex]);

          // Add a random number
          this.questions[i].push(this.getRandomNumberQuestion());
        }

        // Add the final random symbol
        const finalRandomSymbolIndex = Math.floor(Math.random() * symbolsLength);
        this.questions[i].push(this.currentQueryBar[finalRandomSymbolIndex]);
      }

      this.generateAnswers();
    },
    generateAnswers() {
      for (let i = 0; i < this.questions.length; i++) {
        this.answers[i] = [];
        for (let j = 0; j < this.questions[i].length; j++) {
          const value = this.questions[i][j];
          if (typeof value === 'number') {
            const answer = this.questions[i][j-1].points + this.questions[i][j+1].points;
            if (answer > value) {
              this.answers[i].push(3);
            } else if (answer < value) {
              this.answers[i].push(1);
            } else {
              this.answers[i].push(2);
            }
          }
        }
      }
    },
    checkRowAnswers() {
      const rowIndex = this.currentRow - 1;
      for (let [index, radioValue] of this.radioValues[rowIndex].entries()) {
        if (!radioValue) {
          this.result.missed++;
        } else if (radioValue === this.answers[rowIndex][index]) {
          this.result.correct++;
        } else {
          this.result.wrong++;
        }
      }
      console.log(this.result);
    },
    getRandomNumberQuestion() {
        return Math.floor(Math.random() * 16) + 2;
    },
    startCountdown() {
      if (this.isPause) {
        return;
      }

      this.intervalId = setInterval(() => {
        if (this.timeLeftAnswer > 0) {
          this.timeLeftAnswer--;
        } else {
          this.checkRowAnswers();
          if (this.currentTask === this.numberOfTask) {
            clearInterval(this.intervalId);
            alert('Submit API');
            return;
          }
          this.currentTask++;
          this.timeLeftAnswer = this.durationAnswer;
        }
      }, 1000);
    },
    exit() {
      this.$router.push('module');
    },
  }
}
</script>
<style scoped>
  .timer-container-trial {
    @apply absolute right-0 top-0 bg-[#0349D0] p-3 text-white font-bold rounded-bl-[15px];

    button {
      @apply text-black font-bold py-2 rounded-md border-transparent min-w-[100px] cursor-pointer;
    }
  }

  .timer-container {
    @apply absolute top-0 left-1/2 transform -translate-x-1/2 bg-[#0349D0] px-20 py-6 text-white font-bold rounded-bl-[15px] rounded-br-[15px];
  }
</style>
