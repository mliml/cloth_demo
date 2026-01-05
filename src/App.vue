<script setup>
import { ref, computed } from 'vue'
import LeftPanel from './components/LeftPanel.vue'
import RightPanel from './components/RightPanel.vue'

// 模特图片
const modelImage = ref('/model.png')

// 衣服列表
const clothList = ref([])

// 当前选中的衣服 ID
const selectedClothId = ref(null)

// 加载状态（用于背景移除处理）
const isProcessing = ref(false)
const processingMessage = ref('正在处理图片...')

// 衣服计数器（用于生成名称）
let clothCounter = 0

// 添加衣服
function addCloth(imageUrl) {
  clothCounter++
  const newCloth = {
    id: `cloth-${Date.now()}`,
    name: `衣服 ${String(clothCounter).padStart(2, '0')}`,
    imageUrl,
    visible: true,
    transform: {
      scale: 1,
      rotation: 0,
      x: 0,
      y: 0,
      split: 0
    }
  }
  clothList.value.push(newCloth)
  selectedClothId.value = newCloth.id
}

// 删除衣服
function deleteCloth(id) {
  const index = clothList.value.findIndex(c => c.id === id)
  if (index > -1) {
    clothList.value.splice(index, 1)
    if (selectedClothId.value === id) {
      selectedClothId.value = null
    }
  }
}

// 切换衣服显示状态
function toggleClothVisible(id) {
  const cloth = clothList.value.find(c => c.id === id)
  if (cloth) {
    cloth.visible = !cloth.visible
  }
}

// 选中衣服
function selectCloth(id) {
  selectedClothId.value = id
}

// 当前选中的衣服对象
const selectedCloth = computed(() => {
  return clothList.value.find(c => c.id === selectedClothId.value) || null
})

// 更新衣服变换属性
function updateTransform(property, value) {
  if (selectedCloth.value) {
    selectedCloth.value.transform[property] = value
  }
}

// 更新衣服位置（拖拽）
function updatePosition({ x, y }) {
  if (selectedCloth.value) {
    selectedCloth.value.transform.x = x
    selectedCloth.value.transform.y = y
  }
}

// 更换模特图片
function changeModel(imageUrl) {
  modelImage.value = imageUrl
}
</script>

<template>
  <div class="app-container">
    <!-- 加载遮罩 -->
    <div v-if="isProcessing" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>{{ processingMessage }}</p>
      </div>
    </div>

    <LeftPanel
      :clothList="clothList"
      :selectedClothId="selectedClothId"
      :isProcessing="isProcessing"
      @add-cloth="addCloth"
      @delete-cloth="deleteCloth"
      @toggle-visible="toggleClothVisible"
      @select-cloth="selectCloth"
      @update:clothList="list => clothList = list"
      @set-processing="(val, msg) => { isProcessing = val; if (msg) processingMessage = msg }"
    />
    <RightPanel
      :modelImage="modelImage"
      :clothList="clothList"
      :selectedClothId="selectedClothId"
      :selectedCloth="selectedCloth"
      @select-cloth="selectCloth"
      @update-transform="updateTransform"
      @update-position="updatePosition"
      @change-model="changeModel"
    />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  position: relative;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  background: #fff;
  padding: 30px 50px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.loading-content p {
  margin-top: 16px;
  color: #333;
  font-size: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border: 4px solid #e0e0e0;
  border-top-color: #4a90d9;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
