<template>
  <div>
    <div v-if="showInstructionModal" class="instruction-modal">
      <div class="instruction-modal-content">
        <h2 style="font-size: 24px" v-if="!trainingCompleted">
          <b>
            {{
              currentTrainingTask
                ? "Latihan: " + currentTrainingTask
                : "Instruksi"
            }}
          </b>
        </h2>

        <p style="font-size: 20px" class="flex flex-col items-center" v-if="!trainingCompleted"
          v-html="instructionModalContent"></p>
        <p v-else>Apakah Anda Yakin <br />akan memulai ujian {{ testName }}?</p>

        <button @click="startTrainingTask">
          {{ trainingCompleted ? "Mulai Tes" : "Mulai Latihan" }}
        </button>
      </div>
    </div>

    <div class="main-view" v-if="isConfigLoaded">
      <div v-if="timeLeft > 0 && trainingCompleted" class="timer-container">
        Time: {{ formattedTime }}
      </div>
      <div
        :class="trainingCompleted ? 'column-45 mt-3' : ''"
        v-show="!isTimesUp"
      >
        <HorizonTest
          ref="horizonTaskRef"
          :speed="config.horizon.speed"
          :minuteTime="minuteTime"
          :isTimesUp="isTimesUp"
          :isPause="isPauseHorizon"
          :isActive="config.horizon.isActive"
          v-if="config.horizon.isActive"
          @getResult="horizonResult"
        />
        <ArithmeticTask
          ref="arithmeticTaskRef"
          :isTimesUp="isTimesUp"
          :difficulty="config.arithmetic.difficulty"
          :minuteTime="minuteTime"
          :isPause="isPauseArithmetic"
          :isActive="config.arithmetic.isActive"
          v-if="config.arithmetic.isActive"
          :useSound="config.arithmetic.useSound"
          :canPressAnswer="config.arithmetic.canPressAnswer"
          :allowSound="allowSound"
          @getResult="arithmeticResult"
        />
      </div>
      <div
        :class="trainingCompleted ? 'column-10 mt-3' : ''"
        v-show="!isTimesUp"
      >
        <AlertLights
          :speed="config.alertLight.speed"
          :isTimesUp="isTimesUp"
          :frequency="config.alertLight.frequency"
          :isPause="isPauseAlertLight"
          :isActive="config.alertLight.isActive"
          v-if="config.alertLight.isActive"
          @getResult="alertLightResult"
        />
      </div>
      <div
        :class="trainingCompleted ? 'column-45 mt-3 text-left' : ''"
        v-show="!isTimesUp"
      >
        <GaugesMeter
          :isTimesUp="isTimesUp"
          :isPause="isPauseGaugesMeter"
          :frequency="config.gaugesMeter.frequency"
          :isActive="config.gaugesMeter.isActive"
          v-if="config.gaugesMeter.isActive"
          @getResult="gaugesMeterResult"
          :size="50"
        />
      </div>
    </div>
    <button v-if="!trainingCompleted" @click="endTrainingTask" class="finish-button">
      Selesai Latihan
    </button>
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">Your result is submitting</div>
    </div>
  </div>
</template>

<script>
import ArithmeticTask from "./instrument-multitask/ArithmeticTask";
import AlertLights from "./instrument-multitask/AlertLights";
import GaugesMeter from "./instrument-multitask/GaugesMeter";
import HorizonTest from "./instrument-multitask/HorizonTest";

import {
  completeTrainingTestAndUpdateLocalStorage,
  removeTestByNameAndUpdateLocalStorage,
} from "@/utils/index";

