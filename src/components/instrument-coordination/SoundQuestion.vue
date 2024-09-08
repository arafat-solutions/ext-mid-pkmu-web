<template>
  <div>
    <button id="btn-green" class="btn-listening-action green-gradient"></button>
    <button id="btn-red" class="btn-listening-action red-gradient"></button>
  </div>
</template>
<script>
export default {
  props: {
    speedSound: String,
    isTimesUp: Boolean,
    isPause: Boolean,
    isActive: Boolean,
  },
  data: function () {
    return {
      intervalTimerSoundQuestion: null,
      utterance: null,
      soundQuestionInterval: 3000, //in ms
      canAnswerSoundQuestion: false,
      soundQuestionChecks: [],
      result: {
        questions: [],
        needAnswers: [],
        clickedAnswers: [],
        wrong: 0,
        missed: 0,
        correct: 0,
      }
    }
  },
  created() {
    window.addEventListener('keyup', this.handleKeyPress);
  },
  beforeUnmount() {
    window.speechSynthesis.cancel();
    window.removeEventListener('keyup', this.handleKeyPress);
  },
  beforeRouteLeave(to, from, next) {
    window.speechSynthesis.cancel();
    next();
  },
  watch: {
    isPause(newValue) {
      if (newValue) {
        clearInterval(this.intervalTimerSoundQuestion);
        window.speechSynthesis.pause();
      } else {
        window.speechSynthesis.resume();
        this.startGeneratingNumber();
      }
    },
    isTimesUp(newValue) {
      if (newValue) {
        clearInterval(this.intervalTimerSoundQuestion);
        window.speechSynthesis.cancel();
        this.$emit('getResult', {
          correctAnswer: this.result.correct,
          incorrectAnswer: this.result.wrong,
        });
      }
    },
  },
  methods: {
    handleKeyPress(event) {
      if (this.isPause || this.isTimesUp || !this.isActive || !this.canAnswerSoundQuestion) {
        return;
      }

      if (event.key === 'Alt') {
        this.checkAnswer('odd', event.key);
      } else if (event.key.toLowerCase() === 'x') {
        this.checkAnswer('odd', event.key);
      } else if (event.key.toLowerCase() === 'c') {
        this.checkAnswer('even', event.key);
      }
    },
    async checkAnswer(numberType, key) {
      this.canAnswerSoundQuestion = false;
      this.result.clickedAnswers.push(key);
      const trueAnswer = this.result.needAnswers[this.result.needAnswers.length - 1];
      let button = null;
      if (numberType === 'odd') {
        button = document.getElementById('btn-red');

      } else if (numberType === 'even') {
        button = document.getElementById('btn-green');
      }

      if (button) {
        button.classList.add('active');
        await this.delay(500);
        button.classList.remove('active');
      }

      if (this.soundQuestionChecks.length > 0) {
        this.result.wrong++;
      } else if (numberType === 'odd' && trueAnswer === 'odd') {
        this.result.correct++
      } else if (numberType === 'even' && trueAnswer === 'even') {
        this.result.correct++
      } else {
        this.result.wrong++;
      }
    },
    startGeneratingNumber() {
      if (!this.isActive) {
        return;
      }

      if (this.intervalTimerSoundQuestion) {
        clearInterval(this.intervalTimerSoundQuestion);
      }
      this.intervalTimerSoundQuestion = setInterval(this.generateNumber, this.soundQuestionInterval);
    },
    generateNumber() {
      //Check missed
      if (this.result.clickedAnswers.length < this.result.needAnswers.length) {
        this.result.clickedAnswers.push(null);
        this.result.missed++;
      }

      this.canAnswerSoundQuestion = false;
      const randomNumber = Math.floor(Math.random() * 99) + 1;
      this.utterance.text = randomNumber.toString();
      window.speechSynthesis.speak(this.utterance);
      this.canAnswerSoundQuestion = true;
      this.soundQuestionChecks.push(randomNumber);
      this.result.questions.push(randomNumber);
      this.checkConsecutive();
    },
    checkConsecutive() {
      const len = this.soundQuestionChecks.length;
      if (len >= 3) {
        const lastThree = this.soundQuestionChecks.slice(len - 3);
        const allEven = lastThree.every(num => num % 2 === 0);
        const allOdd = lastThree.every(num => num % 2 !== 0);
        if (allEven) {
          this.result.needAnswers.push('even');
        } else if (allOdd) {
          this.result.needAnswers.push('odd');
        }

        if (allEven || allOdd) {
          this.soundQuestionChecks = [];
        }
      }
    },
    setupSound() {
      if (!('speechSynthesis' in window)) {
        console.error('Sorry, your browser does not support text-to-speech.');
        return;
      }

      this.utterance = new SpeechSynthesisUtterance();
      this.utterance.lang = 'en-US';
      this.utterance.rate = this.getRateSpeedSound();
      this.utterance.pitch = 1.2;
      this.utterance.volume = 1;

      this.startGeneratingNumber();
    },
    getRateSpeedSound() {
      if (this.speedSound === 'slow') {
        return 0.35;
      } else if (this.speedSound === 'medium') {
        return 0.70;
      }

      return 1;
    },
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
  }
}
</script>
<style scoped>
  #btn-green {
    position: absolute;
    left: 415px;
    top: 425px;
  }

  #btn-red {
    position: absolute;
    left: 325px;
    top: 425px;
  }

  .btn-listening-action {
    width: 60px;
    height: 60px;
    border: none;
    cursor: pointer;
    border-radius: 50%;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3), 0 6px 20px rgba(0, 0, 0, 0.2);
    transition: transform 0.1s;
  }

  .btn-listening-action:active, .btn-listening-action.active {
    transform: translateY(4px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), 0 3px 10px rgba(0, 0, 0, 0.2);
  }

  .green-gradient {
    background: linear-gradient(to right, #00c851, #007e33);
  }

  .red-gradient {
    background: linear-gradient(to right, #ff4444, #cc0000);
  }
</style>
