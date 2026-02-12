/**
 * ComfyUI 工作流测试工具
 * 用法: node test-workflow.js <workflow-file.json>
 *
 * 示例:
 *   node test-workflow.js workflows/pixar_workflow.json
 */

const fs = require('fs');
const fetch = require('node-fetch');

const COMFYUI_URL = 'http://localhost:8188';
const CLIENT_ID = 'petforge-test';

async function testWorkflow(workflowFile) {
  console.log('🎨 ComfyUI 工作流测试工具\n');

  // 1. 读取工作流文件
  let workflow;
  try {
    const workflowData = fs.readFileSync(workflowFile, 'utf-8');
    workflow = JSON.parse(workflowData);
    console.log(`✅ 已加载工作流: ${workflowFile}`);
    console.log(`   节点数量: ${Object.keys(workflow).length}\n`);
  } catch (error) {
    console.error(`❌ 无法读取工作流文件: ${error.message}`);
    process.exit(1);
  }

  // 2. 验证工作流结构
  console.log('🔍 验证工作流结构...');
  const validation = validateWorkflow(workflow);
  if (!validation.valid) {
    console.error('❌ 工作流验证失败:');
    validation.errors.forEach(err => console.error(`   - ${err}`));
    process.exit(1);
  }
  console.log('✅ 工作流结构正确\n');

  // 3. 显示工作流信息
  displayWorkflowInfo(workflow);

  // 4. 测试发送到ComfyUI
  console.log('🚀 发送工作流到 ComfyUI...');
  try {
    const response = await fetch(`${COMFYUI_URL}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        prompt: workflow,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ 工作流已提交到队列');
    console.log(`   Prompt ID: ${result.prompt_id}\n`);

    // 5. 等待几秒后检查状态
    console.log('⏳ 等待 3 秒后检查状态...');
    await sleep(3000);

    const historyResponse = await fetch(`${COMFYUI_URL}/history/${result.prompt_id}`);
    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      const status = historyData[result.prompt_id];

      if (status) {
        console.log('📊 任务状态:');
        console.log(`   状态: ${status.status?.completed ? '✅ 已完成' : '⏳ 处理中'}`);
        if (status.outputs) {
          const images = status.outputs['9']?.images || []; // 节点9是SaveImage
          console.log(`   生成图像: ${images.length} 张`);
          images.forEach((img, index) => {
            console.log(`     ${index + 1}. ${img.filename} (${img.subpath}/${img.type})`);
          });
        }
      }
    }

    console.log('\n🎉 测试完成！');
    console.log('\n📝 下一步:');
    console.log('   1. 在 ComfyUI 界面查看结果');
    console.log('   2. 检查生成的图像质量');
    console.log('   3. 调整参数并重新测试');

  } catch (error) {
    console.error('\n❌ 发送工作流失败:');
    console.error(`   ${error.message}`);
    console.log('\n🔧 故障排除:');
    console.log('   1. 确保 ComfyUI 正在运行');
    console.log('   2. 检查工作流格式是否正确');
    console.log('   3. 查看ComfyUI控制台日志');
  }
}

function validateWorkflow(workflow) {
  const errors = [];
  const nodeIds = Object.keys(workflow);

  // 检查是否有节点
  if (nodeIds.length === 0) {
    errors.push('工作流为空');
  }

  // 检查每个节点是否有 class_type
  nodeIds.forEach(id => {
    const node = workflow[id];
    if (!node.class_type) {
      errors.push(`节点 ${id} 缺少 class_type`);
    }
  });

  // 检查是否有输出节点（SaveImage）
  const hasSaveImage = nodeIds.some(id => {
    const node = workflow[id];
    return node.class_type === 'SaveImage';
  });

  if (!hasSaveImage) {
    errors.push('工作流缺少 SaveImage 节点');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function displayWorkflowInfo(workflow) {
  console.log('📋 工作流信息:');

  const nodeTypes = {};
  Object.values(workflow).forEach(node => {
    const type = node.class_type;
    nodeTypes[type] = (nodeTypes[type] || 0) + 1;
  });

  console.log('   节点类型统计:');
  Object.entries(nodeTypes).forEach(([type, count]) => {
    console.log(`     - ${type}: ${count}`);
  });

  // 查找关键节点
  const hasCheckpoint = Object.values(workflow).some(n => n.class_type === 'CheckpointLoaderSimple');
  const hasSampler = Object.values(workflow).some(n => n.class_type === 'KSampler' || n.class_type === 'KSamplerAdvanced');
  const hasVAE = Object.values(workflow).some(n => n.class_type.includes('VAE'));

  console.log('\n   关键组件:');
  console.log(`     - 模型加载器: ${hasCheckpoint ? '✅' : '❌'}`);
  console.log(`     - 采样器: ${hasSampler ? '✅' : '❌'}`);
  console.log(`     - VAE: ${hasVAE ? '✅' : '❌'}`);
  console.log('');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 主程序
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('用法: node test-workflow.js <workflow-file.json>\n');
  console.log('示例:');
  console.log('  node test-workflow.js petforge-backend/workflows/pixar_workflow.json');
  console.log('  node test-workflow.js petforge-backend/workflows/clay_workflow.json\n');
  process.exit(1);
}

testWorkflow(args[0]);
