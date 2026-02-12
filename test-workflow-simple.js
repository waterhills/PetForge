/**
 * 简单的ComfyUI工作流测试脚本
 */

const fs = require('fs');
const https = require('https');
const http = require('http');

const COMFYUI_URL = 'http://localhost:8188';

function testWorkflow(workflowFile) {
  console.log('🎨 ComfyUI 工作流测试工具\n');

  // 1. 读取工作流
  let workflow;
  try {
    const workflowData = fs.readFileSync(workflowFile, 'utf-8');
    workflow = JSON.parse(workflowData);
    console.log(`✅ 已加载工作流: ${workflowFile}`);
    console.log(`   节点数量: ${Object.keys(workflow).length}\n`);
  } catch (error) {
    console.error(`❌ 无法读取工作流: ${error.message}\n`);
    return;
  }

  // 2. 显示工作流信息
  console.log('📋 工作流节点:');
  Object.entries(workflow).forEach(([id, node]) => {
    console.log(`   节点 ${id}: ${node.class_type}`);
  });
  console.log('');

  // 3. 发送到ComfyUI
  console.log('🚀 发送到 ComfyUI...\n');

  const postData = JSON.stringify({
    client_id: 'petforge-test',
    prompt: workflow,
  });

  const options = {
    hostname: 'localhost',
    port: 8188,
    path: '/prompt',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        if (res.statusCode === 200) {
          console.log('✅ 工作流已成功提交！');
          console.log(`   Prompt ID: ${result.prompt_id}\n`);
          console.log('📝 在ComfyUI界面查看结果:');
          console.log('   http://localhost:8188\n');
        } else {
          console.error('❌ 提交失败:');
          console.error(`   ${JSON.stringify(result, null, 2)}\n`);
        }
      } catch (e) {
        console.error('❌ 解析响应失败:', e.message);
        console.log('   原始响应:', data, '\n');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ 连接ComfyUI失败:');
    console.error(`   ${error.message}\n`);
    console.log('🔧 请确保:');
    console.log('   1. ComfyUI 正在运行 (http://localhost:8188)');
    console.log('   2. 端口 8188 可访问\n');
  });

  req.write(postData);
  req.end();
}

// 主程序
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('用法: node test-workflow-simple.js <workflow-file.json>\n');
  console.log('示例:');
  console.log('  node test-workflow-simple.js petforge-backend/workflows/pixar_workflow.json');
  console.log('  node test-workflow-simple.js petforge-backend/workflows/clay_workflow.json\n');
  process.exit(1);
}

testWorkflow(args[0]);
