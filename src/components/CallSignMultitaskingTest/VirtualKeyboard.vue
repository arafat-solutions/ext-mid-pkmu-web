<template>
  <div class="virtual-keyboard">
    <div class="keyboard-row">
      <div v-for="key in ['Q', 'W', 'E', 'R']" :key="key" :class="['key', { active: activeKeys.includes(key) }]"
        @mousedown.prevent="emitKeyPress(key)" @mouseup.prevent="emitKeyRelease(key)"
        @mouseleave.prevent="emitKeyRelease(key)" @touchstart.prevent="emitKeyPress(key)"
        @touchend.prevent="emitKeyRelease(key)" @touchcancel.prevent="emitKeyRelease(key)">
        {{ key }}
      </div>
    </div>
    <div class="keyboard-row">
      <div v-for="key in ['A', 'S', 'D', 'F']" :key="key" :class="['key', { active: activeKeys.includes(key) }]"
        @mousedown.prevent="emitKeyPress(key)" @mouseup.prevent="emitKeyRelease(key)"
        @mouseleave.prevent="emitKeyRelease(key)" @touchstart.prevent="emitKeyPress(key)"
        @touchend.prevent="emitKeyRelease(key)" @touchcancel.prevent="emitKeyRelease(key)">
        {{ key }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    activeKeys: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    emitKeyPress(key) {
      this.$emit('key-press', { key });
    },
    emitKeyRelease(key) {
      this.$emit('key-release', { key });
    }
  }
};
</script>

<style scoped>
.virtual-keyboard {
  margin-top: 20px
}

.keyboard-row {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.key {
  width: 50px;
  height: 50px;
  border: 2px solid #333;
  border-radius: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 5px;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  transition: background-color 0.3s, color 0.3s;
}

.key:hover {
  background-color: #4CAF50;
  color: white;
}

.key.active {
  background-color: #4CAF50;
  color: white;
}
</style>