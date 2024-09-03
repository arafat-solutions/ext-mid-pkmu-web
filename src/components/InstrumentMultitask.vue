<template>
  <div>
    <div id="fullPageModal" class="modal">
      <div class="modal-content">
        <p>Click the button to play sound:</p>
        <button id="soundButton" class="modal-button" @click="playSound">Play Sound</button>
      </div>
    </div>
    <div class="main-view" v-if="isConfigLoaded">
      <div v-if="timeLeft > 0" :class="isTrial ? 'timer-container-trial' : 'timer-container'">
        Time: {{ formattedTime }}
        <button v-if="isPause && isTrial" @click="startAgain" class="ml-6">Start</button>
        <button v-if="!isPause && isTrial" @click="pause" class="ml-6">Pause</button>
        <button v-if="isTrial" @click="exit" class="ml-1">Exit</button>
      </div>
      <div class="column-45 mt-3" v-show="!isTimesUp && !isPause">
        <HorizonTest :speed="config.horizon.speed" :minuteTime="minuteTime" :isTimesUp="isTimesUp" :isPause="isPause"
          :isActive="config.horizon.isActive" @getResult="horizonResult" />
        <ArithmeticTask ref="arithmeticTaskRef" :isTimesUp="isTimesUp" :difficulty="config.arithmetic.difficulty"
          :minuteTime="minuteTime" :isPause="isPause" :isActive="config.arithmetic.isActive"
          :useSound="config.arithmetic.useSound" :canPressAnswer="config.arithmetic.canPressAnswer"
          :allowSound="allowSound" @getResult="arithmeticResult" @startAgain="startAgain" />
      </div>
      <div class="column-10 mt-3" v-show="!isTimesUp && !isPause">
        <AlertLights :speed="config.alertLight.speed" :isTimesUp="isTimesUp" :frequency="config.alertLight.frequency"
          :isPause="isPause" :isActive="config.alertLight.isActive" @getResult="alertLightResult" />
      </div>
      <div class="column-45 mt-3 text-left" v-show="!isTimesUp && !isPause">
        <GaugesMeter :isTimesUp="isTimesUp" :isPause="isPause" :frequency="config.gaugesMeter.frequency"
          :isActive="config.gaugesMeter.isActive" @getResult="gaugesMeterResult" :size="50" />
      </div>
    </div>
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">Your result is submitting</div>
    </div>
  </div>
</template>

<script>
import ArithmeticTask from './instrument-multitask/ArithmeticTask';
import AlertLights from './instrument-multitask/AlertLights';
import GaugesMeter from './instrument-multitask/GaugesMeter';
import HorizonTest from './instrument-multitask/HorizonTest';
import { removeTestByNameAndUpdateLocalStorage } from '@/utils/index';

