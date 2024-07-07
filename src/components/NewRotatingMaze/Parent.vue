<template>
    <div class="container">
        <maze :strategy="strategy" :difficulty="difficulty" @start="onStart" @finish="onFinish" @init="onInit"
            :style="mazeStyle"></maze>
    </div>
</template>

<script>
import Maze from './Maze.vue';

export default {
    name: 'NewRotatingMaze',
    components: {
        Maze
    },
    data() {
        return {
            mazeStyle: {
                width: '500px',
                height: '500px'
            },
            startTime: 0,
            time: 0,
            strategy: 'cluster', //cluster, dig
            difficulty: 'hard', // easy, normal, hard
        }
    },
    methods: {
        onStart() {
            this.startTime = Date.now();
        },
        onFinish() {
            this.time = Date.now() - this.startTime;
        },
        onInit() {
            this.startTime = 0;
        }
    }
}
</script>

<style scoped>
.container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100vw;
    position: relative;
}

canvas {
    display: block;
    margin-top: 40px;
    border: none;
}

.timer {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    margin: 0 auto;
    font-size: 24px;
    font-weight: bold;
    width: 300px;
    height: 60px;
    background-color: #6757dc;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
}

.timer p {
    margin: 0;
    padding: 0;
}

.timer :nth-child(1) {
    font-size: 12px;
}

.timer :nth-child(2) {
    font-size: 24px;
    margin-top: 4px
}

.loading-container {
    /* Add your loading indicator styles here */
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    /* Black background with 80% opacity */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    /* Ensure it is above other content */
}

.loading-spinner {
    border: 8px solid rgba(255, 255, 255, 0.3);
    /* Light border */
    border-top: 8px solid #ffffff;
    /* White border for the spinning part */
    border-radius: 50%;
    width: 60px;
    height: 60px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.loading-text {
    color: #ffffff;
    margin-top: 20px;
    font-size: 1.2em;
}
</style>