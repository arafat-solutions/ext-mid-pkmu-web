<template>
  <div>
    <div v-if="isShowModal" class="modal-overlay">
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
    <div v-if="timeLeft > 0 && !isShowModal" :class="isTrial ? 'timer-container-trial' : 'timer-container' ">
      Time: {{ formattedTime }}
      <button v-if="isPause && isTrial" @click="startAgain" class="ml-6">Start</button>
      <button v-if="!isPause && isTrial" @click="pause" class="ml-6">Pause</button>
      <button v-if="isTrial" @click="exit" class="ml-1">Exit</button>
    </div>
    <div id="main-view" v-if="!isShowModal" v-show="!isTimesUp">
      <div class="indicators">
        <AirspeedInstrument
          :isTimesUp="isTimesUp"
          :isPause="isPause"
          :isActive="config.airspeed.isActive"
          :speed="config.airspeed.speed"
        />
        <HeadingInstrument
          :isTimesUp="isTimesUp"
          :isPause="isPause"
          :changeType="config.heading.changeType"
          :speed="config.heading.speed"
        />
        <SoundQuestion
          ref="soundQuestionRef"
          :isTimesUp="isTimesUp"
          :speedSound="config.soundQuestion.speed"
          :isPause="isPause"
          :isActive="config.soundQuestion.isActive"
        />
        <AltimeterInstrument
          :isTimesUp="isTimesUp"
          :isPause="isPause"
          :changeType="config.heading.changeType"
          :speed="config.heading.speed"
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

export default {
  components: {
    HeadingInstrument,
    AirspeedInstrument,
    AnalogClock,
    SoundQuestion,
    AltimeterInstrument,
  },
  data: function () {
    return {
      isLoading: false,
      minuteTime: null,
      timeLeft: 30, // Countdown time in seconds
      intervalTimerTest: null,
      isPause: false,
      isConfigLoaded: false,
      isTrial: this.$route.query.isTrial ?? false,
      isShowModal: true,
      canAnswerSoundQuestion: false,
      soundQuestions: [],
      config: {
        heading: {
          changeType: 'adjust_for_consistent_updates', //inactive, keep_indicator, adjust_for_consistent_updates, adjust_for_consistent_updates
          speed: 50, //integer 1-100
        },
        soundQuestion: {
          isActive: true, //true, false
          speed: 'fast', //slow, medium, fast
        },
        altimeter: {
          changeType: 'adjust_for_irregular_updates', //inactive, keep_indicator, adjust_for_consistent_updates, adjust_for_irregular_updates
          speed: 50, //integer 1-100
        },
        airspeed: {
          isActive: true, // true or false
          speed: 100, //integer 1-100
        }
      },
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
  methods: {
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
</style>
