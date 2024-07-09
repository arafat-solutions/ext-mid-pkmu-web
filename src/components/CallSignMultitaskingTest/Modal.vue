<template>
    <div v-if="visible" class="modal-overlay">
        <div class="black-overlay"></div>
        <div class="modal-content">
            <div class="icon">
                <i class="fas fa-sign-out-alt"></i>
            </div>
            <h2>Are you sure you want to start this test?</h2>
            <div class="button-group">
                <button @click="cancel" class="cancel-btn">Cancel</button>
                <button @click="confirm" class="logout-btn">Ya, Start the test</button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ModalComponent',
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        message: {
            type: String,
            default: 'Are you sure?'
        }
    },
    methods: {
        confirm() {
            this.$emit('confirm');
        },
        cancel() {
            this.$emit('cancel');
        },
    }
};
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 30;
}

.black-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
    background-color: white;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    width: 400px;
    border: 1px solid gray;
    box-shadow: -1px -1px 5px 3px rgba(0, 0, 0, 0.13);
    -webkit-box-shadow: -1px -1px 5px 3px rgba(0, 0, 0, 0.13);
    -moz-box-shadow: -1px -1px 5px 3px rgba(0, 0, 0, 0.13);
    z-index: 40;
}

.icon {
    background-color: #ffebee;
    color: #f44336;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 auto 20px;
}

h2 {
    font-size: 18px;
    margin-bottom: 20px;
}

.button-group {
    display: flex;
    justify-content: space-between;
}

button {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
}

.cancel-btn {
    background-color: #f0f0f0;
    color: #333;
}

.logout-btn {
    background-color: #7e57c2;
    color: white;
}
</style>
