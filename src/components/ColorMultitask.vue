<template>
  <div v-if="showInstructionModal" class="instruction-modal">
    <div class="instruction-modal-content">
      <div v-if="!trainingCompleted">
        <div v-html="instructionModalContent[currentSlide]"></div>
        <div class="navigation-buttons">
          <div
            style="display: flex; justify-content: space-between; width: 100%"
          >
            <button
              @click="prevSlide"
              :disabled="currentSlide == 0"
              class="nav-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sebelum
            </button>
            <div>
              <button
                v-if="currentSlide === instructionModalContent.length - 1"
                @click="startTrainingTask"
                class="start-button"
              >
                Mulai Latihan
              </button>
              <button v-else @click="nextSlide" class="nav-button">
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        <p>
          Anda Telah menyelesaikan semua pelatihan, setelah ini, anda akan
          memulai test yang sesungguhnya. Pastikan kondisi anda dalam kondisi
          prima dan tanpa distraksi, test ini tidak dapat di pause.
        </p>
        <button @click="startTrainingTask">Mulai Test</button>
      </div>
    </div>
  </div>

  <div class="main-view" v-if="isConfigLoaded">
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <div class="text">submitting a result</div>
    </div>

    <div class="timer-container" v-if="showTimer">
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
        v-if="
          currentTrainingTask === 'colorTank' ||
          trainingCompleted ||
          currentTrainingTask == 'combined'
        "
      />

      <div class="horizon-section">
        <Horizon
          :isTimesUp="isTimesUp"
          :speed="config.horizon.speed"
          :isPause="isPauseHorizon"
          :isActive="config.horizon.is_active"
          @getResult="horizonResult"
          class="no-pointer-events"
          v-if="
            currentTrainingTask === 'horizon' ||
            trainingCompleted ||
            currentTrainingTask == 'combined'
          "
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
          v-if="
            currentTrainingTask === 'arithmetic' ||
            trainingCompleted ||
            currentTrainingTask == 'combined'
          "
        />
      </div>
    </div>
  </div>
  <button
    v-if="!trainingCompleted && !showInstructionModal"
    @click="endTrainingTask"
    class="finish-button"
  >
    Selesai Latihan dan Lanjutkan ke Tes Berikutnya
  </button>
</template>

<script>
import { getConfigs } from "@/utils/configs";
import Arithmetics from "./color-multitask/Arithmetics";
import ColorTank from "./color-multitask/ColorTank";
import Horizon from "./color-multitask/Horizon";
import {
  completeTrainingTestAndUpdateLocalStorage,
  removeTestByNameAndUpdateLocalStorage,
} from "@/utils/index";

