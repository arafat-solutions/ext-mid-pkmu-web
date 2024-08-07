<template>
  <div>
    <div class="main-view">
      <h2 class="title-query-bar">Query Bar</h2>
      <div class="query-bar-container">

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
      queryBars: []
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
          console.log(this.queryBars);
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
    }
  }
}
</script>
<style scoped>
.main-view {
  @apply relative text-center flex justify-center items-start gap-5 w-[1280px] m-auto mt-14;
}
</style>
