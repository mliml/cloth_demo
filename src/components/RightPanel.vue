<script setup>
import { ref } from 'vue'
import ModelCanvas from './ModelCanvas.vue'
import ControlSliders from './ControlSliders.vue'

const props = defineProps({
  modelImage: {
    type: String,
    required: true
  },
  clothList: {
    type: Array,
    required: true
  },
  selectedClothId: {
    type: String,
    default: null
  },
  selectedCloth: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['select-cloth', 'update-transform', 'update-position', 'change-model'])

const modelFileInput = ref(null)

// 触发模特图片更换
function triggerModelChange() {
  modelFileInput.value.click()
}

// 处理模特图片更换
function handleModelChange(event) {
  const file = event.target.files?.[0]
  if (!file || !file.type.startsWith('image/')) return

  const reader = new FileReader()
  reader.onload = (e) => {
    emit('change-model', e.target.result)
  }
  reader.readAsDataURL(file)

  event.target.value = ''
}
</script>

<template>
  <div class="right-panel">
    <div class="panel-header">
      <h2>穿搭预览</h2>
      <button class="change-model-btn" @click="triggerModelChange">
        更换模特
      </button>
      <input
        ref="modelFileInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="handleModelChange"
      />
    </div>

    <ModelCanvas
      :modelImage="modelImage"
      :clothList="clothList"
      :selectedClothId="selectedClothId"
      @select-cloth="id => emit('select-cloth', id)"
      @update-position="pos => emit('update-position', pos)"
    />

    <ControlSliders
      :selectedCloth="selectedCloth"
      @update-transform="(prop, val) => emit('update-transform', prop, val)"
    />
  </div>
</template>

<style scoped>
.right-panel {
  flex: 3;
  display: flex;
  flex-direction: column;
  background: #fafafa;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #fff;
}

.panel-header h2 {
  font-size: 18px;
  color: #333;
  margin: 0;
}

.change-model-btn {
  padding: 6px 12px;
  background: #fff;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.change-model-btn:hover {
  background: #f5f5f5;
  border-color: #bbb;
}
</style>
