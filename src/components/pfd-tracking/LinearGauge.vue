<!-- LinearGauge.vue -->
<template>
    <div class="gauge-container" :class="{ vertical: isVertical }">
        <div class="gauge-track">
            <div class="gauge-scale">
                <!-- Generate scale markers -->
                <div v-for="value in scaleValues" :key="value" class="scale-mark">
                    <span class="scale-label">{{ value }}</span>
                </div>
            </div>
            <!-- Current value pointer -->
            <div class="gauge-pointer" :style="pointerStyle"></div>
            <!-- Target marker -->
            <div class="target-marker" :style="targetStyle"></div>
        </div>
        <div class="gauge-label">{{ label }}</div>
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
    for (let i = props.min; i <= props.max; i += props.step) {
        values.push(i);
    }
    return values;
});

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
</script>

<style scoped>
.gauge-container {
    position: relative;
    width: 400px;
    height: 60px;
    margin: 20px;
}

.gauge-container.vertical {
    width: 60px;
    height: 400px;
}

.gauge-track {
    position: relative;
    width: 100%;
    height: 100%;
    background: #2c3e50;
    border-radius: 4px;
}

.gauge-scale {
    position: absolute;
    width: 100%;
    height: 100%;
}

.scale-mark {
    position: absolute;
    width: 100%;
    height: 2px;
    background: #fff;
}

.scale-label {
    position: absolute;
    color: white;
    font-size: 12px;
}

.gauge-pointer {
    position: absolute;
    width: 4px;
    height: 100%;
    background: white;
    border-radius: 2px;
    transition: all 0.1s ease;
}

.target-marker {
    position: absolute;
    width: 16px;
    height: 16px;
    background: #2ecc71;
    border-radius: 50%;
    transform: translate(-6px, -8px);
}

.vertical .gauge-pointer {
    width: 100%;
    height: 4px;
}

.vertical .target-marker {
    transform: translate(-6px, 8px);
}

.gauge-label {
    text-align: center;
    margin-top: 8px;
    color: white;
    font-weight: bold;
}
</style>