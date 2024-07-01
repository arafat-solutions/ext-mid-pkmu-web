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
    </div>
</template>

<script>
import ColorTest from './ColorTest.vue';
import HorizonTest from './HorizonTest.vue';
import CircleTest from './CircleTest.vue';
import CallSignTest from './CallSignTest.vue';

export default {
    name: 'CallSignMultitask',
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
    margin-top: 5px;
}

.right-side {
    width: 50%;
    margin: 0
}
</style>