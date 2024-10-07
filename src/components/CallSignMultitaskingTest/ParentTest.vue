<template>
    <div id="parent-callsign-multitask">
        <!-- modal for start -->
        <!-- <ModalComponent :visible="isModalVisible && indexConfig === 0" title="Start Test"
            description="Are you sure you want to start this test?" @confirm="handleConfirm" @cancel="handleCancel" /> -->

        <!-- Modal for change test -->
        <ModalComponent
            :visible="indexTrainingConfig >= 0 && indexTrainingConfig <= (trainingConfigs.length - 1) && isModalTrainingVisible"
            title="Start Test Training" description="Are you sure you want to start this training test?"
            @confirm="handleConfirmTraining" @cancel="handleCancel" />

        <div class="left-side">
            <ColorTest v-if="configReady" :color-tank-data="configBe.color_tank" :update-results="updateResults"
                :finalScore="results.color_tank.final_score" />
        </div>
        <div class="right-side">
            <CircleTest v-if="configReady" :alert-lights-data="configBe.alert_lights" :update-results="updateResults"
                :update-result-light-avg-time="updateResultLightAvgTime" />
            <HorizonTest v-if="configReady" :horizon-data="configBe.horizon" :update-results="updateResults" />
            <CallSignTest v-if="configReady" :callsign-data="configBe.callsign" :update-results="updateResults"
                ref="callSignTest" />
        </div>
        <div class="timer">
            <p>Waktu:</p>
            <p>{{ formatTime(testTime) }}</p>
        </div>
        <div v-if="seeResults" class="results">
            <div class="test">
                <p>index config: {{ indexConfig }}</p>
                <p>index training config: {{ indexTrainingConfig }}</p>
            </div>
            <div class="test">
                <p class="title">Color </p>
                <div class="test-result">
                    <p>correct: {{ results.color_tank.correct_button_combination }}</p>
                    <p>below: {{ results.color_tank.below_line_responses }}</p>
                    <p>total occurances: {{ results.color_tank.total_occurrences }}</p>
                    <p>final score: {{ results.color_tank.final_score }}</p>
                </div>
            </div>
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
        <div v-if="loading" class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">Your result is submitting</div>
        </div>
    </div>
</template>

<script>
import ColorTest from './ColorTest.vue';
import HorizonTest from './HorizonTest.vue';
import CircleTest from './CircleTest.vue';
import CallSignTest from './CallSignTest.vue';
import ModalComponent from './Modal.vue'
import { removeTestByNameAndUpdateLocalStorage } from '@/utils/index'
import { getConfigs, getCurrentConfig, getStoredIndices } from '@/utils/configs';