export default {
  components: {
    ArithmeticTask,
    AlertLights,
    GaugesMeter,
    HorizonTest,
  },
  data() {
    return {
      trainingCompleted: false,
      showInstructionModal: false,
      currentTrainingTask: null,
      instructionModalContent: "",
      trainingTasks: [
        "horizon",
        "alertLight",
        "arithmetic",
        "gaugesMeter",
        "combined",
      ],
      isPauseArithmetic: false,
      isPauseAlertLight: false,
      isPauseHorizon: false,
      isPauseGaugesMeter: false,
      configs: [],
      minuteTest: null,
      testName: "Multitasking With Instrument",
      isLoading: false,
      minuteTime: null,
      timeLeft: null, // Countdown time in seconds
      interval: null,
      isConfigLoaded: false,
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
          canPressAnswer: true, //true,false
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
        },
      },
    };
  },
  computed: {
    isTimesUp() {
      return this.timeLeft < 1;
    },
    formattedTime() {
      const minutes = Math.floor(this.timeLeft / 60);
      const seconds = this.timeLeft % 60;
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    },
  },
  methods: {
    initConfig() {
      const data = localStorage.getItem("scheduleData");
      if (data) {
        try {
          const scheduleData = JSON.parse(data);
          const instrumentMultitaskConfig = scheduleData.tests.find(
            (t) => t.name === this.testName
          ).configs[0];

          this.configs = scheduleData.tests.find(
            (t) => t.name === this.testName
          ).configs;
          this.trainingCompleted =
            scheduleData.tests.find((t) => t.name === this.testName)
              .trainingCompleted ?? false; //default false

          this.minuteTime = instrumentMultitaskConfig.duration;
          this.timeLeft = this.minuteTime * 60;

          this.minuteTest = 0.1;
          // for (const i in this.configs) {
          //   this.minuteTest += parseInt(this.configs[i].duration);
          // }

          this.config.arithmetic.difficulty =
            instrumentMultitaskConfig.arithmetics.difficulty;
          this.config.arithmetic.useSound =
            instrumentMultitaskConfig.arithmetics.sound;
          this.config.arithmetic.isActive =
            instrumentMultitaskConfig.subtask.arithmetics;
          this.config.alertLight.speed =
            instrumentMultitaskConfig.alert_lights.speed;
          this.config.alertLight.frequency =
            instrumentMultitaskConfig.alert_lights.frequency;
          this.config.alertLight.isActive =
            instrumentMultitaskConfig.subtask.alert_lights;
          this.config.gaugesMeter.frequency =
            instrumentMultitaskConfig.instrument.frequency;
          this.config.gaugesMeter.isActive =
            instrumentMultitaskConfig.subtask.instrument;
          this.config.horizon.speed = instrumentMultitaskConfig.horizon.speed;
          this.config.horizon.isActive =
            instrumentMultitaskConfig.subtask.horizon;
          this.isConfigLoaded = true;

          this.startSimulation();
        } catch (e) {
          console.error("Error parsing schedule data:", e);
        }
      } else {
        console.warn("No schedule data found in localStorage.");
      }
    },
    startSimulation() {
      if (!this.trainingCompleted) {
        this.startTraining();
      } else {
        this.showInstructionModal = true;
      }
    },
    startTraining() {
      this.currentTrainingTask = this.trainingTasks[0];
      this.showTrainingInstructions();
    },
    showTrainingInstructions() {
      const instructions = {
        gaugesMeter:
          "Pada latihan ini Anda diminta untuk merespon indikator berwarna MERAH dengan menekan huruf (W V X Y Z A) pada layar. <img style='border:1px solid gray' src='devices/imt_4.png'/>",
        arithmetic:
          "Pada latihan ini, Anda diminta untuk MENDENGARKAN AUDIO yang menyebutkan ARITMATIKA DASAR kemudian memilih jawaban yang paling benar dengan MENYENTUH LAYAR. (Contoh audio: 5 x 5 adalah, maka anda harus memilih jawaban yang benar yaitu 25) <img style='border:1px solid gray' src='devices/imt_3.png'/>",
        alertLight:
          "Anda diminta untuk merespon bila huruf berwarna MERAH dengan menyentuh layar, bila huruf berwarna KUNING maka abaikan. <img style='border:1px solid gray' src='devices/imt_2.png'/>",
        horizon:
          "Anda diminta untuk mengarahkan garis penerbang dengan menggunakan JOYSTICK mengikuti pergerakan target sampai berwarna HIJAU hingga tes selesai. <img style='border:1px solid gray' src='devices/imt_1.png'/>",
        combined: "Latihan gabungan dari keempat tugas sebelumnya.",
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
          case "gaugesMeter":
            // stop audio
            this.allowSound = false;
            this.startGaugesMeterTraining();
            break;
          case "arithmetic":
            this.startArithmeticTraining();
            break;
          case "alertLight":
            this.allowSound = false;
            this.startAlertLightTraining();
            break;
          case "horizon":
            this.allowSound = false;
            this.startHorizonTraining();
            break;
          case "combined":
            this.startCombinedTraining();
            break;
        }
      }
    },
    startGaugesMeterTraining() {
      this.minuteTime = 99999;
      this.timeLeft = this.minuteTime * 60;

      this.isPauseGaugesMeter = false;
      this.isPauseArithmetic = true;
      this.isPauseAlertLight = true;
      this.isPauseHorizon = true;

      this.config.gaugesMeter.isActive = true;
      this.config.alertLight.isActive = false;
      this.config.arithmetic.isActive = false;
      this.config.horizon.isActive = false;

      clearInterval(this.interval);
      this.interval = null;
      this.startCountdown();
    },
    startArithmeticTraining() {
      this.minuteTime = 99999;
      this.timeLeft = this.minuteTime * 60;

      this.isPauseArithmetic = false;
      this.isPauseGaugesMeter = true;
      this.isPauseAlertLight = true;
      this.isPauseHorizon = true;

      this.config.arithmetic.isActive = true;
      this.config.gaugesMeter.isActive = false;
      this.config.alertLight.isActive = false;
      this.config.horizon.isActive = false;

      this.allowSound = true;
      if (this.config.arithmetic.isActive && this.$refs.arithmeticTaskRef) {
        this.$refs.arithmeticTaskRef.generateProblem();
      }

      clearInterval(this.interval);
      this.interval = null;
      this.startCountdown();
    },

    startAlertLightTraining() {
      this.minuteTime = 99999;
      this.timeLeft = this.minuteTime * 60;

      this.isPauseAlertLight = false;
      this.isPauseArithmetic = true;
      this.isPauseGaugesMeter = true;
      this.isPauseHorizon = true;

      this.config.alertLight.isActive = true;
      this.config.arithmetic.isActive = false;
      this.config.gaugesMeter.isActive = false;
      this.config.horizon.isActive = false;

      clearInterval(this.interval);
      this.interval = null;
      this.startCountdown();
    },
    startHorizonTraining() {
      this.minuteTime = 99999;
      this.timeLeft = this.minuteTime * 60;

      this.isPauseHorizon = false;
      this.isPauseAlertLight = true;
      this.isPauseArithmetic = true;
      this.isPauseGaugesMeter = true;

      this.config.horizon.isActive = true;
      this.config.alertLight.isActive = false;
      this.config.arithmetic.isActive = false;
      this.config.gaugesMeter.isActive = false;

      clearInterval(this.interval);
      this.interval = null;
      this.startCountdown();
    },
    startCombinedTraining() {
      this.isPauseHorizon = false;
      this.isPauseAlertLight = false;
      this.isPauseArithmetic = false;
      this.isPauseGaugesMeter = false;

      this.config.horizon.isActive = true;
      this.config.alertLight.isActive = true;
      this.config.arithmetic.isActive = true;
      this.config.gaugesMeter.isActive = true;

      this.allowSound = true;

      if (this.config.arithmetic.isActive && this.$refs.arithmeticTaskRef) {
        this.$refs.arithmeticTaskRef.generateProblem();
      }

      this.minuteTime = 1;
      this.timeLeft = this.minuteTime * 60;
      clearInterval(this.interval);
      this.interval = null;
      this.startCountdown();
    },
    endTrainingTask() {
      clearInterval(this.interval);
      this.interval = null;
      if (this.config.arithmetic.isActive) {
        this.$refs.arithmeticTaskRef.stop();
      }

      const currentTaskIndex = this.trainingTasks.indexOf(
        this.currentTrainingTask
      );
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
      this.instructionModalContent =
        "Training completed! The actual test will begin now.";

      completeTrainingTestAndUpdateLocalStorage(this.testName);
    },
    startActualTest() {
      this.result = {
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
        },
      };

      this.interval = null;
      this.minuteTime = this.minuteTest;
      this.timeLeft = this.minuteTime * 60;

      // Reset all components to active state
      this.isPauseHorizon = false;
      this.isPauseAlertLight = false;
      this.isPauseArithmetic = false;
      this.isPauseGaugesMeter = false;

      this.config.horizon.isActive = true;
      this.config.alertLight.isActive = true;
      this.config.arithmetic.isActive = true;
      this.config.gaugesMeter.isActive = true;

      this.allowSound = true;

      // Restart all components
      if (this.$refs.arithmeticTaskRef) {
        this.$refs.arithmeticTaskRef.restartQuestions();
      }
      if (this.$refs.horizonTaskRef) {
        this.$refs.horizonTaskRef.startAnimation();
      }
      if (this.config.arithmetic.isActive && this.$refs.arithmeticTaskRef) {
        this.$refs.arithmeticTaskRef.generateProblem();
      }
      this.$refs.horizonTaskRef.startAnimation();

      this.startCountdown();
    },
    startCountdown() {
      console.log(this.interval);
      this.interval = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft -= 1;
        } else {
          clearInterval(this.interval);
          if (this.trainingCompleted) {
            this.submitResult();
          } else {
            this.endTrainingTask();
          }
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
    exit() {
      if (
        confirm(
          "Apakah Anda yakin ingin keluar dari tes? Semua progres akan hilang."
        )
      ) {
        this.$router.push("module");
      }
    },
    generatePayloadForSubmit() {
      const scheduleData = JSON.parse(localStorage.getItem("scheduleData"));
      const config = scheduleData.tests.find(
        (t) => t.name === this.testName
      )
      console.log(config, 'scheduleData');
      const payload = {
        testSessionId: scheduleData.sessionId,
        userId: scheduleData.userId,
        moduleId: scheduleData.moduleId,
        batteryTestId: config.id,
        refreshCount: parseInt(
          localStorage.getItem("reloadCountInstrumentMultitask")
        ),
        result: {
          arithmetics: {
            total_questions: this.result.arithmetic.totalQuestion,
            correct_answer: this.result.arithmetic.correctAnswer,
          },
          horizon: {
            correct_time: this.result.horizon.correctTime, // in seconds
          },
          alert_lights: {
            wrong_response: this.result.alertLight.wrong,
            correct_response: this.result.alertLight.correct,
            total_alert_count: this.result.alertLight.alertCount,
            total_warning_count: this.result.alertLight.warningCount,
            avg_response_time: this.result.alertLight.responseTime,
          },
          instrument: {
            correct_response: this.result.gaugesMeter.correct,
            total_occurence: this.result.gaugesMeter.occurance,
            response_time: this.result.gaugesMeter.responseTime, // in seconds
          },
        },
      };
      return payload;
    },
    async submitResult() {
      try {
        this.isLoading = true;
        const API_URL = process.env.VUE_APP_API_URL;
        const payload = this.generatePayloadForSubmit();
        console.log(payload);
        const response = await fetch(`${API_URL}/api/submission`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error("Failed to submit result");
        }
        removeTestByNameAndUpdateLocalStorage(this.testName);
        localStorage.removeItem("reloadCountInstrumentMultitask");
        this.$router.push("/module");
      } catch (error) {
        console.error(error);
      } finally {
        this.isLoading = false;
        removeTestByNameAndUpdateLocalStorage(this.testName);
        this.$router.push("/module");
      }
    },
  },
  mounted() {
    let reloadCount = parseInt(
      localStorage.getItem("reloadCountInstrumentMultitask") || "0"
    );
    reloadCount++;
    localStorage.setItem(
      "reloadCountInstrumentMultitask",
      reloadCount.toString()
    );

    window.addEventListener("beforeunload", () => {
      localStorage.setItem(
        "reloadCountInstrumentMultitask",
        reloadCount.toString()
      );
    });

    this.initConfig();
  },
  beforeUnmount() {
    clearInterval(this.interval);
  },
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
  background-color: #0349d0;
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
  background-color: #0349d0;
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

.modal-button {
  padding: 10px 20px;
  background-color: #4caf50;
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
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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
</style>
