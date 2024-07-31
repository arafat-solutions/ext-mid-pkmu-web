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
        <Airspeed id="airspeed" class="indicator-bg" :size="200" :airspeed="airspeed" />
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
        <button id="button-plus" class="btn-plus-minus">+</button>
        <div id="airspeed-indicator"></div>
        <button id="button-minus" class="btn-plus-minus">-</button>
      </div>
    </div>
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">Your result is submitting</div>
    </div>
  </div>
</template>

<script>
import {Airspeed} from  'vue-flight-indicators';
import AnalogClock from './instrument-coordination/AnalogClock';
import SoundQuestion from './instrument-coordination/SoundQuestion';
import HeadingInstrument from './instrument-coordination/HeadingInstrument';
import AltimeterInstrument from './instrument-coordination/AltimeterInstrument.vue';

export default {
  components: {
    HeadingInstrument,
    Airspeed,
    AnalogClock,
    SoundQuestion,
    AltimeterInstrument,
  },
  data: function () {
    return {
      isLoading: false,
      minuteTime: null,
      timeLeft: 120, // Countdown time in seconds
      intervalTimerTest: null,
      isPause: false,
      isConfigLoaded: false,
      isTrial: this.$route.query.isTrial ?? false,
      isShowModal: true,
      counter: 0,
      roll: 0,
      pitch: 0,
      vario: 0,
      airspeed: 0,
      canAnswerSoundQuestion: false,
      soundQuestions: [],
      config: {
        heading: {
          changeType: 'adjust_for_irregular_updates', //inactive, keep_indicator, adjust_for_consistent_updates, adjust_for_irregular_updates
          speed: 50, //integer 1-100
        },
        soundQuestion: {
          isActive: false, //true, false
          speed: 'slow', //slow, medium, fast
        },
        altimeter: {
          changeType: 'adjust_for_irregular_updates', //inactive, keep_indicator, adjust_for_consistent_updates, adjust_for_irregular_updates
          speed: 50, //integer 1-100
        }
      },
    }
  },
  mounted: function () {
    setInterval(() => {
      this.roll = 30*Math.sin(this.counter/10);
      this.pitch = 50*Math.sin(this.counter/20);
      this.vario = 2*Math.sin(this.counter/10);
      this.airspeed = 80+80*Math.sin(this.counter/10);
      this.counter++;
    }, 35);
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

#airspeed {
  position: absolute;
  left: 300px;
  top: 200px;
}

#button-plus {
  position: absolute;
  left: 250px;
  top: 200px;
}

#button-minus {
  position: absolute;
  left: 250px;
  top: 350px;
}

#airspeed-indicator {
  position: absolute;
  left: 250px;
  top: 235px;
  width: 33px;
  height: 113px;
  border: 1px solid #9e9e9e;
  background: linear-gradient(to top, blue 50%, transparent 50%);
}

.btn-plus-minus {
  min-width: 35px;
  min-height: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #9e9e9e; /* Grey color */
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 22px;
  font-weight: bold;
  color: white;
}

.btn-plus-minus:hover {
  background-color: #757575; /* Darker grey on hover */
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
