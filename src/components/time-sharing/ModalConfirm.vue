<template>
    <div v-if="show" class="modal-overlay">
      <div class="modal-content">
        <slot></slot>
        <div class="modal-buttons">
          <button @click="$emit('confirm')">Confirm</button>
          <button @click="$emit('cancel')">Cancel</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ModalConfirm',
    props: {
      show: {
        type: Boolean,
        required: true
      }
    }
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
  }
  
  .modal-content {
    background-color: white;
    padding: 20px;
    border-radius: 5px;
    max-width: 80%;
  }
  
  .modal-buttons {
    margin-top: 20px;
    text-align: right;
  }
  
  .modal-buttons button {
    margin-left: 10px;
    padding: 5px 10px;
    cursor: pointer;
  }
  </style>