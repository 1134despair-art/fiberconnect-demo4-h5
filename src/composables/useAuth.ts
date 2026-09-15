import { ref, computed } from 'vue'

// 用户接口定义
export interface User {
  id: string
  phone: string
  name: string
  role: string
  avatar?: string
  email?: string
  password?: string
  title?: string
  skills?: string[]
  devices: Device[]
  createdAt: string
}

export type DeviceType = 'fusion_splicer' | 'portable_otdr' | 'multi_opm_meter' | 'smart_otdr' | 'pon_power_meter' | 'dual_port_pon_meter' | 'stable_light_source' | 'port_audit_instrument'

export type PonPowerRange = 'standard' | 'high'
export type StableSourceWavelength = 1310 | 1550
export type StableSourceOutputFrequency = 'cw' | '270hz' | '1khz' | '2khz'

export interface StableSourceRange {
  min: number
  max: number
  step: number
}

// 设备接口定义
export interface Device {
  id: string
  name: string
  model: string
  serialNumber: string
  deviceType: DeviceType
  status: 'connected' | 'disconnected' | 'inactive'
  lastConnected?: string
  activationStatus: 'activated' | 'not_activated'
  authorizationExpiry?: string
  hasPassword?: boolean
  passwordHash?: string
  lightSourceColor?: 'red' | 'green'
  ponPowerRange?: PonPowerRange
  ponOpmAccuracyDb?: number
  ponOpmAccuracyPercent?: number
  ponMeasurementAccuracyDb?: number
  ponIsolationDb?: number
  supportedVflColors?: Array<'red' | 'green'>
  productBatch?: string
  batteryPercent?: number
  batteryCharging?: boolean
  stableSourceWavelengths?: StableSourceWavelength[]
  stableSourcePowerRange?: StableSourceRange
  stableSourceFrequencies?: StableSourceOutputFrequency[]
  stableSourceCalibrationRange?: StableSourceRange
  stableSourceGainRange?: StableSourceRange
  stableSourceAutoShutdownOptions?: number[]
  stableSourceLanguages?: Array<'zh-CN' | 'en'>
  portAuditPowerRange?: {
    min: number
    max: number
    resolution: number
  }
  portAuditWavelengths?: number[]
  portAuditPonWavelengths?: Array<1490 | 1577>
  portAuditRfidFrequencyMhz?: number
  portAuditHas4g?: boolean
  batteryCapacityMah?: number
  dualPonWavelengths?: Array<1310 | 1490 | 1550>
  dualPonOpmWavelengths?: number[]
  dualPonPowerRange?: PonPowerRange
  dualPonCablePorts?: number
  dualPonSupportsOta?: boolean
}

// 登录结果接口
export interface LoginResult {
  success: boolean
  message?: string
  isNewUser?: boolean
}

// 认证状态管理
const currentUser = ref<User | null>(null)
const isAuthenticated = ref<boolean>(false)

// 模拟用户数据库
const userDatabase = new Map<string, User>()

