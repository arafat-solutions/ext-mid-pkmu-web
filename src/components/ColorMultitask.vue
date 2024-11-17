<template>
  <div v-if="showInstructionModal" class="instruction-modal">
    <div class="instruction-modal-content">
      <h2 v-if="!trainingCompleted">{{ currentTrainingTask ? 'Training: ' + currentTrainingTask : 'Instructions' }}</h2>

      <p v-if="!trainingCompleted">{{ instructionModalContent }}</p>
      <p v-else>
        Apakah Anda Yakin <br>akan memulai ujian Multitasking with Color?
      </p>

      <button @click="startTrainingTask">{{ trainingCompleted ? 'Start Test' : 'Start Task' }}</button>
    </div>
  </div>

  <div class="main-view" v-if="isConfigLoaded">
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <div class="text">submitting a result</div>
    </div>

    <div class="timer-container">
      Time: {{ formattedTime }}
    </div>

    <div class="horizon-tank">
      <ColorTank
        ref="colorTankTaskRef"
        :isTimesUp="isTimesUp"
        :speed="config.color_tank.speed"
        :coloredLowerTank="config.color_tank.colored_lower_tank"
        :isNegativeScore="config.color_tank.negative_score"
        :isPause="isPauseColorTank"
        :isActive="config.color_tank.is_active"
        @getResult="colorTankResult"
      />

      <div class="horizon-section">
        <Horizon
          :isTimesUp="isTimesUp"
          :speed="config.horizon.speed"
          :isPause="isPauseHorizon"
          :isActive="config.horizon.is_active"
          @getResult="horizonResult"
        />

        <Arithmetics
          ref="arithmeticTaskRef"
          :isTimesUp="isTimesUp"
          :difficulty="config.arithmetics.difficulty"
          :duration="config.duration"
          :isPause="isPauseArithmetics"
          :isActive="config.arithmetics.is_active"
          :useSound="config.arithmetics.sound"
          @getResult="arithmeticResult"
        />
      </div>
    </div>

  </div>
</template>

<script>
import { getConfigs } from '@/utils/configs';
import Arithmetics from './color-multitask/Arithmetics';
import ColorTank from './color-multitask/ColorTank';
import Horizon from './color-multitask/Horizon';
import { completeTrainingTestAndUpdateLocalStorage, removeTestByNameAndUpdateLocalStorage } from '@/utils/index'

