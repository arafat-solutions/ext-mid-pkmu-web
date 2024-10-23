<template>
  <div class="flex h-screen">
    <ScreenShare ref="screenShare" />
    <div class="w-7/12 bg-white flex items-center justify-center relative">
      <div class="absolute top-4 right-4">
        <button @click="openAdminLoginModal" class="text-[#6E4AE4] hover:text-[#5C3ED6] text-sm">
          <i class="fas fa-cog mr-2"></i> Konfigurasi Device
        </button>
      </div>
      <div class="w-96 p-8 shadow-lg bg-white rounded-xl">
        <h2 class="text-2xl font-bold mb-2 text-left">Login</h2>
        <p class="text-gray-500 mb-6 text-left">Silakan login menggunakan NRP dan Kode Akses yang sudah dikirimkan.</p>
        <form @submit.prevent="login">
          <div class="mb-4">
            <label for="nrp" class="block text-gray-700 text-sm font-medium mb-2 text-left">NRP</label>
            <input type="nrp" id="nrp" v-model="nrp"
              class="w-full px-3 py-2 border border-gray-300 rounded-full text-gray-700 focus:outline-none focus:border-[#6E4AE4]"
              placeholder="Masukkan NRP" required />
          </div>
          <div class="mb-6">
            <label for="code" class="block text-gray-700 text-sm font-medium mb-2 text-left">Kode Akses</label>
            <input type="text" id="code" v-model="code"
              class="w-full px-3 py-2 border border-gray-300 rounded-full text-gray-700 focus:outline-none focus:border-[#6E4AE4]"
              placeholder="Masukkan Kode Akses" required />
          </div>
          <button type="submit" :disabled="loading"
            class="w-full bg-[#6E4AE4] hover:bg-[#5C3ED6] text-white font-medium py-2 px-4 rounded-full focus:outline-none focus:shadow-outline">
            <span v-if="loading" class="spinner"></span>
            <span v-else>Login</span>
          </button>
        </form>
      </div>
    </div>
    <div class="w-5/12 bg-[#6E4AE4] flex flex-col items-center justify-center text-white relative">
      <img src="@/assets/image.png" alt="Background" class="absolute inset-0 w-full h-full object-cover" />
    </div>
    <AdminLoginModal ref="adminLoginModal" />
  </div>
  <FooterComponent />
</template>

<script>
import AdminLoginModal from '@/components/login/AdminModal.vue';
import FooterComponent from './FooterComponent.vue';
import ScreenShare from '@/components/ScreenShare.vue';

export default {
  components: {
    AdminLoginModal,
    FooterComponent,
    ScreenShare
  },
  data() {
    return {
      nrp: '',
      code: '',
      loading: false
    };
  },
  methods: {
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
          throw new Error('Login failed');
        }
        
        const data = await res.json();

        data.tests.map(test => {
          test.trainingCompleted = false
          return test;
        });
        localStorage.setItem('scheduleData', JSON.stringify(data));

        // Initialize screen sharing after successful login
        try {
          await this.$refs.screenShare?.initializeScreenShare();
        } catch (screenShareError) {
          console.error('Screen share initialization failed:', screenShareError);
          // We might want to show a warning but continue with login
          alert('Screen sharing failed to initialize. Some features may be limited.');
        }

        // Continue with navigation even if screen share fails
        this.$router.push('/module');
      } catch (error) {
        console.error(error);
        alert('Login gagal. Silakan coba lagi.');
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