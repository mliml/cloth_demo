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
 * @param {number} alphaThreshold - Alpha 阈值，低于此值视为透明 (128-255)
 * @returns {Promise<Buffer>} - 处理后的图片
 */
async function removeSmallFragments(imageBuffer, alphaThreshold = 200) {
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

  console.log(`Using alpha threshold: ${alphaThreshold}`)

  // 使用 BFS 找出所有连通区域
  const regions = []
  let currentLabel = 0

  for (let i = 0; i < totalPixels; i++) {
    if (visited[i] || getAlpha(i) < alphaThreshold) continue // 跳过透明像素

    currentLabel++
    const region = []
    const queue = [i]

    while (queue.length > 0) {
      const idx = queue.shift()
      if (visited[idx]) continue

      const alpha = getAlpha(idx)
      if (alpha < alphaThreshold) continue // 透明像素不属于任何区域

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
        if (neighbor >= 0 && !visited[neighbor] && getAlpha(neighbor) >= alphaThreshold) {
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

  // 只保留最大的连通区域，删除所有其他区域
  console.log(`Found ${regions.length} regions, largest has ${largestRegion.pixels.length} pixels`)

  // 创建新的像素数据，只保留最大区域
  const newPixels = Buffer.from(pixels)

  for (let i = 0; i < totalPixels; i++) {
    const alpha = getAlpha(i)
    const label = labels[i]

    // 低于阈值的像素设为透明
    if (alpha < alphaThreshold) {
      newPixels[i * 4 + 3] = 0
      continue
    }

    // 只保留最大区域，其他全部设为透明
    if (label !== largestRegion.label) {
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

  // 获取 alpha 阈值参数
  const alphaThreshold = parseInt(req.body.alphaThreshold) || 200
  console.log(`Received image: ${req.file.originalname}, size: ${req.file.size} bytes, alphaThreshold: ${alphaThreshold}`)

  try {
    // 先用 Sharp 将图片转换为标准 PNG 格式
    console.log('Converting image to PNG...')
    const pngBuffer = await sharp(req.file.buffer)
      .png()
      .toBuffer()

    // 转换为 Blob（库需要 Blob 格式）
    const inputBlob = new Blob([pngBuffer], { type: 'image/png' })

    // 使用 AI 模型移除背景
    console.log('Starting background removal...')
    const blob = await removeBackground(inputBlob, {
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
    resultBuffer = await removeSmallFragments(resultBuffer, alphaThreshold)

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
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log('API endpoint: POST /api/remove-bg')
})
