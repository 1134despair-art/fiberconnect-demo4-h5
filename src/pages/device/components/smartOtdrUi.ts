export const SMART_OTDR_SHELL_MAX_WIDTH = 375
export const SMART_OTDR_SHELL_RADIUS = 22
export const SMART_OTDR_CARD_RADIUS = 18
export const SMART_OTDR_DIALOG_MAX_HEIGHT = 'calc(100vh - 96px)'

export const createPixelValue = (value: number | string) =>
  typeof value === 'number' ? `${value}px` : value
