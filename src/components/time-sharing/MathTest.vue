<template>
    <div class="input-simulation-container">
      <div class="instructions">Press 'Space bar' to switch tasks</div>
      <input v-model="userInput" class="input-box" />
      <button @click="submitInput" class="submit-button">Submit</button>
    </div>
  </template>
  
  <script>
  export default {
    name: 'InputSimulation',
    data() {
      return {
        userInput: ''
      };
    },
    methods: {
      handleKeydown(event) {
        if (event.key === ' ') {
          this.$emit('switch-task');
        }
      },
      submitInput() {
        console.log('User input:', this.userInput);
        this.userInput = '';
      }
    },
    mounted() {
      window.addEventListener('keydown', this.handleKeydown);
    },
    beforeUnmount() {
      window.removeEventListener('keydown', this.handleKeydown);
    }
  };
  </script>
  
  <style>
  .input-simulation-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .instructions {
    margin-bottom: 20px;
  }
  .input-box {
    font-size: 24px;
    padding: 10px;
    margin-bottom: 20px;
  }
  .submit-button {
    font-size: 24px;
    padding: 10px;
  }
  </style>
  