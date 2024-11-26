<template>
  <div class="training-container">
    <!-- Initial Instructions Modal -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>Instruksi Pelatihan PMA Test</h2>
        <div class="instruction-content">
          <h3>Perangkat yang Digunakan:</h3>
          <ul>
            <li>Joystick: Menggerakkan objek hijau secara horizontal dan vertikal</li>
            <li>Thruster: Mengatur kecepatan pergerakan objek</li>
            <li>Layar Sentuh: Menjawab pertanyaan dengan menyentuh opsi yang tersedia</li>
          </ul>
          <p>Durasi pelatihan: 1 menit untuk setiap bagian</p>
        </div>
        <button @click="startTraining" class="start-btn">Mulai Pelatihan</button>
      </div>
    </div>

    <div v-if="!showModal" class="training-content">
      <div class="timer" :style="{ backgroundColor: 'blue', color: 'white', padding: '10px', textAlign: 'center', borderRadius: '20px' }">
        Sisa Waktu: {{ formatTime(remainingTime) }}
      </div>

      <div class="test-content">
        <!-- Training Mode -->
        <template v-if="!isActualTest">
          <div v-if="currentStep === 'tracking'" class="tracking-section">
            <h3>Pelatihan Tracking</h3>
            <p>Gunakan joystick dan thruster untuk menggerakkan objek hijau ke posisi target</p>
            <TrackingTest @update-score="updateTrackingScore" :training-mode="true" />
          </div>

          <div v-if="currentStep === 'questions'" class="questions-section">
            <h3>Pelatihan Menjawab Pertanyaan</h3>
            <p>Pilih jawaban yang benar dengan menyentuh opsi yang tersedia</p>
            <div class="subtasks">
              <StringMemorization v-if="currentSubtask === 'string'" :training-mode="true" @update-score="updateStringScore" />
              <InformationOrdering v-if="currentSubtask === 'ordering'" :training-mode="true" @update-score="updateOrderingScore" />
              <AudioInformation v-if="currentSubtask === 'audio'" :training-mode="true" @update-score="updateAudioScore" />
            </div>
          </div>
        </template>

        <!-- Actual Test Mode -->
        <template v-else>
          <div class="subtasks">
            <StringMemorization v-if="currentSubtask === 'string'" :key="'string'" :training-mode="false" @update-score="updateStringScore" />
            <InformationOrdering v-if="currentSubtask === 'ordering'" :key="'ordering'" :training-mode="false" @update-score="updateOrderingScore" />
            <AudioInformation v-if="currentSubtask === 'audio'" :key="'audio'" :training-mode="false" @update-score="updateAudioScore" />
          </div>

          <div class="tracking-test">
            <TrackingTest :key="'tracking'" :training-mode="false" @update-score="updateTrackingScore" />
          </div>
        </template>
      </div>

      <div v-if="trainingComplete" class="completion-modal modal">
        <div class="modal-content">
          <h2>Pelatihan Selesai</h2>
          <p>Anda telah menyelesaikan sesi pelatihan. Siap untuk memulai tes yang sebenarnya?</p>
          <div class="button-group">
            <button @click="startActualTest" class="start-btn">Mulai Tes</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import TrackingTest from './TrackingTest.vue';
import StringMemorization from './StringMemory.vue';
import InformationOrdering from './InformationOrdering.vue';
import AudioInformation from './AudioInformation.vue';
import { removeTestByNameAndUpdateLocalStorage } from '@/utils';
import { getConfigs } from '@/utils/configs';

