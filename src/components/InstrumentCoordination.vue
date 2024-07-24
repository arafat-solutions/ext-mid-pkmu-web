<template>
  <div>
    <div v-if="isShowModal" class="modal-overlay">
      <div class="modal-content">
        <p>
          <strong>
            Apakah Anda Yakin <br>akan memulai test Instrument Coordination?
          </strong>
          </p>
        <button @click="exit()" style="margin-right: 20px;">Batal</button>
        <button @click="closeModal()">Ya</button>
      </div>
    </div>
    <div v-if="timeLeft > 0 && !isShowModal" :class="isTrial ? 'timer-container-trial' : 'timer-container' ">
      Time: {{ formattedTime }}
      <button v-if="isPause && isTrial" @click="startAgain" class="ml-6">Start</button>
      <button v-if="!isPause && isTrial" @click="pause" class="ml-6">Pause</button>
      <button v-if="isTrial" @click="exit" class="ml-1">Exit</button>
    </div>
    <div id="main-view" v-if="!isShowModal">
      <div class="indicators">
        <Airspeed id="airspeed" class="indicator-bg" :size="200" :airspeed="airspeed" />
        <Heading id="heading" class="indicator-bg" :size="200" :heading="heading"/>
        <button id="btn-green" class="btn-listening-action green-gradient"></button>
        <button id="btn-red" class="btn-listening-action red-gradient"></button>
        <Altimeter id="altimeter" class="indicator-bg" :size="200" :altitude="altitude" :pressure="pressure" />
        <AnalogClock id="clock" />
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
import {Airspeed, Altimeter, Heading} from  'vue-flight-indicators';
import AnalogClock from './instrument-coordination/AnalogClock';

export default {
  components: {
    Heading,
    Airspeed,
    Altimeter,
    AnalogClock,
  },
  data: function () {
    return {
      isLoading: false,
      minuteTime: null,
      timeLeft: 120, // Countdown time in seconds
      intervalTimer: null,
      intervalTimerSoundQuestion: null,
      soundQuestionInterval: 3000, //in ms
      isPause: false,
      isConfigLoaded: false,
      isTrial: this.$route.query.isTrial ?? false,
      isShowModal: true,
      allowSound: false,
      counter: 0,
      roll: 0,
      pitch: 0,
      heading: 0,
      vario: 0,
      airspeed: 0,
      altitude: 0,
      pressure: 0,
      soundQuestions: [],
    }
  },
  mounted: function () {
    setInterval(() => {
      this.roll = 30*Math.sin(this.counter/10);
      this.pitch = 50*Math.sin(this.counter/20);
      this.heading = this.counter;
      this.vario = 2*Math.sin(this.counter/10);
      this.airspeed = 80+80*Math.sin(this.counter/10);
      this.altitude = 10*this.counter;
      this.pressure = 1000+3*Math.sin(this.counter/50);
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
    closeModal() {
      this.isShowModal = false;
      this.startAgain();
    },
    pause() {
      clearInterval(this.intervalTimer);
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
      this.startGeneratingNumber();
    },
    exit() {
      this.$router.push('module');
    },
    startGeneratingNumber() {
      if (this.intervalTimerSoundQuestion) {
        clearInterval(this.intervalTimerSoundQuestion);
      }
      this.intervalTimerSoundQuestion = setInterval(this.generateNumber, this.soundQuestionInterval);
    },
    generateNumber() {
      const randomNumber = Math.floor(Math.random() * 99) + 1;
      this.currentNumber = randomNumber;
      this.soundQuestions.push(randomNumber);
      this.checkConsecutive();
    },
    checkConsecutive() {
      const len = this.soundQuestions.length;
      if (len >= 3) {
        const lastThree = this.soundQuestions.slice(len - 3);
        const allEven = lastThree.every(num => num % 2 === 0);
        const allOdd = lastThree.every(num => num % 2 !== 0);
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

#heading {
  position: absolute;
  left: 540px;
  top: 75px;
}

#altimeter {
  position: absolute;
  left: 780px;
  top: 200px;
}

#clock {
  position: absolute;
  left: 555px;
  top: 350px;
}

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
