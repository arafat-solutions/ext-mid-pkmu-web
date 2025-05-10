<template>
  <div id="parent-callsign-multitask">
    <!-- Modals remain the same -->
    <ModalComponent
      :visible="isTrainingModalVisible"
      :title="currentModalTitle"
      :description="currentModalDescription"
      @confirm="handleTrainingConfirm"
      @cancel="handleCancel"
    />

    <ModalComponent
      :visible="isTestModalVisible"
      :title="'Mulai Tes Aktual'"
      :description="actualTestCount >= 1?'Tes pertama telah selesai, anda akan melakukan tes yang sama lagi untuk melihat perkembangan pemahaman Anda.':'Anda akan memulai tes yang sebenarnya. Tes ini akan menggabungkan semua tugas yang telah Anda latih sebelumnya. Apakah Anda siap untuk memulai?'"
      @confirm="handleTestConfirm"
      @cancel="handleCancel"
    />

    <!-- Main content with conditional wrapper -->
    <div :class="contentLayoutClass">
      <!-- Training Mode -->
      <div v-if="isTraining" class="training-container">
        <div
          v-if="currentTraining.length === 1"
          class="training-container"
          :class="[
            getGridColsClass,
            {
              grid: currentTraining.length > 1,
              'gap-4': currentTraining.length > 1,
            },
          ]"
        >

          <HorizonTest
            v-if="currentTraining.includes('horizon') && configReady"
            :horizon-data="configBe.horizon"
            :update-results="updateResults"
            class="centered-component"
          />

          <CallSignTest
            v-if="currentTraining.includes('callsign') && configReady"
            :callsign-data="configBe.callsign"
            :update-results="updateResults"
            ref="callSignTest"
            :isTraining="isTraining"
          />

          <ColorTest
            v-if="currentTraining.includes('color_tank') && configReady"
            :color-tank-data="configBe.color_tank"
            :update-results="updateResults"
            :finalScore="results.color_tank.final_score"
            :isTraining="isTraining"
            class="centered-component"
          />

          <CircleTest
            v-if="currentTraining.includes('circle_test') && configReady"
            :alert-lights-data="configBe.alert_lights"
            :isTraining="isTraining"
            :update-results="updateResults"
            :update-result-light-avg-time="updateResultLightAvgTime"
            class="centered-component"
          />
        </div>
        <template v-else>
          <div class="left-side">
            <ColorTest
              v-if="currentTraining.includes('color_tank') && configReady"
              :color-tank-data="configBe.color_tank"
              :update-results="updateResults"
              :isTraining="isTraining"
              :finalScore="results.color_tank.final_score"
            />
          </div>
          <div class="right-side">
            <CircleTest
              v-if="currentTraining.includes('circle_test') && configReady"
              :alert-lights-data="configBe.alert_lights"
              :isTraining="isTraining"
              :update-results="updateResults"
              :update-result-light-avg-time="updateResultLightAvgTime"
              style="margin-bottom: 20px"
            />
            <HorizonTest
              v-if="currentTraining.includes('horizon') && configReady"
              :horizon-data="configBe.horizon"
              :update-results="updateResults"
              :trainingCompleted="false"
              :alertOnRight="true"
            />
            <CallSignTest
              v-if="currentTraining.includes('callsign') && configReady"
              ref="callSignTest"
              :callsign-data="configBe.callsign"
              :update-results="updateResults"
              :isTraining="isTraining"
            />
          </div>
        </template>
      </div>

      <!-- Actual Test Mode -->

      <template v-else>
        <div class="left-side">
          <ColorTest
            v-if="configReady"
            :color-tank-data="configBe.color_tank"
            :update-results="updateResults"
            :isTraining="isTraining"
            ref="colorTankTest"
            :finalScore="results.color_tank.final_score"
          />
        </div>
        <div class="right-side">
          <CircleTest
            v-if="configReady"
            :alert-lights-data="configBe.alert_lights"
            :isTraining="isTraining"
            :update-results="updateResults"
            :update-result-light-avg-time="updateResultLightAvgTime"
          />
          <HorizonTest
            v-if="configReady"
            :horizon-data="configBe.horizon"
            :update-results="updateResults"
            :trainingCompleted="true"
          />
          <CallSignTest
            v-if="configReady"
            :callsign-data="configBe.callsign"
            :update-results="updateResults"
            ref="callSignTest"
          />
        </div>
      </template>
    </div>

    <div class="timer" v-if="!isTraining">
      <p>{{ isTraining ? "Waktu Latihan:" : "Waktu Tes:" }}</p>
      <p>{{ formatTime(testTime) }}</p>
    </div>
    <button
      v-if="isTraining"
      @click="handleTrainingComplete"
      class="finish-button"
    >
      Selesai Latihan
    </button>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">Hasil Anda sedang diproses</div>
    </div>
  </div>
