<template>
  <div>
    <div id="main-view">

    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      currentTask: 1,
      numberOfTask: null, //positive number
      symbols: [
        `"( (" ") ,,( (,, ,,) ),, '( (' ') )' ,( (, ,) ), -( (- -) )-`,
        '+) (+ )+ +( :) (: ): :( *) (* )* *( =) (= )= =( + : * =',
        'α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ ο σ τ',
      ],
    }
  }
}
</script>
<style scoped>
body {
  background-color: grey;
  margin: 0; /* Ensure there is no margin around the body */
  padding: 0; /* Ensure there is no padding around the body */
  height: 100vh; /* Make the body take up the full viewport height */
  width: 100vw; /* Make the body take up the full viewport width */
  display: flex; /* To ensure it can contain flex children if needed */
  justify-content: center; /* Optional: Center content horizontally */
  align-items: center; /* Optional: Center content vertically */
}

#main-view {
  position: relative;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 20px;
  width: 1280px;
  margin: 60px auto;
}
</style>
