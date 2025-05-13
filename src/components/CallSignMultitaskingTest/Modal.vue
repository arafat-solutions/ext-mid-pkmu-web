<template>
  <div
    v-if="visible"
    class="fixed inset-0 flex items-center justify-center bg-black/50 z-30"
  >
    <div
      class="w-full h-full bg-white flex flex-col justify-center items-center border border-gray-500 shadow-sm"
    >
      <h2 class="font-bold text-xl mt-4">{{ title }}</h2>
      <h2 class="text-lg mt-2 text-center" v-html="description"></h2>
      <div class="mt-4">
        <button
          @click="confirm"
          class="bg-[#7e57c2] text-white px-4 py-3 border-none rounded-md cursor-pointer font-bold"
        >
          {{isTraining?"Mulai Latihan":"Mulai Tes"}}
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
    isTraining: {
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
