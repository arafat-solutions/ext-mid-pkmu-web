<template>
    <div class="main-view">
      <div class="column arithmetic-display">
        <ArithmeticTask />
      </div>
      <div class="column" />
    </div>
  </template>

<script>
  import ArithmeticTask from './ArithmeticTask';

  export default {
    name: 'MainView',
    components: {
      ArithmeticTask
    }
  };
</script>

<style scoped>
  .main-view {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 20px;
  }

  .column {
    float: left;
    width: 50%;
  }

  .arithmetic-display {
    position: absolute;
    bottom: 0;
    left: 0;
  }
</style>
