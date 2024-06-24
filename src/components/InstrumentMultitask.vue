<template>
    <div class="main-view">
      <div v-if="timeLeft > 0" class="timer">
        Time Left: {{ formattedTime }}
      </div>
      <div v-else class="timer">
        Time's up!
      </div>
      <div class="column arithmetic-display" v-if="!isTimesUp">
        <ArithmeticTask :timeLeft="timeLeft" :difficulty="difficultyArithmetic" />
      </div>
      <div class="column" v-if="!isTimesUp">
        <WarningLights :selectedDifficulty="selectedDifficulty" />
      </div>
      <div class="column" v-if="isTimesUp">
        Detail Result:
      </div>
    </div>
  </template>

<script>
  import ArithmeticTask from './ArithmeticTask';
  import WarningLights from './WarningLights';

  export default {
    name: 'MainView',
    components: {
      ArithmeticTask,
      WarningLights
    },
    data() {
      return {
        timeLeft: 30, // Countdown time in seconds
        interval: null,
        isTimesUp: false,
        difficultyArithmetic: 'medium',
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
        console.log("Time's up!");
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