</template>
<script>
import ColorTest from "./ColorTest.vue";
import HorizonTest from "./HorizonTest.vue";
import CircleTest from "./CircleTest.vue";
import CallSignTest from "./CallSignTest.vue";
import ModalComponent from "./Modal.vue";
import { removeTestByNameAndUpdateLocalStorage } from "@/utils/index";
import { getConfigs } from "@/utils/configs";
import { patchWorkstation } from "@/utils/fetch";

const TRAINING_SEQUENCE = [
  "horizon",
  "callsign",
  "color_tank",
  "circle_test",
  ["horizon", "callsign"],
  ["horizon", "callsign", "color_tank"],
  ["horizon", "callsign", "color_tank",'circle_test'],
];
const TRAINING_TIME = 999999; // 1 minute for each training

const TRAINING_INSTRUCTIONS = {
  horizon: {
    title: "Latihan Horizon",
    description:
      "Anda diminta untuk mengarahkan garis penerbang dengan JOYSTICK mengikuti pergerakan target sampai berwarna HIJAU hingga selesai.",
    img: "<img style='border:1px solid gray;margin:auto' src='devices/mmwcs.png'/>",
  },
  callsign: {
    title: "Latihan Call Sign",
    description:
      "Pada latihan ini, Anda akan mendengar beberapa panggilan. Tugas Anda adalah merespon hanya ketika mendengar panggilan yang sesuai dengan call sign Anda. Gunakan tombol spasi untuk merespon. Latihan ini akan berlangsung selama 1 menit.",
    img: "<img style='border:1px solid gray;margin:auto' src='devices/mmwcs_2.png'/>",
  },
  color_tank: {
    title: "Latihan Color Tank",
    description:
      "Anda diminta untuk mengisi tank bagian bawah (ASDF), dari tank bagian atas (QWER) dengan cara menekan salah satu tank yang berada diatas lalu menekan 2 tank yang berada di bawah dengan warna yang sama. (Contoh: Tank yang kosong berwarna MERAH, maka anda harus menyentuh huruf R (TANK ATAS MERAH), lalu menyentuh D & F (TANK BAWAH MERAH).",
    img: "<img style='border:1px solid gray;margin:auto' src='devices/mmwcs_3.png'/>",
  },
  circle_test: {
    title: "Latihan Rambu Peringatan",
    description:
      "Anda diminta untuk merespon bila huruf berwarna MERAH maka TEKAN HURUF WARNA MERAH pada layar, bila huruf berwarna KUNING maka ABAIKAN.",
    img: "<img style='border:1px solid gray;margin:auto' src='devices/mmwcs_4.png'/>",
  },
  combined: {
    title: "Latihan Gabungan",
    description:
      "Pada tahap ini, peserta akan menjalankan gabungan dari subtask sebelumnya. Subtask akan ditambahkan secara bertahap hingga semua digabungkan dalam satu sesi.",
  },
};

