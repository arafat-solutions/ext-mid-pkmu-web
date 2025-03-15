<template>
  <div v-if="visible" class="modal-overlay">
    <div class="black-overlay"></div>
    <div class="modal-content">
      <div class="icon">
        <i class="fas fa-info-circle"></i>
      </div>
      <h2 style="font-size: 24px">{{ title }}</h2>
      <p class="message" style="font-size: 20px" v-html="message"></p>
      <p class="instructions" style="font-size: 20px">{{ instructions }}</p>
      <div class="button-group">
        <button @click="confirm" class="confirm-btn">
          {{ confirmButtonText }}
        </button>
        <button v-if="isAcoustic" @click="playSound" class="confirm-btn">Putar Suara</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ModalConfirmSound",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    isAcoustic: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: "Confirmation",
    },
    message: {
      type: String,
      default: "Are you sure?",
    },
    instructions: {
      type: String,
      default: "",
    },
    confirmButtonText: {
      type: String,
      default: "YA",
    },
    clickPlaySound: {
      type: String,
      default: "Putar Suara",
    },
  },
  methods: {
    confirm() {
      this.$emit("confirm");
    },

    playSound() {
      this.$emit("clickPlaySound");
    },
    cancel() {
      this.$emit("cancel");
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 30;
}

.black-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  background-color: white;
  padding: 20px;
  z-index: 40;
  border-radius: 5px;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.icon {
  background-color: #e3f2fd;
  color: #2196f3;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 20px;
}

h2 {
  font-size: 20px;
  margin-bottom: 10px;
}

.message {
  font-size: 16px;
  margin-bottom: 10px;
}

.instructions {
  font-size: 14px;
  margin-bottom: 20px;
  color: #666;
}

.button-group {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.cancel-btn {
  background-color: #f0f0f0;
  color: #333;
}

.confirm-btn {
  background-color: #7e57c2;
  color: white;
}
</style>