export default {
  name: 'PMATraining',
  components: {
    TrackingTest,
    StringMemorization,
    InformationOrdering,
    AudioInformation
  },
  setup() {
    const showModal = ref(true);
    const currentStep = ref('');
    const currentSubtask = ref('string');
    const remainingTime = ref(60);
    const trainingComplete = ref(false);
    const isActualTest = ref(false);
    const testId = ref('');
    const moduleId = ref('');
    const sessionId = ref('');
    const userId = ref('');

    const scores = ref({
      tracking: {
        circle_correct_position: 0,
        circle_wrong_position: 0,
        dot_correct_position: 0,
        dot_wrong_position: 0,
        pill_correct_position: 0,
        pill_wrong_position: 0
      },
      string: 0,
      ordering: 0,
      audio: 0
    });

    onMounted(() => {
      const trainingCompleted = localStorage.getItem('pmaTrainingCompleted');
      if (trainingCompleted === 'true') {
        window.location.href = '/pma-test';
        return;
      }

      const config = getConfigs('pma-test');
      if (config) {
        testId.value = config.testId
        moduleId.value = config.moduleId;
        sessionId.value = config.sessionId;
        userId.value = config.userId;
      }
    });

    let timer;

    const startTraining = () => {
      showModal.value = false;
      currentStep.value = 'tracking';  // Start with tracking training
      startTimer();
    };

    const startTimer = () => {
      const testData = getConfigs('pma-test')
      console.log(testData.configs, 'configs')
      // training time is 1minute
      if (!isActualTest.value){
      remainingTime.value = 60;
      } else {
        // sum duration of all configs array
        remainingTime.value = testData.configs.reduce((acc, curr) => acc + Number(curr.duration), 0) * 60; 
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
            if (currentStep.value === 'tracking') {
              currentStep.value = 'questions';
              startTimer();
            } else {
              trainingComplete.value = true;
            }
          }
        }
      }, 1000);
    };

    const startActualTest = () => {
      trainingComplete.value = false;
      isActualTest.value = true;
      currentSubtask.value = 'string';
      scores.value = {
        tracking: {
          circle_correct_position: 0,
          circle_wrong_position: 0,
          dot_correct_position: 0,
          dot_wrong_position: 0,
          pill_correct_position: 0,
          pill_wrong_position: 0
        },
        string: 0,
        ordering: 0,
        audio: 0
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
          isTraining: true
        };

        const res = await fetch(`${API_URL}/api/submission`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          throw new Error('Failed Submit Training');
        }

        localStorage.setItem('pmaTrainingCompleted', 'true');
        removeTestByNameAndUpdateLocalStorage('PMA Training');
        window.location.href = '/module';
      } catch (error) {
        console.error('Error submitting training results:', error);
      }
    };

    const updateTrackingScore = (score) => {
      scores.value.tracking = score;
    };

    const updateStringScore = (score) => {
      scores.value.string = score;
    };

    const updateOrderingScore = (score) => {
      scores.value.ordering = score;
    };

    const updateAudioScore = (score) => {
      scores.value.audio = score;
    };

    const formatTime = (time) => {
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    onUnmounted(() => {
      clearInterval(timer);
    });

    return {
      showModal,
      currentStep,
      currentSubtask,
      remainingTime,
      trainingComplete,
      isActualTest,
      startTraining,
      startActualTest,
      formatTime,
      updateTrackingScore,
      updateStringScore,
      updateOrderingScore,
      updateAudioScore
    };
  }
};
</script>

<style scoped>
.training-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  height: 100vh;
  position: relative; /* Added for absolute positioning context */
}

.timer {
  position: fixed; /* Changed to fixed */
  top: 20px; /* Added top spacing */
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 20px;
  font-size: 1.2em;
  font-weight: bold;
  width: 100%;
  max-width: 300px;
  z-index: 100; /* Ensure timer stays on top */
}

.test-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
  margin-bottom: 20px;
  padding-top: 80px; /* Added padding to account for fixed timer */
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
  max-width: 500px;
  width: 90%;
  text-align: center;
}

.instruction-content {
  margin: 1rem 0;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.start-btn {
  background-color: #4CAF50;
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
  right: 20px;
}

.test-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
  margin-top: 20px; /* Reduced top margin */
  padding-top: 20px; /* Reduced padding */
}

.tracking-section h3,
.questions-section h3 {
  margin-top: 20px;
  margin-bottom: 10px;
}

.tracking-section p,
.questions-section p {
  margin-bottom: 20px;
}

.subtasks {
  width: 100%;
  margin-bottom: 20px;
  margin-top: 30px;
}

.tracking-test {
  width: 100%;
}
</style>