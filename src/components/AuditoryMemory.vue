<template>
  <div class="main-view">
  </div>
</template>

<script>
export default {
  data() {
    return {
      numberOfTask: 3, //positive number
      stringSize: 'ABC-DE-FG', //AB-CD-E, AB-CD-EF, ABC-DE-FG, ABC-DEF-GH, ABC-DEF-GHJ
      includeDigits: true, //true or false
      excludeVowels: true, //true or false
      readingSpeed: 3, // 1-5
    }
  }
}
</script>