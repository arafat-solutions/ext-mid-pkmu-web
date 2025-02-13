<template>
  <div
    v-if="visible"
    class="fixed inset-0 flex items-center justify-center bg-black/50 z-30"
  >
    <div
      class="w-full h-full bg-white flex flex-col justify-center items-center border border-gray-500 shadow-sm"
    >
      <div
        class="bg-[#ffebee] text-[#f44336] w-12 h-12 rounded-full flex justify-center items-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-circle-alert"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
      </div>
      <h2 class="font-bold text-xl mt-4">{{ title }}</h2>
      <h2 class="text-lg mt-2 text-center" v-html="description"></h2>
      <div class="mt-4">
        <button
          @click="confirm"
          class="bg-[#7e57c2] text-white px-4 py-3 border-none rounded-md cursor-pointer font-bold"
        >
          Mulai Latihan
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ModalComponent",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "Are you sure?",
    },
  },
  methods: {
    confirm() {
      this.$emit("confirm");
    },
    cancel() {
      this.$emit("cancel");
    },
  },
};
</script>
