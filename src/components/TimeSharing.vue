<template>
  <div v-if="showEndModal" class="modal">
    <div class="modal-content">
      <h2 v-if="actualTestCount == 0">Latihan Selesai</h2>
      <p v-if="actualTestCount >= 1">
        Tes pertama telah selesai, anda akan melakukan tes yang sama lagi untuk
        melihat perkembangan pemahaman Anda.
      </p>
      <p v-else>
        Anda telah menyelesaikan sesi latihan. Apakah Anda siap untuk memulai
        tes yang sebenarnya?
      </p>
      <button @click="startExam" class="button start-button">Mulai Tes</button>
    </div>
  </div>
  <div>
    <training-session v-if="isTraining" @training-completed="startExam" />
    <div v-else>
      <PlaneSimulator
        v-show="currentComponent === 'PlaneSimulator'"
        :config="config"
        @switch-task="switchTask"
        @test-finished="handleSubmitTest"
        :isTraining="isTraining"
        ref="planeSimulatorRef"
      />
      <MathTest
        v-show="currentComponent === 'MathTest'"
        :config="config"
        @question-result="handleQuestionResult"
        @test-finished="handleSubmitTest"
        ref="mathTestRef"
      />
    </div>
  </div>
</template>
<script>
import PlaneSimulator from "@/components/time-sharing/PlaneSimulator.vue";
import MathTest from "@/components/time-sharing/MathTest.vue";
import TrainingSession from "@/components/time-sharing/TrainingSession.vue";
import { getConfigs, getStoredIndices } from "@/utils/configs";
import { removeTestByNameAndUpdateLocalStorage } from "@/utils";
import { patchWorkstation } from "@/utils/fetch";

export default {
  name: "SimulatorParent",
  data() {
    return {
      isTraining: true,
      currentComponent: "PlaneSimulator",
      mathTestResults: [],
      userInputsMathTest: [],
      showEndModal: false,
      configs: [],
      trainingConfigs: [],
      indexConfig: 0,
      indexTrainingConfig: 0,
      actualTestCount: 0,
      tempFirstResult: null,
      config: {
        id: "",
        arithmetics: {
          frequency: "medium",
          complexity: "medium",
          output: "sound",
        },
        difficultyLevel: "Mudah",
        duration: "2",
        engine_sound: 40,
        navigation: {
          speed: "medium",
          density: "medium",
          control_perspective: "cockpit_crew",
        },
        observer: { speed: "medium", frequency: "medium" },
        subtask: { navigation: true, observer: true },
      },
      moduleId: "",
      sessionId: "",
      userId: "",
      testId: "",
    };
  },
  mounted() {
    this.initConfig();
  },
  methods: {
    initConfig() {
      const configData = getConfigs("time-sharing-test");
      if (!configData) {
        this.$router.push("/module");
        return;
      }
      this.configs = configData.configs;
      this.config = this.configs[0];
      this.testId = configData.testId;
      this.trainingConfigs = configData.trainingConfigs;
      this.moduleId = configData.moduleId;
      this.sessionId = configData.sessionId;
      this.userId = configData.userId;
      const savedIndices = getStoredIndices("index-config-call-sign");
      if (savedIndices) {
        this.indexTrainingConfig = savedIndices.indexTrainingConfig;
        this.indexConfig = savedIndices.indexConfig;
      }
      this.isModalTrainingVisible = true;
      this.setConfig(this.config);
    },
    startExam() {
      this.showEndModal = false;
      const updatePayload = {
        status: "IN_TESTING",
        name: "Time Sharing Test",
      };
      patchWorkstation(updatePayload);
      this.isTraining = false;
      this.setConfig(this.config);
      if (this.$refs.planeSimulatorRef) {
        this.$refs.planeSimulatorRef.initializeGame();
      }
    },
    setConfig(config) {
      this.$nextTick(() => {
        this.config = config;
      });
    },
    switchTask() {
      this.currentComponent =
        this.currentComponent === "PlaneSimulator"
          ? "MathTest"
          : "PlaneSimulator";
    },
    handleQuestionResult(result) {
      this.mathTestResults.push(result);
      this.userInputsMathTest.push({
        type: result.isCorrect ? "correct" : "wrong",
        responseTime: result.responseTime, // if missed, set response time to 1000ms
        timestamp: Date.now(),
      });
    },
    async handleSubmitTest(results) {
      this.actualTestCount++;
      if (this.actualTestCount < 2) {
        this.showEndModal = true;
        this.tempFirstResult = {
          ...results,
          mathTestResults: this.mathTestResults,
          graph_data: this.userInputsMathTest,
        };
        this.mathTestResults = [];
        this.userInputsMathTest = [];
      } else {
        const payload = {
          moduleId: this.moduleId,
          testSessionId: this.sessionId,
          userId: this.userId,
          batteryTestId: this.testId,
          result: this.tempFirstResult,
          result2: {
            ...results,
            mathTestResults: this.mathTestResults,
            graph_data: this.userInputsMathTest,
          },
        };

        try {
          if (this.isTrial) {
            this.$router.push("/module");
            return;
          }

          this.isLoading = true;

          const API_URL = process.env.VUE_APP_API_URL;
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

          removeTestByNameAndUpdateLocalStorage("Time Sharing Test 2023");
          localStorage.removeItem("reloadCountTimeSharing");
          this.$router.push("/module");
        }
        console.log("Submit test payload:", payload);
      }
    },
  },
  components: {
    PlaneSimulator,
    MathTest,
    TrainingSession,
  },
};
</script>

<style scoped>
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
</style>
