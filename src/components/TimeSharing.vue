<template>
  <div>
    <keep-alive>
      <component 
        :is="currentComponent" 
        @switch-task="switchTask"
        @question-result="handleQuestionResult"
      />
    </keep-alive>
  </div>
</template>

<script>
import PlaneSimulator from '@/components/time-sharing/PlaneSimulator.vue';
import MathTest from '@/components/time-sharing/MathTest.vue';

export default {
  name: 'SimulatorParent',
  data() {
    return {
      currentComponent: 'PlaneSimulator',
      mathTestResults: []
    };
  },
  methods: {
    switchTask() {
      this.currentComponent = this.currentComponent === 'PlaneSimulator' ? 'MathTest' : 'PlaneSimulator';
    },
    handleQuestionResult(result) {
      this.mathTestResults.push(result);
      console.log('Question result:', result);
      // You can process or store the results as needed
    }
  },
  components: {
    PlaneSimulator,
    MathTest
  }
};
</script>