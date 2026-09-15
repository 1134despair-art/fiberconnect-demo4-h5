import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径（ES模块中的 __dirname 替代方案）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保截图目录存在
const screenshotDir = path.join(__dirname, '../screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function takeDeviceDetailScreenshot() {
  console.log('🚀 开始截图设备详情页面...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: {
      width: 375,
      height: 812,
      deviceScaleFactor: 2
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // 设置用户代理为移动设备
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1');

  try {
    // 先登录
    console.log('🔐 正在登录...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0', timeout: 30000 });
    
    // 输入手机号
    await page.waitForSelector('input[placeholder="请输入手机号"]', { timeout: 10000 });
    await page.type('input[placeholder="请输入手机号"]', '13800138000');
    
    // 点击获取验证码按钮
    const codeButton = await page.waitForSelector('button', { timeout: 5000 });
    await codeButton.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 输入验证码
    await page.waitForSelector('input[placeholder="请输入验证码"]');
    await page.type('input[placeholder="请输入验证码"]', '123456');
    
    // 点击登录按钮
    const loginButtons = await page.$$('button');
    if (loginButtons.length > 1) {
      await loginButtons[1].click();
    }
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 截图设备详情页面
    console.log('📸 正在截图设备详情页面...');
    await page.goto('http://localhost:3001/device/1', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    await new Promise(resolve => setTimeout(resolve, 5000)); // 等待更长时间
    
    const screenshotPath = path.join(screenshotDir, '03-device-detail.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      type: 'png'
    });
    
    console.log('✅ 设备详情页面截图完成: 03-device-detail.png');

  } catch (error) {
    console.error('❌ 截图失败:', error.message);
  } finally {
    await browser.close();
    console.log('🎉 截图任务完成！');
  }
}

// 运行截图脚本
takeDeviceDetailScreenshot().catch(console.error);