<template>
  <div v-if="isModalTrainingVisible" class="modal-overlay">
    <div class="modal-content">
      <p><strong>Apakah Anda Yakin <br>akan memulai pelatihan Accoustic Memory?</strong></p>
      <button @click="startTest()">Ya</button>
      <button @click="exit()" style="margin-right: 20px;">Batal</button>
    </div>
  </div>

  <div v-if="isModalVisible" class="modal-overlay">
    <div class="modal-content">
      <p><strong>Apakah Anda Yakin <br>akan memulai ujian Accoustic Memory?</strong></p>
      <button @click="startTest()">Ya</button>
      <button @click="exit()" style="margin-right: 20px;">Batal</button>
    </div>
  </div>


  <div class="main-view" v-if="isConfigLoaded">
    <div class="timer-container">
      Task: {{ taskNow }} / {{ numberOfTask }}
    </div>
    <div class="checkbox-grid">
      <div v-for="(row, rowIndex) in totalRow" :key="rowIndex" class="checkbox-row">
        <div v-for="(col, colIndex) in totalColumn" :key="colIndex" class="checkbox-item">
          <label :for="`checkbox-${rowIndex}-${colIndex}`" v-if="(col % this.stringSizeLength) === 1" class="mr-2">{{ String.fromCharCode(96 + Math.ceil(col / this.stringSizeLength)) }})</label>
          <div class="checkbox-wrapper">
            <label class="checkbox">
              <input
                class="checkbox__trigger visuallyhidden"
                :class="[
                  {
                    'wrong-answer': wrongRows[rowIndex][colIndex],
                    'disabled': row !== currentRow
                  }
                ]"
                type="checkbox"
                :id="`checkbox-${rowIndex}-${colIndex}`"
                :disabled="row !== currentRow || currentRowDisabled"
                v-model="checkboxValues[rowIndex][colIndex]"
              />
              <span class="checkbox__symbol">
                <svg aria-hidden="true" class="icon-checkbox" width="28px" height="28px" viewBox="0 0 28 28" version="1" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 14l8 7L24 7"></path>
                </svg>
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
    <div class="wrong-text" v-if="wrong">{{ wrong }} answer{{ wrong > 1 ? 's' : '' }} wrong</div>
    <button class="btn-continue" v-show="canContinue" @click="continueTask">Lanjutkan</button>
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
      canContinue: false,
      page: 1,
      currentRowDisabled: false,
      taskNow: 1,
      currentTask: 1,
      numberOfTask: 10, //positive number
      totalRow: 10,
      stringSize: null, //AB-CD-E, AB-CD-EF, ABC-DE-FG, ABC-DEF-GH, ABC-DEF-GHJ
      includeDigits: null, //true or false
      excludeVowels: null, //true or false
      readingSpeed: null, // 1-100
      isConfigLoaded: false,
      isLoading: false,
      problem: null,
      choicesLength: 4,
      wrong: null,
      wrongRows: [],
      dashInterval: 2000, //in ms
      choicesInterval: 3000, //in ms
      charInterval: 1000, //in ms
      pauseIntervalID: null,
      checkboxValues: [],
      result: {
        correct: 0,
        wrong: 0,
        problems: [],
      }
    }
  },
  computed: {
    stringSizeLength() {
      return this.stringSize.split('-').length;
    },
    totalColumn() {
      return this.choicesLength * this.stringSizeLength;
    },
    currentRow() {
      if (this.currentTask <= this.totalRow) {
        return this.currentTask;
      }

      return this.currentTask % this.totalRow;
    },
  },
  mounted() {
    let reloadCount = parseInt(localStorage.getItem('reloadCountAccousticMemory') || '0');
    reloadCount++;
    localStorage.setItem('reloadCountAccousticMemory', reloadCount.toString());
    window.addEventListener('beforeunload', () => {
      localStorage.setItem('reloadCountAccousticMemory', reloadCount.toString());
    });

    this.initConfig();
  },
  methods: {
    initiateCheckboxValues() {
      this.checkboxValues = Array.from({ length: this.totalRow }, () => Array(this.totalColumn).fill(false));
    },
    initiateWrongRows() {
      this.wrongRows = Array.from({ length: this.totalRow }, () => Array(this.totalColumn).fill(false));
    },
    initConfig() {
      const configData = getConfigs('accoustic-memory-test');
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
      this.stringSize = config.string_size;
      this.includeDigits = config.combination.include_number;
      this.excludeVowels = !config.combination.vocal;
      this.readingSpeed = config.speed;

      this.isConfigLoaded = true;
    },
    async generateProblem() {
      if (this.utterance) {
        window.speechSynthesis.cancel();
      }

      this.problem = null;
      const randomString = this.generateRandomString(this.stringSize, this.includeDigits, this.excludeVowels);
      const choices = this.generateChoices(randomString, this.stringSize, this.includeDigits, this.excludeVowels);

      this.problem = {randomString, choices};
      // Read the question
      await this.readQuestion();

      // Read the choices
      await this.readChoices();
    },
    generateRandomString(format, includeDigits = true, excludeVowels = false) {
      const vowels = 'AEIOU';
      let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

      if (includeDigits) {
          chars += '0123456789';
      }

      if (excludeVowels) {
          chars = chars.split('').filter(char => !vowels.includes(char)).join('');
      }

      let result = '';

      for (let char of format) {
          if (char === '-') {
              result += '-';
          } else {
              result += chars.charAt(Math.floor(Math.random() * chars.length));
          }
      }

      return result;
    },
    getSegments(format) {
      return format.split('-').map(segment => segment.replace(/[^A-Z0-9]/g, ''));
    },
    generateChoices(mainString, format, includeDigits, excludeVowels) {
      const segments = this.getSegments(format);
      const choices = [];
      const mainSegments = mainString.split('-');

      while (choices.length < this.choicesLength) {
          let choice = '';
          let segmentsToMatch = new Set();

          for (let i = 0; i < segments.length; i++) {
              if (Math.random() < 0.5) {
                  choice += mainSegments[i];
                  segmentsToMatch.add(i);
              } else {
                  choice += this.generateRandomString(segments[i], includeDigits, excludeVowels);
              }
              if (i < segments.length - 1) {
                  choice += '-';
              }
          }

          if (segmentsToMatch.size > 0 && !choices.includes(choice)) {
              choices.push(choice);
          }
      }

      return choices;
    },
    checkAnswer(mainString, choices, answers) {
      const mainSegments = mainString.split('-');
      let wrong = 0;
      let correct = 0;
      let column = 0;

      choices.forEach((choice) => {
        const choiceSegments = choice.split('-');

        for (let i = 0; i < mainSegments.length; i++) {
          const isCorrectMatch = mainSegments[i] === choiceSegments[i];
          const isAnswerCorrect = answers[column];

          if (isCorrectMatch === isAnswerCorrect) {
            correct++;
          } else {
            wrong++;
            this.wrongRows[this.currentRow-1][column] = true;
          }
          column++;
        }
      });

      return { correct, wrong };
    },
    async readQuestion() {
      const synth = window.speechSynthesis;
      const utterance = this.setupSound();
      utterance.text = 'Perhatikan kombinasi huruf berikut:';
      // Wrap speechSynthesis.speak in a promise
      await new Promise((resolve, reject) => {
        utterance.onend = resolve;
        utterance.onerror = reject;
        synth.speak(utterance);
      });
      await this.spellOutString(this.problem.randomString);
      // utterance.text = 'is introduces. The query letter strings read out are:';
      // in bahasa
      utterance.text = 'Cocokan kombinasi huruf berikut dengan yang sudah di bacakan sebelumnya:';
      // Wrap speechSynthesis.speak in a promise
      await new Promise((resolve, reject) => {
        utterance.onend = resolve;
        utterance.onerror = reject;
        synth.speak(utterance);
      });
    },
    async readChoices() {
      for (const choice of this.problem.choices) {
        await this.spellOutString(choice);
        await this.delay(this.choicesInterval);
      }

      // Check Answer per Row
      this.checkRowAnswer();
    },
    setupSound() {
      if (!('speechSynthesis' in window)) {
        console.error('Sorry, your browser does not support text-to-speech.');
        return;
      }

      const utterance = new SpeechSynthesisUtterance();
      utterance.lang = 'id-ID';
      utterance.rate = this.getRate();
      utterance.pitch = 1.2;
      utterance.volume = 1;

      return utterance;
    },
    getRate() {
      const minRate = 0.1;
      const maxRate = 1;
      const rate = (this.readingSpeed / 100) * (maxRate - minRate) + minRate;

      return rate;
    },
    spellOutString(text) {
      text = text.toLowerCase();
      const synth = window.speechSynthesis;
      const utterance = this.setupSound();

      const spellOut = (letter, delay) => {
        return new Promise((resolve) => {
          utterance.text = letter;
          synth.speak(utterance);
          setTimeout(() => {
            resolve();
          }, delay);
        });
      };

      return (async () => { // Return the promise chain
        for (let char of text) {
          if (char === '-') {
            await this.delay(this.dashInterval);
          } else {
            await spellOut(char, this.charInterval); // Default interval between letters
            await this.delay(this.charInterval / 2);
          }
        }
      })();
    },
    async checkRowAnswer() {
      const rowResult = this.checkAnswer(this.problem.randomString, this.problem.choices, this.checkboxValues[this.currentRow - 1]);
      this.currentRowDisabled = true;
      this.result.correct += rowResult.correct;
      this.result.wrong += rowResult.wrong;
      this.wrong = rowResult.wrong;
      this.canContinue = true;
      this.result.problems.push(this.problem);
    },
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    exit() {
      window.speechSynthesis.cancel();
      this.$router.push('module');
    },
    startTest() {
      if (!this.isTrainingCompleted) {
        this.numberOfTask = this.configs[0].number_of_task ?? 10;
      } else {
        this.canContinue = false
        this.wrong = null
        this.taskNow = 1
        this.currentTask = 1
        this.result.correct = 0
        this.result.wrong = 0
        this.result.problems = []

        this.numberOfTask = 0
        for (const i in this.configs) {
          this.numberOfTask += parseInt(this.configs[i].number_of_task ?? 10)
        }
      }

      this.isModalTrainingVisible = false;
      this.isModalVisible = false;

      this.setConfig(this.configs[this.page-1])
      this.initiateCheckboxValues();
      this.initiateWrongRows();

      setTimeout(() => {
        this.generateProblem();
      }, 1000);
    },
    continueTask() {
      if (this.taskNow >= this.numberOfTask) {
        if (!this.isTrainingCompleted) {
          this.isTrainingCompleted = true;
          completeTrainingTestAndUpdateLocalStorage("Acoustic Memory Test");

          //Start Exam After Training
          this.isModalVisible = true
          this.result.correct = 0
          this.result.wrong = 0
          this.result.problems = []

          return;
        } else {
          this.submitResult();
          return;
        }
      }

      //Reset
      this.initiateWrongRows();
      this.canContinue = false;
      this.wrong = 0;
      this.currentRowDisabled = false;
      this.currentTask++;
      this.taskNow++;

      if (this.currentTask % this.totalRow === 1) {
        this.currentTask = 1
        this.page++;
        this.setConfig(this.configs[this.page-1])
        this.initiateCheckboxValues();
      }
      this.generateProblem();
    },
    generatePayloadForSubmit() {
      const scheduleData = JSON.parse(localStorage.getItem('scheduleData'));
      const payload = {
        'testSessionId': scheduleData.sessionId,
        'userId': scheduleData.userId,
        'moduleId': scheduleData.moduleId,
        'batteryTestConfigId': scheduleData.testId,
        'refreshCount': parseInt(localStorage.getItem('reloadCountAccousticMemory')),
        'result': {
          'total_question': this.numberOfTask,
          'correct_answer': this.result.correct,
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

        removeTestByNameAndUpdateLocalStorage('Acoustic Memory Test');
        localStorage.removeItem('reloadCountAccousticMemory');
        this.$router.push('/module');// Set isLoading to false when the submission is complete
      }
    }
  }
}
</script>

