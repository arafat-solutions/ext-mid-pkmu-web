<template>
  <div id="main-view">
    <div class="indicators">
      <Airspeed id="airspeed" class="indicator-bg" :size="200" :airspeed="airspeed" />
      <Heading id="heading" class="indicator-bg" :size="200" :heading="heading"/>
      <button id="btn-green" class="btn-listening-action green-gradient"></button>
      <button id="btn-red" class="btn-listening-action red-gradient"></button>
      <Altimeter id="altimeter" class="indicator-bg" :size="200" :altitude="altitude" :pressure="pressure" />
      <AnalogClock id="clock" />
      <Variometer class="indicator-bg" :size="200" :vario="vario" v-show="false" />
      <Attitude class="indicator-bg" :size="200" :roll="roll" :pitch="pitch" v-show="false"/>
    </div>
  </div>
</template>

<script>
import {Airspeed, Attitude, Altimeter, Heading, Variometer} from  'vue-flight-indicators';
import AnalogClock from './instrument-coordination/AnalogClock';

export default {
  components: {
    Attitude,
    Heading,
    Variometer,
    Airspeed,
    Altimeter,
    AnalogClock,
  },
  data: function () {
    return {
      counter: 0,
      roll: 0,
      pitch: 0,
      heading: 0,
      vario: 0,
      airspeed: 0,
      altitude: 0,
      pressure: 0
    }
  },
  mounted: function () {
    setInterval(() => {
      this.roll = 30*Math.sin(this.counter/10);
      this.pitch = 50*Math.sin(this.counter/20);
      this.heading = this.counter;
      this.vario = 2*Math.sin(this.counter/10);
      this.airspeed = 80+80*Math.sin(this.counter/10);
      this.altitude = 10*this.counter;
      this.pressure = 1000+3*Math.sin(this.counter/50);
      this.counter++;
    }, 35);
  }
}
</script>

<style scoped>
body {
  background-color: grey;
  margin: 0; /* Ensure there is no margin around the body */
  padding: 0; /* Ensure there is no padding around the body */
  height: 100vh; /* Make the body take up the full viewport height */
  width: 100vw; /* Make the body take up the full viewport width */
  display: flex; /* To ensure it can contain flex children if needed */
  justify-content: center; /* Optional: Center content horizontally */
  align-items: center; /* Optional: Center content vertically */
}

#main-view {
  position: relative;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 20px;
  width: 1280px;
  margin: 60px auto;
}

#airspeed {
  position: absolute;
  left: 300px;
  top: 200px;
}

#heading {
  position: absolute;
  left: 540px;
  top: 75px;
}

#altimeter {
  position: absolute;
  left: 780px;
  top: 200px;
}

#clock {
  position: absolute;
  left: 540px;
  top: 300px;
}

#btn-green {
  position: absolute;
  left: 415px;
  top: 425px;
}

#btn-red {
  position: absolute;
  left: 325px;
  top: 425px;
}

.btn-listening-action {
  width: 60px;
  height: 60px;
  border: none;
  cursor: pointer;
  border-radius: 50%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3), 0 6px 20px rgba(0, 0, 0, 0.2);
  transition: transform 0.1s;
}

.btn-listening-action:active {
  transform: translateY(4px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), 0 3px 10px rgba(0, 0, 0, 0.2);
}

.green-gradient {
  background: linear-gradient(to right, #00c851, #007e33);
}

.red-gradient {
  background: linear-gradient(to right, #ff4444, #cc0000);
}
</style>