export default {
  name: "MainView",
  components: {
    Arithmetics,
    ColorTank,
    Horizon,
  },
  data() {
    return {
      trainingCompleted: false,
      showTimer: false,
      showInstructionModal: false,
      currentTrainingTask: null,
      instructionModalContent: "",

      trainingTasks: ["colorTank", "horizon", "arithmetic", "combined"],

      isPauseArithmetics: false,
      isPauseColorTank: false,
      isPauseHorizon: false,
      configs: [],
      minuteTest: null,

      isLoading: false,
      timer: {
        minutes: 0,
        second: 0,
      },
      countdownInterval: null,
      isPause: false,
      isConfigLoaded: false,
      testId: null,
      config: {
        duration: null,
        subtask: {
          arithmetics: null,
          color_tank: null,
          horizon: null,
        },
        arithmetics: {
          difficulty: null, //easy, medium, difficult
          sound: null,
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
      currentSlide: 0,
    };
  },
  async mounted() {
    let reloadCount = parseInt(
      localStorage.getItem("reloadCountColorTankMultitask") || "0"
    );
    reloadCount++;
    localStorage.setItem(
      "reloadCountColorTankMultitask",
      reloadCount.toString()
    );

    window.addEventListener("beforeunload", () => {
      localStorage.setItem(
        "reloadCountColorTankMultitask",
        reloadCount.toString()
      );
    });
    const configData = getConfigs("color-multitask-test");
    this.testId = configData.testId;
    this.initConfig();
  },
  beforeUnmount() {
    clearInterval(this.countdownInterval);
  },
  computed: {
    isTimesUp() {
      return this.config.duration < 1;
    },
    formattedTime() {
      const minutes = Math.floor(this.config.duration / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (this.config.duration % 60).toString().padStart(2, "0");
      return `${minutes}:${seconds}`;
    },
  },
  methods: {
    nextSlide() {
      this.currentSlide++;
    },
    prevSlide() {
      this.currentSlide--;
    },
    initConfig() {
      try {
        let config = JSON.parse(localStorage.getItem("scheduleData"));

        if (config) {
          // @TODO: Config Flow
          this.configs = config.tests.find(
            (test) => test.testUrl === "color-multitask-test"
          ).configs;
          this.trainingCompleted =
            config.tests.find((test) => test.testUrl === "color-multitask-test")
              .trainingCompleted ?? false; //default false

          this.minuteTest = 0;
          for (const i in this.configs) {
            this.minuteTest += parseInt(this.configs[i].duration);
          }

          const colorMultitask = config.tests.find(
            (test) => test.testUrl === "color-multitask-test"
          ).configs[0];

          this.config.duration = colorMultitask.duration * 60;
          this.config.batteryTestId = config.testId;
          this.config.sessionId = config.sessionId;
          this.config.userId = config.userId;

          // Color Tank
          this.config.subtask.color_tank = colorMultitask.subtask.color_tank;
          if (this.config.subtask.color_tank) {
            this.config.color_tank.is_active = true;
            this.config.color_tank.negative_score =
              colorMultitask.color_tank.negative_score;
            this.config.color_tank.speed = colorMultitask.color_tank.speed;
            this.config.color_tank.colored_lower_tank =
              colorMultitask.color_tank.colored_lower_tank;
          }

          // Arithmetic
          this.config.subtask.arithmetics = colorMultitask.subtask.arithmetics;
          if (this.config.subtask.arithmetics) {
            this.config.arithmetics.is_active = true;
            this.config.arithmetics.sound = colorMultitask.arithmetics.sound;
            this.config.arithmetics.difficulty =
              colorMultitask.arithmetics.difficulty;
          }

          // Horizon
          this.config.subtask.horizon = colorMultitask.subtask.horizon;
          if (this.config.subtask.horizon) {
            this.config.horizon.is_active = true;
            this.config.horizon.speed = colorMultitask.horizon.speed;
          }

          this.isConfigLoaded = true;

          this.startSimulation();
        }
      } catch (error) {
        console.log(error, "error");
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
        this.showInstructionModal = true;
      }
    },
    startTraining() {
      this.currentTrainingTask = this.trainingTasks[0];
      this.showTrainingInstructions();
    },
    showTrainingInstructions() {
      const instructions = {
        arithmetic: [
          `<b>Arithmetic SubTask</b> <br> Seharusnya headset Anda sudah terpasang saat ini. Dengarkan pertanyaan dan berikan jawaban yang benar.
            <br> <br> <b>Contoh Pertanyaan:</b> <br> 2 + 3 = ? <br> <br> <b>Jawaban:</b> 5 <br> <br> <b>Contoh Pertanyaan:</b> <br> 4 - 1 = ? <br> <br> <b>Jawaban:</b> 3
            <img src="/devices/mwc_math.png" alt="Headset instruction" style="width: 200px; display: block; margin: 20px auto;">`,
        ],
        colorTank: [
          `<b>Color Tank Subtask</b> <br> Gambar dibawah adalah tangki air warna, Dimana pada kotak bawah (ASDF) terdapat 3 jenis air (warna berbeda) yang dialirkan dari empat tangki atas (QWER). Pada periode tertentu tangki bawah akan berkurang dan tugas Anda adalah mengisi Kembali dengan menekan tombol sebagai berikut:
Apabila tangki air warna kuning susut (tangki S dan D) maka Anda harus menekan tombol Q S D atau Q D S, Dimana tombol tangki atas harus di awal. maka Anda harus menekan tombol Q S D atau Q D S agar tangki bawah berwarna kuning terisi Kembali.`,
          `Contoh lain.

Contoh ini menunjukkan pengisian tangki warna hijau yaitu tangki F. Meski tangki hijau lain masih penuh (A dan D) Anda tetap diwajibkan menekan kombinasi 3 tombol, oleh karena itu Anda harus menekan tombol R D F atau R F D secara berurutan agar tangki warna hijau terisi Kembali. Tombol kombinasi lain agar tangki hijau F terisi Kembali juga dapat menggunakan kombinasi tombol R A F atau R F A.`,
        ],
        horizon: [
          "<b>Horizon SubTask</b> <br> Pada tugas ini Anda diharuskan menempatkan perpotongan garis horizontal dan vertikal tetap berwarna hijau selama mungkin. Tugas ini dikendalikan menggunakan JOYSTICK. Jika garis berwarna kuning, Anda harus secepatnya menempatkan Kembali titik tersebut (dengan mengarahkan joystick) untuk kembali ke tengah perpotongan garis agar warna berubah hijau kembali.",
        ],
        combined: [
          "<b>SubTask Kombinasi</b> <br> Peserta harus menjalankan semua subtask sebelumnya secara bersamaan.",
        ],
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
          case "colorTank":
            this.currentSlide = 0;
            this.startColorTankTraining();
            break;
          case "arithmetic":
            this.currentSlide = 0;
            this.startArithmeticTraining();
            break;
          case "horizon":
            this.currentSlide = 0;
            this.startHorizonTraining();
            break;
          case "combined":
            this.currentSlide = 0;
            this.startCombinedTraining();
            break;
        }
      }
    },
    startHorizonTraining() {
      this.config.duration = 1 * 60000; // basically forever until the user ends it

      this.isPauseHorizon = false;
      this.isPauseColorTank = true;
      this.isPauseArithmetics = true;

      this.config.horizon.is_active = true;
      this.config.arithmetics.is_active = false;
      this.config.color_tank.is_active = false;

      this.startCountdown();
    },
    startColorTankTraining() {
      this.config.duration = 1 * 60000; // basically forever until the user ends it

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
      this.config.duration = 1 * 60000; // basically forever until the user ends it

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
      this.config.duration = 1 * 60000; // basically forever until the user ends it

      this.isPauseArithmetics = false;
      this.isPauseColorTank = false;
      this.isPauseHorizon = false;

      this.config.arithmetics.is_active = true;
      this.config.color_tank.is_active = true;
      this.config.horizon.is_active = true;

      this.$refs.colorTankTaskRef?.initLowerTank();
      this.$refs.colorTankTaskRef?.initScore();
      this.$refs.colorTankTaskRef?.start();
      this.$refs.arithmeticTaskRef?.generateNumbers();

      this.startCountdown();
    },
    endTrainingTask() {
      // stop sound and reset the game
      // this.$refs.colorTankTaskRef.stop();
      // this.$refs.arithmeticTaskRef.reset();
      // this.$refs.horizonTaskRef.reset();

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

      completeTrainingTestAndUpdateLocalStorage("Multitasking With Color");
    },
    startActualTest() {
      this.showTimer = true;
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
      };
      this.config.duration = this.minuteTest * 60;
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
      if (
        confirm(
          "Apakah Anda yakin ingin keluar dari tes? Semua progres akan hilang."
        )
      ) {
        this.$router.push("module");
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
      this.result.arithmetics.avg_response_time =
        result.responseTime.toFixed(2);
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
          refreshCount: parseInt(
            localStorage.getItem("reloadCountColorTankMultitask")
          ),
          result: this.result,
        };

        const res = await fetch(`${API_URL}/api/submission`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error("Failed Submit Test");
        }
      } catch (error) {
        console.error(error), "error";
      } finally {
        this.isLoading = false;

        removeTestByNameAndUpdateLocalStorage("Multitasking With Color");
        localStorage.removeItem("reloadCountColorTankMultitask");
        this.$router.push("/module");
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
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 100%;
  background-color: white;
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
  background-color: #0349d0;
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

.no-pointer-events {
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* Add styles for answer highlighting */
:deep(.answer-button) {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  padding: 1rem;
  margin: 0.5rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

:deep(.answer-button.selected) {
  background-color: #4caf50;
  color: white;
  border-color: #45a049;
}

.finish-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 20px;
  font-size: 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
</style>