<style scoped>
  .main-view {
    gap: 20px;
    width: 1000px;
    margin: 60px auto;
    padding-top: 4rem;
    text-align: left;
  }

  .checkbox-grid {
    display: flex;
    flex-direction: column;
  }

  .checkbox-row {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 30px;
  }

  .checkbox-item {
    display: flex;
    align-items: center;
    margin: 0 0.5rem;
    font-weight: bold;
    font-size: 20px;
  }

  .checkbox-item label {
    margin-left: 15px;
  }

  .mr-2 {
    margin-right: 1rem;
  }

  .checkbox-wrapper {
    --s-xsmall: 0.625em;
    --s-small: 1.2em;
    --border-width: 1px;
    --c-primary: #5F11E8;
    --c-primary-20-percent-opacity: rgb(95 17 232 / 20%);
    --c-primary-10-percent-opacity: rgb(95 17 232 / 10%);
    --t-base: 0.4s;
    --t-fast: 0.2s;
    --e-in: ease-in;
    --e-out: cubic-bezier(.11, .29, .18, .98);
    --c-disabled-bg: #d3d3d3; /* Light gray background for disabledValues */
    --c-disabled-border: #a9a9a9; /* Dark gray border for disabled checkboxes */
  }

  .checkbox-wrapper .visuallyhidden {
    border: 0;
    clip: rect(0 0 0 0);
    height: 1px;
    margin: -1px;
    overflow: hidden;
    padding: 0;
    position: absolute;
    width: 1px;
  }

  .checkbox-wrapper .checkbox {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  .checkbox-wrapper .checkbox + .checkbox {
    margin-top: var(--s-small);
  }

  .checkbox-wrapper .checkbox__symbol {
    display: inline-block;
    display: flex;
    border: var(--border-width) solid var(--c-primary);
    position: relative;
    border-radius: 0.1em;
    width: 1.5em;
    height: 1.5em;
    transition: box-shadow var(--t-base) var(--e-out), background-color var(--t-base);
    box-shadow: 0 0 0 0 var(--c-primary-10-percent-opacity);
  }

  .checkbox-wrapper .checkbox__symbol:after {
    content: "";
    position: absolute;
    top: 0.5em;
    left: 0.5em;
    width: 0.25em;
    height: 0.25em;
    background-color: var(--c-primary-20-percent-opacity);
    opacity: 0;
    border-radius: 3em;
    transform: scale(1);
    transform-origin: 50% 50%;
  }

  .checkbox-wrapper .checkbox .icon-checkbox {
    width: 1em;
    height: 1em;
    margin: auto;
    fill: none;
    stroke-width: 3;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-miterlimit: 10;
    color: var(--c-primary);
    display: inline-block;
  }

  .checkbox-wrapper .checkbox .icon-checkbox path {
    transition: stroke-dashoffset var(--t-fast) var(--e-in);
    stroke-dasharray: 30px, 31px;
    stroke-dashoffset: 31px;
  }

  .checkbox-wrapper .checkbox__textwrapper {
    margin: 0;
  }

  .checkbox-wrapper .checkbox__trigger:checked + .checkbox__symbol:after {
    -webkit-animation: ripple 1.5s var(--e-out);
    animation: ripple 1.5s var(--e-out);
  }

  .checkbox-wrapper .checkbox__trigger:checked + .checkbox__symbol .icon-checkbox path {
    transition: stroke-dashoffset var(--t-base) var(--e-out);
    stroke-dashoffset: 0px;
  }

  .checkbox-wrapper .checkbox__trigger:focus + .checkbox__symbol {
    box-shadow: 0 0 0 0.25em var(--c-primary-20-percent-opacity);
  }

  .checkbox-wrapper .checkbox__trigger:disabled + .checkbox__symbol {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .checkbox-wrapper .checkbox__trigger.disabled + .checkbox__symbol {
    background-color: var(--c-disabled-bg);
    border-color: var(--c-disabled-border);
  }

  .checkbox-wrapper .checkbox__trigger.wrong-answer + .checkbox__symbol {
    border-color: red; /* Change border color to red for wrong answer */
    transition: border-color var(--t-base) var(--e-out); /* Smooth transition */
    box-shadow: 0 0 0 0.25em rgb(255 0 0 / 20%);
  }

  .checkbox-wrapper .checkbox__trigger.wrong-answer + .checkbox__symbol .icon-checkbox path {
    stroke: red; /* Change checkbox icon color to red for wrong answer */
    transition: stroke var(--t-base) var(--e-out); /* Smooth transition */
  }

  @-webkit-keyframes ripple {
    from {
      transform: scale(0);
      opacity: 1;
    }
    to {
      opacity: 0;
      transform: scale(20);
    }
  }

  @keyframes ripple {
    from {
      transform: scale(0);
      opacity: 1;
    }
    to {
      opacity: 0;
      transform: scale(20);
    }
  }

  .timer-container-trial {
    position: absolute;
    right: 0;
    top: 0;
    background-color: #0349D0;
    padding: 0.75rem;
    color: #ffffff;
    font-weight: bold;
    border-bottom-left-radius: 15px;

    button {
      color: #000000;
      font-weight: bold;
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
      border-radius: 5px;
      border-color: transparent;
      min-width: 100px;
      cursor: pointer;
    }
  }

  .timer-container {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    background-color: #0349D0;
    padding: 1.5rem 5rem;
    color: #ffffff;
    font-weight: bold;
    border-bottom-left-radius: 15px;
    border-bottom-right-radius: 15px;
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
    max-width: 90%;
    max-height: 90%;
    overflow-y: auto;
  }

  .modal-content button {
    background-color: #6200ee;
    color:white;
    border-radius: 10px;
    border: none;
    padding: 10px;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }

  .modal-content button:hover {
    background-color: #5e37a6;
  }

  .wrong-text {
    display: inline-block;
    color: rgb(223, 35, 35);
    font-weight: bold;
    font-size: 16px;
    text-align: left;
    margin-left: 25px;
    margin-top: 20px;
  }

  .btn-continue {
    display: inline-block;
    background-color: #5e37a6;
    padding: 10px 25px;
    color: #ffffff;
    font-weight: bold;
    font-size: 16px;
    text-align: right !important;
    border-radius: 10px;
    border-width: 0;
    margin-left: 670px;
  }

  .ml-4 {
    margin-left: 4rem;
  }

  .ml-1 {
    margin-left: 1rem;
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
</style>
