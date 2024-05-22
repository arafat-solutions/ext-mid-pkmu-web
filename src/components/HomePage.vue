<template>
  <div class="home">
    <h1>Home Page</h1>
    <nav>
      <ul>
        <li><router-link to="/battery-test-1">Radar Page</router-link></li>
        <li><router-link to="/tank">Tank Page</router-link></li>
      </ul>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'HomePage'
};
</script>

<style scoped>
/* Add styles specific to HomePage here */
</style>
