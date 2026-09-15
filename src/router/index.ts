import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../pages/home/Home.vue'
import Login from '../pages/login/Login.vue'
import { useAuth } from '../composables/useAuth'
import i18n from '../locales'

// 路由配置
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { 
      requiresAuth: false,
      title: '用户登录'
    }
  },
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { 
      requiresAuth: true,
      title: '首页'
    }
  },
  {
    path: '/device/:id',
    name: 'DeviceDetail',
    component: () => import('../pages/device/DeviceDetail.vue'),
    meta: { 
      requiresAuth: true,
      title: '设备详情'
    }
  },
  {
    path: '/device/:id/omp',
    name: 'OpmOperation',
    component: () => import('../pages/device/operations/OpmOperation.vue'),
    meta: { 
      requiresAuth: true,
      title: 'OPM光功率计'
    }
  },
  {
    path: '/device/:id/mopm',
    name: 'OpmOperationMultiOpm',
    component: () => import('../pages/device/operations/OpmOperationMultiOpm.vue'),
    meta: {
      requiresAuth: true,
      title: 'OPM光功率计'
    }
  },
  {
    path: '/device/:id/wiremap',
    name: 'CableWiremapOperation',
    component: () => import('../pages/device/operations/CableWiremapOperation.vue'),
    meta: {
      requiresAuth: true,
      title: '网络对线'
    }
  },
  {
    path: '/device/:id/seek',
    name: 'CableSeekOperation',
    component: () => import('../pages/device/operations/CableSeekOperation.vue'),
    meta: {
      requiresAuth: true,
      title: '网络寻线'
    }
  },
  {
    path: '/device/:id/cable-test',
    name: 'CableTestOperation',
    component: () => import('../pages/device/operations/CableTestOperation.vue'),
    meta: {
      requiresAuth: true,
      title: '网线测试'
    }
  },
  {
    path: '/device/:id/event-map',
    name: 'EventMapOperation',
    component: () => import('../pages/device/operations/EventMapOperation.vue'),
    meta: {
      requiresAuth: true,
      title: '事件地图'
    }
  },
  {
    path: '/device/:id/light-source',
    name: 'LightSourceOperation',
    component: () => import('../pages/device/operations/LightSourceOperation.vue'),
    meta: {
      requiresAuth: true,
      title: '光源'
    }
  },
  {
    path: '/device/:id/system',
    name: 'SystemSettings',
    component: () => import('../pages/device/operations/SystemSettings.vue'),
    meta: { 
      requiresAuth: true,
      title: '系统设置'
    }
  },
  {
    path: '/device/:id/vfl',
    name: 'VflOperation',
    component: () => import('../pages/device/operations/VflOperation.vue'),
    meta: { 
      requiresAuth: true,
      title: 'VFL红光源'
    }
  },
  {
    path: '/device/:id/otdr',
    name: 'OtdrOperation',
    component: () => import('../pages/device/operations/OtdrOperation.vue'),
    meta: { 
      requiresAuth: true,
      title: 'OTDR'
    }
  },
  {
    path: '/device/:id/smart-otdr',
    name: 'SmartOtdrMeasure',
    component: () => import('../pages/device/operations/SmartOtdrMeasure.vue'),
    meta: {
      requiresAuth: true,
      title: '智能OTDR测量'
    }
  },
  {
    path: '/device/:id/endface',
    name: 'SmartEndfaceInspect',
    component: () => import('../pages/device/operations/SmartEndfaceInspect.vue'),
    meta: {
      requiresAuth: true,
      title: '端面检测'
    }
  },
  {
    path: '/device/:id/pon-measure',
    name: 'PonMeasurement',
    component: () => import('../pages/device/pon/PonMeasurement.vue'),
    meta: {
      requiresAuth: true,
      title: '10GPON光功率测量'
    }
  },
  {
    path: '/device/:id/pon-opm',
    name: 'PonOpmMeasurement',
    component: () => import('../pages/device/pon/PonMeasurement.vue'),
    meta: {
      requiresAuth: true,
      title: '普通光功率测量'
    }
  },
  {
    path: '/device/:id/pon-history',
    name: 'PonHistory',
    component: () => import('../pages/device/pon/PonHistory.vue'),
    meta: {
      requiresAuth: true,
      title: 'PON测量记录'
    }
  },
  {
    path: '/device/:id/pon-vfl',
    name: 'PonVflControl',
    component: () => import('../pages/device/pon/PonVflControl.vue'),
    meta: {
      requiresAuth: true,
      title: '10GPON光功率计VFL'
    }
  },
  {
    path: '/device/:id/pon-settings',
    name: 'PonSettings',
    component: () => import('../pages/device/pon/PonSettings.vue'),
    meta: {
      requiresAuth: true,
      title: '10GPON光功率计设置'
    }
  },
  {
    path: '/device/:id/dual-pon-network',
    name: 'DualPonNetwork',
    component: () => import('../pages/device/dual-pon/DualPonNetwork.vue'),
    meta: { requiresAuth: true, title: 'PON网络状态测试' }
  },
  {
    path: '/device/:id/dual-pon-power',
    name: 'DualPonPower',
    component: () => import('../pages/device/dual-pon/DualPonPower.vue'),
    meta: { requiresAuth: true, title: '双端PON功率测量' }
  },
  {
    path: '/device/:id/dual-pon-vfl',
    name: 'DualPonVfl',
    component: () => import('../pages/device/dual-pon/DualPonVfl.vue'),
    meta: { requiresAuth: true, title: '双端PON VFL控制' }
  },
  {
    path: '/device/:id/dual-pon-cable-length',
    name: 'DualPonCableLength',
    component: () => import('../pages/device/dual-pon/DualPonCable.vue'),
    meta: { requiresAuth: true, title: 'RJ45线长测试' }
  },
  {
    path: '/device/:id/dual-pon-wiremap',
    name: 'DualPonWiremap',
    component: () => import('../pages/device/dual-pon/DualPonCable.vue'),
    meta: { requiresAuth: true, title: 'RJ45线序测试' }
  },
  {
    path: '/device/:id/dual-pon-trace',
    name: 'DualPonTrace',
    component: () => import('../pages/device/dual-pon/DualPonCable.vue'),
    meta: { requiresAuth: true, title: 'RJ45寻线' }
  },
  {
    path: '/device/:id/dual-pon-records',
    name: 'DualPonRecords',
    component: () => import('../pages/device/dual-pon/DualPonRecords.vue'),
    meta: { requiresAuth: true, title: '双端PON测量记录' }
  },
  {
    path: '/device/:id/dual-pon-settings',
    name: 'DualPonSettings',
    component: () => import('../pages/device/dual-pon/DualPonSettings.vue'),
    meta: { requiresAuth: true, title: '双端PON设备设置' }
  },
  {
    path: '/device/:id/port-fid',
    name: 'PortAuditFid',
    component: () => import('../pages/device/port-audit/PortAuditFid.vue'),
    meta: { requiresAuth: true, title: '光纤识别' }
  },
  {
    path: '/device/:id/port-onu',
    name: 'PortAuditOnu',
    component: () => import('../pages/device/port-audit/PortAuditOnu.vue'),
    meta: { requiresAuth: true, title: 'ONU检测' }
  },
  {
    path: '/device/:id/port-power',
    name: 'PortAuditPower',
    component: () => import('../pages/device/port-audit/PortAuditPower.vue'),
    meta: { requiresAuth: true, title: '端口功率测量' }
  },
  {
    path: '/device/:id/port-rfid',
    name: 'PortAuditRfid',
    component: () => import('../pages/device/port-audit/PortAuditRfid.vue'),
    meta: { requiresAuth: true, title: 'RFID标签核查' }
  },
  {
    path: '/device/:id/port-vfl',
    name: 'PortAuditVfl',
    component: () => import('../pages/device/port-audit/PortAuditVfl.vue'),
    meta: { requiresAuth: true, title: '端口清查仪VFL' }
  },
  {
    path: '/device/:id/port-remote',
    name: 'PortAuditRemote',
    component: () => import('../pages/device/port-audit/PortAuditRemote.vue'),
    meta: { requiresAuth: true, title: '端口清查仪4G远程连接' }
  },
  {
    path: '/device/:id/port-settings',
    name: 'PortAuditSettings',
    component: () => import('../pages/device/port-audit/PortAuditSettings.vue'),
    meta: { requiresAuth: true, title: '端口清查仪设置' }
  },
  {
    path: '/device/:id/stable-source-control',
    name: 'StableSourceControl',
    component: () => import('../pages/device/stable-source/StableSourceControl.vue'),
    meta: {
      requiresAuth: true,
      title: '稳定光源控制'
    }
  },
  {
    path: '/device/:id/stable-source-vfl',
    name: 'StableSourceVfl',
    component: () => import('../pages/device/stable-source/StableSourceVfl.vue'),
    meta: {
      requiresAuth: true,
      title: '稳定光源VFL'
    }
  },
  {
    path: '/device/:id/stable-source-settings',
    name: 'StableSourceSettings',
    component: () => import('../pages/device/stable-source/StableSourceSettings.vue'),
    meta: {
      requiresAuth: true,
      title: '稳定光源设置'
    }
  },
  {
    path: '/device/:id/smart-opm',
    name: 'SmartPowerMeter',
    component: () => import('../pages/device/operations/SmartPowerMeter.vue'),
    meta: {
      requiresAuth: true,
      title: '智能光功率计'
    }
  },
  {
    path: '/device/:id/loss-test',
    name: 'SmartLossTest',
    component: () => import('../pages/device/operations/SmartLossTest.vue'),
    meta: {
      requiresAuth: true,
      title: '损耗测试'
    }
  },
  {
    path: '/device/:id/files',
    name: 'SmartFileManager',
    component: () => import('../pages/device/operations/SmartFileManager.vue'),
    meta: {
      requiresAuth: true,
      title: '文件管理'
    }
  },
  {
    path: '/device/:id/fusion',
    name: 'FusionSettings',
    component: () => import('../pages/device/operations/FusionSettings.vue'),
    meta: { 
      requiresAuth: true,
      title: '熔接设置'
    }
  },
  {
    path: '/device/:id/fusion-operation',
    name: 'FusionOperation',
    component: () => import('../pages/device/operations/FusionOperation.vue'),
    meta: {
      requiresAuth: true,
      title: '熔接操作'
    }
  },
  {
    path: '/device/:id/legacy-settings',
    name: 'LegacyDeviceSettings',
    component: () => import('../pages/device/operations/LegacyDeviceSettings.vue'),
    meta: {
      requiresAuth: true,
      title: '设备设置'
    }
  },
  {
    path: '/device/:id/mopm-vfl',
    name: 'MultiOpmVfl',
    component: () => import('../pages/device/operations/LightSourceOperationMultiOpm.vue'),
    meta: {
      requiresAuth: true,
      title: '红绿光源'
    }
  },
  {
    path: '/device/:id/maintenance',
    name: 'DeviceMaintenance',
    component: () => import('../pages/device/operations/DeviceMaintenance.vue'),
    meta: { 
      requiresAuth: true,
      title: '设备维护'
    }
  },
  {
    path: '/device/:id/records',
    name: 'FusionRecords',
    component: () => import('../pages/device/operations/FusionRecords.vue'),
    meta: { 
      requiresAuth: true,
      title: '熔接记录'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../pages/settings/Settings.vue'),
    meta: { 
      requiresAuth: true,
      title: '设置'
    }
  },
  {
    path: '/operation-manual',
    name: 'OperationManual',
    component: () => import('../pages/settings/OperationManual.vue'),
    meta: {
      requiresAuth: true,
      title: '操作手册'
    }
  },
  {
    path: '/catalog',
    name: 'ProductCatalog',
    component: () => import('../pages/product/ProductCatalog.vue'),
    meta: { 
      requiresAuth: true,
      title: '产品分类'
    }
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: () => import('../pages/product/ProductDetail.vue'),
    meta: { 
      requiresAuth: true,
      title: '产品详情'
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../pages/profile/Profile.vue'),
    meta: { 
      requiresAuth: true,
      title: '个人中心'
    }
  },
  {
    path: '/after-sales',
    name: 'AfterSales',
    component: () => import('../pages/settings/AfterSales.vue'),
    meta: { 
      requiresAuth: true,
      title: '售后订单'
    }
  },
  // 404页面重定向
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 全局路由守卫
router.beforeEach((to, _from, next) => {
  const { checkAuth } = useAuth()
  const isAuthenticated = checkAuth()

  // 语言上下文切换逻辑
  const isDeviceContext = to.path.startsWith('/device/')
  // 如果没有设置过，默认使用 zh-CN
  // locale_app 继承原有的 language 设置，保证兼容性
  const appLocale = localStorage.getItem('locale_app') || localStorage.getItem('language') || 'zh-CN'
  const deviceLocale = localStorage.getItem('locale_device') || 'zh-CN'
  
  const targetLocale = isDeviceContext ? deviceLocale : appLocale
  
  // @ts-ignore
  if (i18n.global.locale.value !== targetLocale) {
    // @ts-ignore
    i18n.global.locale.value = targetLocale
  }
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 移动端应用`
  }
  
  // 检查路由权限
  if (to.meta.requiresAuth) {
    if (isAuthenticated) {
      next()
    } else {
      // 未登录用户重定向到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
  } else {
    // 已登录用户访问登录页时重定向到首页
    if (to.name === 'Login' && isAuthenticated) {
      next('/')
    } else {
      next()
    }
  }
})

// 路由错误处理
router.onError((error) => {
  console.error('路由错误:', error)
})

export default router
