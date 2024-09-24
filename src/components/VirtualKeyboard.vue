<template>
  <div class="virtual-keyboard">
    <div v-for="(row, rowIndex) in keys" :key="rowIndex" class="keyboard-row">
      <button 
        v-for="key in row" 
        :key="key" 
        :class="['keyboard-key', { 'active': isKeyActive(key) }]"
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
  props: {
    activeKeys: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    handleMouseDown(key) {
      this.pressedKeys.push(key);
      this.$emit('keyPress', { key });
    },
    isKeyActive(key) {
      return this.activeKeys.includes(key);
    }
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeyDown);
    console.log('mounted', this.keys);
  },
  beforeUnmount() {
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
  transition: background-color 0.3s ease;
}

.keyboard-key.pressed {
  background-color: #d0d0d0;
}

.keyboard-key.active {
  background-color: green;
  color: white;
}
</style>