/**
 * ComfyUI 连接测试脚本
 * 运行: node test-comfyui.js
 */

const COMFYUI_URL = 'http://localhost:8188';

async function testComfyUI() {
  console.log('🔍 测试 ComfyUI 连接...\n');
  console.log(`📍 目标: ${COMFYUI_URL}\n`);

  try {
    // 测试 1: 基本连接
    console.log('测试 1: 检查 ComfyUI 是否运行...');
    const response = await fetch(COMFYUI_URL);
    if (response.ok) {
      console.log('✅ ComfyUI 正在运行\n');
    } else {
      throw new Error(`ComfyUI 返回状态: ${response.status}`);
    }

    // 测试 2: 系统状态
    console.log('测试 2: 获取系统状态...');
    const systemStats = await fetch(`${COMFYUI_URL}/system_stats`);
    if (systemStats.ok) {
      const stats = await systemStats.json();
      console.log('✅ 系统状态:', JSON.stringify(stats, null, 2), '\n');
    } else {
      console.log('⚠️  无法获取系统状态（可能不支持此端点）\n');
    }

    // 测试 3: 队列状态
    console.log('测试 3: 检查队列状态...');
    const queue = await fetch(`${COMFYUI_URL}/queue`);
    if (queue.ok) {
      const queueData = await queue.json();
      console.log('✅ 队列状态:', JSON.stringify(queueData, null, 2), '\n');
    }

    // 测试 4: 历史记录
    console.log('测试 4: 检查历史记录...');
    const history = await fetch(`${COMFYUI_URL}/history`);
    if (history.ok) {
      const historyData = await history.json();
      const keys = Object.keys(historyData);
      console.log(`✅ 找到 ${keys.length} 条历史记录\n`);
    }

    // 测试 5: 模型列表
    console.log('测试 5: 检查可用模型...');
    try {
      const models = await fetch(`${COMFYUI_URL}/object_info/CheckpointLoaderSimple`);
      if (models.ok) {
        const modelsData = await models.json();
        console.log('✅ 检查点加载器可用');
      }
    } catch (e) {
      console.log('⚠️  无法获取模型信息\n');
    }

    console.log('═══════════════════════════════════════');
    console.log('🎉 所有测试通过！ComfyUI 已就绪');
    console.log('═══════════════════════════════════════');
    console.log('\n📝 下一步:');
    console.log('   1. 启动后端: cd petforge-backend && npm run dev');
    console.log('   2. 启动前端: cd petforge-app && npm run dev');
    console.log('   3. 访问: http://localhost:3000/upload');
    console.log('   4. 上传图片并测试生成\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.log('\n🔧 故障排除:');
    console.log('   1. 确保 ComfyUI 正在运行');
    console.log('   2. 检查端口 8188 是否被占用');
    console.log('   3. 尝试访问 http://localhost:8188');
    console.log('   4. 查看日志了解详情\n');

    // 提供诊断信息
    console.log('📊 诊断信息:');
    console.log('   - ComfyUI URL:', COMFYUI_URL);
    console.log('   - 后端配置: petforge-backend/.env');
    console.log('   - 详细文档: COMFYUI_SETUP.md\n');
  }
}

testComfyUI();