// 初始化一些测试用户数据
const initTestUsers = () => {
  const testUsers: User[] = [
    {
      id: '1',
      phone: '13800138000',
      email: 'test@example.com', // 恢复默认测试账号的邮箱
      password: 'password123',
      name: '张三',
      role: 'user',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=13800138000',
      devices: [
        {
          id: 'device_001',
          name: '六马达熔接机-001',
          model: 'WM-6000',
          serialNumber: 'WM6000001',
          deviceType: 'fusion_splicer',
          status: 'connected',
          lastConnected: '2024-12-25 10:30:00',
          activationStatus: 'activated',
          authorizationExpiry: '2025-12-25',
          hasPassword: true
        },
        {
          id: 'device_002',
          name: '六马达熔接机-002',
          model: 'WM-6000',
          serialNumber: 'WM6000002',
          deviceType: 'fusion_splicer',
          status: 'disconnected',
          lastConnected: '2024-12-24 15:20:00',
          activationStatus: 'activated',
          authorizationExpiry: '2025-06-24',
          hasPassword: true
        },
        {
          id: 'device_003',
          name: '六马达熔接机-003',
          model: 'WM-6000',
          serialNumber: 'WM6000003',
          deviceType: 'fusion_splicer',
          status: 'inactive',
          activationStatus: 'not_activated',
          hasPassword: false
        },
        {
          id: 'device_004',
          name: '六马达熔接机-004',
          model: 'WM-6000',
          serialNumber: 'WM6000004',
          deviceType: 'fusion_splicer',
          status: 'disconnected',
          lastConnected: '2024-12-23 09:15:00',
          activationStatus: 'not_activated',
          hasPassword: false
        },
        {
          id: 'device_005',
          name: '六马达熔接机-005',
          model: 'WM-6000',
          serialNumber: 'WM6000005',
          deviceType: 'fusion_splicer',
          status: 'inactive',
          activationStatus: 'activated',
          authorizationExpiry: '2024-12-20', // 已过期
          hasPassword: true
        },
        {
          id: 'device_006',
          name: '便携式OTDR测试仪-001',
          model: 'FWV-100-V10',
          serialNumber: 'FWV100V10001',
          deviceType: 'portable_otdr',
          status: 'disconnected',
          lastConnected: '2024-12-22 11:05:00',
          activationStatus: 'activated',
          authorizationExpiry: '2025-12-22',
          hasPassword: false
        },
        {
          id: 'device_007',
          name: '手持式多功能光功率计-001',
          model: 'MOPM-4G',
          serialNumber: 'MOPM4G0001',
          deviceType: 'multi_opm_meter',
          status: 'inactive',
          activationStatus: 'activated',
          authorizationExpiry: '2025-12-25',
          hasPassword: false,
          lightSourceColor: 'red'
        },
        {
          id: 'device_008',
          name: '智能OTDR测试仪-001',
          model: 'SOTDR-200',
          serialNumber: 'SOTDR200001',
          deviceType: 'smart_otdr',
          status: 'disconnected',
          lastConnected: '2024-12-21 09:40:00',
          activationStatus: 'activated',
          authorizationExpiry: '2025-12-25',
          hasPassword: false
        }
      ],
      createdAt: '2024-01-15 10:00:00'
    },
    {
      id: '2',
      phone: '13900139000',
      // email: '', // 纯手机号用户，无邮箱
      password: 'password123',
      name: '李四',
      role: 'user',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=13900139000',
      devices: [],
      createdAt: '2024-02-01 12:00:00'
    }
  ]
  
  testUsers.forEach(user => {
    userDatabase.set(user.phone, user)
    if (user.email) {
      userDatabase.set(user.email, user)
    }
  })
}

// 获取用户的辅助函数
const findUser = (account: string): User | undefined => {
  return userDatabase.get(account)
}

// 初始化测试数据
initTestUsers()

/**
 * 用户认证组合式函数
 * 提供手机号验证码登录、退出、权限检查等功能
 */
