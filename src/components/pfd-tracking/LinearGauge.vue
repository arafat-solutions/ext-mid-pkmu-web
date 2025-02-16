<template>
    <div class="gauge-container" :class="{ vertical: isVertical }" :style="gaugeStyle">
        <!-- Background scale marks -->
        <div class="scale-background">
            <div v-for="n in totalTicks" :key="`bg-${n}`" 
                class="scale-mark" 
                :class="{ major: n % 5 === 0 }">
            </div>
        </div>

        <!-- Main gauge window with scrolling content -->
        <div class="gauge-window">
            <!-- Center line indicator -->
            <div class="center-pointer"></div>

            <!-- Scrolling track with values -->
            <div class="gauge-track" :style="trackStyle">
                <div class="scale-section">
                    <div v-for="value in scaleValues" :key="value" 
                        class="scale-label-container"
                        :style="getScaleLabelStyle(value)">
                        <div class="scale-mark" :class="{ 
                            major: value % (isVertical ? step : 45) === 0,
                            current: isCurrentValue(value)
                        }"></div>
                        <span class="scale-label" :class="{ highlight: isCurrentValue(value) }">
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

const totalTicks = computed(() => {
    return props.isVertical ? 50 : 36; // 50 marks for vertical, 36 for heading (every 10 degrees)
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
    const currentValue = Math.round(normalizedValue.value);
    
    if (props.isVertical) {
        // For vertical gauges (altitude and airspeed)
        const centerValue = Math.round(currentValue / props.step) * props.step;
        
        // Show more values for better scale density
        for (let i = 6; i >= -6; i--) {
            const value = centerValue + (i * props.step);
            if (value >= props.min && value <= props.max) {
                values.push(value);
            }
        }
    } else {
        // For heading (horizontal)
        const baseStep = 45; // Major divisions every 45 degrees
        const centerValue = Math.round(currentValue / baseStep) * baseStep;
        
        // Show values covering full 360° view
        for (let i = -4; i <= 4; i++) {
            let value = centerValue + (i * baseStep);
            value = ((value % 360) + 360) % 360;
            values.push(value);
        }
    }

    return props.isVertical ? values : values.sort((a, b) => a - b);
});

const trackStyle = computed(() => {
    const currentValue = normalizedValue.value;
    const centerOffset = 50; // Center point percentage
    const valueOffset = ((currentValue - props.min) / range.value) * 100;
    const movement = centerOffset - valueOffset;
    
    return props.isVertical
        ? { transform: `translateY(${movement}%)` }
        : { transform: `translateX(${movement}%)` };
});

const getScaleLabelStyle = (value) => {
    const percentage = ((value - props.min) / range.value) * 100;
    const baseStyle = {
        position: 'absolute',
        [props.isVertical ? 'bottom' : 'left']: `${percentage}%`,
        transform: props.isVertical ? 'translateY(50%)' : 'translateX(-50%)',
    };
    
    return baseStyle;
};

const getTargetStyle = computed(() => {
    const percentage = ((props.target - props.min) / range.value) * 100;
    return props.isVertical
        ? {
            bottom: `${percentage}%`,
            left: '50%',
            transform: 'translate(-50%, 50%)'
        }
        : {
            left: `${percentage}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)'
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
            case 0: return 'N';
            case 90: return 'E';
            case 180: return 'S';
            case 270: return 'W';
            default: return value.toString();
        }
    }
    return value.toString();
};

const gaugeStyle = computed(() => ({
    '--num-steps': totalTicks.value
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
    width: 40px;
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
    color: #2ecc71;
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