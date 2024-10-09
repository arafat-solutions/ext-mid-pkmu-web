<template>
  <div class="pma-test-container">
    <div class="timer"
      :style="{ backgroundColor: 'blue', color: 'white', padding: '10px', textAlign: 'center', borderRadius: '20px' }">
      Time Remaining: {{ formatTime(remainingTime) }}
    </div>

    <div class="test-content">
      <div class="subtasks">
        <StringMemorization v-if="currentSegment === 1" :key="'string'" @update-score="updateStringScore" />
        <InformationOrdering v-if="currentSegment === 2" :key="'ordering'" @update-score="updateOrderingScore" />
        <AudioInformation v-if="currentSegment === 3" :key="'audio'" @update-score="updateAudioScore" />
      </div>

      <div class="tracking-test">
        <TrackingTest :key="'tracking'" @update-score="updateTrackingScore" />
      </div>
    </div>

    <div class="score-display">
      <div>Circle Time - Blue: {{ scores.tracking.blueTime.toFixed(1) }}s, Red: {{ scores.tracking.redTime.toFixed(1)
        }}s</div>
      <div>Dot Time - Green: {{ scores.tracking.greenTime.toFixed(1) }}s, Red: {{ scores.tracking.dotRedTime.toFixed(1)
        }}s</div>
    </div>

    <button @click="submitTest" :disabled="!testFinished">Submit Test</button>
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
  name: 'PMATest',
  components: {
    TrackingTest,
    StringMemorization,
    InformationOrdering,
    AudioInformation
  },
  data() {
    return {
      isLoading: false,
      isTrial: false,
      config: {
       
      },
      
    };
  },
  setup() {
    const testDuration = 0.5 * 60; // 3 minutes in seconds
    const remainingTime = ref(testDuration);
    const currentSegment = ref(1);
    const segmentDuration = testDuration / 3;
    const testFinished = ref(false);
    const testId = ref('');
    const moduleId = ref('');
    const sessionId = ref('');
    const userId = ref('');
    const configTest = ref({});
    

    const scores = ref({
      tracking: { blueTime: 0, redTime: 0, greenTime: 0, dotRedTime: 0 },
      string: 0,
      ordering: 0,
      audio: 0
    });

    const config = getConfigs('pma-test');
    if (!config) {
      this.$router.push('/module');
      return;
    }
    configTest.value = config.configs[0];
    testId.value = config.configs[0].id;
    moduleId.value = config.moduleId;
    sessionId.value = config.sessionId;
    userId.value = config.userId;
    
    const updateTrackingScore = (newScores) => {
      console.log('Tracking scores updated:', newScores);
      scores.value.tracking = newScores;
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

    const submitTest = async () => {
      console.log('Test submitted with scores:', scores.value);
      try {
        const API_URL = process.env.VUE_APP_API_URL;
        const payload = {
          testSessionId: sessionId.value,
          userId: userId.value,
          batteryTestConfigId: testId.value,
          result: scores.value,
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

        removeTestByNameAndUpdateLocalStorage('PMA Test');
        localStorage.removeItem('reloadCountRadarVigilance');
        this.$router.push('/module');
      }
    };

    let timer;
    onMounted(() => {
      timer = setInterval(() => {
        if (remainingTime.value > 0) {
          remainingTime.value--;
          if (remainingTime.value % segmentDuration === 0 && currentSegment.value < 3) {
            currentSegment.value++;
          }
        } else {
          clearInterval(timer);
          submitTest();
          testFinished.value = true;
        }
      }, 1000);
    });

    onUnmounted(() => {
      clearInterval(timer);
    });

    return {
      remainingTime,
      currentSegment,
      testFinished,
      formatTime,
      updateTrackingScore,
      updateStringScore,
      updateOrderingScore,
      updateAudioScore,
      submitTest,
      scores
    };
  }
};
</script>

<style scoped>
.pma-test-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  height: 100vh;
}

.timer {
  margin-bottom: 20px;
  font-size: 1.2em;
  font-weight: bold;
  width: 100%;
  max-width: 300px;
}

.test-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
  margin-bottom: 20px;
}

.subtasks {
  width: 100%;
  margin-bottom: 20px;
  margin-top: 50px;
}

.tracking-test {
  width: 100%;
}

.score-display {
  margin-top: 500px;
  text-align: center;
}

button {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 1em;
  cursor: pointer;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>