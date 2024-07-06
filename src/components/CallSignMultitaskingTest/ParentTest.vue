<template>

    <div id="parent-callsign-multitask">
        <div class="left-side">
            <ColorTest :color-tank-data="configBe.color_tank" />
        </div>
        <div class="right-side">
            <CircleTest :alert-lights-data="configBe.alert_lights" :update-results="updateResults" />
            <HorizonTest :horizon-data="configBe.horizon" :update-results="updateResults" />
            <CallSignTest :callsign-data="configBe.callsign" :update-results="updateResults" />
        </div>
        <div class="timer">
            <p>Waktu:</p>
            <p>{{ formatTime(testTime) }}</p>
        </div>
        <div v-if="seeResults" class="results">
            <div class="test">
                <p class="title">lights </p>
                <div class="test-result">
                    <p>wrong: {{ results.alert_lights.wrong_response }}</p>
                    <p>correct: {{ results.alert_lights.correct_response }}</p>
                    <p>alert: {{ results.alert_lights.total_alert_count }}</p>
                    <p>warning: {{ results.alert_lights.total_warning_count }}</p>
                    <p>response: {{ results.alert_lights.avg_response_time }}</p>
                </div>
            </div>
            <div class="test">
                <p class="title">horizon </p>
                <div class="test-result">
                    <p>correct: {{ results.horizon.correct_time.toFixed(2) }}</p>
                </div>
            </div>
            <div class="test">
                <p class="title">Callsign </p>
                <div class="test-result">
                    <p>wrong: {{ results.call_sign.wrong_response }}</p>
                    <p>correct: {{ results.call_sign.correct_response }}</p>
                    <p>matches: {{ results.call_sign.total_match_count }}</p>
                </div>
            </div>
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
            tesInterval: null,
            callSignInputFocus: false,
            configBe: {
                alert_lights: {
                    frequency: 'often',// seldom, medium, often // seberapa sering dia nyala
                    speed: 'fast',// slow, medium, fast
                    play: true
                },
                callsign: {
                    frequency: 'often', // seldom, medium, often seberapa sering dia texttospeech nya ngomong
                    matches: 'high', // low, medium, high = seberapa sering dia dipanggil
                    speed: 'slow', // 
                    play: true,
                },
                color_tank: {
                    negative_score: true,
                    speed: 'slow',
                    duration: 10,
                    play: true
                },
                horizon: {
                    speed: 'slow', // slow, medium, fast
                    play: true
                },
                subtask: {
                    alert_lights: true,
                    callsign: true,
                    color_tank: true,
                    horizon: true
                }
            },
            results: {
                horizon: {
                    correct_time: 0
                },
                alert_lights: {
                    wrong_response: 0,
                    correct_response: 0,
                    total_alert_count: 0,
                    total_warning_count: 0,
                    avg_response_time: 0
                },
                call_sign: {
                    wrong_response: 0,
                    correct_response: 0,
                    total_match_count: 0,
                },
            },
            seeResults: true
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
        updateResults(component, data) {
            if (Object.hasOwn(this.results, component)) {
                Object.keys(data).forEach(key => {
                    if (Object.hasOwn(this.results[component], key)) {
                        this.results[component][key] += data[key];
                    }
                });
            }
        }

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

.results {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100vw;
    height: 70px;
    background-color: #6757dc;
    color: white;
    display: flex;
    justify-content: space-evenly;
}

.test {
    display: flex;
    flex-direction: column;
    width: 200px;
    height: 70px
}

.title {
    margin: 0
}

.test-result {
    margin: 0
}

.test-result {
    display: flex;
    justify-content: space-between;
    width: 300px;
    color: white;
}
</style>