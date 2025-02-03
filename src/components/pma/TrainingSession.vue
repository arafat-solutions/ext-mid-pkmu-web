<template>
  <div class="training-container">
    <!-- Training Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h2 class="modal-title">{{ currentTraining.title }}</h2>
        <div class="modal-description">
          <p>{{ currentTraining.description }}</p>
          <div class="training-progress">
            Step {{ currentStep + 1 }} of 4
          </div>
        </div>
        <div class="modal-controls">
          <button 
            v-if="currentStep > 0" 
            class="nav-btn" 
            @click="handlePrevStep"
          >
            Previous
          </button>
          <button 
            class="start-btn" 
            @click="closeModal"
          >
            {{ currentStep === 3 ? 'Start Final Test' : 'Start Training' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Training Content -->
    <div v-if="!showModal" class="training-content">
      <TrackingTest
        :training-mode="true"
        :training-type="currentTraining.type"
        :duration="currentTraining.duration"
        @training-complete="handleNextStep"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import TrackingTest from './TrackingTest.vue';

export default {
  name: 'TrackingTraining',
  components: {
    TrackingTest
  },
  emits: ['training-complete'],
  setup(props, { emit }) {
    const currentStep = ref(0);
    const showModal = ref(true);

    const trainingSteps = [
      {
        type: 'circle',
        title: 'Circle Size Matching Training',
        description: 'Dalam latihan ini, Anda akan berlatih menyesuaikan ukuran lingkaran biru dengan lingkaran referensi putus-putus. Gunakan throttle untuk mengatur ukuran lingkaran. Usahakan untuk menjaga lingkaran tetap biru (menunjukkan ukuran yang tepat) selama mungkin. Durasi: 30 detik.',
        duration: 30
      },
      {
        type: 'dot',
        title: 'Dot Tracking Training',
        description: 'Dalam latihan ini, Anda akan berlatih mengendalikan titik agar tetap berada di dalam lingkaran. Gunakan joystick untuk mengontrol posisi titik. Titik akan berwarna hijau saat berada di dalam lingkaran dan merah saat di luar. Usahakan untuk menjaga titik tetap hijau selama mungkin. Durasi: 30 detik.',
        duration: 30
      },
      {
        type: 'pill',
        title: 'Pill Rotation Training',
        description: 'Dalam latihan ini, Anda akan berlatih menyesuaikan rotasi pil dengan zona target. Gunakan pedal untuk mengontrol rotasi. Pil akan berwarna kuning saat sejajar dengan benar dan merah saat tidak sejajar. Durasi: 30 detik.',
        duration: 30
      },
      {
        type: 'combined',
        title: 'Combined Tracking Test',
        description: 'Sekarang Anda akan berlatih ketiga tugas secara bersamaan: menyesuaikan ukuran lingkaran, menjaga titik tetap di dalam, dan menyelaraskan pil. Ini adalah latihan terakhir Anda sebelum tes yang sebenarnya. Durasi: 60 detik.',
        duration: 60
      }
    ];

    const currentTraining = computed(() => trainingSteps[currentStep.value]);

    const closeModal = () => {
      showModal.value = false;
    };

    const handleNextStep = () => {
      if (currentStep.value < trainingSteps.length - 1) {
        currentStep.value++;
        showModal.value = true;
      } else {
        emit('training-complete');
      }
    };

    const handlePrevStep = () => {
      if (currentStep.value > 0) {
        currentStep.value--;
        showModal.value = true;
      }
    };

    return {
      showModal,
      currentStep,
      currentTraining,
      closeModal,
      handleNextStep,
      handlePrevStep
    };
  }
};
</script>

<style scoped>
.modal-overlay {
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
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #333;
}

.modal-description {
  margin-bottom: 1.5rem;
  color: #666;
  line-height: 1.6;
}

.training-progress {
  margin-top: 1rem;
  font-weight: bold;
  color: #4CAF50;
}

.modal-controls {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
}

.start-btn {
  background-color: #4CAF50;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.nav-btn {
  background-color: #666;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.start-btn:hover {
  background-color: #45a049;
}

.nav-btn:hover {
  background-color: #555;
}

.training-container {
  width: 100%;
  height: 100%;
}

.training-content {
  height: 100%;
}
</style>