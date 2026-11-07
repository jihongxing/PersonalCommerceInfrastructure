#!/usr/bin/env node

/**
 * Phase 6 Day 4 - 完整 E2E 工作流验证脚本
 * 
 * 验证流程:
 * 1. Creator 创建服务并发布
 * 2. Consumer 搜索并预约服务
 * 3. Creator 收到审核请求
 * 4. Creator 审核预约（接受/拒绝）
 * 5. Consumer 收到结果通知
 * 6. 完整状态验证
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/v1';
const TIMEOUT = 10000;

interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

/**
 * 辅助函数
 */
async function fetchWithTimeout(url: string, options: any = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function runTest(name: string, testFn: () => Promise<void>) {
  console.log(`\n🧪 ${name}`);
  const startTime = Date.now();
  
  try {
    await testFn();
    const duration = Date.now() - startTime;
    results.push({ name, status: 'pass', duration });
    console.log(`   ✅ PASS (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.push({ name, status: 'fail', duration, error: errorMsg });
    console.log(`   ❌ FAIL (${duration}ms): ${errorMsg}`);
  }
}

/**
 * 测试用例
 */

// Test 1: Creator 创建服务
async function testCreatorCreateService() {
  const creatorToken = process.env.CREATOR_TOKEN || 'creator-test-token';
  
  const response = await fetchWithTimeout(`${BASE_URL}/creator/offerings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${creatorToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      capabilityIds: ['capability-001'],
      title: '一对一英语口语课程',
      description: '帮助学生提高英语口语流利度',
      availabilityDescription: '周一到周五 19:00-21:00',
      requestInstructions: '请提供学生的英语水平',
    }),
  });

  if (response.status !== 201) {
    throw new Error(`Expected 201, got ${response.status}`);
  }

  const data = await response.json() as any;
  if (!data.id) {
    throw new Error('No service ID returned');
  }

  console.log(`   Service ID: ${data.id}`);
  return data.id;
}

// Test 2: Creator 发布服务
async function testPublishService(serviceId: string) {
  const creatorToken = process.env.CREATOR_TOKEN || 'creator-test-token';
  
  const response = await fetchWithTimeout(
    `${BASE_URL}/creator/offerings/${serviceId}/publish`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${creatorToken}`,
      },
    }
  );

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }

  const data = await response.json() as any;
  if (data.offering.state !== 'published') {
    throw new Error(`Expected state 'published', got ${data.offering.state}`);
  }

  console.log(`   Published! Distribution asset: ${data.distributionAsset?.id}`);
  return data.offering.id;
}

// Test 3: Consumer 查询服务
async function testConsumerViewService(serviceId: string) {
  const response = await fetchWithTimeout(`${BASE_URL}/public/offerings/${serviceId}`, {
    method: 'GET',
  });

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }

  const data = await response.json() as any;
  if (!data.title) {
    throw new Error('No service title in response');
  }

  console.log(`   Found service: ${data.title}`);
}

// Test 4: Consumer 提交预约请求
async function testConsumerSubmitRequest(serviceId: string) {
  const response = await fetchWithTimeout(
    `${BASE_URL}/public/offerings/${serviceId}/requests`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitorContact: 'consumer@example.com',
        visitorName: '学生张三',
        visitorMessage: '我想提高英语口语，请问课程时间如何安排？',
      }),
    }
  );

  if (response.status !== 201) {
    throw new Error(`Expected 201, got ${response.status}`);
  }

  const data = await response.json() as any;
  if (!data.actionId) {
    throw new Error('No action ID returned');
  }

  console.log(`   Request submitted! Action ID: ${data.actionId}`);
  return data.actionId;
}

// Test 5: Creator 获取待审核请求
async function testCreatorListPendingRequests() {
  const creatorToken = process.env.CREATOR_TOKEN || 'creator-test-token';
  
  const response = await fetchWithTimeout(
    `${BASE_URL}/creator/requests/submitted`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${creatorToken}`,
      },
    }
  );

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }

  const data = await response.json() as any;
  if (!Array.isArray(data.actions)) {
    throw new Error('Expected actions array in response');
  }

  console.log(`   Found ${data.actions.length} pending requests`);
  return data.actions.length > 0 ? data.actions[0].id : null;
}

// Test 6: Creator 接受预约请求
async function testCreatorAcceptRequest(actionId: string) {
  const creatorToken = process.env.CREATOR_TOKEN || 'creator-test-token';
  
  const response = await fetchWithTimeout(
    `${BASE_URL}/creator/requests/${actionId}/confirm`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${creatorToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creatorMessage: '课程时间已确认，周一 19:00-20:00',
      }),
    }
  );

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }

  const data = await response.json() as any;
  if (data.state !== 'confirmed') {
    throw new Error(`Expected state 'confirmed', got ${data.state}`);
  }

  console.log(`   Request confirmed!`);
}

