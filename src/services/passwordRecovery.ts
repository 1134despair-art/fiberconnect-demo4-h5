import type { User } from '@/composables/useAuth'
import { replaceRegisteredPassword } from './prototypeAccounts'
export interface PasswordRecoveryAdapter {
 request(account: string): Promise<void>
 reset(account: string, code: string, password: string, user: User): Promise<User>
}
// Prototype only: swap this adapter for server-issued single-use challenges before production.
const challenges = new Map<string, { expires: number; retryAfter: number; attempts: number }>()
let adapter: PasswordRecoveryAdapter = {
 async request(account) {
  const key = account.trim().toLowerCase(), previous = challenges.get(key)
  if (previous && Date.now() < previous.retryAfter) throw new Error('请稍后重新获取验证码')
  challenges.set(key, { expires: Date.now() + 300000, retryAfter: Date.now() + 60000, attempts: 0 })
 },
 async reset(account, code, password, user) {
  const key = account.trim().toLowerCase(), challenge = challenges.get(key)
  if (!challenge || challenge.expires < Date.now() || challenge.attempts >= 5) throw new Error('验证码已失效，请重新获取')
  challenge.attempts++
  if (code !== '123456') throw new Error('验证码错误，请重新输入')
  if (password.length < 6 || password.length > 20) throw new Error('密码需为 6～20 位')
  const updated = await replaceRegisteredPassword(key, password, user)
  challenges.delete(key)
  return updated
 }
}
export const getPasswordRecoveryAdapter = () => adapter
export const setPasswordRecoveryAdapter = (value: PasswordRecoveryAdapter) => { adapter = value }
