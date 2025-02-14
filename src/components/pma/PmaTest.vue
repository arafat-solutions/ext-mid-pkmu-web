<template>
  <div class="training-container">
    <!-- Initial Instructions Modal -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>LATIHAN</h2>
        <div class="instruction-content">
          <h3>Perangkat yang Digunakan:</h3>
          <p>
            Joystick: Menggerakkan objek dot, Thruster: Mengatur Ukuran
            lingkaran, Layar Sentuh: Menjawab pertanyaan
          </p>
        </div>
        <button @click="startTraining" class="start-btn">Mulai latihan</button>
      </div>
    </div>

    <div v-if="!showModal" class="training-content">
      <!-- Tracking Joystick Instructions Modal -->
      <div
        v-if="currentStep === 'tracking_joystick' && showModalJoystick"
        class="modal"
      >
        <div class="modal-content">
          <h2>LATIHAN JOYSTICK</h2>

          <div class="instruction-content">
            <p>
              Gunakan joystick untuk menggerakkan objek dot ke dalam lingkaran
            </p>
            <p>
              Objek dot secara otomatis akan berusaha bergerak kearah luar
              lingkaran
            </p>
            <p>
              Tugas anda adalah mengontrol objek dot untuk selalu berada di
              dalam lingkaran dengan menggerakan joystick
            </p>
          </div>
          <img :src="'devices/joystick.png'" class="center" alt="Joystick" />
          <img
            :src="'devices/joystick_example.png'"
            class="center"
            alt="Joystick"
          />
          <button @click="startTrackingJoystick" class="start-btn">
            Mulai latihan Joystick
          </button>
        </div>
      </div>

      <!-- Tracking Thruster Instructions Modal -->
      <div
        v-if="currentStep === 'tracking_thruster' && showModalThruster"
        class="modal"
      >
        <div class="modal-content">
          <h2>LATIHAN THRUSTER & PEDAL</h2>
          <div class="instruction-content">
            <p>
              Gunakan thruster untuk mengatur ukuran dari lingkaran tanpa putus.
            </p>
            <p>Ukuran lingkaran putus-putus akan bergerak secara automatis.</p>
            <p>
              Tugas anda adalah merubah ukuran lingkaran tanpa putus, mengikuti
              ukuran lingkaran putus-putus.
            </p>
          </div>
          <img :src="'devices/thruster.png'" class="center" alt="thruster" />
          <img :src="'devices/pedal.png'" class="center" alt="pedal" />
          <button @click="startTrackingThruster" class="start-btn">
            Mulai latihan Thruster
          </button>
        </div>
      </div>

      <div v-if="currentStep === 'string' && showModalString" class="modal">
        <div class="modal-content">
          <h2>LATIHAN MEMORI</h2>

          <div class="instruction-content">
            <div
              style="
                display: flex;
                justify-content: center;
                width: 100%;
                margin-top: 4px;
                margin-bottom: 4px;
              "
            >
              <img
                :src="'devices/memory_pre.png'"
                class="center"
                alt="Joystick"
              />
            </div>
            <p>
              Perhatikan deret aplhanumeric, pada contoh <b>7506AMOV</b> dan
              anda harus mengingat deret tersebut. <br />Setelah beberapa saat,
              deret tersebut tertutup dan disajikan pilihan jawaban. Tugas anda
              adalah menentukan huruf dan angka mana yang terkandung pada deret
              alphanumeric yang telah anda ingat sebelumnya.
            </p>

            <div
              style="
                display: flex;
                justify-content: center;
                width: 100%;
                margin-top: 4px;
                margin-bottom: 4px;
              "
            >
              <img :src="'devices/memory.png'" class="center" alt="Joystick" />
            </div>
            <p>Dari contoh diatas, jawaban yang benar adalah <b>7506</b></p>
          </div>
          <button @click="startString" class="start-btn">
            Mulai latihan Memory
          </button>
        </div>
      </div>

      <div v-if="currentStep === 'audio' && showModalAudio" class="modal">
        <div class="modal-content">
          <h3>Gunakan Headphone yang tersedia!</h3>
          <h2>LATIHAN MEMORI</h2>

          <button @click="startAudio" class="start-btn">
            Mulai latihan Audio
          </button>
        </div>
      </div>

      <!-- Combined Training Instructions Modal -->
      <div
        v-if="currentStep === 'combined_training' && showModalCombined"
        class="modal"
      >
        <div class="modal-content">
          <h2>LATIHAN GABUNGAN</h2>

          <div class="instruction-content">
            <p>Lakukan semua tugas latihan secara bersamaan</p>
          </div>
          <button @click="startCombinedTraining" class="start-btn">
            Mulai latihan Gabungan
          </button>
        </div>
      </div>

      <div class="test-content">
        <!-- Training Mode -->
        <template v-if="!isActualTest">
          <div
            v-if="currentStep === 'tracking_joystick'"
            class="tracking-section"
          >
            <h3>LATIHAN JOYSTICK</h3>
            <TrackingTest
              @update-score="updateTrackingScore"
              :training-mode="true"
              :current-training="'joystick'"
              :isActualTest="isActualTest"
            />
          </div>

          <div
            v-if="currentStep === 'tracking_thruster'"
            class="tracking-section"
          >
            <h3>LATIHAN THRUSTER</h3>
            <TrackingTest
              @update-score="updateTrackingScore"
              :training-mode="true"
              :current-training="'thruster'"
              :isActualTest="isActualTest"
            />
          </div>

          <div
            v-if="currentStep === 'string'"
            class="combined-training-section"
          >
            <div class="subtasks">
              <StringMemorization
                v-if="currentSubtask === 'string'"
                :training-mode="true"
                @update-score="updateStringScore"
                :isActualTest="isActualTest"
              />
            </div>
          </div>

          <div v-if="currentStep === 'audio'" class="combined-training-section">
            <div class="subtasks">
              <AudioInformation
                v-if="currentSubtask === 'audio'"
                :training-mode="true"
                @update-score="updateStringScore"
              />
            </div>
          </div>

          <div
            v-if="currentStep === 'combined_training'"
            class="combined-training-section"
          >
            <h3>latihan Gabungan</h3>

            <div class="subtasks">
              <StringMemorization
                v-if="currentSubtask === 'string'"
                :key="'string'"
                :training-mode="true"
                @update-score="updateStringScore"
                :isActualTest="isActualTest"
              />
            </div>

            <div class="tracking-test">
              <TrackingTest
                @update-score="updateTrackingScore"
                :training-mode="true"
                :current-training="'all'"
                :isActualTest="isActualTest"
              />
            </div>
          </div>

          <!-- Single, consistently placed next button for all training steps -->
          <!-- <div class="next-button-container"> -->
          <button @click="nextStep" class="start-btn">Berikutnya</button>
          <!-- </div> -->
        </template>

        <!-- Actual Test Mode -->
        <template v-else>
          <div class="timer">Sisa Waktu: {{ formatTime(remainingTime) }}</div>
          <div class="subtasks">
            <StringMemorization
              v-if="currentSubtask === 'string'"
              :key="'string'"
              :training-mode="false"
              @update-score="updateStringScore"
              :isActualTest="isActualTest"
            />
            <AudioInformation
              v-if="currentSubtask === 'audio'"
              :key="'audio'"
              :training-mode="false"
              @update-score="updateAudioScore"
            />
          </div>

          <div class="tracking-test">
            <TrackingTest
              :key="'tracking'"
              :training-mode="false"
              :current-training="'all'"
              @update-score="updateTrackingScore"
              :isActualTest="isActualTest"
            />
          </div>
        </template>
      </div>

      <div v-if="trainingComplete" class="completion-modal modal">
        <div class="modal-content">
          <h2>latihan Selesai</h2>
          <p>
            Anda telah menyelesaikan sesi latihan. Siap untuk memulai tes yang
            sebenarnya?
          </p>
          <div class="button-group">
            <button @click="startActualTest" class="start-btn">
              Mulai Tes
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";
import TrackingTest from "./TrackingTest.vue";
import StringMemorization from "./StringMemory.vue";
import AudioInformation from "./AudioInformation.vue";
import { removeTestByNameAndUpdateLocalStorage } from "@/utils";
import { getConfigs } from "@/utils/configs";