export function useAuth() {
  // 计算属性
  const user = computed(() => currentUser.value)
  const isLoggedIn = computed(() => isAuthenticated.value)

  /**
   * 手机号验证码登录
   * @param phone 手机号
   * @param verifyCode 验证码
   * @returns 登录结果
   */
  const loginWithPhone = async (phone: string, verifyCode: string): Promise<LoginResult> => {
    try {
      // 模拟网络请求延迟
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 验证验证码（Demo环境，验证码统一为123456）
      if (verifyCode !== '123456') {
        return {
          success: false,
          message: '验证码错误，请重新输入'
        }
      }
      
      // 检查用户是否存在
      let userData = findUser(phone)
      let isNewUser = false
      
      if (!userData) {
        // 自动注册新用户
        isNewUser = true
        userData = {
          id: `user_${Date.now()}`,
          phone,
          // 手机号登录时，默认不设置邮箱，用户可在个人中心添加
          // email: `${phone}@example.com`, 
          name: `用户${phone.slice(-4)}`,
          role: 'user',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`,
          devices: [
            // 新用户默认显示一些已添加的设备
            {
              id: `device_${Date.now()}_1`,
              name: '六马达熔接机-A01',
              model: 'WM-6000',
              serialNumber: `WM${Date.now().toString().slice(-6)}`,
              deviceType: 'fusion_splicer',
              status: 'disconnected',
              lastConnected: '2024-12-20 14:20:00',
              activationStatus: 'activated',
              authorizationExpiry: '2025-06-20',
              hasPassword: true
            },
            {
              id: `device_${Date.now()}_2`,
              name: '六马达熔接机-B02',
              model: 'WM-6000',
              serialNumber: `WM${(Date.now() + 1000).toString().slice(-6)}`,
              deviceType: 'fusion_splicer',
              status: 'inactive',
              activationStatus: 'not_activated',
              hasPassword: false
            },
            {
              id: `device_${Date.now()}_3`,
              name: '六马达熔接机-C03',
              model: 'WM-6000',
              serialNumber: `WM${(Date.now() + 2000).toString().slice(-6)}`,
              deviceType: 'fusion_splicer',
              status: 'connected',
              lastConnected: new Date().toLocaleString('zh-CN'),
              activationStatus: 'activated',
              authorizationExpiry: '2025-12-25',
              hasPassword: true
            },
            {
              id: `device_${Date.now()}_4`,
              name: '便携式OTDR测试仪-D04',
              model: 'FWV-100-V10',
              serialNumber: `FWV${(Date.now() + 3000).toString().slice(-6)}`,
              deviceType: 'portable_otdr',
              status: 'disconnected',
              lastConnected: '2024-12-20 14:20:00',
              activationStatus: 'activated',
              authorizationExpiry: '2025-06-20',
              hasPassword: false
            },
            {
              id: `device_${Date.now()}_5`,
              name: '手持式多功能光功率计-E05',
              model: 'MOPM-4G',
              serialNumber: `MOPM${(Date.now() + 4000).toString().slice(-6)}`,
              deviceType: 'multi_opm_meter',
              status: 'inactive',
              activationStatus: 'activated',
              authorizationExpiry: '2025-12-25',
              hasPassword: false,
              lightSourceColor: 'red'
            },
            {
              id: `device_${Date.now()}_6`,
              name: '智能OTDR测试仪-F06',
              model: 'SOTDR-200',
              serialNumber: `SOTDR${(Date.now() + 5000).toString().slice(-6)}`,
              deviceType: 'smart_otdr',
              status: 'disconnected',
              lastConnected: '2024-12-19 10:10:00',
              activationStatus: 'activated',
              authorizationExpiry: '2025-12-25',
              hasPassword: false
            }
          ],
          createdAt: new Date().toLocaleString('zh-CN')
        }
        
        // 保存新用户到数据库
        userDatabase.set(phone, userData)
      }
      
      // 设置当前用户
      currentUser.value = userData
      isAuthenticated.value = true
      
      // 保存到本地存储
      localStorage.setItem('auth_user', JSON.stringify(userData))
      localStorage.setItem('auth_token', `token_${userData.id}_${Date.now()}`)
      
      return {
        success: true,
        isNewUser,
        message: isNewUser ? '注册成功' : '登录成功'
      }
      
    } catch (error) {
      console.error('登录失败:', error)
      return {
        success: false,
        message: '登录失败，请稍后重试'
      }
    }
  }

  /**
   * 邮箱密码登录/注册
   * @param email 邮箱
   * @param password 密码
   * @returns 登录结果
   */
  const loginWithEmail = async (email: string, password: string): Promise<LoginResult> => {
    try {
      // 模拟网络请求延迟
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 检查用户是否存在
      let userData = findUser(email)
      let isNewUser = false
      
      if (!userData) {
        // 自动注册新用户
        isNewUser = true
        userData = {
          id: `user_${Date.now()}`,
          phone: '', // 邮箱注册时手机号可为空
          email,
          password,
          name: `用户${email.split('@')[0]}`,
          role: 'user',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          devices: [
            {
              id: `device_${Date.now()}_1`,
              name: '六马达熔接机-E01',
              model: 'WM-6000',
              serialNumber: `WM${Date.now().toString().slice(-6)}`,
              deviceType: 'fusion_splicer',
              status: 'disconnected',
              lastConnected: '2024-12-20 14:20:00',
              activationStatus: 'activated',
              authorizationExpiry: '2025-06-20',
              hasPassword: true
            },
            {
              id: `device_${Date.now()}_2`,
              name: '六马达熔接机-F02',
              model: 'WM-6000',
              serialNumber: `WM${(Date.now() + 1000).toString().slice(-6)}`,
              deviceType: 'fusion_splicer',
              status: 'connected',
              lastConnected: new Date().toLocaleString('zh-CN'),
              activationStatus: 'activated',
              authorizationExpiry: '2025-12-25',
              hasPassword: true
            },
            {
              id: `device_${Date.now()}_3`,
              name: '智能OTDR测试仪-G03',
              model: 'SOTDR-200',
              serialNumber: `SOTDR${(Date.now() + 2000).toString().slice(-6)}`,
              deviceType: 'smart_otdr',
              status: 'disconnected',
              lastConnected: '2024-12-20 16:30:00',
              activationStatus: 'activated',
              authorizationExpiry: '2025-12-25',
              hasPassword: false
            }
          ],
          createdAt: new Date().toLocaleString('zh-CN')
        }
        
        // 保存新用户到数据库
        userDatabase.set(email, userData)
      } else {
        // 检查密码（Demo环境，如果是新注册用户保存了密码就校验，否则默认通过）
        if (userData.password && userData.password !== password) {
          return {
            success: false,
            message: '密码错误，请重新输入'
          }
        }
      }
      
      // 设置当前用户
      currentUser.value = userData
      isAuthenticated.value = true
      
      // 保存到本地存储
      localStorage.setItem('auth_user', JSON.stringify(userData))
      localStorage.setItem('auth_token', `token_${userData.id}_${Date.now()}`)
      
      return {
        success: true,
        isNewUser,
        message: isNewUser ? '注册成功' : '登录成功'
      }
    } catch (error) {
      console.error('登录失败:', error)
      return {
        success: false,
        message: '登录失败，请稍后重试'
      }
    }
  }

  /**
   * 用户退出登录
   */
  const logout = async (): Promise<void> => {
    try {
      // 模拟网络请求
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 清除状态
      currentUser.value = null
      isAuthenticated.value = false
      
      // 清除存储数据
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_token')
      sessionStorage.removeItem('auth_user')
      sessionStorage.removeItem('auth_token')
    } catch (error) {
      console.error('退出登录失败:', error)
    }
  }

  /**
   * 检查用户认证状态
   * @returns 是否已认证
   */
  const checkAuth = (): boolean => {
    try {
      // 优先检查localStorage，再检查sessionStorage
      const userStr = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user')
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      
      if (userStr && token) {
        const userData = JSON.parse(userStr) as User
        if (Array.isArray(userData.devices)) {
          userData.devices = userData.devices.map(d => ({
            ...d,
            deviceType: (d as any).deviceType || 'fusion_splicer'
          }))
        }
        currentUser.value = userData
        isAuthenticated.value = true
        return true
      }
      
      return false
    } catch (error) {
      console.error('认证检查失败:', error)
      return false
    }
  }

  /**
   * 更新用户信息
   * @param userData 用户数据
   */
  const updateUser = (userData: Partial<User>) => {
    if (currentUser.value) {
      currentUser.value = { ...currentUser.value, ...userData }
      
      // 更新存储中的用户信息
      const storage = localStorage.getItem('auth_user') ? localStorage : sessionStorage
      storage.setItem('auth_user', JSON.stringify(currentUser.value))
      
      // 更新数据库中的用户信息
      if (currentUser.value.phone) {
        userDatabase.set(currentUser.value.phone, currentUser.value)
      }
      if (currentUser.value.email) {
        userDatabase.set(currentUser.value.email, currentUser.value)
      }
    }
  }

  /**
   * 添加设备到用户账户
   * @param device 设备信息
   */
  const addDevice = (device: Device): boolean => {
    if (!currentUser.value) return false

    const normalizedSerial = device.serialNumber.trim().toUpperCase()
    const alreadyExists = currentUser.value.devices.some(
      item => item.serialNumber.trim().toUpperCase() === normalizedSerial
    )
    if (alreadyExists) return false

    currentUser.value.devices.push(device)
    updateUser({ devices: currentUser.value.devices })
    return true
  }

  /**
   * 更新设备信息
   * @param deviceId 设备ID
   * @param deviceData 设备数据
   */
  const updateDevice = (deviceId: string, deviceData: Partial<Device>) => {
    if (currentUser.value) {
      const deviceIndex = currentUser.value.devices.findIndex(d => d.id === deviceId)
      if (deviceIndex !== -1) {
        currentUser.value.devices[deviceIndex] = {
          ...currentUser.value.devices[deviceIndex],
          ...deviceData
        }
        updateUser({ devices: currentUser.value.devices })
      }
    }
  }

  /**
   * 检查用户权限
   * @param permission 权限标识
   * @returns 是否有权限
   */
  const hasPermission = (permission: string): boolean => {
    if (!currentUser.value) return false
    
    const { role } = currentUser.value
    
    // 权限映射表
    const permissions: Record<string, string[]> = {
      admin: ['read', 'write', 'delete', 'manage', 'device_control'],
      user: ['read', 'write', 'device_control']
    }
    
    return permissions[role]?.includes(permission) || false
  }

  /**
   * 发送验证码（模拟）
   * @param phone 手机号
   * @returns 是否发送成功
   */
  const sendVerifyCode = async (phone: string): Promise<boolean> => {
    try {
      // 模拟发送验证码的网络请求
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 在实际项目中，这里会调用短信服务API
      console.log(`向 ${phone} 发送验证码: 123456`)
      
      return true
    } catch (error) {
      console.error('发送验证码失败:', error)
      return false
    }
  }

  // 初始化时检查认证状态
  checkAuth()

  return {
    // 状态
    user,
    isLoggedIn,
    
    // 方法
    loginWithPhone,
    logout,
    checkAuth,
    updateUser,
    addDevice,
    updateDevice,
    hasPermission,
    sendVerifyCode,
    loginWithEmail
  }
}