export default {
  name: 'MainView',
  components: {
    Arithmetics,
    ColorTank,
    Horizon,
  },
  data() {
    return {
      trainingCompleted: false,
      showInstructionModal: false,
      currentTrainingTask: null,
      instructionModalContent: '',

      trainingTasks: ['colorTank', 'horizon', 'arithmetic', 'combined'],

      isPauseArithmetics: false,
      isPauseColorTank: false,
      isPauseHorizon: false,
      configs: [],
      minuteTest: null,


      isLoading: false,
      timer: {
        minutes: 0,
        second: 0
      },
      countdownInterval: null,
      isPause: false,
      isConfigLoaded: false,
      testId: null,
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
    let reloadCount = parseInt(localStorage.getItem('reloadCountColorTankMultitask') || '0')
    reloadCount++
    localStorage.setItem('reloadCountColorTankMultitask', reloadCount.toString())

    window.addEventListener('beforeunload', () => {
      localStorage.setItem('reloadCountColorTankMultitask', reloadCount.toString())
    })
    const configData = getConfigs('color-multitask-test')
    this.testId = configData.testId
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
    initConfig() {
      try {
        let config = JSON.parse(localStorage.getItem('scheduleData'));

        if (config) {
          // @TODO: Config Flow
          this.configs = config.tests.find(test => test.testUrl === 'color-multitask-test').configs;
          this.trainingCompleted =  config.tests.find(test => test.testUrl === 'color-multitask-test').trainingCompleted ?? false; //default false

          this.minuteTest = 0;
          for (const i in this.configs){
            this.minuteTest += parseInt(this.configs[i].duration)
          }

          const colorMultitask = config.tests.find(test => test.testUrl === 'color-multitask-test').configs[0];

          this.config.duration = colorMultitask.duration * 60;
          this.config.batteryTestId = config.testId;
          this.config.sessionId = config.sessionId;
          this.config.userId = config.userId;

          // Color Tank
          this.config.subtask.color_tank = colorMultitask.subtask.color_tank
          if (this.config.subtask.color_tank) {
            this.config.color_tank.is_active = true
            this.config.color_tank.negative_score = colorMultitask.color_tank.negative_score
            this.config.color_tank.speed = colorMultitask.color_tank.speed
            this.config.color_tank.colored_lower_tank = colorMultitask.color_tank.colored_lower_tank
          }

          // Arithmetic
          this.config.subtask.arithmetics = colorMultitask.subtask.arithmetics
          if (this.config.subtask.arithmetics) {
            this.config.arithmetics.is_active = true
            this.config.arithmetics.sound = colorMultitask.arithmetics.sound
            this.config.arithmetics.difficulty = colorMultitask.arithmetics.difficulty
          }

          // Horizon
          this.config.subtask.horizon = colorMultitask.subtask.horizon
          if (this.config.subtask.horizon) {
            this.config.horizon.is_active = true
            this.config.horizon.speed = colorMultitask.horizon.speed
          }

          this.isConfigLoaded = true;

          this.startSimulation();
        }
      } catch (error) {
        console.log(error, 'error')
      }
    },
    startSimulation() {
      this.isPauseHorizon = true;
      this.isPauseColorTank = true;
      this.isPauseArithmetics = true;

      this.config.horizon.is_active = false;
      this.config.arithmetics.is_active = false;
      this.config.color_tank.is_active = false;

      if (!this.trainingCompleted) {
        this.startTraining();
      } else {
        this.showInstructionModal = true
      }
    },
    startTraining() {
      this.currentTrainingTask = this.trainingTasks[0];
      this.showTrainingInstructions();
    },
    showTrainingInstructions() {
      const instructions = {
        arithmetic: "Peserta harus mendengarkan angka-angka yang diberikan.",
        colorTank: "Peserta harus merespons dengan mengisi tanki yang kosong dengan warna yang sesuai.",
        horizon: "Peserta harus menjaga parameter penerbangan (seperti ketinggian dan arah) dalam batas yang ditentukan.",
        combined: "Latihan gabungan dari tugas sebelumnya."
      };

      this.instructionModalContent = instructions[this.currentTrainingTask];
      this.showInstructionModal = true;
    },
    startTrainingTask() {
      this.showInstructionModal = false;

      if (this.trainingCompleted) {
        this.startActualTest();
      } else {
        switch (this.currentTrainingTask) {
          case 'colorTank':
            this.startColorTankTraining();
            break;
          case 'arithmetic':
            this.startArithmeticTraining();
            break;
          case 'horizon':
            this.startHorizonTraining();
            break;
          case 'combined':
            this.startCombinedTraining();
            break;
        }
      }
    },
    startHorizonTraining() {
      this.config.duration = 1 * 60

      this.isPauseHorizon = false;
      this.isPauseColorTank = true;
      this.isPauseArithmetics = true;

      this.config.horizon.is_active = true;
      this.config.arithmetics.is_active = false;
      this.config.color_tank.is_active = false;

      this.startCountdown();
    },
    startColorTankTraining() {
      this.config.duration = 1 * 60

      this.isPauseColorTank = false;
      this.isPauseHorizon = true;
      this.isPauseArithmetics = true;

      this.config.color_tank.is_active = true;
      this.config.horizon.is_active = false;
      this.config.arithmetics.is_active = false;

      this.$refs.colorTankTaskRef.start();

      this.startCountdown();
    },
    startArithmeticTraining() {
      this.config.duration = 1 * 60

      this.isPauseArithmetics = false;
      this.isPauseColorTank = true;
      this.isPauseHorizon = true;

      this.config.arithmetics.is_active = true;
      this.config.color_tank.is_active = false;
      this.config.horizon.is_active = false;

      this.$refs.arithmeticTaskRef.generateNumbers();

      this.startCountdown();
    },
    startCombinedTraining() {
      this.config.duration = 1 * 60

      this.isPauseArithmetics = false;
      this.isPauseColorTank = false;
      this.isPauseHorizon = false;

      this.config.arithmetics.is_active = true;
      this.config.color_tank.is_active = true;
      this.config.horizon.is_active = true;

      this.$refs.colorTankTaskRef.initLowerTank();
      this.$refs.colorTankTaskRef.initScore();
      this.$refs.colorTankTaskRef.start();
      this.$refs.arithmeticTaskRef.generateNumbers();

      this.startCountdown();
    },
    endTrainingTask() {
      const currentTaskIndex = this.trainingTasks.indexOf(this.currentTrainingTask);
      if (currentTaskIndex < this.trainingTasks.length - 1) {
        this.currentTrainingTask = this.trainingTasks[currentTaskIndex + 1];
        this.showTrainingInstructions();
      } else {
        this.completeTraining();
      }
    },
    completeTraining() {
      this.trainingCompleted = true;
      this.showInstructionModal = true;
      this.instructionModalContent = "Training completed! The actual test will begin now.";

      completeTrainingTestAndUpdateLocalStorage("Multitasking With Color");
    },
    startActualTest() {
      this.result = {
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

      this.config.duration = this.minuteTest * 60

      this.isPauseArithmetics = false;
      this.isPauseColorTank = false;
      this.isPauseHorizon = false;

      this.config.arithmetics.is_active = true;
      this.config.color_tank.is_active = true;
      this.config.horizon.is_active = true;

      this.$refs.colorTankTaskRef.initLowerTank();
      this.$refs.colorTankTaskRef.initScore();
      this.$refs.colorTankTaskRef.start();
      this.$refs.arithmeticTaskRef.generateNumbers();

      this.startCountdown();
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
          if (this.trainingCompleted) {
            this.submitResult();
          } else {
            this.endTrainingTask();
          }
        }
      }, 1000);
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
        this.isLoading = true;

        const API_URL = process.env.VUE_APP_API_URL;
        const payload = {
          testSessionId: this.config.sessionId,
          userId: this.config.userId,
          batteryTestId: this.testId,
          refreshCount: parseInt(localStorage.getItem('reloadCountColorTankMultitask')),
          result: this.result,
        }

        const res = await fetch(`${API_URL}/api/submission`,
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

        removeTestByNameAndUpdateLocalStorage('Multitasking With Color')
        localStorage.removeItem('reloadCountColorTankMultitask');
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

  .instruction-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .instruction-modal-content {
    background-color: #fff;
    padding: 20px;
    border-radius: 5px;
    text-align: center;
    max-width: 80%;
  }

  .instruction-modal-content h2 {
    margin-top: 0;
  }

  .instruction-modal-content button {
    margin-top: 20px;
    padding: 10px 20px;
    font-size: 16px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }

  .instruction-modal-content button:hover {
    background-color: #0056b3;
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
