<template>
  <div class="flex h-screen" tabindex="0" @keydown="handleKeyPress" ref="loginContainer">
    <div class="w-7/12 bg-white flex items-center justify-center relative">
      <div class="w-96 p-8 shadow-lg bg-white rounded-xl">
        <h2 class="text-2xl font-bold mb-2 text-left">Login</h2>
        <p class="text-gray-500 mb-6 text-left">Silakan login menggunakan NRP dan Kode Akses yang sudah dikirimkan.</p>
        <form @submit.prevent="login">
          <div class="mb-4">
            <label for="nrp" class="block text-gray-700 text-sm font-medium mb-2 text-left">NRP</label>
            <input type="text" id="nrp" v-model="nrp" autocomplete="off"
              class="w-full px-3 py-2 border border-gray-300 rounded-full text-gray-700 focus:outline-none focus:border-[#6E4AE4]"
              placeholder="Masukkan NRP" required />
          </div>
          <div class="mb-6">
            <label for="code" class="block text-gray-700 text-sm font-medium mb-2 text-left">Kode Akses</label>
            <input type="text" id="code" v-model="code" autocomplete="off"
              class="w-full px-3 py-2 border border-gray-300 rounded-full text-gray-700 focus:outline-none focus:border-[#6E4AE4]"
              placeholder="Masukkan Kode Akses" required />
          </div>
          <button type="submit" :disabled="loading"
            class="w-full bg-[#6E4AE4] hover:bg-[#5C3ED6] text-white font-medium py-2 px-4 rounded-full focus:outline-none focus:shadow-outline">
            <span v-if="loading" class="spinner"></span>
            <span v-else>Login</span>
          </button>
          <p v-if="error" class="text-red-500 text-xs mt-2">{{ error }}</p>
        </form>
      </div>
    </div>

    <div class="w-5/12 bg-[#6E4AE4] flex flex-col items-center justify-center text-white relative">
      <!-- Removed the admin button from here -->
      <img src="@/assets/image.png" alt="Background" class="absolute inset-0 w-full h-full object-cover" />
    </div>
    <AdminLoginModal ref="adminLoginModal" />
  </div>
  <FooterComponent />
</template>

<script>
import AdminLoginModal from '@/components/login/AdminModal.vue';
import FooterComponent from './FooterComponent.vue';

export default {
  components: {
    AdminLoginModal,
    FooterComponent,
  },
  data() {
    return {
      nrp: '',
      code: '',
      loading: false,
      error: null,
      // Keyboard sequence detection
      secretCode: ['p', 'k', 'm', 'u'],
      userInput: [],
      maxBufferTime: 2000, // 2 seconds between keypresses
      lastKeyTime: 0
    };
  },
  mounted() {
    // Focus the container to capture keyboard events
    this.$refs.loginContainer.focus();
  },
  methods: {
    handleKeyPress(event) {
      const currentTime = new Date().getTime();
      
      // Reset sequence if too much time has passed since last keypress
      if (currentTime - this.lastKeyTime > this.maxBufferTime && this.userInput.length > 0) {
        this.userInput = [];
      }
      
      this.lastKeyTime = currentTime;
      this.userInput.push(event.key);
      
      // Keep only the last N keys where N is the length of the secret code
      if (this.userInput.length > this.secretCode.length) {
        this.userInput.shift();
      }
      
      // Check if the sequence matches
      if (this.checkSequence()) {
        this.openAdminLoginModal();
        this.userInput = []; // Reset after success
      }
    },
    
    checkSequence() {
      if (this.userInput.length !== this.secretCode.length) {
        return false;
      }
      
      for (let i = 0; i < this.secretCode.length; i++) {
        if (this.userInput[i] !== this.secretCode[i]) {
          return false;
        }
      }
      
      return true;
    },
    
    openAdminLoginModal() {
      this.$refs.adminLoginModal.openModal();
    },
    
    async login() {
      this.loading = true;
      const workstationId = localStorage.getItem('designatedWorkstation')
      const API_URL = process.env.VUE_APP_API_URL;
      try {
        const res = await fetch(`${API_URL}/api/scheduling/workstation-signin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            workstationId: Number(workstationId),
            nrp: this.nrp,
            code: this.code
          })
        });

        if (!res.ok) {
          const data = await res.json();
          this.error = data?.message;
          throw new Error('Login failed');
        }

        const data = await res.json();

        data.tests.map(test => {
          test.trainingCompleted = false
          return test;
        });
        localStorage.setItem('scheduleData', JSON.stringify(data));

        // Emit login success before navigation
        console.log('emit login success');
        this.$emit('login-success');

        // Navigate to module page
        this.$router.push('/module');
      } catch (error) {
        console.error(error);
        // alert('Login gagal. Silakan coba lagi.');
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.spinner {
  @apply inline-block w-4 h-4 border-2 border-white border-solid rounded-full animate-spin;
  border-top-color: transparent;
}
</style>