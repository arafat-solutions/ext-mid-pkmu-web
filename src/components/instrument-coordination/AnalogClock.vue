<template>
  <div class="clock">
    <div class="hour"></div>
    <div class="min"></div>
    <div class="sec"></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      deg: 6,
    };
  },
  mounted() {
    this.setClock();
    setInterval(this.setClock, 1000);
    document.documentElement.setAttribute('data-theme', 'dark');
  },
  methods: {
    setClock() {
      const hour = this.$el.querySelector('.hour');
      const min = this.$el.querySelector('.min');
      const sec = this.$el.querySelector('.sec');

      let day = new Date();
      let hh = day.getHours() * 30;
      let mm = day.getMinutes() * this.deg;
      let ss = day.getSeconds() * this.deg;

      hour.style.transform = `rotateZ(${hh + mm / 12}deg)`;
      min.style.transform = `rotateZ(${mm}deg)`;
      sec.style.transform = `rotateZ(${ss}deg)`;
    }
  }
};
</script>

<style scoped>
.page-header {
  font-size: 2rem;
  color: #ffffff;
  padding: 2rem 0;
  font-family: monospace;
  text-transform: uppercase;
  letter-spacing: 4px;
  transition: all ease 0.2s;
}

.clock {
  min-height: 160px;
  min-width: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #232323;
  background-image: url("https://imvpn22.github.io/analog-clock/clock.png");
  background-position: center center;
  background-size: cover;
  border-radius: 50%;
  border: 4px solid #232323;
  box-shadow: 0 -15px 15px rgba(255, 255, 255, 0.05),
    inset 0 -15px 15px rgba(255, 255, 255, 0.05), 0 15px 15px rgba(0, 0, 0, 0.3),
    inset 0 15px 15px rgba(0, 0, 0, 0.3);
  transition: all ease 0.2s;
}

.clock:before {
  content: "";
  height: 0.75rem;
  width: 0.75rem;
  background-color: #ffffff;
  border: 2px solid #232323;
  position: absolute;
  border-radius: 50%;
  z-index: 1000;
  transition: all ease 0.2s;
}

.hour,
.min,
.sec {
  position: absolute;
  display: flex;
  justify-content: center;
  border-radius: 50%;
}

.hour {
  height: 8em;
  width: 8em;
}

.hour:before {
  content: "";
  position: absolute;
  height: 50%;
  width: 6px;
  background-color: #ffffff;
  border-radius: 6px;
}

.min {
  height: 10em;
  width: 10em;
}

.min:before {
  content: "";
  height: 50%;
  width: 4px;
  background-color: #ffffff;
  border-radius: 4px;
}

.sec {
  height: 10em;
  width: 10em;
}

.sec:before {
  content: "";
  height: 60%;
  width: 2px;
  background-color: #f00;
  border-radius: 2px;
}
</style>
