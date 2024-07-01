<template>
    <div id="parent-callsign-multitask">
        <div class="left-side">
            <ColorTest />
        </div>
        <div class="right-side">
            <CircleTest />
            <HorizonTest />
            <CallSignTest />
        </div>
        <div class="timer">
            <p>Waktu:</p>
            <p>{{ formatTime(testTime) }}</p>
        </div>
    </div>
</template>

<script>
import ColorTest from './ColorTest.vue';
import HorizonTest from './HorizonTest.vue';
import CircleTest from './CircleTest.vue';
import CallSignTest from './CallSignTest.vue';

export default {
    name: 'CallSignMultitask',
    data() {
        return {
            testTime: 5 * 60,
            tesInterval: null
        }
    },
    mounted() {
        this.countDownTestTime()
    },
    beforeUnmount() {
        clearInterval(this.timerInterval);
    },
    methods: {
        formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainderSeconds = seconds % 60;
            return `${minutes}:${remainderSeconds < 10 ? '0' : ''}${remainderSeconds}`;
        },
        countDownTestTime() {
            this.tesInterval = setInterval(async () => {
                if (this.testTime > 0) {
                    this.testTime--;
                } else {
                    clearInterval(this.tesInterval);
                    // try {
                    //     await this.submitResult();
                    //     console.log('Test result submitted successfully');
                    // } catch (error) {
                    //     console.error('An error occurred while submitting the test result:', error);
                    // }
                }
            }, 1000)
        },
    },
    components: {
        ColorTest,
        HorizonTest,
        CircleTest,
        CallSignTest
    }
};
</script>

<style>
#parent-callsign-multitask {
    display: flex;
    height: 100vh;
    background-color: white;
    padding: 20px;
    max-width: 1000px;
    min-width: 1000px;
    margin: 0 auto;
}

.left-side {
    width: 50%;
    margin-top: 35px;
}

.right-side {
    width: 50%;
    margin-top: 30px
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
</style>