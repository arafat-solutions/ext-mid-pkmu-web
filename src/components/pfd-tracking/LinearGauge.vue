<template>
  <div
    class="gauge-container"
    :class="{ vertical: isVertical }"
    :style="gaugeStyle"
  >
    <!-- Background scale marks -->
    <!-- <div class="scale-background"> -->
    <!--   <div -->
    <!--     v-for="n in totalTicks" -->
    <!--     :key="`bg-${n}`" -->
    <!--     class="scale-mark" -->
    <!--     :class="{ major: n % 5 === 0 }" -->
    <!--   ></div> -->
    <!-- </div> -->

    <!-- Main gauge window with scrolling content -->
    <div class="gauge-window">
      <!-- Center line indicator -->
      <div class="center-pointer"></div>

      <!-- Scrolling track with values -->
      <div class="gauge-track" :style="trackStyle">
        <div class="scale-section">
          <div
            v-for="value in scaleValues"
            :key="value"
            class="scale-label-container"
            :style="getScaleLabelStyle(value)"
          >
            <div
              class="scale-mark"
              :class="{
                major: value % (props.step * 5) === 0,
                //current: isCurrentValue(value),
              }"
            ></div>
            <span
              v-if="value % (props.step * 5) === 0"
              class="scale-label"
              :class="{ highlight: isCurrentValue(value) }"
            >
              {{ formatLabel(value) }}
            </span>
          </div>

          <!-- Target indicator -->
          <div class="target-marker" :style="getTargetStyle"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from "vue";

const props = defineProps({
  isSpeed: {
    type: Boolean,
    default: false,
  },
  value: {
    type: Number,
    required: true,
  },
  target: {
    type: Number,
    required: true,
  },
  min: {
    type: Number,
    required: true,
  },
  max: {
    type: Number,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  isVertical: {
    type: Boolean,
    default: true,
  },
  step: {
    type: Number,
    default: 10,
  },
});

const totalTicks = computed(() => {
  if (props.isVertical) {
    return Math.floor((props.max - props.min) / props.step) + 1;
  } else {
    return Math.floor(360 / props.step) + 1;
  }
});

const range = computed(() => props.max - props.min);

const normalizedValue = computed(() => {
  let normalized = props.value;
  if (!props.isVertical) {
    // For heading, wrap around 0-360
    normalized = ((normalized % 360) + 360) % 360;
  } else {
    // For vertical gauges, clamp to min/max
    normalized = Math.max(props.min, Math.min(props.max, normalized));
  }
  return normalized;
});

const scaleValues = computed(() => {
  const values = [];
  for (let i = props.min; i <= props.max; i += props.step) {
    values.push(i);
  }
  return values;
});

const trackStyle = computed(() => {
  const currentValue = normalizedValue.value;
  const centerOffset = 50; // Center point percentage
  const valueOffset = ((currentValue - props.min) / range.value) * 100;
  const movementX = centerOffset - valueOffset - 46;
  const movementY = valueOffset - centerOffset -(props.isSpeed ?35:48) ;

  return props.isVertical
    ? {
        transform: `translateY(${movementY}%)`,
        height: `${scaleValues.value.length * 10}px`,
      }
    : {
        transform: `translateX(${movementX}%)`,
        width: `${scaleValues.value.length * 10}px`,
      };
});

const getScaleLabelStyle = (value) => {
  //make the scaleValues part of formula percentage like trackstyle
  const percentage = ((value - props.min) / range.value) * 100;
  const baseStyle = {
    position: "absolute",
    [props.isVertical ? "bottom" : "left"]: `${percentage}%`,
    transform: props.isVertical ? "translateY(50%)" : "translateX(-50%)",
  };

  return baseStyle;
};

const getTargetStyle = computed(() => {
  const percentage = ((props.target - props.min) / range.value) * 100;
  return props.isVertical
    ? {
        bottom: `${percentage}%`,
        left: "50%",
        transform: "translate(-50%, 50%)",
      }
    : {
        left: `${percentage}%`,
        top: "50%",
        transform: "translate(-50%, -50%)",
      };
});

const isCurrentValue = (value) => {
  if (props.isVertical) {
    return Math.abs(value - normalizedValue.value) < props.step / 2;
  } else {
    const diff = Math.abs(value - normalizedValue.value);
    return Math.min(diff, 360 - diff) < 22.5; // Half of 45° for heading
  }
};

const formatLabel = (value) => {
  if (!props.isVertical) {
    // Format heading values
    switch (value) {
      case 0:
        return "N";
      case 90:
        return "E";
      case 180:
        return "S";
      case 270:
        return "W";
      default:
        return value.toString();
    }
  }
  return value.toString();
};

const gaugeStyle = computed(() => ({
  "--num-steps": totalTicks.value,
}));
</script>

<style scoped>
.gauge-container {
  position: relative;
  width: 300px;
  height: 40px;
  background: rgba(24, 28, 31, 0.95);
  border-radius: 2px;
  overflow: hidden;
}

.gauge-container.vertical {
  width: 70px;
  height: 300px;
}

.scale-background {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.vertical .scale-background {
  flex-direction: column;
}

.horizontal .scale-background {
  flex-direction: row;
}

.gauge-window {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.gauge-track {
  position: absolute;
  width: 100%;
  height: 200%;
  transition: transform 0.1s linear;
}

.scale-section {
  position: relative;
  width: 100%;
  height: 100%;
}

.scale-label-container {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 4px;
}

.vertical .scale-label-container {
  flex-direction: row;
  left: 0;
  width: 100%;
}

.horizontal .scale-label-container {
  flex-direction: column;
  top: 0;
  height: 100%;
}

.scale-mark {
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
}

.vertical .scale-mark {
  width: 10px;
  height: 1px;
  margin-right: 5px;
}

.vertical .scale-mark.major {
  width: 15px;
}

.horizontal .scale-mark.major {
  height: 15px;
}

.horizontal .scale-mark {
  width: 1px;
  height: 10px;
  margin-bottom: 5px;
}

.scale-mark.major {
  background: rgba(255, 255, 255, 0.8);
}

.scale-mark.current {
  background: #2ecc71;
}

.scale-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-family: monospace;
  transition: all 0.2s ease;
}

.scale-label.highlight {
  /*color: #2ecc71;*/
  font-weight: bold;
}

.center-pointer {
  position: absolute;
  z-index: 10;
  background: rgba(255, 59, 48, 0.9);
  box-shadow: 0 0 3px rgba(255, 59, 48, 0.5);
}

.vertical .center-pointer {
  left: 0;
  top: 50%;
  width: 100%;
  height: 2px;
  transform: translateY(-50%);
}

.horizontal .center-pointer {
  top: 0;
  left: 50%;
  width: 2px;
  height: 100%;
  transform: translateX(-50%);
}

.target-marker {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #2ecc71;
  border-radius: 50%;
  z-index: 5;
  box-shadow: 0 0 5px rgba(46, 204, 113, 0.5);
}
</style>
