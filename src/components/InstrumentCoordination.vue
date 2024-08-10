<template>
  <div>
    <div v-if="isShowModal === true" class="modal-overlay">
      <div class="modal-content">
        <p>
          <strong>
            Apakah Anda Yakin <br>akan memulai test Instrument Coordination?
          </strong>
          </p>
        <button @click="exit" style="margin-right: 20px;">Batal</button>
        <button @click="startTest">Ya</button>
      </div>
    </div>
    <div v-if="timeLeft > 0 && isShowModal === false" :class="isTrial ? 'timer-container-trial' : 'timer-container' ">
      Time: {{ formattedTime }}
      <button v-if="isPause && isTrial" @click="startAgain" class="ml-6">Start</button>
      <button v-if="!isPause && isTrial" @click="pause" class="ml-6">Pause</button>
      <button v-if="isTrial" @click="exit" class="ml-1">Exit</button>
    </div>
    <div id="main-view" v-if="isShowModal === false" v-show="!isTimesUp">
      <div class="indicators">
        <AirspeedInstrument
          :isTimesUp="isTimesUp"
          :isPause="isPause"
          :isActive="config.airspeed.isActive"
          :speed="config.airspeed.speed"
          @getResult="airspeedResult"
        />
        <HeadingInstrument
          :isTimesUp="isTimesUp"
          :isPause="isPause"
          :changeType="config.heading.changeType"
          :speed="config.heading.speed"
          @getResult="headingResult"
        />
        <SoundQuestion
          ref="soundQuestionRef"
          :isTimesUp="isTimesUp"
          :speedSound="config.soundQuestion.speed"
          :isPause="isPause"
          :isActive="config.soundQuestion.isActive"
          @getResult="soundResult"
        />
        <AltimeterInstrument
          :isTimesUp="isTimesUp"
          :isPause="isPause"
          :changeType="config.altimeter.changeType"
          :speed="config.altimeter.speed"
          @getResult="altimeterResult"
        />
        <AnalogClock />
      </div>
    </div>
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">Your result is submitting</div>
    </div>
  </div>
</template>

<script>
import AnalogClock from './instrument-coordination/AnalogClock';
import SoundQuestion from './instrument-coordination/SoundQuestion';
import HeadingInstrument from './instrument-coordination/HeadingInstrument';
import AltimeterInstrument from './instrument-coordination/AltimeterInstrument.vue';
import AirspeedInstrument from './instrument-coordination/AirspeedInstrument.vue';
import { removeTestByNameAndUpdateLocalStorage } from '@/utils/index';

export default {
  components: {
    HeadingInstrument,
    AirspeedInstrument,
    AnalogClock,
    SoundQuestion,
    AltimeterInstrument,
  },
  data() {
    return {
      testName: 'Monitoring & Instrument Koordination',
      isLoading: false,
      minuteTime: null,
      timeLeft: null, // Countdown time in seconds
      intervalTimerTest: null,
      isPause: false,
      isTrial: this.$route.query.isTrial ?? false,
      isShowModal: null,
      canAnswerSoundQuestion: false,
      soundQuestions: [],
      config: {
        heading: {
          changeType: null, //inactive, keep_indicator, adjust_for_consistent_updates, adjust_for_irregular_updates
          speed: null, //integer 1-100
        },
        soundQuestion: {
          isActive: null, //true, false
          speed: null, //slow, medium, fast
        },
        altimeter: {
          changeType: null, //inactive, keep_indicator, adjust_for_consistent_updates, adjust_for_irregular_updates
          speed: null, //integer 1-100
        },
        airspeed: {
          isActive: null, // true or false
          speed: null, //integer 1-100
        }
      },
      result: {
        compass: null,
        altimeter: null,
        airspeed: null,
        gameDuration: null,
        listening: {
          correctAnswer: null,
          incorrectAnswer: null
        }
      }
    }
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
  mounted() {
    this.loadConfig();
  },
  methods: {
    loadConfig() {
      const data = localStorage.getItem('scheduleData');
      if (data) {
        try {
          const scheduleData = JSON.parse(data);
          const config = scheduleData.tests.find((t) => t.name === this.testName).config;
          this.minuteTime = config.duration;
          this.timeLeft = this.minuteTime * 60;
          this.result.gameDuration = this.timeLeft;
          this.config.heading.changeType = config.compass;
          this.config.heading.speed = config.green_dot_speed;
          this.config.soundQuestion.isActive = config.listening_task !== 'disabled';
          this.config.soundQuestion.speed = config.listening_task !== 'disabled' ? config.listening_task : null;
          this.config.altimeter.changeType = config.altimeter;
          this.config.altimeter.speed = config.green_dot_speed;
          this.config.airspeed.isActive = config.airspeed === 'active';
          this.config.airspeed.speed = config.yaw_speed;
          this.isShowModal = true;
        } catch (e) {
          console.error('Error parsing schedule data:', e);
        }
      }

      console.warn('No schedule data found in localStorage.');
    },
    async startTest() {
      this.isShowModal = false;
      await this.$nextTick();
      this.$refs.soundQuestionRef.setupSound();
      this.startAgain();
    },
    pause() {
      clearInterval(this.intervalTimerTest);
      this.isPause = true;
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
    startAgain() {
      this.isPause = false;
      this.startCountdown();
    },
    exit() {
      this.$router.push('module');
    },
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    generatePayloadForSubmit() {
      const scheduleData = JSON.parse(localStorage.getItem('scheduleData'));
      const test = scheduleData.tests.find((t) => t.name === this.testName);
      const payload = {
        'testSessionId': scheduleData.sessionId,
        'userId': scheduleData.userId,
        'moduleId': scheduleData.moduleId,
        'batteryTestConfigId': test.config.id,
        'result': this.result
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
        this.$router.push('/module');// Set isLoading to false when the submission is complete
      }
    },
    airspeedResult(result) {
      this.result.airspeed = result;
    },
    headingResult(result) {
      this.result.compass = result;
    },
    soundResult(result) {
      this.result.listening.correctAnswer = result.correctAnswer;
      this.result.listening.incorrectAnswer = result.incorrectAnswer;
    },
    altimeterResult(result) {
      this.result.altimeter = result;
    },
  }
}
</script>

<style scoped>
body {
  background-color: grey;
  margin: 0; /* Ensure there is no margin around the body */
  padding: 0; /* Ensure there is no padding around the body */
  height: 100vh; /* Make the body take up the full viewport height */
  width: 100vw; /* Make the body take up the full viewport width */
  display: flex; /* To ensure it can contain flex children if needed */
  justify-content: center; /* Optional: Center content horizontally */
  align-items: center; /* Optional: Center content vertically */
}

#main-view {
  position: relative;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 20px;
  width: 1280px;
  margin: 60px auto;
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
