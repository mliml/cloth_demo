<script setup>
import { ref } from 'vue'
import draggable from 'vuedraggable'
import ClothItem from './ClothItem.vue'

const props = defineProps({
  clothList: {
    type: Array,
    required: true
  },
  selectedClothId: {
    type: String,
    default: null
  },
  isProcessing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'add-cloth',
  'delete-cloth',
  'toggle-visible',
  'select-cloth',
  'update:clothList',
  'set-processing'
])

const fileInput = ref(null)
const removeBgFileInput = ref(null)
const alphaThreshold = ref(200) // Alpha 阈值，越高越严格

// 触发普通上传
function triggerUpload() {
  fileInput.value.click()
}

// 触发抠图上传
function triggerRemoveBgUpload() {
  removeBgFileInput.value.click()
}

// 处理普通文件上传
function handleFileChange(event) {
  const files = event.target.files
  if (!files || files.length === 0) return

  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (e) => {
      emit('add-cloth', e.target.result)
    }
    reader.readAsDataURL(file)
  })

  // 清空 input，允许重复上传同一文件
  event.target.value = ''
}

// 处理抠图上传 - 调用服务器端 API
async function handleRemoveBgFileChange(event) {
  const files = event.target.files
  if (!files || files.length === 0) return

  emit('set-processing', true, '正在上传图片...')

  try {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue

      // 创建 FormData 上传图片
      const formData = new FormData()
      formData.append('image', file)
      formData.append('alphaThreshold', alphaThreshold.value.toString())

      emit('set-processing', true, '正在处理图片（服务器抠图中）...')

      // 调用服务器端抠图 API
      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        let errorMsg = '服务器处理失败'
        try {
          const error = await response.json()
          errorMsg = error.error || errorMsg
        } catch {
          errorMsg = `服务器错误 (${response.status})`
        }
        throw new Error(errorMsg)
      }

      // 获取处理后的图片
      const blob = await response.blob()

      // 转换为 DataURL
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.readAsDataURL(blob)
      })

      emit('add-cloth', dataUrl)
    }
  } catch (error) {
    console.error('背景移除失败:', error)
    alert('背景移除失败: ' + error.message)
  } finally {
    emit('set-processing', false)
  }

  // 清空 input，允许重复上传同一文件
  event.target.value = ''
}

// 拖拽排序更新
function onDragEnd() {
  emit('update:clothList', props.clothList)
}
</script>

<template>
  <div class="left-panel">
    <div class="panel-header">
      <h2>衣服列表</h2>
      <div class="upload-buttons">
        <button class="upload-btn" @click="triggerUpload" :disabled="isProcessing">
          + 上传衣服
        </button>
        <button class="upload-btn remove-bg" @click="triggerRemoveBgUpload" :disabled="isProcessing">
          + 上传并抠图
        </button>
      </div>
      <div class="threshold-control">
        <label>
          抠图精度: {{ alphaThreshold }}
          <span class="hint">(越高碎片越少，但可能丢失细节)</span>
        </label>
        <input
          type="range"
          v-model.number="alphaThreshold"
          min="128"
          max="255"
          step="1"
        />
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        style="display: none"
        @change="handleFileChange"
      />
      <input
        ref="removeBgFileInput"
        type="file"
        accept="image/*"
        multiple
        style="display: none"
        @change="handleRemoveBgFileChange"
      />
    </div>

    <div class="cloth-list" v-if="clothList.length > 0">
      <draggable
        :list="clothList"
        item-key="id"
        handle=".drag-handle"
        @end="onDragEnd"
      >
        <template #item="{ element }">
          <ClothItem
            :cloth="element"
            :isSelected="selectedClothId === element.id"
            @delete="emit('delete-cloth', element.id)"
            @toggle-visible="emit('toggle-visible', element.id)"
            @select="emit('select-cloth', element.id)"
          />
        </template>
      </draggable>
    </div>

    <div class="empty-state" v-else>
      <p>暂无衣服</p>
      <p class="hint">点击上方按钮上传图片</p>
    </div>
  </div>
</template>

<style scoped>
.left-panel {
  flex: 2;
  background: #fff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.panel-header h2 {
  font-size: 18px;
  margin-bottom: 12px;
  color: #333;
}

.upload-buttons {
  display: flex;
  gap: 8px;
}

.upload-btn {
  flex: 1;
  padding: 10px 12px;
  background: #4a90d9;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
}

.upload-btn:hover:not(:disabled) {
  background: #3a7bc8;
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-btn.remove-bg {
  background: #6b5b95;
}

.upload-btn.remove-bg:hover:not(:disabled) {
  background: #5a4a84;
}

.threshold-control {
  margin-top: 12px;
}

.threshold-control label {
  display: block;
  font-size: 13px;
  color: #555;
  margin-bottom: 6px;
}

.threshold-control .hint {
  font-size: 11px;
  color: #999;
}

.threshold-control input[type="range"] {
  width: 100%;
  cursor: pointer;
}

.cloth-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.empty-state p {
  margin: 4px 0;
}

.empty-state .hint {
  font-size: 12px;
}
</style>