export default {
  name: "CallSignMultitask",
  components: {
    ColorTest,
    HorizonTest,
    CircleTest,
    CallSignTest,
    ModalComponent,
  },
  data() {
    return {
      loading: false,
      testTime: TRAINING_TIME,
      tesInterval: null,
      isTraining: true,
      isActualTest: false,
      currentTraining: [],
      trainingIndex: 0,
      isTrainingModalVisible: true,
      isTestModalVisible: false,
      configBe: {
        alert_lights: {
          frequency: "often",
          speed: "fast",
          play: true,
        },
        callsign: {
          frequency: "seldom",
          matches: "high",
          speed: "slow",
          play: true,
        },
        color_tank: {
          negative_score: true,
          speed: "fast",
          descend_speed: "fast",
          colored_lower_tank: true,
          play: true,
          final_score: 0,
        },
        horizon: {
          speed: "medium",
          play: true,
        },
      },
      results: {
        horizon: {
          correct_time: 0,
        },
        alert_lights: {
          wrong_response: 0,
          correct_response: 0,
          total_alert_count: 0,
          total_warning_count: 0,
          avg_response_time: 0,
        },
        call_sign: {
          wrong_response: 0,
          correct_response: 0,
          total_match_count: 0,
        },
        color_tank: {
          correct_button_combination: 0,
          below_line_responses: 0,
          total_occurrences: 0,
          final_score: 120,
        },
      },
      tempFirstResult: {
        horizon: {
          correct_time: 0,
        },
        alert_lights: {
          wrong_response: 0,
          correct_response: 0,
          total_alert_count: 0,
          total_warning_count: 0,
          avg_response_time: 0,
        },
        call_sign: {
          wrong_response: 0,
          correct_response: 0,
          total_match_count: 0,
        },
        color_tank: {
          correct_button_combination: 0,
          below_line_responses: 0,
          total_occurrences: 0,
          final_score: 120,
        },
      },
      configs: [],
      indexConfig: 0,
      moduleId: "",
      sessionId: "",
      userId: "",
      testId: "",
      configReady: false,
      refreshCount: 0,
      actualTestCount: 0,
    };
  },
  computed: {
    getGridColsClass() {
      const len = this.currentTraining.length;
      if (len === 1) return "grid-cols-1";
      if (len === 2) return "grid-cols-2";
      if (len === 3) return "grid-cols-3";
      if (len >= 4) return "grid-cols-4";
      return "";
    },
    currentModalTitle() {
      return this.currentTraining.length === 1
        ? TRAINING_INSTRUCTIONS[this.currentTraining[0]].title
        : TRAINING_INSTRUCTIONS.combined.title;
    },
    currentModalDescription() {
      return this.currentTraining.length === 1
        ? TRAINING_INSTRUCTIONS[this.currentTraining[0]].description
        : TRAINING_INSTRUCTIONS.combined.description;
    },
    contentLayoutClass() {
      return this.isTraining ? "content-training" : "content-test";
    },
  },
  async mounted() {
    this.initConfig();
    this.refreshCount = parseInt(
      localStorage.getItem("refreshCallsignMultitaskTest") || "0"
    );
    this.refreshCount++;
    localStorage.setItem(
      "refreshCallsignMultitaskTest",
      this.refreshCount.toString()
    );

    window.addEventListener("beforeunload", this.handleBeforeUnload);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    // Start with first training
    this.currentTraining = [TRAINING_SEQUENCE[0]];
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    clearInterval(this.tesInterval);
  },
  methods: {
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainderSeconds = seconds % 60;
      return `${minutes}:${
        remainderSeconds < 10 ? "0" : ""
      }${remainderSeconds}`;
    },
    countDownTime() {
      this.tesInterval = setInterval(async () => {
        if (this.testTime > 0) {
          this.testTime--;
        } else {
          clearInterval(this.tesInterval);

          if (this.isTraining) {
            this.handleTrainingComplete();
          } else {
            if (this.indexConfig < this.configs.length - 1) {
              this.indexConfig++;
              this.startNextTest();
            } else {
              this.actualTestCount++;
              if (this.actualTestCount < 2) {
                this.isTestModalVisible = true;
                this.tempFirstResult = this.results;
              } else {
                await this.submitResult();
              }
            }
          }
        }
      }, 1000);
    },
    handleTrainingComplete() {
      this.trainingIndex++;
      if (this.trainingIndex < TRAINING_SEQUENCE.length) {
        this.currentTraining = Array.isArray(
          TRAINING_SEQUENCE[this.trainingIndex]
        )
          ? TRAINING_SEQUENCE[this.trainingIndex]
          : [TRAINING_SEQUENCE[this.trainingIndex]];
        this.testTime = TRAINING_TIME;
        this.isTrainingModalVisible = true;
        this.resetResults();
      } else {
        this.isTraining = false;
        this.isTestModalVisible = true;
        this.resetResults();
      }
    },
    resetResults() {
      Object.keys(this.results).forEach((key) => {
        Object.keys(this.results[key]).forEach((subKey) => {
          this.results[key][subKey] =
            key === "color_tank" && subKey === "final_score" ? 120 : 0;
        });
      });
    },
    initConfig() {
      const configData = getConfigs("call-sign-multitask-test");
      if (!configData) {
        this.$router.push("/module");
        return;
      }

      this.configs = configData.configs;
      this.moduleId = configData.moduleId;
      this.sessionId = configData.sessionId;
      this.userId = configData.userId;
      this.testId = configData.testId;
      // Initialize training config
      this.configReady = true;
      this.setTrainingConfig(TRAINING_SEQUENCE[0]);
    },
    setTrainingConfig(training) {
      console.log(training);
      // // Reset all subtasks to false
      // Object.keys(this.configBe).forEach(key => {
      //     if (this.configBe[key].hasOwnProperty('play')) {
      //         this.configBe[key].play = false;
      //     }
      // });

      // // Enable only the current training task
      // if (this.configBe[training]?.hasOwnProperty('play')) {
      //     this.configBe[training].play = true;
      // }
    },
    setActualTestConfig(config) {
      const { alert_lights, callsign, color_tank, horizon, subtask } = config;

      this.configBe.alert_lights = {
        ...alert_lights,
        play: subtask?.alert_lights,
      };
      this.configBe.callsign = { ...callsign, play: subtask?.callsign };
      this.configBe.color_tank = { ...color_tank, play: subtask?.color_tank };
      this.configBe.horizon = { ...horizon, play: subtask?.horizon };
    },
    handleTrainingConfirm() {
      const updatePayload = {
        status: "IN_TRAINING",
        name: "Multitasking Mix With Call Sign",
      };

      patchWorkstation(updatePayload);
      clearInterval(this.tesInterval);
      this.isTrainingModalVisible = false;
      this.currentTraining.forEach((training) =>
        this.setTrainingConfig(training)
      );
      this.countDownTime();

      if (this.currentTraining.includes("callsign")) {
        this.$refs.callSignTest?.startSpeechTest();
      }
    },
    handleTestConfirm() {
      const updatePayload = {
        status: "IN_TESTING",
        name: "Multitasking Mix With Call Sign",
      };

      patchWorkstation(updatePayload);
      clearInterval(this.tesInterval);
      this.isTestModalVisible = false;
      this.isActualTest = true;
      this.setActualTestConfig(this.configs[this.indexConfig]);
      // sum durations from config.duration
      this.testTime = 360;
      this.countDownTime();
      this.$refs.colorTankTest.initializeTest();
      if (this.configBe.callsign.play) {
        this.$refs.callSignTest?.startSpeechTest();
      }
    },
    handleCancel() {
      this.$router.replace("/module");
    },
    startNextTest() {
      this.setActualTestConfig(this.configs[this.indexConfig]);
      this.countDownTime();
    },
    updateResults(component, data) {
      if (!this.isTraining && Object.hasOwn(this.results, component)) {
        Object.keys(data).forEach((key) => {
          if (Object.hasOwn(this.results[component], key)) {
            this.results[component][key] += data[key];
          }
        });
      }
    },
    updateResultLightAvgTime(time) {
      if (!this.isTraining) {
        this.results.alert_lights.avg_response_time = time;
      }
    },
    async submitResult() {
      try {
        this.loading = true;
        const API_URL = process.env.VUE_APP_API_URL;
        const payload = {
          testSessionId: this.sessionId,
          userId: this.userId,
          moduleId: this.moduleId,
          batteryTestId: this.testId,
          result: this.tempFirstResult,
          result2: this.results,
          refreshCount: this.refreshCount,
        };

        const response = await fetch(`${API_URL}/api/submission`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        if (this.actualTestCount > 1) {
          removeTestByNameAndUpdateLocalStorage(
            "Multitasking Mix With Call Sign"
          );
          localStorage.removeItem("refreshCallsignMultitaskTest");
          this.$router.push("/module");
        }
      } catch (error) {
        console.error(error);
      } finally {
        this.loading = false;
      }
    },
    handleBeforeUnload() {
      localStorage.setItem(
        "refreshCallsignMultitaskTest",
        this.refreshCount.toString()
      );
    },
  },
};
</script>

<style>
#parent-callsign-multitask {
  display: flex;
  height: 100vh;
  background-color: white;
  padding: 10px;
  max-width: 1000px;
  min-width: 1000px;
  margin: 0 auto;
  position: relative;
}

/* New training mode layout */
.content-training {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 60px 20px 20px 20px;
  /* Add top padding for timer */
}

.training-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.centered-component {
  margin: auto;
  max-width: 600px;
  width: 100%;
}

/* Test mode layout */
.content-test {
  display: flex;
  width: 100%;
  padding-top: 60px;
  /* Add padding for timer */
}

.left-side {
  width: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.right-side {
  width: 50%;
}

.timer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  margin: 0 auto;
  font-size: 24px;
  font-weight: bold;
  width: 300px;
  height: 60px;
  background-color: #6757dc;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  z-index: 10;
}

.timer p {
  margin: 0;
  padding: 0;
}

.timer :nth-child(1) {
  font-size: 12px;
}

.timer :nth-child(2) {
  font-size: 24px;
  margin-top: 4px;
}

.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  border: 8px solid rgba(255, 255, 255, 0.3);
  border-top: 8px solid #ffffff;
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
