<template>
    <div class="training-session">
        <div v-if="showModal" class="modal">
            <div class="modal-content">
                <h2>{{ currentTask.charAt(0).toUpperCase() + currentTask.slice(1) }} Training</h2>
                <p>{{ getInstructions() }}</p>
                <button @click="startTraining" class="start-button">Start Training</button>
            </div>
        </div>
        <div v-else-if="showEndModal" class="modal">
            <div class="modal-content">
                <h2>Training Complete</h2>
                <p>You have completed the training session. Are you ready to start the actual test?</p>
                <button @click="startActualTest" class="start-button">Start Test</button>
            </div>
        </div>
        <div v-else>
            <div class="timer">Time remaining: {{ formatTime(remainingTime) }}</div>
            <component :is="getComponentForTask(currentTask)" :config="getConfigForTask(currentTask)"
                :isTrainingMode="true" @test-finished="handleTrainingFinished" @switch-task="handleSwitchTask">
            </component>
        </div>
    </div>
</template>

<script>
import PlaneSimulator from './PlaneSimulator.vue';
import MathTest from './MathTest.vue';
import { checkIfTrainingTestCompleted, completeTrainingTestAndUpdateLocalStorage } from '@/utils';

export default {
    name: 'TrainingSession',
    components: {
        PlaneSimulator,
        MathTest,
    },
    data() {
        return {
            trainingTasks: ['navigation', 'math', 'instrument', 'combined'],
            currentTaskIndex: 0,
            showModal: true,
            showEndModal: false,
            remainingTime: 60, // 1 minute
            timerInterval: null,
        };
    },
    computed: {
        currentTask() {
            return this.trainingTasks[this.currentTaskIndex];
        },
    },
    mounted() {
        const completed = checkIfTrainingTestCompleted('Time Sharing Test 2023');
        if (completed) {
            this.$emit('training-completed');
        }
        return completed;
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
                observer: { speed: 'medium', frequency: 'medium' },
                arithmetics: { frequency: 'medium', complexity: 'medium', output: 'sound_and_visual' },
            };

            switch (task) {
                case 'navigation':
                    return { ...baseConfig, subtask: { navigation: true, observer: false } };
                case 'instrument':
                    return { ...baseConfig, subtask: { navigation: false, observer: true } };
                case 'math':
                    return baseConfig;
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
                this.remainingTime = 60;
            } else {
                this.showEndModal = true;
                completeTrainingTestAndUpdateLocalStorage('Time Sharing Test 2023');
            }
        },

        startActualTest() {
            this.showEndModal = false;
            this.$emit('training-completed');
        },
        handleSwitchTask() {
            // Only allow task switching in combined mode
            if (this.currentTask === 'combined') {
                // Switch between PlaneSimulator and MathTest
                this.$emit('switch-task');
            }
        },
    },
};
</script>

<style scoped>
.training-session {
    position: relative;
    width: 100%;
    height: 100%;
}

.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-content h2 {
    margin-bottom: 1rem;
    font-size: 1.5rem;
    color: #333;
}

.modal-content p {
    margin-bottom: 1.5rem;
    font-size: 1rem;
    color: #666;
    line-height: 1.5;
}

.start-button {
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.3s ease;
}

.start-button:hover {
    background-color: #45a049;
}

.timer {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 1rem;
}
</style>