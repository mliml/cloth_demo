<script setup>
defineProps({
  cloth: {
    type: Object,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['delete', 'toggle-visible', 'select'])
</script>

<template>
  <div
    class="cloth-item"
    :class="{ selected: isSelected }"
    @click="emit('select')"
  >
    <div class="drag-handle" title="拖拽排序">
      <span>⋮⋮</span>
    </div>

    <div class="thumbnail">
      <img :src="cloth.imageUrl" :alt="cloth.name" />
    </div>

    <div class="info">
      <span class="name">{{ cloth.name }}</span>
    </div>

    <label class="visibility-toggle" @click.stop>
      <input
        type="checkbox"
        :checked="cloth.visible"
        @change="emit('toggle-visible')"
      />
      <span class="toggle-label">显示</span>
    </label>

    <button
      class="delete-btn"
      @click.stop="emit('delete')"
      title="删除"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.cloth-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f9f9f9;
  border: 2px solid transparent;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.cloth-item:hover {
  background: #f0f0f0;
}

.cloth-item.selected {
  border-color: #4a90d9;
  background: #e8f0fb;
}

.drag-handle {
  cursor: grab;
  color: #999;
  font-size: 14px;
  padding: 4px;
  user-select: none;
}

.drag-handle:active {
  cursor: grabbing;
}

.thumbnail {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #ddd;
  flex-shrink: 0;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.visibility-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #666;
}

.visibility-toggle input {
  cursor: pointer;
}

.delete-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: #ff4d4f;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  transition: background 0.2s;
}

.delete-btn:hover {
  background: #ff7875;
}
</style>