export default {
  name: "PMATraining",
  components: {
    TrackingTest,
    StringMemorization,
    AudioInformation,
  },
  setup() {
    const showModal = ref(true);
    const showModalJoystick = ref(false);
    const showModalThruster = ref(false);
    const showModalCombined = ref(false);
    const showModalString = ref(false);
    const showModalAudio = ref(false);
    const currentStep = ref("");
    const currentSubtask = ref("string");
    const remainingTime = ref(60);
    const trainingComplete = ref(false);
    const isActualTest = ref(false);
    const testId = ref("");
    const moduleId = ref("");
    const sessionId = ref("");
    const userId = ref("");

    const scores = ref({
      tracking: {
        circle_correct_position: 0,
        circle_wrong_position: 0,
        dot_correct_position: 0,
        dot_wrong_position: 0,
        pill_correct_position: 0,
        pill_wrong_position: 0,
      },
      string: 0,
      audio: 0,
    });

    onMounted(() => {
      const trainingCompleted = localStorage.getItem("pmaTrainingCompleted");
      if (trainingCompleted === "true") {
        window.location.href = "/pma-test";
        return;
      }

      const config = getConfigs("pma-test");
      if (config) {
        testId.value = config.testId;
        moduleId.value = config.moduleId;
        sessionId.value = config.sessionId;
        userId.value = config.userId;
      }
    });

    let timer;

    const startTraining = () => {
      showModal.value = false;
      currentStep.value = "tracking_joystick";
      showModalJoystick.value = true;
      startTimer();
    };

    const startTrackingJoystick = () => {
      showModalJoystick.value = false;
    };

    const startTrackingThruster = () => {
      showModalThruster.value = false;
    };

    const startString = () => {
      showModalString.value = false;
    };

    const startAudio = () => {
      showModalAudio.value = false;
    };

    const startCombinedTraining = () => {
      showModalCombined.value = false;
    };

    const startTimer = () => {
      const testData = getConfigs("pma-test");
      if (!isActualTest.value) {
        remainingTime.value = 99999999;
      } else {
        remainingTime.value =
          testData.configs.reduce(
            (acc, curr) => acc + Number(curr.duration),
            0
          ) * 60;
      }
      clearInterval(timer);

      timer = setInterval(() => {
        if (remainingTime.value > 0) {
          remainingTime.value--;
        } else {
          clearInterval(timer);
          if (isActualTest.value) {
            submit();
          } else {
            if (currentStep.value === "tracking_joystick") {
              currentStep.value = "tracking_thruster";
              showModalThruster.value = true;
              startTimer();
            } else if (currentStep.value === "tracking_thruster") {
              currentStep.value = "combined_training";
              showModalCombined.value = true;
              startTimer();
            } else {
              trainingComplete.value = true;
            }
          }
        }
      }, 1000);
    };

    const startActualTest = () => {
      showModalCombined.value = false;
      trainingComplete.value = false;
      isActualTest.value = true;
      currentSubtask.value = "string";

      scores.value = {
        tracking: {
          circle_correct_position: 0,
          circle_wrong_position: 0,
          dot_correct_position: 0,
          dot_wrong_position: 0,
          pill_correct_position: 0,
          pill_wrong_position: 0,
        },
        string: 0,
        audio: 0,
      };
      startTimer();
    };

    const submit = async () => {
      try {
        const API_URL = process.env.VUE_APP_API_URL;
        const payload = {
          testSessionId: sessionId.value,
          userId: userId.value,
          batteryTestId: testId.value,
          result: scores.value,
          isTraining: true,
        };

        const res = await fetch(`${API_URL}/api/submission`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error("Failed Submit Training");
        }

        localStorage.removeItem("pmaTrainingCompleted");
        removeTestByNameAndUpdateLocalStorage("PMA Test");
        window.location.href = "/module";
      } catch (error) {
        console.error("Error submitting training results:", error);
      }
    };

    const updateTrackingScore = (score) => {
      scores.value.tracking = score;
    };

    const updateStringScore = (score) => {
      scores.value.string = score;
    };

    const updateAudioScore = (score) => {
      scores.value.audio = score;
    };

    const formatTime = (time) => {
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    };

    const nextStep = () => {
      clearInterval(timer);
      if (currentStep.value === "tracking_joystick") {
        currentStep.value = "tracking_thruster";
        showModalThruster.value = true;
        startTimer();
      } else if (currentStep.value === "tracking_thruster") {
        currentStep.value = "string";
        showModalString.value = true;
        startTimer();
      } else if (currentStep.value === "string") {
        currentStep.value = "combined_training";
        showModalCombined.value = true;
        startTimer();
      } else if (currentStep.value === "combined_training") {
        trainingComplete.value = true;
      }
    };

    onUnmounted(() => {
      clearInterval(timer);
    });

    return {
      showModal,
      showModalJoystick,
      showModalThruster,
      showModalString,
      showModalAudio,
      showModalCombined,
      currentStep,
      currentSubtask,
      remainingTime,
      trainingComplete,
      isActualTest,
      startTraining,
      startTrackingJoystick,
      startTrackingThruster,
      startString,
      startAudio,
      startCombinedTraining,
      startActualTest,
      formatTime,
      updateTrackingScore,
      updateStringScore,
      updateAudioScore,
      nextStep,
    };
  },
};
</script>

