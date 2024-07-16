<template>
  <div class="compass">
    <!-- Arrow -->
    <svg class="compass__arrow" :style="`transform: rotate(${degrees}deg);`" width="37px" height="36px" viewBox="0 0 37 36" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <g id="spot-search-copy-10" transform="translate(-236.000000, -796.000000)">
                <g id="Group" transform="translate(236.000000, 796.000000)">
                    <rect id="Rectangle" opacity="0" x="0.5" y="0" width="36" height="36"></rect>
                    <polygon id="Rectangle" fill="#FFFFFF" points="14 18 18.5 7 23 18 18.5292306 29"></polygon>
                    <polygon id="Rectangle" fill="#FF0000" transform="translate(18.500000, 12.500000) scale(1, -1) translate(-18.500000, -12.500000) " points="14 7 23 7 18.5292306 18"></polygon>
                    <circle id="Oval" fill="#000000" cx="18.5" cy="18" r="1.5"></circle>
                </g>
            </g>
        </g>
    </svg>
    <!-- BG dots -->
    <svg class="compass__background" width="37px" height="36px" viewBox="0 0 37 36" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <g id="spot-search-copy-10" transform="translate(-236.000000, -796.000000)">
                <rect id="bg" opacity="0" x="236.5" y="796" width="36" height="36"></rect>
                <circle id="nn" fill="#FFFFFF" cx="254.5" cy="797.5" r="1.5"></circle>
                <circle id="ss" fill="#FFFFFF" cx="254.5" cy="830.5" r="1.5"></circle>
                <circle id="ee" fill="#FFFFFF" cx="271"   cy="814"   r="1.5"></circle>
                <circle id="ww" fill="#FFFFFF" cx="238"   cy="814"   r="1.5"></circle>
                <circle id="nw" fill="#FFFFFF" cx="242.5" cy="802.5" r="1"  ></circle>
                <circle id="sw" fill="#FFFFFF" cx="242.5" cy="825.5" r="1"  ></circle>
                <circle id="ew" fill="#FFFFFF" cx="266.5" cy="825.5" r="1"  ></circle>
                <circle id="ne" fill="#FFFFFF" cx="266.5" cy="802.5" r="1"  ></circle>
            </g>
        </g>
    </svg>
  </div>
</template>

<script>
export default {
  name: 'AppCompass',
  props: {
    degrees: {
      type: Number,
      required: true,
      default: 0,
    }
  }
}
</script>

<style scoped>
.compass {
  position: relative;
  height: 36px;
  width: 36px;
}
.compass__arrow, .compass__background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
