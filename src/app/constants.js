// 앱 전역 공유 상수
export const KIN_API =
  process.env.NEXT_PUBLIC_KIN_API_URL || 'https://kin-agent-production.up.railway.app'

export const FONT = "'DM Mono', monospace"
export const YELLOW = '#FFE500'
export const BG = '#080806'
export const BORDER = '#1c1c1a'

export const MOOD_IMAGE = {
  default: '/kin_default.webp',
  happy: '/kin_happy.webp',
  excited: '/kin_excited.webp',
  thinking: '/kin_thinking1.webp',
  serious: '/kin_serious.webp',
  sad: '/kin_sad.webp',
  laughing: '/kin_laughing2.webp',
  shocked: '/kin_shocked1.webp',
  energetic: '/kin_energetic1.webp',
  interested: '/kin_interested1.webp',
  calm: '/kin_calm.webp',
}

export const MOOD_KO = {
  default: '대기 중',
  happy: '기분 좋음',
  excited: '흥미로움',
  thinking: '생각 중',
  serious: '진지함',
  sad: '슬픔',
  laughing: '웃음',
  shocked: '놀람',
  energetic: '에너지',
  interested: '관심 있음',
  calm: '차분함',
}

// 이미지 업로드 제한
export const IMAGE_MAX_SIZE_MB = 5
export const IMAGE_MAX_PX = 1200
export const IMAGE_QUALITY = 0.82