<style scoped>
.training-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  height: 100vh;
  position: relative;
}

.timer {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: blue;
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  z-index: 100;
  font-size: 1.2em;
  font-weight: bold;
  text-align: center;
}

.test-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
  margin-bottom: 20px;
  padding-top: 80px;
}

.subtasks {
  width: 100%;
  margin-bottom: 20px;
  margin-top: 50px;
}

.tracking-test {
  width: 100%;
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
  padding: 2rem;
  border-radius: 10px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.start-btn {
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
}

.start-btn:hover {
  background-color: #45a049;
}

.next-button-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
}

.next-btn {
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.next-btn:hover {
  background-color: #45a049;
}

.completion-modal {
  display: flex;
  justify-content: center;
  align-items: center;
}

.completion-modal .modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.completion-modal .modal-content button {
  margin-top: 1rem;
}

.tracking-section {
  width: 100%;
}

.combined-training-section {
  width: 100%;
}

h2 {
  margin-bottom: 1rem;
}

h3 {
  margin-bottom: 1rem;
}

ul {
  margin-bottom: 1rem;
}

li {
  margin-bottom: 0.5rem;
}

@media (min-width: 768px) {
  .training-container {
    padding: 40px;
  }

  .timer {
    top: 30px;
    right: -700px;
    font-size: 1.5em;
  }

  .modal-content {
    padding: 3rem;
  }

  .button-group {
    gap: 2rem;
  }

  .start-btn {
    padding: 15px 30px;
    font-size: 1.2rem;
  }

  .next-btn {
    padding: 15px 30px;
    font-size: 1.2rem;
  }

  .completion-modal .modal-content button {
    margin-top: 2rem;
  }

  h2 {
    margin-bottom: 1rem;
  }

  h3 {
    margin-bottom: 1rem;
  }

  ul {
    margin-bottom: 2rem;
  }

  li {
    margin-bottom: 1rem;
  }
}

.paragraph {
  font-size: 20px;
}

.modal-content {
  font-size: 24px;
}
.instruction-content {
  font-size: 20px;
}
</style>