export default {
    name: 'CallSignMultitask',
    data() {
        return {
            loading: false,
            startTest: false,
            testTime: 5 * 60,
            tesInterva: null,
            configBe: {
                alert_lights: {
                    frequency: 'often',// seldom, medium, often // seberapa sering dia nyala
                    speed: 'fast',// slow, medium, fast
                    play: false
                },
                callsign: {
                    frequency: 'often', // seldom, medium, often seberapa sering dia texttospeech nya ngomong
                    matches: 'high', // low, medium, high = seberapa sering dia dipanggil
                    speed: 'slow', // 
                    play: false,
                },
                color_tank: {
                    negative_score: true,
                    speed: 'fast',
                    descend_speed: "fast", // slow, medium, fast
                    colored_lower_tank: true,
                    play: false,
                    final_score: 0
                },
                horizon: {
                    speed: 'medium', // slow, medium, fast
                    play: false
                },
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
                color_tank: {
                    correct_button_combination: 0,
                    below_line_responses: 0,
                    total_occurrences: 0,
                    final_score: 120 // sisa yang 120
                }
            },
            seeResults: false, // untuk hide show debugging
            refreshCount: 0,
            // data for configs
            configs: [],
            trainingConfigs: [],
            indexConfig: 0,
            indexTrainingConfig: 0,
            moduleId: '',
            sessionId: '',
            userId: '',
            testId: '',
            isModalTrainingVisible: false,
            isModalVisible: true,
            configReady: false,
        }
    },
    async mounted() {
        this.initConfig()

        // Load the refresh count from localStorage
        this.refreshCount = parseInt(localStorage.getItem('refreshCallsignMultitaskTest') || '0');
        // Increment the refresh count
        this.refreshCount++;
        // Save the updated count to localStorage
        localStorage.setItem('refreshCallsignMultitaskTest', this.refreshCount.toString());
        // Add event listener for beforeunload
        window.addEventListener('beforeunload', this.handleBeforeUnload);
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('beforeunload', this.handleBeforeUnload)

        clearInterval(this.tesInterval);
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
                    this.$refs.callSignTest.cleanup()

                    if (this.indexTrainingConfig < (this.trainingConfigs.length - 1)) {
                        this.indexTrainingConfig++
                        this.isModalTrainingVisible = true
                    } else if (this.indexConfig < (this.configs.length - 1)) {
                        this.indexConfig++
                        this.isModalTrainingVisible = true
                    } else {
                        await this.submitResult();
                    }

                    // Update localStorage with new indices
                    localStorage.setItem("index-config-call-sign", JSON.stringify({
                        indexTrainingConfig: this.indexTrainingConfig,
                        indexConfig: this.indexConfig
                    }))
                }
            }, 1000)
        },
        initConfig() {
            const configData = getConfigs('call-sign-multitask-test');
            if (!configData) {
                this.$router.push('/module');
                return;
            }

            this.configs = configData.configs;
            this.trainingConfigs = configData.trainingConfigs;
            this.moduleId = configData.moduleId;
            this.sessionId = configData.sessionId;
            this.userId = configData.userId;

            const savedIndices = getStoredIndices('index-config-call-sign');
            if (savedIndices) {
                this.indexTrainingConfig = savedIndices.indexTrainingConfig;
                this.indexConfig = savedIndices.indexConfig;
            }

            this.isModalTrainingVisible = true;
            this.setConfig(getCurrentConfig(this.configs, this.trainingConfigs, this.indexTrainingConfig, this.indexConfig));
        },
        setConfig(config) {
            // const { alert_lights, callsign, color_tank, duration, horizon, id, subtask } = config
            const { alert_lights, callsign, color_tank, horizon, id, subtask } = config

            this.$nextTick(() => {
                this.configBe.alert_lights.frequency = alert_lights?.frequency
                this.configBe.alert_lights.speed = alert_lights?.speed
                this.configBe.alert_lights.play = subtask?.alert_lights

                this.configBe.callsign.frequency = callsign?.frequency
                this.configBe.callsign.matches = callsign?.matches
                this.configBe.callsign.speed = callsign?.speed
                this.configBe.callsign.play = subtask?.callsign

                this.configBe.color_tank.negative_score = color_tank?.negative_score
                this.configBe.color_tank.speed = color_tank?.speed
                this.configBe.color_tank.descend_speed = color_tank?.descend_speed
                this.configBe.color_tank.colored_lower_tank = color_tank?.colored_lower_tank
                this.configBe.color_tank.play = subtask?.color_tank

                this.configBe.horizon.speed = horizon?.speed
                this.configBe.horizon.play = subtask?.horizon

                this.testTime = 2 * 60
                this.testId = id
                this.results.color_tank.final_score = 120 // hardcode

                this.configReady = true;
            });
        },
        handleConfirm() {
            this.isModalVisible = false
            this.startTest = true
            this.countDownTestTime()
            if (this.configBe.callsign.play === true) {
                this.$refs.callSignTest.startSpeechTest()
            }
        },
        handleCancel() {
            this.isModalVisible = false;
            this.$router.replace('/module');
        },
        handleConfirmTraining() {
            const config = this.indexTrainingConfig <= (this.trainingConfigs.length - 1)
                ? this.trainingConfigs[this.indexTrainingConfig]
                : this.configs[this.indexConfig]

            this.setConfig(config)

            console.log(config, "<<< config")

            localStorage.setItem("index-config-call-sign", JSON.stringify({ indexTrainingConfig: this.indexTrainingConfig, indexConfig: this.indexConfig }))

            this.isModalTrainingVisible = false
            this.countDownTestTime()

            if (this.configBe.callsign.play === true) {
                this.$refs.callSignTest.startSpeechTest()
            }
        },
        updateResults(component, data) {
            if (Object.hasOwn(this.results, component)) {
                Object.keys(data).forEach(key => {
                    if (Object.hasOwn(this.results[component], key)) {
                        this.results[component][key] += data[key];
                    }
                });
            }
        },
        updateResultLightAvgTime(time) {
            this.results.alert_lights.avg_response_time = time
        },
        async submitResult() {
            try {
                this.loading = true;
                const API_URL = process.env.VUE_APP_API_URL;
                const payload = {
                    testSessionId: this.sessionId,
                    userId: this.userId,
                    moduleId: this.moduleId,
                    batteryTestConfigId: this.testId,
                    result: this.results,
                    refreshCount: this.refreshCount
                }
                const response = await fetch(`${API_URL}/api/submission`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }
                removeTestByNameAndUpdateLocalStorage('Multitasking Mix With Call Sign')
                // Remove the refresh count in localStorage after successful submission
                localStorage.removeItem('refreshCallsignMultitaskTest');
                localStorage.removeItem("index-config-call-sign")
                this.$router.push('/module');
            } catch (error) {
                console.log(error, "<< error")
            } finally {
                this.loading = false; // Set loading to false when the submission is complete
            }
        },
        handleBeforeUnload() {
            // Save the current refresh count to localStorage before the page unloads
            localStorage.setItem('refreshCallsignMultitaskTest', this.refreshCount.toString());
        },
    },
    components: {
        ColorTest,
        HorizonTest,
        CircleTest,
        CallSignTest,
        ModalComponent,
    }
};
</script>

<style>
#parent-callsign-multitask {
    display: flex;
    height: 100vh;
    background-color: white;
    padding: 10px;
    max-width: 1000px;
    min-width: 1000px;
    margin: 0 auto;
}

.start-container {
    width: 100vw;
    height: 100vh;
    background-color: white;
    position: absolute;
    left: 0;
    top: 0;
    z-index: 33;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
}

.start-button {
    width: 200px;
    padding: 10px;
    background-color: #6c5ce7;
    color: #fff;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    margin-top: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 24px;
}

.left-side {
    width: 50%;
    /* margin-top: 25px; */
    display: flex;
    flex-direction: column;
    align-items: center;
}

.right-side {
    width: 50%;
    /* margin-top: 30px */
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
    margin: auto auto;
    border: 1px solid white;
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