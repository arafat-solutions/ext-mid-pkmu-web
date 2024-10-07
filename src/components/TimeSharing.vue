<template>
  <div>
    <keep-alive>
      <component :is="currentComponent" @switch-task="switchTask" @question-result="handleQuestionResult"
        :config="config" @test-finished="handleSubmitTest" />
    </keep-alive>
  </div>
</template>

<script>
import PlaneSimulator from '@/components/time-sharing/PlaneSimulator.vue';
import MathTest from '@/components/time-sharing/MathTest.vue';
import { getConfigs, getCurrentConfig, getStoredIndices } from '@/utils/configs';
import { removeTestByNameAndUpdateLocalStorage } from '@/utils';

export default {
  name: 'SimulatorParent',
  data() {
    return {
      currentComponent: 'PlaneSimulator',
      mathTestResults: [],
      userInputsMathTest: [],
      configs: [],
      trainingConfigs: [],
      indexConfig: 0,
      indexTrainingConfig: 0,
      config: {
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
  methods: {
    mounted() {
      this.initConfig()
    },
    initConfig() {
      const configData = getConfigs('time-sharing-test');
      if (!configData) {
        this.$router.push('/module');
        return;
      }
      this.configs = configData.configs;
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
      this.setConfig(getCurrentConfig(this.configs, this.trainingConfigs, this.indexTrainingConfig, this.indexConfig));
    },
    setConfig(config) {
      this.$nextTick(() => {
        this.config = config;
        this.testId = config.id;
        console.log('true config parent', this.config);
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
        sessionId: this.sessionId,
        userId: this.userId,
        testId: this.testId,
        batteryTestConfigId: this.testId,
        results: {
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
    MathTest
  }
};
</script>