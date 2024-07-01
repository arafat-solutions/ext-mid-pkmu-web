<template>
  <div class="main-view">
    <div v-if="timeLeft > 0" class="timer-container">
      Time: {{ formattedTime }}
      <button v-if="isPause" @click="startAgain" class="ml-6">Start</button>
      <button v-else @click="pause" class="ml-6">Pause</button>
      <button @click="exit" class="ml-1">Exit</button>
    </div>
    <div class="column-45 mt-3" v-show="!isTimesUp && !isPause">
      <HorizonView />
      <ArithmeticTask :isTimesUp="isTimesUp" :difficulty="difficultyArithmetic" :minuteTime="minuteTime" :isPause="isPause" @getResult="arithmeticResult"/>
    </div>
    <div class="column-10 mt-3 text-left" v-show="!isTimesUp && !isPause">
      <AlertLights :speed="speedAlertLight" :isTimesUp="isTimesUp" :frequency="frequencyAlertLight" :isPause="isPause" @getResult="alertLightResult"  />
    </div>
    <div class="column-45 mt-3 text-left" v-show="!isTimesUp && !isPause">
      <GaugesMeter :isTimesUp="isTimesUp" :frequency="frequencyGaugesMeter" @getResult="gaugesMeterResult" />
    </div>
    <div class="column-50" v-show="isTimesUp">
      <h2 class="title-result">Results:</h2>
      <h3 class="title-result">Horizon</h3>
      <div class="column-50 mb-2">
        <span class="label-result">Accuracy:</span>
      </div>
      <div class="column-50 mb-2">
        <span class="value-result">n/a</span>
      </div>
      <h3 class="title-result">Alert Lights</h3>
      <div class="column-50 mb-2">
        <span class="label-result">Correct response:</span>
        <span class="label-result">Response time:</span>
      </div>
      <div class="column-50 mb-2">
        <span class="value-result">{{ alertLightCorrectResponse }}</span>
        <span class="value-result">{{ alertLightResponseTime }}</span>
      </div>
      <h3 class="title-result">Instrument</h3>
      <div class="column-50 mb-2">
        <span class="label-result">Correct response:</span>
        <span class="label-result">Response time:</span>
      </div>
      <div class="column-50 mb-2">
        <span class="value-result">{{ gaugesMeterCorrectResponse }}</span>
        <span class="value-result">{{ gaugesMeterResponseTime }}</span>
      </div>
      <h3 class="title-result">Mental Arithmetics</h3>
      <div class="column-50">
        <span class="label-result">Correct response:</span>
        <span class="label-result">Response time:</span>
      </div>
      <div class="column-50 mb-2">
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
  import HorizonView from './HorizonView';

  export default {
    name: 'MainView',
    components: {
      ArithmeticTask,
      AlertLights,
      GaugesMeter,
      HorizonView,
    },
    data() {
      return {
        minuteTime: 1,
        timeLeft: 0, // Countdown time in seconds
        interval: null,
        isTimesUp: false,
        isPause: false,
        difficultyArithmetic: 'easy',//easy,medium,difficult
        speedAlertLight: 'fast', //very_slow,slow,medium,fast,very_fast
        frequencyAlertLight: 'very_often', //very_rarely,rarely,medium,often,very_often
        frequencyGaugesMeter: 'high', //easy,medium,high
        results: {
          alertLight: {
            correctResponse: null,
            responseTime: null,
          },
          arithmetic: {
            correctResponse: null,
            responseTime: null,
          },
          gaugesMeter: {
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
      },
      gaugesMeterCorrectResponse() {
        if (!this.results.gaugesMeter.correctResponse) {
          return 'n/a';
        }

        return `${this.results.gaugesMeter.correctResponse} %`;
      },
      gaugesMeterResponseTime() {
        if (!this.results.gaugesMeter.responseTime) {
          return 'n/a';
        }

        return `${this.results.gaugesMeter.responseTime} s`;
      },
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
      gaugesMeterResult(result) {
        this.results.gaugesMeter.correctResponse = result.correctResponse;
        this.results.gaugesMeter.responseTime = result.responseTime;
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
    width: 1280px;
    margin: 0 auto;
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

  .column-50 {
    float: left;
    width: 50%;
  }

  .column-45 {
    float: left;
    width: 45%;
  }

  .column-10 {
    float: left;
    width: 10%;
  }

  .timer-container {
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

  .text-left {
    text-align: left;
  }

  .horizon-container {
    margin: 0 auto;
  }
</style>
