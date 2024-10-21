<template>
  <div>
    <training-session v-if="isTraining" @training-completed="startExam" />
    <keep-alive v-else>
      <component
        :is="currentComponent"
        @switch-task="switchTask"
        @question-result="handleQuestionResult"
        :config="config"
        @test-finished="handleSubmitTest"
      />
    </keep-alive>
  </div>
</template>
<script>
import PlaneSimulator from '@/components/time-sharing/PlaneSimulator.vue';
import MathTest from '@/components/time-sharing/MathTest.vue';
import TrainingSession from '@/components/time-sharing/TrainingSession.vue';
import { getConfigs, getStoredIndices } from '@/utils/configs';
import { removeTestByNameAndUpdateLocalStorage } from '@/utils';

export default {
  name: 'SimulatorParent',
  data() {
    return {
      isTraining: true,
      currentComponent: 'PlaneSimulator',
      mathTestResults: [],
      userInputsMathTest: [],
      configs: [],
      trainingConfigs: [],
      indexConfig: 0,
      indexTrainingConfig: 0,
      config: {
        id:'',
        arithmetics: { frequency: "medium", complexity: "medium", output: "sound" },
        difficultyLevel: "Mudah",
        duration: "2",
        engine_sound: 40,
        navigation: { speed: "medium", density: "medium", control_perspective: "cockpit_crew" },
        observer: { speed: "medium", frequency: "medium" },
        subtask: { navigation: true, observer: true },
      },
      moduleId: '',
      sessionId: '',
      userId: '',
      testId: '',
    };
  },
  mounted() {
    this.initConfig();
  },
  methods: {
    initConfig() {
      const configData = getConfigs('time-sharing-test');
      if (!configData) {
        this.$router.push('/module');
        return;
      }
      this.configs = configData.configs;
      this.config = this.configs[0]; 
      this.testId = this.configs[0].id; 
      this.trainingConfigs = configData.trainingConfigs;
      this.moduleId = configData.moduleId;
      this.sessionId = configData.sessionId;
      this.userId = configData.userId;
      const savedIndices = getStoredIndices('index-config-call-sign');
      if (savedIndices) {
        this.indexTrainingConfig = savedIndices.indexTrainingConfig;
        this.indexConfig = savedIndices.indexConfig;
      }
      this.isModalTrainingVisible = true;
      // this.setConfig(getCurrentConfig(this.configs, this.trainingConfigs, this.indexTrainingConfig, this.indexConfig));
      this.setConfig(this.config);
    },
    startExam() {
      this.isTraining = false;
      this.setConfig(this.config);
    },
    setConfig(config) {
      this.$nextTick(() => {
        console.log('Current config:', config);
        this.config = config;
        this.testId = config.id;
      });
    },
    switchTask() {
      this.currentComponent = this.currentComponent === 'PlaneSimulator' ? 'MathTest' : 'PlaneSimulator';
    },
    handleQuestionResult(result) {
      this.mathTestResults.push(result);
      this.userInputsMathTest.push({
        type: result.isCorrect ? 'correct' : 'wrong',
        responseTime: result.responseTime, // if missed, set response time to 1000ms
        timestamp: Date.now(),
      });
      console.log('Question result:', result);
      // You can process or store the results as needed
    },
    async handleSubmitTest(results) {
      const payload = {
        moduleId: this.moduleId,
        testSessionId: this.sessionId,
        userId: this.userId,
        batteryTestConfigId: this.testId,
        result: {
          mathTestResults: this.mathTestResults,
          graph_data: this.userInputsMathTest,
          ...results,
        },
      }
      try {
        if (this.isTrial) {
          this.$router.push('/module');
          return;
        }

        this.isLoading = true;

        const API_URL = process.env.VUE_APP_API_URL;
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

        removeTestByNameAndUpdateLocalStorage('time-sharing-test');
        localStorage.removeItem('reloadCountTimeSharing');
        this.$router.push('/module');
      }
      console.log('Submit test payload:', payload);
    }
  },
  components: {
    PlaneSimulator,
    MathTest,
    TrainingSession,
  }
};
</script>