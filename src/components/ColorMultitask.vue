<template>
    <div v-if="isShowModal" class="modal-overlay">
      <div class="modal-content">
        <p>
          <strong>
            Apakah Anda Yakin <br>akan memulai test Multitasking with Color?
          </strong>
          </p>
        <button @click="exit()" style="margin-right: 20px;">Batal</button>
        <button @click="closeModal()">Ya</button>
      </div>
    </div>

  <div class="main-view" v-if="isConfigLoaded">
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <div class="text">submitting a result</div>
    </div>

    <div :class="isTrial ? 'timer-container-trial' : 'timer-container' ">
      Time: {{ formattedTime }}
      <button v-if="isPause && isTrial" @click="startAgain" class="ml-6" style="margin-right: 5px;">Start</button>
      <button v-if="!isPause && isTrial" @click="pause" class="ml-6" style="margin-right: 5px;">Pause</button>
      <button v-if="isTrial" @click="exit" class="ml-1">Exit</button>
    </div>

    <div class="horizon-tank">
      <ColorTank
        :isTimesUp="isTimesUp"
        :speed="config.color_tank.speed"
        :coloredLowerTank="config.color_tank.colored_lower_tank"
        :isNegativeScore="config.color_tank.negative_score"
        :isPause="isPause"
        :isActive="config.subtask.color_tank"
        @getResult="colorTankResult"
      />

      <div class="horizon-section">
        <Horizon
          :isTimesUp="isTimesUp"
          :speed="config.horizon.speed"
          :isPause="isPause"
          :isActive="config.subtask.horizon"
          @getResult="horizonResult"
        />

        <Arithmetics
          ref="arithmeticsRef"
          :isTimesUp="isTimesUp"
          :difficulty="config.arithmetics.difficulty"
          :duration="config.duration"
          :isPause="isPause"
          :isActive="config.subtask.arithmetics"
          :useSound="config.arithmetics.sound"
          @getResult="arithmeticResult"
        />
      </div>
    </div>

  </div>
</template>

<script>
import Arithmetics from './color-multitask/Arithmetics';
import ColorTank from './color-multitask/ColorTank';
import Horizon from './color-multitask/Horizon';
import { removeTestByNameAndUpdateLocalStorage } from '@/utils/index'

