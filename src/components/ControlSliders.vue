<script setup>
import { computed } from 'vue'

const props = defineProps({
  selectedCloth: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update-transform'])

// 计算属性用于双向绑定
const scale = computed({
  get: () => props.selectedCloth?.transform.scale ?? 1,
  set: (val) => emit('update-transform', 'scale', Number(val))
})

const rotation = computed({
  get: () => props.selectedCloth?.transform.rotation ?? 0,
  set: (val) => emit('update-transform', 'rotation', Number(val))
})

const posX = computed({
  get: () => props.selectedCloth?.transform.x ?? 0,
  set: (val) => emit('update-transform', 'x', Number(val))
})

const posY = computed({
  get: () => props.selectedCloth?.transform.y ?? 0,
  set: (val) => emit('update-transform', 'y', Number(val))
})

const isDisabled = computed(() => !props.selectedCloth)
</script>

<template>
  <div class="control-sliders" :class="{ disabled: isDisabled }">
    <div class="slider-group">
      <div class="slider-item">
        <label>
          <span class="label-text">大小</span>
          <span class="value-display">{{ scale.toFixed(1) }}x</span>
        </label>
        <input
          type="range"
          v-model="scale"
          min="0.1"
          max="3"
          step="0.1"
          :disabled="isDisabled"
        />
      </div>

      <div class="slider-item">
        <label>
          <span class="label-text">角度</span>
          <span class="value-display">{{ rotation }}°</span>
        </label>
        <input
          type="range"
          v-model="rotation"
          min="0"
          max="360"
          step="1"
          :disabled="isDisabled"
        />
      </div>

      <div class="slider-item">
        <label>
          <span class="label-text">X 位置</span>
          <span class="value-display">{{ posX }}px</span>
        </label>
        <input
          type="range"
          v-model="posX"
          min="-500"
          max="500"
          step="1"
          :disabled="isDisabled"
        />
      </div>

      <div class="slider-item">
        <label>
          <span class="label-text">Y 位置</span>
          <span class="value-display">{{ posY }}px</span>
        </label>
        <input
          type="range"
          v-model="posY"
          min="-500"
          max="500"
          step="1"
          :disabled="isDisabled"
        />
      </div>
    </div>

    <div class="hint" v-if="isDisabled">
      请先选中一件衣服进行调整
    </div>
  </div>
</template>

<style scoped>
.control-sliders {
  padding: 16px 20px;
  background: #fff;
  border-top: 1px solid #e0e0e0;
}

.control-sliders.disabled {
  opacity: 0.6;
}

.slider-group {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.slider-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slider-item label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.label-text {
  color: #666;
}

.value-display {
  color: #333;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.slider-item input[type="range"] {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #e0e0e0;
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.slider-item input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #4a90d9;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.1s;
}

.slider-item input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.slider-item input[type="range"]:disabled {
  cursor: not-allowed;
}

.slider-item input[type="range"]:disabled::-webkit-slider-thumb {
  background: #bbb;
  cursor: not-allowed;
}

.hint {
  text-align: center;
  color: #999;
  font-size: 13px;
  margin-top: 12px;
}
</style>
