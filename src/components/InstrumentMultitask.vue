<template>
    <div class="main-view">
      <div v-if="timeLeft > 0" class="timer-container">
        Time: {{ formattedTime }}
        <button v-if="isPause" @click="startAgain" class="ml-6">Start</button>
        <button v-else @click="pause" class="ml-6">Pause</button>
        <button @click="exit" class="ml-1">Exit</button>
      </div>
      <div class="column arithmetic-display mt-3" v-show="!isTimesUp && !isPause">
        <ArithmeticTask :isTimesUp="isTimesUp" :difficulty="difficultyArithmetic" :minuteTime="minuteTime" :isPause="isPause" @getResult="arithmeticResult"/>
      </div>
      <div class="column mt-3" v-show="!isTimesUp && !isPause">
        <AlertLights :speed="speedAlertLight" :isTimesUp="isTimesUp" :frequency="frequencyAlertLight" :isPause="isPause" @getResult="alertLightResult"  />
        <GaugesMeter />
      </div>
      <div class="column" v-show="isTimesUp">
        <h2 class="title-result">Results:</h2>
        <h3 class="title-result">Alert Lights</h3>
        <div class="column mb-2">
          <span class="label-result">Correct response:</span>
          <span class="label-result">Response time:</span>
        </div>
        <div class="column mb-2">
          <span class="value-result">{{ alertLightCorrectResponse }}</span>
          <span class="value-result">{{ alertLightResponseTime }}</span>
        </div>
        <h3 class="title-result">Mental Arithmetics</h3>
        <div class="column">
          <span class="label-result">Correct response:</span>
          <span class="label-result">Response time:</span>
        </div>
        <div class="column value-result">
          <span class="value-result">{{ arithmeticCorrectResponse }}</span>
          <span class="value-result">{{ arithmeticResponseTime }}</span>
        </div>
      </div>
    </div>
  </template>

<script>
  import ArithmeticTask from './ArithmeticTask';
  import AlertLights from './AlertLights';
  import GaugesMeter from './GaugesMeter';

  export default {
    name: 'MainView',
    components: {
      ArithmeticTask,
      AlertLights,
      GaugesMeter
    },
    data() {
      return {
        minuteTime: 10,
        timeLeft: 0, // Countdown time in seconds
        interval: null,
        isTimesUp: false,
        isPause: false,
        difficultyArithmetic: 'easy',//easy,medium,difficult
        speedAlertLight: 'fast', //very_slow,slow,medium,fast,very_fast
        frequencyAlertLight: 'very_often', //very_rarely,rarely,medium,often,very_often
        results: {
          alertLight: {
            correctResponse: null,
            responseTime: null,
          },
          arithmetic: {
            correctResponse: null,
            responseTime: null,
          },
        }
      };
    },
    computed: {
      formattedTime() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      },
      arithmeticCorrectResponse() {
        if (!this.results.arithmetic.correctResponse) {
          return 'n/a';
        }

        return `${this.results.arithmetic.correctResponse}`;
      },
      arithmeticResponseTime() {
        if (!this.results.arithmetic.responseTime) {
          return 'n/a';
        }

        return `${this.results.arithmetic.responseTime} s`;
      },
      alertLightCorrectResponse() {
        if (!this.results.alertLight.correctResponse) {
          return 'n/a';
        }

        return `${this.results.alertLight.correctResponse} %`;
      },
      alertLightResponseTime() {
        if (this.results.alertLight.responseTime === 'NaN' || !this.results.alertLight.responseTime) {
          return 'n/a';
        }

        return `${this.results.alertLight.responseTime} s`;
      }
    },
    methods: {
      startCountdown() {
        this.interval = setInterval(() => {
          if (this.timeLeft > 0) {
            this.timeLeft -= 1;
          } else {
            clearInterval(this.interval);
            this.timeUp();
          }
        }, 1000);
      },
      timeUp() {
        this.isTimesUp = true;
      },
      arithmeticResult(result) {
        this.results.arithmetic.correctResponse = result.correctResponse;
        this.results.arithmetic.responseTime = result.responseTime;
      },
      alertLightResult(result) {
        this.results.alertLight.correctResponse = result.correctResponse;
        this.results.alertLight.responseTime = result.responseTime;
      },
      pause() {
        clearInterval(this.interval);
        this.isPause = true;
      },
      startAgain() {
        this.startCountdown();
        this.isPause = false;
      },
      exit() {
        this.$router.push('module');
      }
    },
    mounted() {
      this.startCountdown();
    },
    created() {
      this.timeLeft = this.minuteTime * 60; // Initialize timeLeft correctly
    },
    beforeUnmount() {
      clearInterval(this.interval);
    }
  };
</script>

<style scoped>
  .main-view {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 20px;
  }

  .mb-2 {
    margin-bottom: 2rem;
  }

  .mt-3 {
    margin-top: 3rem;
  }

  .ml-6 {
    margin-left: 6rem;
  }

  .ml-1 {
    margin-left: 1rem;
  }

  .column {
    float: left;
    width: 50%;
  }

  .arithmetic-display {
    margin-top: 30%;
  }

  .timer-container {
    position: absolute;
    right: 0;
    top: 0;
    background-color: #0349D0;
    padding: 1rem;
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

  .title-result, .label-result {
    text-align: left;
  }

  .value-result {
    text-align: right;
  }

  .label-result, .value-result {
    display: block;
  }

  h3 {
    margin-block-end: 0.5rem;
  }
</style>
