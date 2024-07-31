<template>
  <div class="container mx-auto p-4 overflow-auto">
    <div class="flex items-center mb-6">
      <button @click="$router.push('/')" class="text-[#6E4AE4] hover:text-[#5C3ED6] mr-4 flex items-center">
        <i class="fas fa-arrow-left mr-2"></i> Kembali
      </button>
    </div>

    <h1 class="text-2xl font-bold justify-center">Konfigurasi Perangkat</h1>
    <div class="mb-6">
      <div class="flex justify-start">
        <button class="text-[#6E4AE4] font-semibold"
        @click="activeTab = 'umum'" 
        :class="['mr-4 pb-2', activeTab === 'umum' ? 'border-b-2 border-[#6E4AE4] text-[#6E4AE4]' : 'text-gray-500']"
      >
        Umum
      </button>
      <button  class="text-[#6E4AE4] font-semibold"
        @click="activeTab = 'workstation'" 
        :class="['pb-2', activeTab === 'workstation' ? 'border-b-2 border-[#6E4AE4] text-[#6E4AE4]' : 'text-gray-500']"
      >
        Workstation
      </button>
      </div>
    </div>

    <div v-if="activeTab === 'umum'">
      <h2 class="text-xl font-semibold mb-4 text-left">Umum</h2>
      
      <div class="grid grid-cols-2 gap-4 mb-2 text-left justify-between">
        <div>
          <label for="testType" class="block text-sm font-medium text-gray-700 mb-1">Pilih Jenis Test</label>
          <select 
            id="testType" 
            v-model="selectedTest" 
            @change="updateInputMapping"
            class="w-full px-3 py-2 text-base border border-gray-300 rounded-full focus:outline-none focus:ring-[#6E4AE4] focus:border-[#6E4AE4]"
          >
            <option v-for="test in Object.keys(testData)" :key="test" :value="test">
              {{ test }}
            </option>
          </select>
        </div>
        <div>
          <label for="inputDevice" class="block text-sm font-medium text-gray-700 mb-1">Input Device</label>
          <select 
            id="inputDevice"
            class="w-full px-3 py-2 text-base border border-gray-300 rounded-full focus:outline-none focus:ring-[#6E4AE4] focus:border-[#6E4AE4]"
          >
            <option>Pilih Input Device</option>
          </select>
        </div>
      </div>

      <div v-if="selectedTest && testData[selectedTest]">
        <div v-for="(category, categoryName) in testData[selectedTest]" :key="categoryName" class="mb-8">
          <div class="bg-gray-100 px-4 py-2 rounded-t-md font-medium flex justify-between">
            <span>{{ categoryName }}</span>
            <div>
              <span class="mr-12">Default</span>
              <span>Opsi lain</span>
            </div>
          </div>
          <div class="border-l border-r border-b border-gray-200 text-left">
            <div v-for="(item, itemName, index) in category" :key="itemName" 
                 class="flex justify-between items-center px-4 py-2"
                 :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50'">
              <span class="w-1/2">{{ index + 1 }}. {{ itemName }}</span>
              <div class="flex w-1/2">
                <span class="w-1/2 text-center">{{ item.default }}</span>
                <input 
                  v-model="testData[selectedTest][categoryName][itemName].alt" 
                  class="w-1/2 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-[#6E4AE4] focus:border-[#6E4AE4]"
                  :placeholder="item.alt || '...'"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end mt-8">
        <button 
          @click="restoreDefaults" 
          class="px-4 py-2 border border-[#6E4AE4] text-[#6E4AE4] rounded-xl hover:bg-[#6E4AE4] hover:text-white transition-colors mr-4"
        >
          Kembalikan seperti semula
        </button>
        <button 
          @click="saveConfiguration" 
          class="px-4 py-2 bg-[#6E4AE4] text-white rounded-xl hover:bg-[#5C3ED6] transition-colors"
        >
          Simpan Konfigurasi
        </button>
      </div>
    </div>

    <div v-else-if="activeTab === 'workstation'">
      <!-- Workstation tab content -->
      <p>Workstation configuration coming soon...</p>
    </div>
  </div>
</template>

<script>
// The script section remains largely the same as before
export default {
  data() {
    return {
      activeTab: 'umum',
      selectedTest: '',
      testData: {
        "Multitasking Mix with Call Sign": {
          "TANK WARNA": {
            "Tangki Merah": { "default": "Q", "alt": "" },
            "Tangki Hijau": { "default": "W", "alt": "" },
            "Tangki Kuning": { "default": "E", "alt": "" },
            "Tangki Biru": { "default": "R", "alt": "" },
            "Tabung BKH (Biru, Kuning, Hijau)": { "default": "A", "alt": "" },
            "Tabung HBM (Hijau, Biru, Merah)": { "default": "S", "alt": "" },
            "Tabung MKB (Merah, Kuning, Biru)": { "default": "D", "alt": "" },
            "Tabung KMH (Kuning, Merah, Hijau)": { "default": "F", "alt": "" }
          }
        },
        "Rotating Maze": {
          "Umum": {
            "Rotasi Kanan": { "default": "Q", "alt": "" },
          }
        }
      },
    };
  },
  // ... (rest of the methods remain the same)
};
</script>