// Test 7: Creator 拒绝预约请求
async function testCreatorDeclineRequest(actionId: string) {
  const creatorToken = process.env.CREATOR_TOKEN || 'creator-test-token';
  
  const response = await fetchWithTimeout(
    `${BASE_URL}/creator/requests/${actionId}/decline`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${creatorToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creatorMessage: '抱歉，近期时间较紧张，无法安排',
      }),
    }
  );

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }

  const data = await response.json() as any;
  if (data.state !== 'declined') {
    throw new Error(`Expected state 'declined', got ${data.state}`);
  }

  console.log(`   Request declined!`);
}

// Test 8: Creator 获取已确认请求
async function testCreatorListConfirmedRequests() {
  const creatorToken = process.env.CREATOR_TOKEN || 'creator-test-token';
  
  const response = await fetchWithTimeout(
    `${BASE_URL}/creator/requests/confirmed`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${creatorToken}`,
      },
    }
  );

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }

  const data = await response.json() as any;
  if (!Array.isArray(data.actions)) {
    throw new Error('Expected actions array in response');
  }

  console.log(`   Found ${data.actions.length} confirmed requests`);
}

// Test 9: 完整工作流集成测试
async function testFullWorkflow() {
  console.log('\n🔄 完整工作流集成测试');
  console.log('='.repeat(50));

  // Step 1: Creator 创建服务
  let serviceId: string;
  await runTest('1. Creator 创建服务', async () => {
    serviceId = await testCreatorCreateService();
  });

  // Step 2: Creator 发布服务
  await runTest('2. Creator 发布服务', async () => {
    if (!serviceId) throw new Error('Service ID not available');
    await testPublishService(serviceId);
  });

  // Step 3: Consumer 查看服务
  await runTest('3. Consumer 查看服务', async () => {
    if (!serviceId) throw new Error('Service ID not available');
    await testConsumerViewService(serviceId);
  });

  // Step 4: Consumer 提交预约
  let actionId: string;
  await runTest('4. Consumer 提交预约请求', async () => {
    if (!serviceId) throw new Error('Service ID not available');
    actionId = await testConsumerSubmitRequest(serviceId);
  });

  // Step 5: Creator 获取待审核列表
  await runTest('5. Creator 获取待审核请求', async () => {
    if (!actionId) throw new Error('Action ID not available');
    await testCreatorListPendingRequests();
  });

  // Step 6: Creator 接受预约
  await runTest('6. Creator 接受预约请求', async () => {
    if (!actionId) throw new Error('Action ID not available');
    await testCreatorAcceptRequest(actionId);
  });

  // Step 7: Creator 获取已确认列表
  await runTest('7. Creator 获取已确认请求', async () => {
    await testCreatorListConfirmedRequests();
  });

  // Step 8: 测试拒绝流程（使用新的预约）
  let actionId2: string;
  await runTest('8. Consumer 提交第二个预约请求', async () => {
    if (!serviceId) throw new Error('Service ID not available');
    actionId2 = await testConsumerSubmitRequest(serviceId);
  });

  await runTest('9. Creator 拒绝预约请求', async () => {
    if (!actionId2) throw new Error('Action ID not available');
    await testCreatorDeclineRequest(actionId2);
  });
}

/**
 * 主函数
 */
async function main() {
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║  Phase 6 Day 4 - E2E 工作流验证              ║');
  console.log('║  Creator 初始化 → 预约 → 审核 完整闭环      ║');
  console.log('╚═══════════════════════════════════════════════╝');

  console.log('\n📋 测试环境配置:');
  console.log(`   API Base URL: ${BASE_URL}`);
  console.log(`   Timeout: ${TIMEOUT}ms`);
  console.log(`   Creator Token: ${process.env.CREATOR_TOKEN ? '✓' : '✗ (using default)'}`);

  try {
    await testFullWorkflow();

    // 输出总结
    console.log('\n' + '='.repeat(50));
    console.log('📊 测试总结');
    console.log('='.repeat(50));

    const passed = results.filter((r) => r.status === 'pass').length;
    const failed = results.filter((r) => r.status === 'fail').length;
    const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n✅ 通过: ${passed}`);
    console.log(`❌ 失败: ${failed}`);
    console.log(`⏱️  总耗时: ${totalTime}ms`);

    if (failed > 0) {
      console.log('\n失败的测试:');
      results
        .filter((r) => r.status === 'fail')
        .forEach((r) => {
          console.log(`  ❌ ${r.name}: ${r.error}`);
        });
    }

    const success = failed === 0;
    console.log(`\n${success ? '🎉 所有测试通过!' : '⚠️  部分测试失败'}`);
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n💥 测试执行错误:', error);
    process.exit(1);
  }
}

main();
