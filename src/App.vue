<template>
  <router-view />
</template>

<script setup lang="ts">
// 路由容器组件，不需要额外逻辑
</script>

<style>
/* 引入全局样式 */
@import './styles/global.css';

/* 基础容器样式 - 仅在需要时覆盖全局样式 */

/* 应用容器 */
.app-container {
  width: min(var(--ds-mobile-shell-width), calc(100vw - var(--ds-mobile-shell-viewport-gap)));
  max-width: var(--ds-mobile-shell-width);
  height: min(var(--ds-mobile-shell-height), calc(100dvh - var(--ds-mobile-shell-viewport-gap)));
  max-height: var(--ds-mobile-shell-height);
  box-sizing: border-box;
  background: var(--color-white);
  border-radius: var(--ds-mobile-shell-radius);
  overflow: hidden;
  position: relative;
  border: 1px solid var(--color-border);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  z-index: 10;
}

/* 所有业务页面共用同一移动 App 外壳，页面差异仅保留在内容区域。 */

/* 顶部标题栏 */
.header {
  height: 56px;
  background: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-bottom: 1px solid var(--color-border);
  z-index: 20;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* 主内容区域 */
.content-flex {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
  background-color: var(--color-bg);
}

/* 底部导航栏 */
.nav-bar {
  height: 80px;
  background: var(--color-white);
  display: flex;
  justify-content: space-around;
  border-top: 1px solid var(--color-border);
  z-index: 20;
  box-shadow: 0 -1px 10px rgba(0, 0, 0, 0.05);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  width: 70px;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
}

.nav-item.active {
  color: var(--color-primary);
}

.nav-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
  transition: all 0.2s ease;
}

.nav-text {
  font-size: 12px;
  font-weight: 500;
}

.nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: inherit;
  width: 100%;
}

/* 滚动条隐藏 */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 内容卡片 */
.content-card {
  background: var(--color-white);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

/* 统计区域 */
.stats-section {
  margin: 16px;
  background: var(--color-white);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
</style>
