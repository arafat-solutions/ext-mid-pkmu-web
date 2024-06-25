<template>
    <div class="main-view">
      <div v-if="timeLeft > 0" class="timer">
        Time Left: {{ formattedTime }}
      </div>
      <div v-else class="timer">
        Time's up!
      </div>
      <div class="column arithmetic-display" v-show="!isTimesUp">
        <ArithmeticTask :timeLeft="timeLeft" :difficulty="difficultyArithmetic" />
      </div>
      <div class="column" v-show="!isTimesUp">
        <AlertLights :speed="speedAlertLight" :isTimesUp="isTimesUp" :frequency="frequencyAlertLight"  />
      </div>
      <div class="column" v-show="isTimesUp">
        Detail Result:
      </div>
    </div>
  </template>

<script>
  import ArithmeticTask from './ArithmeticTask';
  import AlertLights from './AlertLights';

  export default {
    name: 'MainView',
    components: {
      ArithmeticTask,
      AlertLights
    },
    data() {
      return {
        timeLeft: 30, // Countdown time in seconds
        interval: null,
        isTimesUp: false,
        difficultyArithmetic: 'easy',//easy,medium,difficult
        speedAlertLight: 'fast', //very_slow,slow,medium,fast,very_fast
        frequencyAlertLight: 'very_often', //very_rarely,rarely,medium,often,very_often
      };
    },
    computed: {
      formattedTime() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
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
      }
    },
    mounted() {
      this.startCountdown();
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

  .column {
    float: left;
    width: 50%;
    margin-top: 3rem;
  }

  .arithmetic-display {
    margin-top: 40%;
  }

  .timer {
    position: absolute;
    right: 0;
    margin-right: 5rem;
  }
</style>
