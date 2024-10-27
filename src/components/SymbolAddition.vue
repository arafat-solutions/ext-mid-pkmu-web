<template>
  <div v-if="isModalTrainingVisible" class="modal-overlay">
    <div class="modal-content">
      <p><strong>Apakah Anda Yakin <br>akan memulai pelatihan Symbol Addition?</strong></p>
      <button @click="exit()" style="margin-right: 20px;">Batal</button>
      <button @click="startTest()">Ya</button>
    </div>
  </div>

  <div v-if="isModalVisible" class="modal-overlay">
    <div class="modal-content">
      <p><strong>Apakah Anda Yakin <br>akan memulai ujian Symbol Addition?</strong></p>
      <button @click="exit()" style="margin-right: 20px;">Batal</button>
      <button @click="startTest()">Ya</button>
    </div>
  </div>

  <div class='timer-container' v-if="!isTimesUp">
    Task: {{ currentTask }} / {{ numberOfTask }}
  </div>
  <div v-if="!isTimesUp">
    <div class="relative text-center justify-center items-start gap-5 w-[1280px] m-auto mt-14" v-if="isConfigLoaded">
      <h2 class="font-bold">Query Bar</h2>
      <div class="border w-3/5 mx-auto mt-4 border-violet-500 rounded" v-if="queryBars.length > 0">
        <div :class="classQueryBar">
          <div v-for="(queryBar, index) in currentQueryBar" :key="index + '_query_symbol'">{{ queryBar.symbol }}</div>
          <div v-for="(queryBar, index) in currentQueryBar" :key="index + '_query_points'" class="font-bold">{{ queryBar.points }}</div>
        </div>
      </div>
      <div class="w-4/5 mx-auto mt-5">
        <div class="grid grid-rows-2 grid-cols-17 gap-1 mb-3 p-1" v-for="(questionRows, indexRow) in questions.slice((currentPage-1) * totalRow, (currentPage-1) * totalRow + totalRow)" :key="indexRow + '_grid'" :class="(indexRow+1) === currentRow ? 'border border-violet-500 rounded' : ''">
          <div v-for="(question, indexColumn) in questionRows" :key="indexColumn + '_question'" :class="indexColumn % 2 === 0 ? '' : 'font-bold'">{{ indexColumn % 2 === 0 ? question.symbol : question }}</div>
          <div v-for="(_, indexColumn) in questionRows" :key="indexColumn + '_answer'">
            <div v-if="indexColumn % 2 === 0">&nbsp;</div>
            <div v-else>
              <div
              :class="this.radioValues[indexRow][Math.floor(indexColumn/2)] !== this.answers[indexRow][Math.floor(indexColumn/2)] && this.currentRowDisabled && (indexRow+1) === currentRow && this.radioValues[indexRow][Math.floor(indexColumn/2)]? 'border border-red-600 rounded' : ''">
                <input
                  :name="`answer-${indexRow}-${indexColumn}`"
                  type="radio"
                  class="accent-violet-500"
                  v-for="n in 3"
                  :key="n"
                  :class="n % 2 === 0 ? 'mx-1' : ''"
                  :value="n"
                  :disabled="(indexRow+1) !== currentRow || currentRowDisabled"
                  v-model="radioValues[indexRow][Math.floor(indexColumn/2)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="inline-block text-red-600 font-bold text-lg text-left ml-6 mt-5" v-if="currentWrong">{{ currentWrong }} answer{{ currentWrong > 1 ? 's' : '' }} wrong</div>
    </div>
  </div>
  <div v-if="isLoading" class="loading-container">
    <div class="loading-spinner"></div>
    <div class="loading-text">Your result is submitting</div>
  </div>
</template>
<script>

