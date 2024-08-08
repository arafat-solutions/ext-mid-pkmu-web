<template>
  <div>
    <div class="relative text-center justify-center items-start gap-5 w-[1280px] m-auto mt-14" v-if="isConfigLoaded">
      <h2 class="font-bold">Query Bar</h2>
      <div class="border w-3/5 mx-auto mt-4 border-violet-500 rounded" v-if="queryBars.length > 0">
        <div class="grid grid-rows-2 grid-cols-16 gap-2 p-2">
          <div v-for="(queryBar, index) in queryBars" :key="index + '_query_symbol'">{{ queryBar.symbol }}</div>
          <div v-for="(queryBar, index) in queryBars" :key="index + '_query_points'" class="font-bold">{{ queryBar.points }}</div>
        </div>
      </div>
      <div class="w-4/5 mx-auto mt-5">
        <div class="grid grid-rows-2 grid-cols-17 gap-2">
          <div v-for="(question, index) in questions" :key="index + '_question'" :class="index % 2 === 0 ? '' : 'font-bold'">{{ index % 2 === 0 ? question.symbol : question }}</div>
          <div v-for="(question, index) in questions" :key="index + '_answer'">
            <div v-if="index % 2 === 0">&nbsp;</div>
            <div v-else>
              <input
                id="purple-radio"
                type="radio"
                name="colored-radio"
                class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <input type="radio" />
              <input type="radio" />
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
      isConfigLoaded: false,
      radioValues: [],
      totalRow: 10,
      choicesLength: 8,
      queryBarLength: 16,
      queryBars: [],
      questions: [],
      totalQuestionPerRow: 8,
    }
  },
  mounted() {
    this.loadConfig();
  },
  computed: {
    symbols() {
      return this.selectedSymbols.split(/\s+/);
    },
    totalColumn() {
      return this.choicesLength * 3;
    },
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
          console.log(this.queryBars);
          console.log(this.questions);
        }
      }
      console.warn('No schedule data found in localStorage.');
    },
    initiateRadioValues() {
      this.radioValues = Array.from({ length: this.totalRow }, () => Array(this.totalColumn).fill(false));
    },
    generateQueryBar() {
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

      this.queryBars = tempResult;
    },
    generateQuestion() {
      const symbolsLength = this.queryBars.length;

      for (let i = 0; i < this.totalQuestionPerRow; i++) {
          // Add symbol
          this.questions.push(this.queryBars[i % symbolsLength]);
          // Add random number
          this.questions.push(this.getRandomNumberQuestion());
      }

      // Add the final symbol
      this.questions.push(this.queryBars[this.totalQuestionPerRow % symbolsLength]);
    },
    getRandomNumberQuestion() {
        return Math.floor(Math.random() * 16) + 2;
    }
  }
}
</script>