export default {
  components: {
    ArithmeticTask,
    AlertLights,
    GaugesMeter,
    HorizonTest,
  },
  data() {
    return {
      testName: 'Multitasking With Instrument',
      isLoading: false,
      minuteTime: null,
      timeLeft: null, // Countdown time in seconds
      interval: null,
      isPause: false,
      isConfigLoaded: false,
      isTrial: this.$route.query.isTrial ?? false,
      allowSound: false,
      config: {
        alertLight: {
          speed: null, //very_slow,slow,medium,fast,very_fast
          frequency: null, //very_rarely,rarely,medium,often,very_often
          isActive: null, //true,false
        },
        arithmetic: {
          useSound: null, //true,false
          difficulty: null, //easy,medium,difficult
          isActive: null, //true,false
          canPressAnswer: false, //true,false
        },
        gaugesMeter: {
          frequency: null, //low,medium,high
          isActive: null, //true,false
        },
        horizon: {
          speed: null, //very_slow,slow,medium,fast,very_fast
          isActive: null, //true,false
        },
      },
      result: {
        alertLight: {
          correctResponse: null,
          responseTime: null,
          wrong: null,
          correct: null,
          alertCount: null,
          warningCount: null,
        },
        arithmetic: {
          correctResponse: null,
          responseTime: null,
          correctAnswer: null,
          totalQuestion: null,
        },
        gaugesMeter: {
          correctResponse: null,
          responseTime: null,
          correct: null,
          occurance: null,
        },
        horizon: {
          accuracy: null,
          correctTime: null,
        }
      }
    };
  },
  computed: {
    isTimesUp() {
      return this.timeLeft < 1;
    },
    formattedTime() {
      const minutes = Math.floor(this.timeLeft / 60);
      const seconds = this.timeLeft % 60;
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    },
  },
  methods: {
    loadConfig() {
      const data = localStorage.getItem('scheduleData');
      if (data) {
        try {
          const scheduleData = JSON.parse(data);
          const instrumentMultitaskConfig = scheduleData.tests.find((t) => t.name === this.testName).config;
          this.minuteTime = instrumentMultitaskConfig.duration;
          this.timeLeft = this.minuteTime * 60;
          this.config.arithmetic.difficulty = instrumentMultitaskConfig.arithmetics.difficulty;
          this.config.arithmetic.useSound = instrumentMultitaskConfig.arithmetics.sound;
          this.config.arithmetic.isActive = instrumentMultitaskConfig.subtask.arithmetics;
          // Trigger pause after user click button
          if (this.config.arithmetic.useSound && this.config.arithmetic.isActive) {
            this.pause();
            document.getElementById('fullPageModal').style.display = 'flex';
          }
          this.config.alertLight.speed = instrumentMultitaskConfig.alert_lights.speed;
          this.config.alertLight.frequency = instrumentMultitaskConfig.alert_lights.frequency;
          this.config.alertLight.isActive = instrumentMultitaskConfig.subtask.alert_lights;
          this.config.gaugesMeter.frequency = instrumentMultitaskConfig.instrument.frequency;
          this.config.gaugesMeter.isActive = instrumentMultitaskConfig.subtask.instrument;
          this.config.horizon.speed = instrumentMultitaskConfig.horizon.speed;
          this.config.horizon.isActive = instrumentMultitaskConfig.subtask.horizon;
          this.isConfigLoaded = true;
          this.startCountdown();
        } catch (e) {
          console.error('Error parsing schedule data:', e);
        }
      }

      console.warn('No schedule data found in localStorage.');
    },
    startCountdown() {
      if (this.isPause) {
        return;
      }

      this.interval = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft -= 1;
        } else {
          this.submitResult();
          clearInterval(this.interval);
        }
      }, 1000);
    },
    arithmeticResult(result) {
      this.result.arithmetic = result;
    },
    alertLightResult(result) {
      this.result.alertLight = result;
    },
    gaugesMeterResult(result) {
      this.result.gaugesMeter = result;
    },
    horizonResult(result) {
      this.result.horizon = result;
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
    playSound() {
      this.allowSound = true;
      document.getElementById('fullPageModal').style.display = 'none';
      this.$refs.arithmeticTaskRef.generateProblem();
      this.startAgain();
    },
    generatePayloadForSubmit() {
      const scheduleData = JSON.parse(localStorage.getItem('scheduleData'));
      const test = scheduleData.tests.find((t) => t.name === this.testName);
      const payload = {
        'testSessionId': scheduleData.sessionId,
        'userId': scheduleData.userId,
        'moduleId': scheduleData.moduleId,
        'batteryTestConfigId': test.config.id,
        'result': {
          'arithmetics': {
            'total_questions': this.result.arithmetic.totalQuestion,
            'correct_answer': this.result.arithmetic.correctAnswer,
          },
          'horizon': {
            'correct_time': this.result.horizon.correctTime, // in seconds
          },
          'alert_lights': {
            'wrong_response': this.result.alertLight.wrong,
            'correct_response': this.result.alertLight.correct,
            'total_alert_count': this.result.alertLight.alertCount,
            'total_warning_count': this.result.alertLight.warningCount,
            'avg_response_time': this.result.alertLight.responseTime
          },
          'instrument': {
            'correct_response': this.result.gaugesMeter.correct,
            'total_occurence': this.result.gaugesMeter.occurance,
            'response_time': this.result.gaugesMeter.responseTime // in seconds
          }
        }
      }

      return payload;
    },
    async submitResult() {
      try {
        if (this.isTrial) {
          this.$router.push('/module');
          return;
        }

        this.isLoading = true;
        const API_URL = process.env.VUE_APP_API_URL;
        const payload = this.generatePayloadForSubmit();
        const response = await fetch(`${API_URL}api/submission`, {
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

        removeTestByNameAndUpdateLocalStorage(this.testName)
        this.$router.push('/module');
      }
    }
  },
  mounted() {
    this.loadConfig();
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
  margin: 60px auto;
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
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
}

.column-10 {
  float: left;
  width: 10%;
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

.title-result,
.label-result {
  text-align: left;
}

.value-result {
  text-align: right;
}

.label-result,
.value-result {
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

/* Full-page modal styles */
.modal {
  display: none;
  /* Hidden by default */
  position: fixed;
  /* Stay in place */
  z-index: 1;
  /* Sit on top */
  left: 0;
  top: 0;
  width: 100%;
  /* Full width */
  height: 100%;
  /* Full height */
  overflow: auto;
  /* Enable scroll if needed */
  background-color: rgba(0, 0, 0, 0.8);
  /* Black with opacity */
  justify-content: center;
  /* Center horizontally */
  align-items: center;
  /* Center vertically */
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}

.modal-button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
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
