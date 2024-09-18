<template>
  <div class="profile-container">
    <div class="profile-header">
      <span class="back-arrow">&#8592;</span>
      <img src="" alt="User Avatar" class="avatar" />
      <h2>{{ username }}</h2>
    </div>
    <form class="profile-form">
      <div class="form-row">
        <div class="form-group">
          <label for="namaPeserta">Nama Peserta <span class="required">*</span></label>
          <input type="text" id="namaPeserta" v-model="profile.namaPeserta" required />
        </div>
        <div class="form-group">
          <label for="email">Email <span class="required">*</span></label>
          <input type="email" id="email" v-model="profile.email" disabled />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="gender">Gender <span class="required">*</span></label>
          <select id="gender" v-model="profile.gender" required>
            <option value="Pria">Pria</option>
            <option value="Wanita">Wanita</option>
          </select>
        </div>
        <div class="form-group">
          <label for="tempatLahir">Tempat Lahir <span class="required">*</span></label>
          <select id="tempatLahir" v-model="profile.tempatLahir" required>
            <option v-for="option in tempatLahirOptions" :key="option" :value="option">{{ option }}</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="tanggalLahir">Tanggal Lahir <span class="required">*</span></label>
          <input type="date" id="tanggalLahir" v-model="profile.tanggalLahir" required />
        </div>
        <div class="form-group">
          <label for="jabatan">Jabatan <span class="required">*</span></label>
          <input type="text" id="jabatan" v-model="profile.jabatan" required />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="pangkat">Pangkat <span class="required">*</span></label>
          <input type="text" id="pangkat" v-model="profile.pangkat" required />
        </div>
        <div class="form-group">
          <label for="noKepegawaian">No Kepegawaian <span class="required">*</span></label>
          <input type="text" id="noKepegawaian" v-model="profile.noKepegawaian" required />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="nik">NIK <span class="required">*</span></label>
          <input type="text" id="nik" v-model="profile.nik" required />
        </div>
        <div class="form-group">
          <label for="alamatLengkap">Alamat Lengkap</label>
          <input type="text" id="alamatLengkap" v-model="profile.alamatLengkap" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="provinsi">Provinsi <span class="required">*</span></label>
          <select id="provinsi" v-model="profile.provinsi" required>
            <option v-for="option in provinsiOptions" :key="option" :value="option">{{ option }}</option>
          </select>
        </div>
        <div class="form-group">
          <label for="kotaKabupaten">Kota/Kabupaten <span class="required">*</span></label>
          <select id="kotaKabupaten" v-model="profile.kotaKabupaten" required>
            <option v-for="option in kotaKabupatenOptions" :key="option" :value="option">{{ option }}</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="kecamatan">Kecamatan <span class="required">*</span></label>
          <select id="kecamatan" v-model="profile.kecamatan" required>
            <option v-for="option in kecamatanOptions" :key="option" :value="option">{{ option }}</option>
          </select>
        </div>
        <div class="form-group">
          <label for="kelurahan">Kelurahan <span class="required">*</span></label>
          <select id="kelurahan" v-model="profile.kelurahan" required>
            <option v-for="option in kelurahanOptions" :key="option" :value="option">{{ option }}</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="noHp">No HP <span class="required">*</span></label>
          <input type="number" id="noHp" v-model="profile.noHp" required />
        </div>
        <div class="form-group">
          <label for="noTelpRumah">No Telp Rumah</label>
          <input type="number" id="noTelpRumah" v-model="profile.noTelpRumah" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="agama">Agama <span class="required">*</span></label>
          <select id="agama" v-model="profile.agama" required>
            <option v-for="option in agamaOptions" :key="option" :value="option">{{ option }}</option>
          </select>
        </div>
        <div class="form-group">
          <label for="status">Status <span class="required">*</span></label>
          <select id="status" v-model="profile.status" required>
            <option v-for="option in statusOptions" :key="option" :value="option">{{ option }}</option>
          </select>
        </div>
      </div>
      <button type="submit" class="save-button">Save</button>
    </form>
  </div>
</template>

<script>
export default {
  name: "ProfilePage",
  data() {
    const user = JSON.parse(localStorage.getItem('scheduleData')).userId;
    return {
      profile: {
        username: user,
        namaPeserta: '',
        email: 'andiwijaya@gmail.com',
        gender: '',
        tempatLahir: '',
        tanggalLahir: '',
        jabatan: '',
        pangkat: '',
        noKepegawaian: '',
        nik: '',
        alamatLengkap: '',
        provinsi: '',
        kotaKabupaten: '',
        kecamatan: '',
        kelurahan: '',
        noHp: '',
        noTelpRumah: '',
        agama: '',
        status: ''
      },
      tempatLahirOptions: ['Kota Bekasi', 'Kota Jakarta', 'Kota Bandung'],
      provinsiOptions: ['Jawa Barat', 'Jawa Tengah', 'Jawa Timur'],
      kotaKabupatenOptions: ['Bekasi', 'Jakarta', 'Bandung'],
      kecamatanOptions: ['Kecamatan 1', 'Kecamatan 2', 'Kecamatan 3'],
      kelurahanOptions: ['Kelurahan 1', 'Kelurahan 2', 'Kelurahan 3'],
      agamaOptions: ['Islam', 'Kristen', 'Hindu', 'Budha'],
      statusOptions: ['Single', 'Married']
    };
  }
};
</script>

<style scoped>
.profile-container {
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  width: 90%;
  margin: 20px auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  max-height: 90vh;
}

.profile-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.profile-header .back-arrow {
  color: #6200ee;
  font-size: 24px;
  margin-right: 10px;
  cursor: pointer;
}

.profile-header .avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 20px;
}

.profile-header h2 {
  margin: 0;
}

.profile-form .form-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.profile-form .form-group {
  flex: 0 0 48%;
  display: flex;
  flex-direction: column;
}

.profile-form .form-group label {
  margin-bottom: 5px;
  font-weight: bold;
  text-align: left;
}

.profile-form .form-group .required {
  color: red;
}

.profile-form .form-group input,
.profile-form .form-group select {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 30px;
}

.save-button {
  background-color: #6200ee;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  align-self: flex-start;
}

.save-button:hover {
  background-color: #3700b3;
}
</style>
