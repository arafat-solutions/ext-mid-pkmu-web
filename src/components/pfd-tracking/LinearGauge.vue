<template>
    <div class="gauge-container" :class="{ vertical: isVertical }" :style="gaugeStyle">
        <div class="gauge-track" :style="trackStyle">
            <!-- Single scale section from min to max -->
            <div class="scale-section">
                <div class="scale-lines">
                    <div v-for="value in scaleValues" :key="value" class="scale-mark" :style="getScaleMarkStyle(value)">
                        <span class="scale-label" :style="getLabelStyle(value)">
                            {{ formatLabel(value) }}
                        </span>
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

// Calculate the range (difference between max and min)
const range = computed(() => props.max - props.min);

// Normalize the value to ensure it stays within the range
const normalizedValue = computed(() => {
    let normalized = props.value;
    while (normalized > props.max) normalized -= range.value;
    while (normalized < props.min) normalized += range.value;
    return normalized;
});

const scaleValues = computed(() => {
    const values = [];
    const currentValue = Math.round(normalizedValue.value);

    if (props.isVertical) {
        // For vertical gauges (altitude and airspeed)
        const baseStep = props.step;
        // Get the centered value (rounded to nearest step)
        const centerValue = Math.round(currentValue / baseStep) * baseStep;
        
        // For altitude/airspeed, show 5 values with current in middle
        for (let i = 2; i >= -2; i--) {  // Descending order for vertical gauges
            const value = centerValue + (i * baseStep);
            if (value >= props.min && value <= props.max) {
                values.push(value);
            }
        }
    } else {
        // For heading (horizontal)
        const baseStep = 45;
        const centerValue = Math.round(currentValue / baseStep) * baseStep;
        
        for (let i = -2; i <= 2; i++) {
            let value = centerValue + (i * baseStep);
            value = ((value % 360) + 360) % 360;
            values.push(value);
        }
    }

    return props.isVertical ? values : values.sort((a, b) => a - b);
});

// Track style for proper positioning
const trackStyle = computed(() => {
    const currentValue = normalizedValue.value;
    const centerOffset = props.isVertical ? 50 : 50; // Center point percentage
    
    // Calculate how far we need to move to center the current value
    const valueOffset = ((currentValue - props.min) / range.value) * 100;
    const movement = centerOffset - valueOffset;
    
    return props.isVertical
        ? { transform: `translateY(${movement}%)` }
        : { transform: `translateX(${movement}%)` };
});

// Helper to check if value is current
const isCurrentValue = (value) => {
    return Math.abs(value - normalizedValue.value) < props.step / 2;
};

// Scale mark style with proper positioning and highlight
const getScaleMarkStyle = (value) => {
    const percentage = ((value - props.min) / range.value) * 100;
    
    if (props.isVertical) {
        return {
            position: 'absolute',
            bottom: `${percentage}%`,
            left: '-15px',
            width: '15px',
            height: '2px',
            backgroundColor: isCurrentValue(value) ? '#2ecc71' : 'rgba(255, 255, 255, 0.8)',
            transform: 'translateY(50%)'
        };
    } else {
        return {
            position: 'absolute',
            left: `${percentage}%`,
            top: '-15px',
            width: '2px',
            height: '15px',
            backgroundColor: isCurrentValue(value) ? '#2ecc71' : 'rgba(255, 255, 255, 0.8)',
            transform: 'translateX(-50%)'
        };
    }
};

// Label style with proper positioning and formatting
const getLabelStyle = (value) => {
    const percentage = ((value - props.min) / range.value) * 100;
    
    const baseStyle = {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '2px 6px',
        borderRadius: '3px',
        fontSize: '14px',
        fontWeight: isCurrentValue(value) ? 'bold' : 'normal',
        color: isCurrentValue(value) ? '#2ecc71' : 'white',
        fontFamily: 'monospace'
    };
    
    if (props.isVertical) {
        return {
            ...baseStyle,
            bottom: `${percentage}%`,
            left: '-50px',
            transform: 'translateY(50%)'
        };
    } else {
        return {
            ...baseStyle,
            left: `${percentage}%`,
            bottom: '-30px',
            transform: 'translateX(-50%)'
        };
    }
};

// Target marker positioning
const getTargetStyle = computed(() => {
    const targetPercentage = ((props.target - props.min) / range.value) * 100;
    return props.isVertical
        ? { 
            bottom: `${targetPercentage}%`,
            left: '50%',
            transform: 'translate(-50%, 50%)'
          }
        : { 
            left: `${targetPercentage}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)'
          };
});

// Format labels (especially for heading)
const formatLabel = (value) => {
    if (!props.isVertical) {
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

// CSS variables for spacing
const gaugeStyle = computed(() => ({
    '--num-steps': Math.floor((props.max - props.min) / props.step) + 1
}));
</script>

<style scoped>
.gauge-container {
    position: relative;
    width: 300px;
    height: 40px;
    margin: 10px;
    background: rgba(29, 35, 42, 0.95);
    border-radius: 4px;
    padding: 10px;
}

.gauge-container.vertical {
    width: 40px;
    height: 300px;
    margin-left: 60px;
}

.gauge-window {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 2px;
}

.gauge-track {
    position: absolute;
    width: 100%;
    height: 200%;
    transition: transform 0.1s linear;
}

.gauge-container.vertical .gauge-track {
    height: 200%;
}

.gauge-container.horizontal .gauge-track {
    width: 200%;
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
}

.scale-mark {
    transition: all 0.2s ease;
}

.scale-label {
    white-space: nowrap;
    transition: all 0.2s ease;
    z-index: 2;
}

.center-pointer {
    position: absolute;
    z-index: 3;
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
    box-shadow: 0 0 5px rgba(46, 204, 113, 0.5);
}
</style>