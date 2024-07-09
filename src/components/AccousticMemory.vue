<template>
  <div v-if="isShowModal" class="modal-overlay">
    <div class="modal-content">
      <p>
        <strong>
          Apakah Anda Yakin <br>akan memulai test Accoustic Memory?
        </strong>
        </p>
      <button @click="exit()" style="margin-right: 20px;">Batal</button>
      <button @click="closeModal()">Ya</button>
    </div>
  </div>
  <div class="main-view" v-if="isConfigLoaded">
    <div :class="isTrial ? 'timer-container-trial' : 'timer-container' ">
      Task: {{ currentTask }} / {{ numberOfTask }}
      <button v-if="isPause && isTrial" @click="startAgain" class="ml-6">Start</button>
      <button v-if="!isPause && isTrial" @click="pause" class="ml-6">Pause</button>
      <button v-if="isTrial" @click="exit" class="ml-1">Exit</button>
    </div>
    <div class="checkbox-grid">
      <div v-for="(row, rowIndex) in totalRow" :key="rowIndex" class="checkbox-row">
        <div v-for="(col, colIndex) in totalColumn" :key="colIndex" class="checkbox-item">
          <label :for="`checkbox-${rowIndex}-${colIndex}`" v-if="(col % this.stringSizeLength) === 1" class="mr-2">{{ String.fromCharCode(96 + Math.ceil(col / this.stringSizeLength)) }})</label>
          <div class="checkbox-wrapper">
            <label class="checkbox">
              <input
                class="checkbox__trigger visuallyhidden"
                type="checkbox"
                :id="`checkbox-${rowIndex}-${colIndex}`"
                :disabled="row !== (currentTask % numberOfTask)"
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
  </div>
</template>

<script>
export default {
  data() {
    return {
      isShowModal: false,
      page: 1,
      currentTask: 1,
      numberOfTask: 3, //positive number
      totalRow: 10,
      stringSize: 'ABC-DE-FG', //AB-CD-E, AB-CD-EF, ABC-DE-FG, ABC-DEF-GH, ABC-DEF-GHJ
      includeDigits: true, //true or false
      excludeVowels: true, //true or false
      readingSpeed: 'medium', // easy,medium,difficult
      isPause: false,
      isConfigLoaded: false,
      isTrial: this.$route.query.isTrial ?? false,
      isLoading: false,
      problem: null,
      choicesLength: 4,
      dashInterval: 2000, //in ms
      choicesInterval: 3000, //in ms
      charInterval: 1000, //in ms
      checkboxValues: []
    }
  },
  computed: {
    stringSizeLength() {
      return this.stringSize.split('-').length;
    },
    totalColumn() {
      return this.choicesLength * this.stringSizeLength;
    },
  },
  mounted() {
    this.initiateCheckboxValues();
  },
  methods: {
    initiateCheckboxValues() {
      this.checkboxValues = Array.from({ length: this.totalRow }, () => Array(this.totalColumn).fill(false));
      this.isConfigLoaded = true;
      this.isShowModal = true;
    },
    currentRow(row) {
      return this.page * row;
    },
    async generateProblem() {
      const randomString = this.generateRandomString(this.stringSize, this.includeDigits, this.excludeVowels);
      const choices = this.generateChoices(randomString, this.stringSize, this.includeDigits, this.excludeVowels);
      const answers = this.getCurrentAnswer(randomString, choices);

      this.problem = {randomString, choices, answers};

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
    getCurrentAnswer(mainString, choices) {
      const mainSegments = mainString.split('-');
      const answers = [];

      choices.forEach(choice => {
        const choiceSegments = choice.split('-');
        const matchIndices = [];

        for (let i = 0; i < mainSegments.length; i++) {
            if (mainSegments[i] === choiceSegments[i]) {
                matchIndices.push(i);
            }
        }

        answers.push(matchIndices);
      });

      return answers;
    },
    async readQuestion() {
      const synth = window.speechSynthesis;
      const utterance = this.setupSound();
      utterance.text = 'The reference letter';
      // Wrap speechSynthesis.speak in a promise
      await new Promise((resolve, reject) => {
        utterance.onend = resolve;
        utterance.onerror = reject;
        synth.speak(utterance);
      });
      await this.spellOutString(this.problem.randomString);
      utterance.text = 'is introduces. The query letter strings read out are:';
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
    },
    setupSound() {
      if (!('speechSynthesis' in window)) {
        console.error('Sorry, your browser does not support text-to-speech.');
        return;
      }

      const utterance = new SpeechSynthesisUtterance();
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.2;
      utterance.volume = 1;

      return utterance;
    },
    spellOutString(text) {
      console.log(text);
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
          }
        }
      })();
    },
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    pause() {
      clearInterval(this.interval);
      this.isPause = true;
    },
    startAgain() {
      this.isPause = false;
      this.startCountdown();
    },
    exit() {
      this.$router.push('module');
    },
    closeModal() {
      this.isShowModal = false;
      this.generateProblem();
    },
  }
}
</script>
<style scoped>
  .main-view {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 20px;
    width: 1280px;
    margin: 60px auto;
    padding-top: 4rem;
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
    background-color: var(--c-disabled-bg);
    border-color: var(--c-disabled-border);
    cursor: not-allowed;
    opacity: 0.6;
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
    padding: 20px;
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
</style>
