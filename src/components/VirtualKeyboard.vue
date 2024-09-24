<template>
  <div class="virtual-keyboard">
    <div v-for="(row, rowIndex) in keys" :key="rowIndex" class="keyboard-row">
      <button 
        v-for="key in row" 
        :key="key" 
        class="keyboard-key" 
        :class="{ pressed: pressedKeys[key] }"
        @mousedown="handleMouseDown(key)"
      >
        {{ key }}
      </button>
    </div>
  </div>
</template>


<script>
export default {
  name: 'VirtualKeyboard',
  data() {
    return {
      keys: [
        ['Q', 'W', 'E', 'R'],
        ['A', 'S', 'D', 'F']
      ],
      pressedKeys: []
    }
  },
  methods: {
    handleMouseDown(key) {
      console.log(key, 'pressed');
      this.pressedKeys.push(key);
      if (this.pressedKeys.length === 3) {
        this.pressedKeys = [];
      }
      this.$emit('keyPress', { key });
    },
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeyDown);
  },
  beforeUnmountf() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }
}
</script>

<style scoped>
.virtual-keyboard {
  margin-top: 20px;
}

.keyboard-row {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.keyboard-key {
  width: 50px;
  height: 50px;
  margin: 0 5px;
  font-size: 18px;
  font-weight: bold;
  border: 2px solid #333;
  border-radius: 5px;
  background-color: #f0f0f0;
  cursor: pointer;
}

.keyboard-key.pressed {
  background-color: #ccc;
}

.keyboard-key.active {
  background-color: green;
}
</style>
