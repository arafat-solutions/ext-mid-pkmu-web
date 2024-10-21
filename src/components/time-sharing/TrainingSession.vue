<template>
    <div class="training-session">
        <div v-if="showModal" class="modal">
            <div class="modal-content">
                <h2>{{ currentTask.charAt(0).toUpperCase() + currentTask.slice(1) }} Training</h2>
                <p>{{ getInstructions() }}</p>
                <button @click="startTraining">Start Training</button>
            </div>
        </div>
        <div v-else>
            <div class="timer">Time remaining: {{ formatTime(remainingTime) }}</div>
            <component :is="getComponentForTask(currentTask)" :config="getConfigForTask(currentTask)"
                @test-finished="handleTrainingFinished"></component>
        </div>
    </div>
</template>

<script>
import PlaneSimulator from './PlaneSimulator.vue';
import MathTest from './MathTest.vue';

export default {
    name: 'TrainingSession',
    components: {
        PlaneSimulator,
        MathTest,
    },
    data() {
        return {
            trainingTasks: ['instrument', 'combined'],
            currentTaskIndex: 0,
            showModal: true,
            remainingTime: 30, // half minutes
            timerInterval: null,
        };
    },
    computed: {
        currentTask() {
            return this.trainingTasks[this.currentTaskIndex];
        },
    },
    methods: {
        getInstructions() {
            switch (this.currentTask) {
                case 'navigation':
                    return 'Practice controlling the plane to avoid obstacles. Use A and D keys or the joystick to move left and right.';
                case 'math':
                    return 'Solve math problems as quickly and accurately as possible.';
                case 'instrument':
                    return 'Monitor the instruments and click or press the corresponding key when a gauge enters the red zone.';
                case 'combined':
                    return 'Practice all subtasks together. Switch between tasks using the spacebar.';
                default:
                    return '';
            }
        },
        startTraining() {
            this.showModal = false;
            this.startTimer();
        },
        startTimer() {
            this.timerInterval = setInterval(() => {
                if (this.remainingTime > 0) {
                    this.remainingTime--;
                } else {
                    this.handleTrainingFinished();
                }
            }, 1000);
        },
        formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        },
        getComponentForTask(task) {
            if (task === 'math') {
                return 'MathTest';
            }
            return 'PlaneSimulator';
        },
        getConfigForTask(task) {
            const baseConfig = {
                duration: 1,
                navigation: { speed: 'medium', density: 'medium', control_perspective: 'cockpit_crew' },
                observer: { speed: 'very_fast', frequency: 'very_fast' },
                arithmetics: { frequency: 'medium', complexity: 'medium', output: 'sound' },
            };

            switch (task) {
                case 'navigation':
                    return { ...baseConfig, subtask: { navigation: true, observer: false } };
                case 'instrument':
                    return { ...baseConfig, subtask: { navigation: false, observer: true } };
                case 'combined':
                    return { ...baseConfig, subtask: { navigation: true, observer: true } };
                default:
                    return baseConfig;
            }
        },
        handleTrainingFinished() {
            clearInterval(this.timerInterval);
            this.currentTaskIndex++;
            if (this.currentTaskIndex < this.trainingTasks.length) {
                this.showModal = true;
                this.remainingTime = 30;
            } else {
                this.$emit('training-completed');
            }
        },
    },
};
</script>

<style scoped>
.training-session {
    /* Add your styles here */
}

.modal {
    /* Add your modal styles here */
}

.timer {
    /* Add your timer styles here */
}
</style>