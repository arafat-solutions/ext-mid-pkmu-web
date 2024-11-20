<!-- LinearGauge.vue -->
<template>
    <div class="gauge-container" :class="{ vertical: isVertical }">
      <div class="gauge-track">
        <!-- Scale lines -->
        <div class="scale-lines">
          <div v-for="value in scaleValues" 
               :key="value" 
               class="scale-mark"
               :style="getScaleMarkStyle(value)">
            <span class="scale-label">{{ formatLabel(value) }}</span>
          </div>
        </div>
        <!-- Target marker -->
        <div class="target-marker" :style="targetStyle"></div>
        <!-- Current value pointer -->
        <div class="gauge-pointer" :style="pointerStyle"></div>
      </div>
    </div>
  </template>
<script setup>
import { computed } from 'vue';
import { defineProps } from 'vue';

const props = defineProps({
    value: {
        type: Number,
        required: true
    },
    target: {
        type: Number,
        required: true
    },
    min: {
        type: Number,
        required: true
    },
    max: {
        type: Number,
        required: true
    },
    label: {
        type: String,
        required: true
    },
    isVertical: {
        type: Boolean,
        default: true
    },
    step: {
        type: Number,
        default: 10
    }
});
const scaleValues = computed(() => {
  const values = [];
  if (props.isVertical) {
    // Vertical gauges (speed and altitude) keep original logic
    for (let i = props.min; i <= props.max; i += props.step) {
      values.push(i);
    }
  } else {
    // Horizontal gauge (heading) - show only major cardinal directions
    // and intermediate points
    values.push(0);    // N
    values.push(90);   // E
    values.push(180);  // S
    values.push(270);  // W
    values.push(360);  // N
  }
  return values;
});

// Add function to format heading labels
const formatLabel = (value) => {
  if (!props.isVertical) {
    // For heading, show cardinal directions
    switch (value) {
      case 0: return 'N';
      case 90: return 'E';
      case 180: return 'S';
      case 270: return 'W';
      case 360: return 'N';
      default: return value;
    }
  }
  return value;
};

const calculatePosition = (value) => {
    const percentage = ((value - props.min) / (props.max - props.min)) * 100;
    return `${percentage}%`;
};

const pointerStyle = computed(() => {
    const pos = calculatePosition(props.value);
    return props.isVertical
        ? { bottom: pos }
        : { left: pos };
});

const targetStyle = computed(() => {
    const pos = calculatePosition(props.target);
    return props.isVertical
        ? { bottom: pos }
        : { left: pos };
});

const getScaleMarkStyle = (value) => {
    const pos = calculatePosition(value);
    return props.isVertical
        ? { bottom: pos }
        : { left: pos };
};
</script>

<style scoped>
.gauge-container {
    position: relative;
    width: 300px;
    height: 40px;
    margin: 10px;
}

.gauge-container.vertical {
    width: 40px;
    height: 300px;
}

.gauge-track {
    position: relative;
    width: 100%;
    height: 100%;
    background: transparent;
    border: 2px solid white;
}

.scale-lines {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.scale-mark {
    position: absolute;
    background: white;
}

.vertical .scale-mark {
    width: 10px;
    height: 2px;
    left: -10px;
}

.horizontal .scale-mark {
    width: 2px;
    height: 10px;
    top: -10px;
}

.scale-label {
    position: absolute;
    color: white;
    font-size: 12px;
}

.vertical .scale-label {
    right: 20px;
    transform: translateY(50%);
}

.horizontal .scale-label {
    top: 20px;
    transform: translateX(-50%);
}

.gauge-pointer {
    position: absolute;
    background: white;
    z-index: 2;
}

.vertical .gauge-pointer {
    width: 100%;
    height: 2px;
    left: 0;
}

.horizontal .gauge-pointer {
    width: 2px;
    height: 100%;
    top: 0;
}

.target-marker {
    position: absolute;
    width: 12px;
    height: 12px;
    background: #2ecc71;
    border-radius: 50%;
    z-index: 1;
}

.vertical .target-marker {
    left: 50%;
    transform: translate(-50%, 50%);
}

.horizontal .target-marker {
    top: 50%;
    transform: translate(-50%, -50%);
}
</style>