import { completeTrainingTestAndUpdateLocalStorage, removeTestByNameAndUpdateLocalStorage } from '@/utils/index'
import { getConfigs } from '@/utils/configs';
export default {
  data() {
    return {
      isModalTrainingVisible: false,
      isModalVisible: false,
      isTrainingCompleted: false,
      configs: [],
      indexConfig: 0,


      currentTask: 1,
      numberOfTask: null,
      numberOfTaskInConfig: null,
      selectedSymbols: null,
      resetQueryBarPerRow: null,
      varianceSymbols: null,
      isLoading: false,
      isConfigLoaded: false,
      radioValues: [],
      start: 0,
      totalRow: 8,
      choicesLength: 8,
      durationAnswer: 20, // in seconds
      timeLeftAnswer: 20, // in seconds
      moveNextTaskDuration: 5, // in seconds
      queryBars: [],
      questions: [],
      answers: [],
      currentWrong: null,
      currentRowDisabled: false,
      result: {
        correct: 0,
        wrong: 0,
      },
    }
  },
  mounted() {
    let reloadCount = parseInt(localStorage.getItem('reloadCountSymbolAddition') || '0');
    reloadCount++;
    localStorage.setItem('reloadCountSymbolAddition', reloadCount.toString());
    window.addEventListener('beforeunload', () => {
      localStorage.setItem('reloadCountSymbolAddition', reloadCount.toString());
    });

    this.initConfig();
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

      return this.queryBars[Math.ceil(this.currentTask/this.totalRow)-1];
    },
    currentPage() {
      return Math.ceil(this.currentTask/this.totalRow);
    },
    currentRow() {
      return (((this.currentTask - 1) % this.totalRow) + 1);
    },
    classQueryBar() {
      return `grid grid-rows-2 grid-cols-${this.varianceSymbols} gap-1 p-1`;
    }
  },
  watch: {
    currentPage() {
      this.initiateRadioValues();
    },
    isTimesUp(value) {
      if (value) {
        if (!this.isTrainingCompleted) {
          this.isTrainingCompleted = true;
          completeTrainingTestAndUpdateLocalStorage("Symbol Addition");

          //Start Exam After Training
          this.isModalVisible = true
          this.result.correct = 0
          this.result.wrong = 0
        } else {
          this.submitResult()
        }
      }
    }
  },
  methods: {
    startTest() {
      if (!this.isTrainingCompleted) {
        this.numberOfTask = this.configs[0].numberOfQuestion;
      } else {
        this.currentTask = 1
        this.numberOfTask = 0
        for (const i in this.configs) {
          this.numberOfTask += parseInt(this.configs[i].numberOfQuestion)
        }
      }

      this.isModalTrainingVisible = false;
      this.isModalVisible = false;

      setTimeout(() => {
        this.initiateRadioValues();
        this.startExam();
      }, 500);

      this.startCountdown();
    },
    startExam() {
      if (!this.isTrainingCompleted) {
        this.setConfig(this.configs[0])
        this.generateQueryBar();
        this.generateQuestion();
      } else {
        for (var i in this.configs) {
          this.setConfig(this.configs[i])
          this.generateQueryBar();
          this.generateQuestion();
        }
      }
    },
    exit() {
      if (confirm("Apakah Anda yakin ingin keluar dari tes? Semua progres akan hilang.")) {
        this.$router.push('module');
      }
    },
    initConfig() {
      const configData = getConfigs('symbol-addition-test');
      if (!configData) {
        this.$router.push('/module');
        return;
      }

      this.configs = configData.configs;

      //For Training
      this.isTrainingCompleted = configData.trainingCompleted;

      if (!this.isTrainingCompleted) {
        this.isModalTrainingVisible = true;
      } else {
        this.isModalVisible = true;
      }
    },
    setConfig(config) {
      this.selectedSymbols = config.symbols;
      this.resetQueryBarPerRow = config.resetQueryBar;
      this.varianceSymbols = this.getVariation(config.variation);
      this.numberOfTaskInConfig = config.numberOfQuestion

      this.isConfigLoaded = true;
    },
    async startCountdown() {
      if (this.currentRowDisabled || this.isTimesUp) {
        return;
      }

      if (this.timeLeftAnswer > 0) {
        this.timeLeftAnswer--;
      } else {
        this.checkRowAnswers();
        this.currentRowDisabled = true;
        await this.delay(this.moveNextTaskDuration * 1000);
        this.currentRowDisabled = false;
        this.currentWrong = null;
        this.currentTask++;
        this.timeLeftAnswer = this.durationAnswer;
      }
      await this.delay(1000);

      this.startCountdown();
    },
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    initiateRadioValues() {
      this.radioValues = Array.from({ length: this.totalRow }, () => Array(this.choicesLength).fill(null));
    },
    generateQueryBar() {
      let totalQueryBar = this.numberOfTaskInConfig;
      if (!this.resetQueryBarPerRow) {
        totalQueryBar = Math.ceil(this.numberOfTaskInConfig / this.totalRow);
      }
      const randomSymbols = this.getRandomSymbols();

      for (let i=0;i<totalQueryBar;i++) {
        let tempSymbols = [...randomSymbols];
        let points = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        let tempResult = [];

        while (tempResult.length < this.varianceSymbols && tempSymbols.length > 0) {
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
    getVariation(variation) {
      if (variation < 9) {
        return 9;
      }

      if (variation > this.symbols.length) {
        return this.symbols.length;
      }

      return variation;
    },
    getRandomSymbols() {
      const shuffledArray = this.symbols.sort(() => Math.random() - 0.5);

      return shuffledArray.slice(0, this.varianceSymbols);
    },
    generateQuestion() {
      for (let i = 0; i < this.numberOfTaskInConfig; i++) {
        // Initialize each row as an empty array
        this.questions[this.start] = [];
        const symbolsLength = this.currentQueryBar.length;

        for (let j = 0; j < this.totalRow; j++) {
          // Add a random symbol
          const randomSymbolIndex = Math.floor(Math.random() * symbolsLength);
          this.questions[this.start].push(this.currentQueryBar[randomSymbolIndex]);

          // Add a random number
          this.questions[this.start].push(this.getRandomNumberQuestion());
        }

        // Add the final random symbol
        const finalRandomSymbolIndex = Math.floor(Math.random() * symbolsLength);
        this.questions[this.start].push(this.currentQueryBar[finalRandomSymbolIndex]);

        this.start++;
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
      let wrong = 0;
      for (let [index, radioValue] of this.radioValues[rowIndex].entries()) {
        if (radioValue === this.answers[rowIndex][index]) {
          this.result.correct++;
        } else if (radioValue && radioValue !== this.answers[rowIndex][index]){
          this.result.wrong++;
          wrong++;
        }
      }
      this.currentWrong = wrong;
    },
    getRandomNumberQuestion() {
        return Math.floor(Math.random() * 16) + 2;
    },
    generatePayloadForSubmit() {
      const scheduleData = JSON.parse(localStorage.getItem('scheduleData'));
      const totalQuestion = this.numberOfTask * this.choicesLength;
      const skippedQuestion = totalQuestion - this.result.correct - this.result.wrong;
      const payload = {
        'testSessionId': scheduleData.sessionId,
        'userId': scheduleData.userId,
        'moduleId': scheduleData.moduleId,
        'batteryTestId': scheduleData.testId,
        'refreshCount': parseInt(localStorage.getItem('reloadCountSymbolAddition')),
        'result': {
          'correctAnswer': this.result.correct,
          'totalQuestion': totalQuestion,
          'skippedQuestion': skippedQuestion,
          'incorrectAnswer': this.result.wrong
        }
      }

      return payload;
    },
    async submitResult() {
      try {
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
        removeTestByNameAndUpdateLocalStorage('Symbol Addition');
        localStorage.removeItem('reloadCountSymbolAddition');
        this.$router.push('/module');// Set isLoading to false when the submission is complete
      }
    }
  }
}
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
    max-width: 90%;
    max-height: 90%;
    overflow-y: auto;
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

  .grid-cols-9 {
    grid-template-columns: repeat(9, minmax(0, 1fr));
  }

  .grid-cols-10 {
    grid-template-columns: repeat(10, minmax(0, 1fr));
  }

  .grid-cols-11 {
    grid-template-columns: repeat(11, minmax(0, 1fr));
  }

  .grid-cols-12 {
    grid-template-columns: repeat(12, minmax(0, 1fr));
  }

  .grid-cols-13 {
    grid-template-columns: repeat(13, minmax(0, 1fr));
  }

  .grid-cols-14 {
    grid-template-columns: repeat(14, minmax(0, 1fr));
  }

  .grid-cols-15 {
    grid-template-columns: repeat(15, minmax(0, 1fr));
  }

  .grid-cols-16 {
    grid-template-columns: repeat(16, minmax(0, 1fr));
  }

  .grid-cols-17 {
    grid-template-columns: repeat(17, minmax(0, 1fr));
  }

  .grid-cols-18 {
    grid-template-columns: repeat(18, minmax(0, 1fr));
  }

  .grid-cols-19 {
    grid-template-columns: repeat(19, minmax(0, 1fr));
  }

  .grid-cols-20 {
    grid-template-columns: repeat(20, minmax(0, 1fr));
  }
</style>
