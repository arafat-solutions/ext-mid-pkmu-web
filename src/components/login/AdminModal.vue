<template>
  <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
    <div class="relative p-6 bg-white w-96 rounded-xl shadow-lg">
      <button @click="closeModal" class="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <h3 class="text-xl font-semibold text-gray-900 mb-4 text-left">Login</h3>
      <p class="text-gray-500 mb-6 text-left">Silakan login menggunakan akun Admin untuk mengakses menu Konfigurasi Device</p>
      <form @submit.prevent="adminLogin">
        <div class="mb-4">
          <label for="adminEmail" class="block text-gray-700 text-sm font-medium mb-2 text-left">Email</label>
          <input type="email" id="adminEmail" v-model="adminEmail" 
                 class="w-full px-3 py-2 border border-gray-300 rounded-xl text-gray-700 focus:outline-none focus:border-[#6E4AE4]"
                 placeholder="Masukkan Email" required />
        </div>
        <div class="mb-6">
          <label for="adminPassword" class="block text-gray-700 text-sm font-medium mb-2 text-left">Password</label>
          <input type="password" id="adminPassword" v-model="adminPassword"
                 class="w-full px-3 py-2 border border-gray-300 rounded-xl text-gray-700 focus:outline-none focus:border-[#6E4AE4]"
                 placeholder="Masukkan Password" required />
        </div>
        <button type="submit" :disabled="loading"
                class="w-full bg-[#6E4AE4] hover:bg-[#5C3ED6] text-white font-medium py-2 px-4 rounded-xl focus:outline-none focus:shadow-outline">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Login</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      showModal: false,
      adminEmail: '',
      adminPassword: '',
      loading: false
    };
  },
  methods: {
    openModal() {
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.adminEmail = '';
      this.adminPassword = '';
    },
    async adminLogin() {
      this.loading = true;
      try {
        const response = await fetch('https://walrus-app-bfooa.ondigitalocean.app/api/auth/sign-in', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.adminEmail,
            password: this.adminPassword
          })
        });

        if (!response.ok) {
          throw new Error('Login failed');
        }

        const data = await response.json();
        console.log('Login successful:', data);
        
        this.closeModal();
        this.$router.push('/config');
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
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