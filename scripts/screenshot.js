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

// 页面配置
const pages = [
  { name: '登录页面', url: 'http://localhost:3001/login', filename: '01-login.png' },
  { name: '首页', url: 'http://localhost:3001/', filename: '02-home.png' },
  { name: '设备详情', url: 'http://localhost:3001/device/1', filename: '03-device-detail.png' },
  { name: 'OPM光功率计', url: 'http://localhost:3001/device/1/omp', filename: '04-omp-operation.png' },
  { name: 'VFL红光源', url: 'http://localhost:3001/device/1/vfl', filename: '05-vfl-operation.png' },
  { name: 'OTDR', url: 'http://localhost:3001/device/1/otdr', filename: '06-otdr-operation.png' },
  { name: '熔接设置', url: 'http://localhost:3001/device/1/fusion', filename: '07-fusion-settings.png' },
  { name: '设备维护', url: 'http://localhost:3001/device/1/maintenance', filename: '08-device-maintenance.png' },
  { name: '熔接记录', url: 'http://localhost:3001/device/1/records', filename: '09-fusion-records.png' },
  { name: '系统设置', url: 'http://localhost:3001/device/1/system', filename: '10-system-settings.png' },
  { name: '应用设置', url: 'http://localhost:3001/settings', filename: '11-app-settings.png' }
];

async function takeScreenshots() {
  console.log('🚀 开始截图...');
  
  const browser = await puppeteer.launch({
    headless: 'new', // 使用新的无头模式
    defaultViewport: {
      width: 375,  // iPhone 12 Pro 宽度
      height: 812, // iPhone 12 Pro 高度
      deviceScaleFactor: 2
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // 设置用户代理为移动设备
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1');

  try {
    // 首先访问登录页面并截图
    console.log('📱 正在截图登录页面...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000)); // 替代 waitForTimeout
    
    const loginScreenshotPath = path.join(screenshotDir, '01-login.png');
    await page.screenshot({
      path: loginScreenshotPath,
      fullPage: true,
      type: 'png'
    });
    console.log('✅ 登录页面截图完成');

    // 模拟登录操作
    console.log('🔐 正在模拟登录...');
    
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
      await loginButtons[1].click(); // 第二个按钮是登录按钮
    }
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 截取其他页面
    for (let i = 1; i < pages.length; i++) {
      const pageConfig = pages[i];
      try {
        console.log(`📸 正在截图: ${pageConfig.name}`);
        await page.goto(pageConfig.url, { waitUntil: 'networkidle0', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 2000)); // 等待页面完全加载和动画完成
        
        const screenshotPath = path.join(screenshotDir, pageConfig.filename);
        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
          type: 'png'
        });
        
        console.log(`✅ ${pageConfig.name} 截图完成: ${pageConfig.filename}`);
      } catch (error) {
        console.error(`❌ ${pageConfig.name} 截图失败:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ 截图过程中出现错误:', error);
  } finally {
    await browser.close();
    console.log('🎉 截图完成！所有图片保存在 screenshots/ 目录中');
    
    // 列出生成的截图文件
    const files = fs.readdirSync(screenshotDir);
    console.log('\n📁 生成的截图文件:');
    files.forEach(file => {
      console.log(`   ${file}`);
    });
  }
}

// 运行截图脚本
takeScreenshots().catch(console.error);