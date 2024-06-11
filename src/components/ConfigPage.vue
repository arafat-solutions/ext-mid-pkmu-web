<template>
  <div class="config-page">
    <div class="header">
      <button class="back-button" @click="goBack">Kembali</button>
      <div class="tabs">
        <button :class="{ active: activeTab === 'Umum' }" @click="activeTab = 'Umum'">Umum</button>
        <button :class="{ active: activeTab === 'Kontrol' }" @click="activeTab = 'Kontrol'">Kontrol</button>
      </div>
    </div>
    <h1>Konfigurasi Perangkat</h1>
    <div class="content" v-if="activeTab === 'Umum'">
      <div class="dropdowns">
        <div class="dropdown">
          <label for="test-dropdown">Pilih Jenis Test</label>
          <select id="test-dropdown" v-model="selectedTest" @change="updateConfigurations">
            <option value="" disabled selected>Pilih Baterai Test</option>
            <option v-for="(test, index) in testNames" :key="index" :value="test">{{ test }}</option>
          </select>
        </div>
      </div>
      <div class="config-table" v-if="configurations.length">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>TANK WARNA</th>
              <th>Default</th>
              <th>Opsilain</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(config, index) in configurations" :key="config.id">
              <td>{{ index + 1 }}</td>
              <td>{{ config.name }}</td>
              <td>{{ config.defaultKey }}</td>
              <td><input type="text" v-model="config.secondaryKey" maxlength="1" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="content" v-else-if="activeTab === 'Kontrol'">
      <div class="dropdown">
        <label for="device-dropdown">Pilih perangkat</label>
        <select id="device-dropdown" v-model="selectedDevice" @change="loadControlConfigurations">
          <option value="" disabled selected>Pilih perangkat</option>
          <option v-for="(device, index) in devices" :key="index" :value="device">{{ device }}</option>
        </select>
      </div>
      <div class="control-table">
        <table>
          <thead>
            <tr>
              <th>KONFIGURASI DASAR</th>
              <th>Default</th>
              <th>Opsilain</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(control, index) in controlConfigurations" :key="index">
              <td>{{ control.name }}</td>
              <td>
                <component :is="control.component" v-model="control.value" :options="control.options" />
              </td>
              <td><input type="text" v-model="control.secondaryKey" maxlength="1" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="buttons">
        <button class="reset-button" @click="resetToDefault">Kembalikan seperti semula</button>
        <button class="save-button" @click="saveConfigurations">Simpan Konfigurasi</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      activeTab: 'Umum',
      selectedTest: '',
      selectedDevice: '',
      configurations: [],
      controlConfigurations: [],
      testNames: [],
      devices: ["Logitech Gamepad F310", "Other Device"],
      primaryPurple: '#6E51CB'
    };
  },
  created() {
    this.fetchTestConfigurations();
  },
  methods: {
    fetchTestConfigurations() {
      // Simulate an API call
      setTimeout(() => {
        const testConfigurations = {
          "Radar Vigilliance Test": [
            { id: 1, name: "Tangki Merah", defaultKey: "Q", secondaryKey: "" },
            { id: 2, name: "Tangki Hijau", defaultKey: "W", secondaryKey: "" },
            // Add more configurations as needed
          ],
          "Multitasking Mix with Call Sign": [
            { id: 1, name: "Tabung BKH (Biru, Kuning, Hijau)", defaultKey: "A", secondaryKey: "" },
            { id: 2, name: "Tabung HBM (Hijau, Biru, Merah)", defaultKey: "S", secondaryKey: "" },
            // Add more configurations as needed
          ],
          "PFD Tracking": [
            { id: 1, name: "Tangki Kuning", defaultKey: "E", secondaryKey: "" },
            { id: 2, name: "Tangki Biru", defaultKey: "R", secondaryKey: "" },
            // Add more configurations as needed
          ],
          "Multitasking mix With Color Tanks": [
            { id: 1, name: "Tangki Merah", defaultKey: "Q", secondaryKey: "" },
            { id: 2, name: "Tangki Hijau", defaultKey: "W", secondaryKey: "" },
            // Add more configurations as needed
          ]
        };
        this.testNames = Object.keys(testConfigurations);
        this.testConfigurations = testConfigurations;
      }, 1000);
    },
    loadControlConfigurations() {
      // Simulate loading control configurations based on the selected device
      this.controlConfigurations = [
        { name: "Balikkan Sumbu X", component: "ToggleSwitch", value: false },
        { name: "Balikkan Sumbu Y", component: "ToggleSwitch", value: false },
        { name: "Sensitivitas Analog Kiri", component: "Slider", value: 50 },
        { name: "Sensitivitas Analog Kanan", component: "Slider", value: 50 },
        { name: "Sensitivitas Tombol", component: "Slider", value: 50 },
        { name: "Tukar Mode", component: "Dropdown", value: "Start", options: ["Start", "Select"] },
        { name: "Pemetaan Tombol", component: "Dropdown", value: "Kiri", options: ["Kiri", "Kanan"] }
      ];
    },
    goBack() {
      // Implement back navigation logic
    },
    updateConfigurations() {
      this.configurations = this.testConfigurations[this.selectedTest];
    },
    resetToDefault() {
      // Logic to reset control configurations to default values
      this.loadControlConfigurations();
    },
    saveConfigurations() {
      // Logic to save current control configurations
      console.log("Configurations saved", this.controlConfigurations);
    }
  }
};
</script>

<style>
.config-page {
  padding: 20px;
  overflow-y: auto;
}
.header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.back-button {
  background: none;
  border: none;
  color: #6E51CB;
  cursor: pointer;
  margin-bottom: 10px;
}
.tabs {
  display: flex;
}
.tabs button {
  background: none;
  border: none;
  color: black;
  font-weight: bold;
  padding: 10px;
  cursor: pointer;
}
.tabs .active {
  border-bottom: 2px solid #6E51CB;
}
h1 {
  text-align: center;
  margin: 20px 0;
}
.dropdowns {
  display: flex;
  justify-content: space-between;
  margin: 20px 0;
}
.dropdown {
  display: flex;
  flex-direction: column;
}
.dropdown label {
  margin-bottom: 5px;
}
.dropdown select {
  padding: 10px;
  border-radius: 20px;
  border: 1px solid #ccc;
}
.config-table,
.control-table {
  margin-top: 20px;
  width: 75%;
  margin: 0 auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 10px;
  text-align: left;
}
th {
  background-color: #f0f0f0;
  border-radius: 10px 10px 0 0;
}
td input {
  width: 50px;
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #ccc;
  text-align: center;
}
.buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}
.reset-button,
.save-button {
  background-color: #6E51CB;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
}
.reset-button {
  background-color: #e0e0e0;
  color: black;
}
</style>
