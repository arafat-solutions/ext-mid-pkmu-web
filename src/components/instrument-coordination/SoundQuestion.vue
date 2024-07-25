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
      soundQuestions: [],
      result: {
        soundQuestion: {
          questions: [],
          needAnswers: [],
          wrongAnswers: 0,
        },
      }
    }
  },
  created() {
    window.addEventListener('keyup', this.handleKeyPress);
  },
  beforeUnmount() {
    window.removeEventListener('keyup', this.handleKeyPress);
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
  },
  methods: {
    startGeneratingNumber() {
      if (this.intervalTimerSoundQuestion) {
        clearInterval(this.intervalTimerSoundQuestion);
      }
      this.intervalTimerSoundQuestion = setInterval(this.generateNumber, this.soundQuestionInterval);
    },
    generateNumber() {
      this.canAnswerSoundQuestion = false;
      const randomNumber = Math.floor(Math.random() * 99) + 1;
      console.log(randomNumber);
      this.utterance.text = randomNumber.toString();
      window.speechSynthesis.speak(this.utterance);
      this.canAnswerSoundQuestion = true;
      this.soundQuestions.push(randomNumber);
      this.result.soundQuestion.questions.push(randomNumber);
      this.checkConsecutive();
    },
    checkConsecutive() {
      const len = this.soundQuestions.length;
      if (len >= 3) {
        const lastThree = this.soundQuestions.slice(len - 3);
        const allEven = lastThree.every(num => num % 2 === 0);
        const allOdd = lastThree.every(num => num % 2 !== 0);
        if (allEven) {
          this.result.soundQuestion.needAnswers.push('even');
        } else if (allOdd) {
          this.result.soundQuestion.needAnswers.push('odd');
        }

        if (allEven || allOdd) {
          this.checkSoundQuestion();
        }
      }
    },
    checkSoundQuestion() {
      alert('Three consecutive odd or even numbers detected!');
      // Reset the numbers list or take any other action as needed
      this.soundQuestions = [];
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
    },
    getRateSpeedSound() {
      if (this.speedSound === 'slow') {
        return 0.35;
      } else if (this.speedSound === 'medium') {
        return 0.70;
      }

      return 1;
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

  .btn-listening-action:active {
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