export default {
  name: 'MainView',
  components: {
    Arithmetics,
    ColorTank,
    Horizon,
  },
  data() {
    return {
      isShowModal: false,
      isLoading: false,
      timer: {
        minutes: 0,
        second: 0
      },
      countdownInterval: null,
      isPause: false,
      isConfigLoaded: false,
      isTrial: this.$route.query.isTrial ?? false,
      config: {
        duration : null,
        subtask: {
          arithmetics: null,
          color_tank: null,
          horizon: null,
        },
        arithmetics: {
          difficulty: null, //easy, medium, difficult
          sound: null
        },
        horizon: {
          speed: null, //very_slow, slow, medium, fast, very_fast
        },
        color_tank: {
          negative_score: null,
          colored_lower_tank: null,
          speed: null, //slow, medium, fast
        },
      },
      result: {
        arithmetics: {
          total_questions: null,
          correct_answer: null,
          avg_response_time: null,
        },
        horizon: {
          correct_time: null, // in seconds
        },
        color_tank: {
          final_score: null,
        },
      },
    };
  },
  async mounted() {
    this.initConfig();
  },
  beforeUnmount() {
    clearInterval(this.countdownInterval);
  },
  computed: {
    isTimesUp() {
      return this.config.duration  < 1;
    },
    formattedTime() {
      const minutes = Math.floor(this.config.duration / 60).toString().padStart(2, '0');
      const seconds = (this.config.duration % 60).toString().padStart(2, '0');
      return `${minutes}:${seconds}`;
    },
  },
  methods: {
    closeModal() {
      this.isShowModal = false;
      this.isConfigLoaded = true;
      this.startCountdown();

      setTimeout(() => {
        this.$refs.arithmeticsRef.generateAudio();
			}, 2000)
    },
    pause() {
      clearInterval(this.countdownInterval);
      this.isPause = true;
    },
    startAgain() {
      this.startCountdown();
      this.isPause = false;
    },
    exit() {
      if (confirm("Apakah Anda yakin ingin keluar dari tes? Semua progres akan hilang.")) {
        this.$router.push('module');
      }
    },
    startCountdown() {
      this.countdownInterval = setInterval(() => {
        if (this.config.duration > 0) {
          this.config.duration--;
        } else {
          clearInterval(this.countdownInterval);

          // Submit Answer
          setTimeout(() => {
            this.submitResult();
          }, 1000);
        }
      }, 1000);
    },
    initConfig() {
      try {
        let config = JSON.parse(localStorage.getItem('scheduleData'));

        if (config) {
          const colorMultitask = config.tests.find(test => test.testUrl === 'color-multitask-test').config;
          this.config.duration = colorMultitask.duration * 60;
          this.config.batteryTestConfigId = colorMultitask.id;
          this.config.sessionId = config.sessionId;
          this.config.userId = config.userId;

          // Color Tank
          this.config.subtask.color_tank = colorMultitask.subtask.color_tank
          if (this.config.subtask.color_tank) {
            this.config.color_tank.negative_score = colorMultitask.color_tank.negative_score
            this.config.color_tank.speed = colorMultitask.color_tank.speed
            this.config.color_tank.colored_lower_tank = colorMultitask.color_tank.colored_lower_tank
          }

          // Arithmetic
          this.config.subtask.arithmetics = colorMultitask.subtask.arithmetics
          if (this.config.subtask.arithmetics) {
            this.config.arithmetics.sound = colorMultitask.arithmetics.sound
            this.config.arithmetics.difficulty = colorMultitask.arithmetics.difficulty
          }

          // Horizon
          this.config.subtask.horizon = colorMultitask.subtask.horizon
          if (this.config.subtask.horizon) {
            this.config.horizon.speed = colorMultitask.horizon.speed
          }

          if (this.config.subtask.arithmetics) {
            this.isShowModal = true;
          } else {
            this.isConfigLoaded = true;
            this.startCountdown();
          }
        }
      } catch (error) {
        console.log(error, 'error')
      }
    },
    arithmeticResult(result) {
      this.result.arithmetics.correct_answer = result.correctAnswer;
      this.result.arithmetics.total_questions = result.totalQuestion;
      this.result.arithmetics.avg_response_time = result.responseTime.toFixed(2);
    },
    colorTankResult(result) {
      this.result.color_tank.final_score = result.score;
    },
    horizonResult(result) {
      this.result.horizon.correct_time = result.correctTime.toFixed(2);
    },
    async submitResult() {
      try {
        if (this.isTrial) {
          this.$router.push('/module');
          return;
        }

        this.isLoading = true;

        const API_URL = process.env.VUE_APP_API_URL;
        const payload = {
          testSessionId: this.config.sessionId,
          userId: this.config.userId,
          batteryTestConfigId: this.config.batteryTestConfigId,
          result: this.result,
        }

        const res = await fetch(`${API_URL}api/submission`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          }
        )

        if (!res.ok) {
          throw new Error('Failed Submit Test');
        }
      } catch (error) {
        console.error(error), "error";
      } finally {
        this.isLoading = false;

        removeTestByNameAndUpdateLocalStorage('Multi Tasking With Color')
        this.$router.push('/module');
      }
    },
  },
};
</script>

<style scoped>
  .main-view {
    justify-content: center;
    align-items: flex-start;
    gap: 20px;
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
    padding: 20px;
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
  }
  .timer-container-trial button {
    color: #000000;
    font-weight: bold;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    border-radius: 5px;
    border-color: transparent;
    min-width: 100px;
    cursor: pointer;
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
  .spinner {
    border: 8px solid rgba(255, 255, 255, 0.3);
    /* Light border */
    border-top: 8px solid #ffffff;
    /* White border for the spinning part */
    border-radius: 50%;
    width: 60px;
    height: 60px;
    animation: spin 1s linear infinite;
  }
  .horizon-tank {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		align-items: center;
		height: 92vh;
		margin-left: 40px;
		margin-right: 40px;
	}

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
  .text {
    color: #ffffff;
    margin-top: 20px;
    font-size: 1.2em;
  }
  .horizon-section {
    position: relative;
  }
</style>
