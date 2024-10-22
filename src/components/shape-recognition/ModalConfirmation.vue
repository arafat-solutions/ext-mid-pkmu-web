<template>
    <div class="modal-overlay" @click="$emit('close')">
      <div class="modal-content" @click.stop>
        <slot></slot>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ModalConfirmation',
    emits: ['close']
  }
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
    padding: 20px;
    border-radius: 5px;
    max-width: 80%;
    max-height: 80%;
    overflow-y: auto;
  }
  </style>