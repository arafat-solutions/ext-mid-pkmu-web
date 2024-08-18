<template>
  <div>
    <keep-alive>
      <component :is="currentComponent" @switch-task="switchTask" />
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
      currentComponent: 'PlaneSimulator'
    };
  },
  methods: {
    switchTask() {
      this.currentComponent = this.currentComponent === 'PlaneSimulator' ? 'MathTest' : 'PlaneSimulator';
    }
  },
  components: {
    PlaneSimulator,
    MathTest
  }
};
</script>