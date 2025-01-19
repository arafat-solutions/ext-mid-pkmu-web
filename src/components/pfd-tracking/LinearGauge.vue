<template>
    <div class="gauge-container" :class="{ vertical: isVertical }" :style="gaugeStyle">
        <div class="gauge-track" :style="trackStyle">
            <!-- Single scale section from min to max -->
            <div class="scale-section">
                <div class="scale-lines">
                    <div v-for="value in scaleValues" :key="value" class="scale-mark" :style="getScaleMarkStyle(value)">
                        <span class="scale-label">{{ formatLabel(value) }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="gauge-window">
            <!-- Fixed center pointer (red line) -->
            <div class="center-pointer"></div>

            <!-- Scrolling track -->
            <div class="gauge-track" :style="trackStyle">
                <!-- Single scale section from min to max -->
                <div class="scale-section">
                    <!-- Target marker -->
                    <div class="target-marker" :style="getTargetStyle"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, defineProps } from 'vue';

const props = defineProps({
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

// Calculate the number of steps for consistent spacing
const numSteps = computed(() => {
    return Math.floor((props.max - props.min) / props.step) + 1;
});

// Generate scale values from min to max
const scaleValues = computed(() => {
    const values = [];
    if (props.isVertical) {
        for (let i = props.min; i <= props.max; i += props.step) {
            values.push(i);
        }
    } else {
        // For horizontal, ensure labels are placed at 0, 90, 180, 270, 360
        values.push(0, 90, 180, 270, 360);
    }
    return values;
});

// Calculate the range (difference between max and min)
const range = computed(() => props.max - props.min);

// Normalize the value to ensure it stays within the range
const normalizedValue = computed(() => {
    let normalized = props.value;
    while (normalized > props.max) normalized -= range.value;
    while (normalized < props.min) normalized += range.value;
    return normalized;
});

// Calculate the track style for scrolling
const trackStyle = computed(() => {
    const percentage = ((normalizedValue.value - props.target) / range.value) * 100;
    return props.isVertical
        ? { transform: `translateY(${percentage}%)` } // Adjust the transform to align the target with the center
        : { transform: `translateX(${percentage}%)` }; // Adjust the transform to align the target with the center
});

// Calculate the style for each scale mark
const getScaleMarkStyle = (value) => {
    const percentage = ((value - props.min) / range.value) * 100;
    return props.isVertical
        ? { bottom: `${percentage}%` } // Position labels from bottom to top
        : { left: `${percentage}%` }; // Position labels from left to right
};

// Calculate the style for the target marker
const getTargetStyle = computed(() => {
    const targetPercentage = ((props.target - props.min) / range.value) * 100;
    return props.isVertical
        ? { bottom: `${targetPercentage}%` }
        : { left: `${targetPercentage}%` };
});

// Format the label for display
const formatLabel = (value) => {
    if (!props.isVertical) {
        switch (value) {
            case 0:
                return 'N';
            case 90:
                return 'E';
            case 180:
                return 'S';
            case 270:
                return 'W';
            case 360:
                return 'N';
            default:
                return value;
        }
    }
    return value;
};

// CSS variables for consistent spacing
const gaugeStyle = computed(() => {
    return {
        '--num-steps': numSteps.value,
    };
});
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

.gauge-window {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border: 2px solid white;
}

.gauge-track {
    position: absolute;
    width: 100%;
    height: 200%;
    /* Double height for vertical scroll */
    transition: transform 0.3s ease;
}

.gauge-container.vertical .gauge-track {
    height: 200%;
    /* Double height for vertical scroll */
}

.gauge-container.horizontal .gauge-track {
    width: 200%;
    /* Double width for horizontal scroll */
}

.scale-section {
    position: absolute;
    width: 100%;
    height: 100%;
}

.scale-lines {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
}

.scale-mark {
    position: absolute;
    background: white;
}

.vertical .scale-mark {
    left: -10px;
    width: 10px;
    height: 2px;
}

.horizontal .scale-mark {
    top: -10px;
    width: 2px;
    height: 10px;
}

.scale-label {
    position: absolute;
    color: white;
    font-size: 12px;
    white-space: nowrap;
}

.vertical .scale-label {
    left: -30px;
    transform: translateY(-50%);
}

.horizontal .scale-label {
    bottom: -20px;
    transform: translateX(-50%);
}

.center-pointer {
    position: absolute;
    background: red;
    z-index: 3;
}

.vertical .center-pointer {
    left: 0;
    top: 50%;
    width: 100%;
    height: 2px;
    transform: translateY(-50%);
}

.horizontal .center-pointer {
    left: 50%;
    top: 0;
    width: 2px;
    height: 100%;
    transform: translateX(-50%);
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