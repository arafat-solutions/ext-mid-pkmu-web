<template>
    <div v-if="visible" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <slot name="header">
                    <h3>{{ title }}</h3>
                </slot>
            </div>
            <div class="modal-body">
                <slot name="body">
                    <p>{{ message }}</p>
                </slot>
            </div>
            <div class="modal-footer">
                <button @click="cancel" class="cancel-button">Batal</button>
                <button @click="confirm" class="confirm-button">Ya, Log Out</button>
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
        title: {
            type: String,
            default: 'Confirmation'
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

<style>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-content {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 300px;
    text-align: center;
}

.modal-header h3 {
    margin: 0;
    padding: 0;
}

.modal-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
}

.cancel-button,
.confirm-button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.cancel-button {
    background: #eee;
}

.confirm-button {
    background: #6E51CB;
    color: white;
}
</style>