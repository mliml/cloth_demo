<script setup>
import { ref, computed } from 'vue'

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
  }
})

const emit = defineEmits(['select-cloth', 'update-position'])

// 可见的衣服列表
const visibleClothes = computed(() => {
  return props.clothList.filter(c => c.visible)
})

// 拖拽状态
const isDragging = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const dragStartTransform = ref({ x: 0, y: 0 })

// 计算衣服样式 - 反转 z-index，让列表顶部的项目显示在最上层
function getClothStyle(cloth, index) {
  const { scale, rotation, x, y } = cloth.transform
  return {
    transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotation}deg)`,
    zIndex: visibleClothes.value.length - index
  }
}

// 点击画布空白处取消选中
function handleCanvasClick(event) {
  if (event.target.classList.contains('canvas-container') ||
      event.target.classList.contains('canvas-content')) {
    emit('select-cloth', null)
  }
}

// 拖拽开始
function handleMouseDown(event, cloth) {
  // 先选中该衣服
  emit('select-cloth', cloth.id)

  isDragging.value = true
  dragStartPos.value = { x: event.clientX, y: event.clientY }
  dragStartTransform.value = { x: cloth.transform.x, y: cloth.transform.y }

  // 阻止默认行为（如图片拖拽）
  event.preventDefault()
}

// 拖拽中
function handleMouseMove(event) {
  if (!isDragging.value) return

  const dx = event.clientX - dragStartPos.value.x
  const dy = event.clientY - dragStartPos.value.y

  emit('update-position', {
    x: dragStartTransform.value.x + dx,
    y: dragStartTransform.value.y + dy
  })
}

// 拖拽结束
function handleMouseUp() {
  isDragging.value = false
}
</script>

<template>
  <div
    class="canvas-container"
    @click="handleCanvasClick"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
  >
    <div class="canvas-content">
      <!-- 模特图片 -->
      <img
        :src="modelImage"
        alt="模特"
        class="model-image"
      />

      <!-- 衣服图层 -->
      <img
        v-for="(cloth, index) in visibleClothes"
        :key="cloth.id"
        :src="cloth.imageUrl"
        :alt="cloth.name"
        class="cloth-image"
        :class="{ selected: selectedClothId === cloth.id, dragging: isDragging && selectedClothId === cloth.id }"
        :style="getClothStyle(cloth, index)"
        @mousedown="handleMouseDown($event, cloth)"
      />
    </div>
  </div>
</template>

<style scoped>
.canvas-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  overflow: hidden;
  background: #e8e8e8;
}

.canvas-content {
  position: relative;
  max-width: 100%;
  max-height: 100%;
}

.model-image {
  display: block;
  max-width: 100%;
  max-height: 85vh;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
}

.cloth-image {
  position: absolute;
  top: 50%;
  left: 50%;
  max-width: 200px;
  transform-origin: center center;
  cursor: grab;
  user-select: none;
  transition: box-shadow 0.2s, outline 0.2s;
}

.cloth-image.dragging {
  cursor: grabbing;
  transition: none;
}

.cloth-image.selected {
  outline: 3px solid #4a90d9;
  outline-offset: 2px;
  box-shadow: 0 4px 12px rgba(74, 144, 217, 0.4);
}

.cloth-image:hover:not(.selected) {
  outline: 2px dashed #999;
  outline-offset: 2px;
}
</style>
