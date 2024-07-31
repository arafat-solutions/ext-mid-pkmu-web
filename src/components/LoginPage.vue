<template>
  <div class="flex h-screen">
    <div class="w-7/12 bg-white flex items-center justify-center relative">
      <div class="absolute top-4 right-4">
        <button @click="openAdminLoginModal" class="text-[#6E4AE4] hover:text-[#5C3ED6] text-sm">
          <i class="fas fa-cog mr-2"></i> Konfigurasi Device
        </button>
      </div>
      <div class="w-96 p-8 shadow-lg bg-white rounded-xl">
        <h2 class="text-2xl font-bold mb-2 text-left">Login</h2>
        <p class="text-gray-500 mb-6 text-left">Silakan login menggunakan Email dan Kode Akses yang sudah dikirimkan.</p>
        <form @submit.prevent="login">
          <div class="mb-4">
            <label for="email" class="block text-gray-700 text-sm font-medium mb-2 text-left">Email</label>
            <input type="email" id="email" v-model="email" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-full text-gray-700 focus:outline-none focus:border-[#6E4AE4]"
                   placeholder="Masukkan Email" required />
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
</template>

<script>
import AdminLoginModal from '@/components/login/AdminModal.vue';

export default {
  components: {
    AdminLoginModal
  },
  data() {
    return {
      email: '',
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
      try {
        const res = await fetch("https://walrus-app-bfooa.ondigitalocean.app/api/scheduling/workstation-signin", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            workstationId: 0,
            email: this.email,
            code: this.code
          })
        });
        if (!res.ok) {
          throw new Error('Login failed');
        }
        const data = await res.json();
        console.log(data);

        localStorage.setItem('scheduleData', JSON.stringify(data));

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