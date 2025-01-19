<template>
    <div class="analog-clock">
        <div class="clock-face">
            <!-- Minute and Hour Indicators -->
            <div v-for="indicator in 60" :key="indicator" class="indicator" :class="{
                'hour-indicator': indicator % 5 === 0,
                'minute-indicator': indicator % 5 !== 0,
            }" :style="{ transform: `rotate(${indicator * 6}deg) translateX(-50%)` }"></div>

            <!-- Clock Hands -->
            <div class="hand hour-hand" :style="{ transform: `rotate(${hourRotation}deg)` }"></div>
            <div class="hand minute-hand" :style="{ transform: `rotate(${minuteRotation}deg)` }"></div>
            <div class="hand second-hand" :style="{ transform: `rotate(${secondRotation}deg)` }"></div>

            <!-- Clock Center Dot -->
            <div class="center-dot"></div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

// Reactive state for clock hands
const hourRotation = ref(0);
const minuteRotation = ref(0);
const secondRotation = ref(0);

// Function to update the clock hands
const updateClock = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Calculate rotations
    hourRotation.value = (hours % 12) * 30 + minutes * 0.5;
    minuteRotation.value = minutes * 6 + seconds * 0.1;
    secondRotation.value = seconds * 6;
};

// Start the clock
let interval;
onMounted(() => {
    updateClock();
    interval = setInterval(updateClock, 1000);
});

// Cleanup on unmount
onBeforeUnmount(() => {
    clearInterval(interval);
});
</script>

<style scoped>
.analog-clock {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    background-color: #1a1a1a;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    position: relative;
}

.clock-face {
    position: relative;
    width: 160px;
    /* Keep clock face large within container */
    height: 160px;
    /* Keep clock face large within container */
    border-radius: 50%;
}

/* Indicators */
.indicator {
    position: absolute;
    top: 0;
    left: 50%;
    transform-origin: 50% 80px;
    /* Adjusted for larger size */
    background-color: #fff;
}

.hour-indicator {
    height: 15px;
    width: 3px;
}

.minute-indicator {
    height: 8px;
    width: 2px;
}

/* Clock Hands */
.hand {
    position: absolute;
    left: 50%;
    bottom: 50%;
    transform-origin: 50% 100%;
    background-color: #fff;
    border-radius: 2px;
}

.hour-hand {
    width: 4px;
    height: 45px;
    transform: translateX(-50%);
}

.minute-hand {
    width: 3px;
    height: 65px;
    transform: translateX(-50%);
}

.second-hand {
    width: 2px;
    height: 75px;
    background-color: red;
    transform: translateX(-50%);
}

/* Clock Center Dot */
.center-dot {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 8px;
    height: 8px;
    background-color: #fff;
    border-radius: 50%;
    transform: translate(-50%, -50%);
}
</style>