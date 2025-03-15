<template>
  <div class="training-session">
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>
          {{
            currentTask.charAt(0).toUpperCase() + currentTask.slice(1)
          }}
          Training
        </h2>
        <p v-html="getInstructions()" class="flex flex-col items-center"></p>
        <div class="flex space-x-4 items-center justify-end">
          <button @click="startTraining" class="button start-button">
            Mulai Latihan
          </button>
        </div>
      </div>
    </div>
    <div v-else-if="showEndModal" class="modal">
      <div class="modal-content">
        <h2>Latihan Selesai</h2>
        <p>
          Anda telah menyelesaikan sesi latihan. Apakah Anda siap untuk memulai
          tes yang sebenarnya?
        </p>
        <button @click="startActualTest" class="button start-button">
          Mulai Tes
        </button>
      </div>
    </div>
    <KeepAlive v-else>
      <component :is="getComponentForTask(currentTask)" :config="getConfigForTask(currentTask)" :isTrainingMode="true"
        @test-finished="handleTrainingFinished" :isCombined="isCombined">
      </component>
    </KeepAlive>
  </div>

  <button @click="handleTrainingFinished" class="finish-button">
    Selesai Latihan
  </button>
</template>

<script>
import PlaneSimulator from "./PlaneSimulator.vue";
import MathTest from "./MathTest.vue";
import {
  checkIfTrainingTestCompleted,
  completeTrainingTestAndUpdateLocalStorage,
} from "@/utils";

export default {
  name: "TrainingSession",
  components: {
    PlaneSimulator,
    MathTest,
  },
  data() {
    return {
      trainingTasks: ["navigation", "math", "instrument", "combined"],
      currentTaskIndex: 0,
      showModal: true,
      showEndModal: false,
      remainingTime: 99999, // 1 minute
      timerInterval: null,
      isCombined: false,
    };
  },
  computed: {
    currentTask() {
      return this.trainingTasks[this.currentTaskIndex];
    },
  },
  mounted() {
    const completed = checkIfTrainingTestCompleted("Time Sharing Test 2023");
    window.addEventListener("keydown", this.handleKeydown);
    if (completed) {
      this.$emit("training-completed");
    }
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.handleKeydown);
  },
  methods: {
    getInstructions() {
      const instructions = {
        navigation:
          'Anda diminta untuk mengarahkan pesawat untuk menghindari tabrakan dengan balok yang ada menggunakan keyboard (A atau D). Jika pesawat mengalami tabrakan, maka anda harus mengarahkan pesawat untuk menghindar.<img src="devices/tst_1.png"/>',
        math: 'Pada latihan ini, anda diminta untuk menjawab soal perhitungan dasar dengan cara menyentuh layar. (Contoh: 20 – 3, maka anda harus menjawab 17)<img src="devices/tst_2.png"/>',
        instrument:
          'Anda diminta untuk merespon Instrumen yang indikatornya berwarna MERAH dengan menekan huruf (C N V B) pada KEYBOARD.<img src="devices/tst_3.png"/>',
        combined:
          "Latih semua sub-tugas secara bersamaan. Gunakan tombol SPASI untuk beralih mengerjakan tugas MATH TRAINING",
      };
      return instructions[this.currentTask] || "";
    },
    startTraining() {
      this.showModal = false;
      if (this.currentTask === 'combined') {
        this.currentTaskIndex = 1;
        setTimeout(() => {
          this.currentTaskIndex = 3;
        }, 1);

      }
      this.startTimer();
    },
    handleCancel() {
      this.showModal = false;
      this.$router.replace("/module");
    },
    startTimer() {
      this.timerInterval = setInterval(() => {
        if (this.remainingTime > 0) {
          this.remainingTime--;
        } else {
          this.handleTrainingFinished();
        }
      }, 1000);
    },
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    },
    getConfigForTask(task) {
      const baseConfig = {
        duration: 99999,
        navigation: {
          speed: "very_slow",
          density: "very_low",
          control_perspective: "cockpit_crew",
        },
        observer: { speed: "medium", frequency: "medium" },
        arithmetics: {
          frequency: "medium",
          complexity: "medium",
          output: "sound_and_visual",
        },
      };

      const taskConfigs = {
        navigation: {
          ...baseConfig,
          subtask: { navigation: true, observer: false },
        },
        instrument: {
          ...baseConfig,
          subtask: { navigation: false, observer: true },
        },
        math: baseConfig,
        combined: {
          ...baseConfig,
          subtask: { navigation: true, observer: true },
        },
      };

      return taskConfigs[task] || baseConfig;
    },

    getComponentForTask(task) {
      if (task === "math") {
        return "MathTest";
      }
      return "PlaneSimulator";
    },
    handleTrainingFinished() {
      clearInterval(this.timerInterval);
      if (this.isCombined) {
        this.showEndModal = true;
        return completeTrainingTestAndUpdateLocalStorage(
          "Time Sharing Test 2023"
        );
      }
      this.currentTaskIndex++;
      if (this.currentTaskIndex === 3) {
        this.isCombined = true;
      }
      if (this.currentTaskIndex < this.trainingTasks.length) {
        this.showModal = true;
        this.remainingTime = 99999;
      } else {
        this.showEndModal = true;
        completeTrainingTestAndUpdateLocalStorage("Time Sharing Test 2023");
      }
    },
    startActualTest() {
      this.showEndModal = false;
      this.$emit("training-completed");
    },
    handleSwitchTask() {
      if (this.currentTask === "combined" || (this.currentTask === "math" && this.isCombined)) {
        this.currentTaskIndex = this.currentTaskIndex === 3 ? 1 : 3;
      }
    },
    handleKeydown(event) {
      if (event.key === " ") this.handleSwitchTask();
    }
  },
};
</script>

<style scoped>
.training-session {
  position: relative;
  width: 100%;
  height: 100%;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.modal-content h2 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
  color: #333;
}

.modal-content p {
  margin-bottom: 1.5rem;
  font-size: 1rem;
  color: #666;
  line-height: 1.5;
}

.button {
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.start-button {
  background-color: #4caf50;
}

.start-button:hover {
  background-color: #45a049;
}

.cancel-button {
  background-color: #af4c4c;
}

.cancel-button:hover {
  background-color: #af4c4c;
}

.timer {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 1rem;
}
</style>
