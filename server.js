import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { removeBackground } from '@imgly/background-removal-node'
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// 配置 CORS
app.use(cors())

// 配置 multer 用于内存存储
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB 限制
})

// 静态文件服务（前端构建产物）
app.use(express.static(path.join(__dirname, 'dist')))

/**
 * 移除小碎片，只保留最大的连通区域
 * @param {Buffer} imageBuffer - 带 Alpha 通道的 PNG 图片
 * @returns {Promise<Buffer>} - 处理后的图片
 */
async function removeSmallFragments(imageBuffer) {
  const image = sharp(imageBuffer)
  const metadata = await image.metadata()
  const { width, height } = metadata

  // 提取原始像素数据 (RGBA)
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const pixels = new Uint8Array(data)
  const totalPixels = width * height

  // 创建访问标记数组
  const visited = new Array(totalPixels).fill(false)
  const labels = new Array(totalPixels).fill(0)

  // 获取像素的 Alpha 值
  const getAlpha = (idx) => pixels[idx * 4 + 3]

  // 使用 BFS 找出所有连通区域
  const regions = []
  let currentLabel = 0

  for (let i = 0; i < totalPixels; i++) {
    if (visited[i] || getAlpha(i) < 128) continue // 跳过透明像素

    currentLabel++
    const region = []
    const queue = [i]

    while (queue.length > 0) {
      const idx = queue.shift()
      if (visited[idx]) continue

      const alpha = getAlpha(idx)
      if (alpha < 128) continue // 透明像素不属于任何区域

      visited[idx] = true
      labels[idx] = currentLabel
      region.push(idx)

      const x = idx % width
      const y = Math.floor(idx / width)

      // 检查 4 个方向的邻居
      const neighbors = [
        y > 0 ? idx - width : -1,           // 上
        y < height - 1 ? idx + width : -1,  // 下
        x > 0 ? idx - 1 : -1,               // 左
        x < width - 1 ? idx + 1 : -1        // 右
      ]

      for (const neighbor of neighbors) {
        if (neighbor >= 0 && !visited[neighbor] && getAlpha(neighbor) >= 128) {
          queue.push(neighbor)
        }
      }
    }

    if (region.length > 0) {
      regions.push({ label: currentLabel, pixels: region })
    }
  }

  // 找出最大的区域
  if (regions.length === 0) {
    return imageBuffer // 没有任何不透明区域，返回原图
  }

  const largestRegion = regions.reduce((max, r) =>
    r.pixels.length > max.pixels.length ? r : max
  )

  // 计算阈值：小于总像素的 0.05% 的区域将被删除
  const minRegionSize = Math.max(100, totalPixels * 0.0005)

  console.log(`Found ${regions.length} regions, largest has ${largestRegion.pixels.length} pixels`)
  console.log(`Minimum region size threshold: ${minRegionSize}`)

  // 创建新的像素数据，只保留大区域
  const newPixels = Buffer.from(pixels)

  for (let i = 0; i < totalPixels; i++) {
    const label = labels[i]
    if (label === 0) continue // 本来就是透明的

    const region = regions.find(r => r.label === label)
    if (!region) continue

    // 如果不是最大区域，且小于阈值，则设为透明
    if (region !== largestRegion && region.pixels.length < minRegionSize) {
      newPixels[i * 4 + 3] = 0 // 设置 Alpha 为 0
    }
  }

  // 重建图片
  const result = await sharp(newPixels, {
    raw: {
      width,
      height,
      channels: 4
    }
  })
    .png()
    .toBuffer()

  return result
}

// 抠图 API
app.post('/api/remove-bg', upload.single('image'), async (req, res) => {
  const startTime = Date.now()

  if (!req.file) {
    return res.status(400).json({ error: '请上传图片' })
  }

  console.log(`Received image: ${req.file.originalname}, size: ${req.file.size} bytes`)

  try {
    // 使用 AI 模型移除背景
    console.log('Starting background removal...')
    const blob = await removeBackground(req.file.buffer, {
      model: 'small',
      output: {
        format: 'image/png'
      }
    })

    // 转换 Blob 为 Buffer
    const arrayBuffer = await blob.arrayBuffer()
    let resultBuffer = Buffer.from(arrayBuffer)

    console.log(`Background removed, size: ${resultBuffer.length} bytes`)

    // 后处理：移除小碎片
    console.log('Removing small fragments...')
    resultBuffer = await removeSmallFragments(resultBuffer)

    console.log(`Fragments removed, final size: ${resultBuffer.length} bytes`)

    const duration = Date.now() - startTime
    console.log(`Total processing time: ${duration}ms`)

    // 返回处理后的图片
    res.set('Content-Type', 'image/png')
    res.send(resultBuffer)

  } catch (error) {
    console.error('Background removal failed:', error)
    res.status(500).json({ error: '背景移除失败: ' + error.message })
  }
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 所有其他路由返回 index.html（SPA 支持）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log('API endpoint: POST /api/remove-bg')
})
