<template>
  <div class="main-view">
  </div>
</template>

<script>
export default {
  data() {
    return {
      numberOfTask: 3, //positive number
      stringSize: 'ABC-DE-FG', //AB-CD-E, AB-CD-EF, ABC-DE-FG, ABC-DEF-GH, ABC-DEF-GHJ
      includeDigits: true, //true or false
      excludeVowels: true, //true or false
      readingSpeed: 'medium', // easy,medium,difficult
      isPause: false,
      isConfigLoaded: false,
      isTrial: this.$route.query.isTrial ?? false,
      isLoading: false,
      problem: null,
      dashInterval: 1000, //in ms
      choicesInterval: 3000, //in ms
    }
  },
  methods: {
    generateProblem() {
      const randomString = generateRandomString(this.stringSize, true, true);
      const choices = generateChoices(randomString, this.stringSize, true, true);
      const answers = getCurrentAnswer(randomString, choices);

      this.problem = {question, choices, answers};

      // Read the question
      this.readQuestion();

      // Read the choices
      this.readChoices();
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
      const segments = getSegments(format);
      const numChoices = 4;
      const choices = [];
      const mainSegments = mainString.split('-');

      while (choices.length < numChoices) {
          let choice = '';
          let segmentsToMatch = new Set();

          for (let i = 0; i < segments.length; i++) {
              if (Math.random() < 0.5) {
                  choice += mainSegments[i];
                  segmentsToMatch.add(i);
              } else {
                  choice += generateRandomString(segments[i], includeDigits, excludeVowels);
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
    readQuestion() {
      const synth = window.speechSynthesis;
      const utterance = this.setupSound();
      utterance.text = 'The reference letter';
      synth.speak(utterance);
      this.spellOutString(this.problem.randomString);
      utterance.text = 'is introduces. The query letter strings read out are:';
      synth.speak(utterance);
    },
    async readChoices() {
      for (const choice of this.problem.choices) {
        await this.spellOutString(choice);
        await delay(this.choicesInterval);
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

      (async () => {
          for (let char of text) {
              if (char === '-') {
                  await delay(this.dashInterval);
              } else {
                  await spellOut(char, 500); // Default interval between letters
              }
          }
      })();
    },
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
  }
}
</script>
