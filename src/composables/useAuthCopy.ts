import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const messages: Record<string, string[]> = {
  'zh-CN': ['欢迎回来', '登录后连接设备，查看测量数据', '创建账号，连接你的设备', '手机号', '邮箱', '验证码', '密码', '确认密码', '6–20 位', '显示密码', '隐藏密码'],
  'zh-TW': ['歡迎回來', '登入後連接設備，查看測量資料', '建立帳號，連接你的設備', '手機號碼', '電子郵件', '驗證碼', '密碼', '確認密碼', '6–20 位', '顯示密碼', '隱藏密碼'],
  en: ['Welcome back', 'Connect devices and view your measurements', 'Create an account to connect your devices', 'Phone number', 'Email', 'Verification code', 'Password', 'Confirm password', '6–20 characters', 'Show password', 'Hide password'],
  fr: ['Bon retour', 'Connectez vos appareils et consultez vos mesures', 'Créez un compte pour connecter vos appareils', 'Téléphone', 'E-mail', 'Code de vérification', 'Mot de passe', 'Confirmer le mot de passe', '6–20 caractères', 'Afficher le mot de passe', 'Masquer le mot de passe'],
  es: ['Te damos la bienvenida', 'Conecta tus equipos y consulta las mediciones', 'Crea una cuenta para conectar tus equipos', 'Teléfono', 'Correo electrónico', 'Código de verificación', 'Contraseña', 'Confirmar contraseña', '6–20 caracteres', 'Mostrar contraseña', 'Ocultar contraseña'],
  pt: ['Bem-vindo de volta', 'Conecte seus dispositivos e consulte as medições', 'Crie uma conta para conectar seus dispositivos', 'Telefone', 'E-mail', 'Código de verificação', 'Senha', 'Confirmar senha', '6–20 caracteres', 'Mostrar senha', 'Ocultar senha'],
  ru: ['С возвращением', 'Подключайте устройства и просматривайте измерения', 'Создайте аккаунт для подключения устройств', 'Телефон', 'Электронная почта', 'Код подтверждения', 'Пароль', 'Подтвердите пароль', '6–20 символов', 'Показать пароль', 'Скрыть пароль'],
  pl: ['Witaj ponownie', 'Łącz urządzenia i przeglądaj pomiary', 'Utwórz konto, aby połączyć urządzenia', 'Telefon', 'E-mail', 'Kod weryfikacyjny', 'Hasło', 'Potwierdź hasło', '6–20 znaków', 'Pokaż hasło', 'Ukryj hasło'],
  ko: ['다시 오신 것을 환영합니다', '기기를 연결하고 측정 데이터를 확인하세요', '기기를 연결할 계정을 만드세요', '전화번호', '이메일', '인증 코드', '비밀번호', '비밀번호 확인', '6–20자', '비밀번호 표시', '비밀번호 숨기기'],
  th: ['ยินดีต้อนรับกลับ', 'เชื่อมต่ออุปกรณ์และดูผลการวัด', 'สร้างบัญชีเพื่อเชื่อมต่ออุปกรณ์', 'หมายเลขโทรศัพท์', 'อีเมล', 'รหัสยืนยัน', 'รหัสผ่าน', 'ยืนยันรหัสผ่าน', '6–20 ตัวอักษร', 'แสดงรหัสผ่าน', 'ซ่อนรหัสผ่าน'],
}

export function useAuthCopy() {
  const { locale } = useI18n()
  return computed(() => {
    const [welcome, welcomeHint, registerHint, phone, email, code, password, confirmPassword, passwordHint, showPassword, hidePassword] = messages[locale.value] || messages.en
    return { welcome, welcomeHint, registerHint, phone, email, code, password, confirmPassword, passwordHint, showPassword, hidePassword }
  })
}
