<template>
  <section class="curve-card">
    <div class="card-head">
      <div>
        <div class="card-title">{{ t('deviceDetail.smartOtdrChartTitle') }}</div>
        <div class="card-subtitle">{{ summaryText }}</div>
      </div>
    </div>

    <div class="curve-stage" :class="measureStatus">
      <div class="curve-toolbar">
        <span>WL: {{ parameterForm.wavelength }}</span>
        <span>Range: {{ visibleDistanceMax }}km</span>
        <span>PW: {{ parameterForm.pulseWidth }}</span>
        <span>Time: {{ measureTimeLabel }}</span>
      </div>

      <div v-if="abSummary" class="ab-pill">
        <span>A-B {{ abSummary.distance }}</span>
        <strong>{{ abSummary.loss }}</strong>
      </div>

      <div
        v-if="displayTooltipNode"
        class="event-tooltip"
        :style="{ left: `${displayTooltipNode.x}px`, top: `${Math.max(displayTooltipNode.y - 18, 28)}px` }"
      >
        <span>{{ displayTooltipNode.distance }}</span>
        <strong>{{ displayTooltipNode.value }}</strong>
      </div>

      <svg class="curve-svg" viewBox="0 0 360 240" preserveAspectRatio="none">
        <g class="axis-layer">
          <text v-for="tick in xAxisTicks" :key="tick.label" :x="tick.x" y="232" class="axis-label">
            {{ tick.label }}
          </text>
          <text v-for="level in yAxisTicks" :key="level.label" x="8" :y="level.y" class="axis-label left">
            {{ level.label }}
          </text>
        </g>
        <g class="grid-layer">
          <line v-for="x in gridX" :key="`x-${x}`" :x1="x" :x2="x" y1="12" y2="210" />
          <line v-for="y in gridY" :key="`y-${y}`" x1="0" x2="360" :y1="y" :y2="y" />
        </g>

        <rect
          v-if="abWindow"
          class="ab-band"
          :x="abWindow.x"
          y="20"
          :width="abWindow.width"
          height="190"
        />

        <polyline :points="fillPoints" class="curve-fill" />
        <polyline :points="polylinePoints" class="curve-line" />

        <g
          v-for="point in hoverNodes"
          :key="point.key"
          :class="['curve-point-group', { highlighted: point.highlight }]"
          :transform="`translate(${point.x}, ${point.y})`"
          @mouseenter="hoverPointKey = point.key"
          @mouseleave="hoverPointKey = null"
          @click="emit('point-select', point.index)"
        >
          <circle class="curve-point-hit" r="10" />
          <circle class="curve-point-ring" r="5.4" />
          <circle class="curve-point-dot" r="2.4" />
        </g>

        <g v-if="abMarkers.length" class="ab-marker-layer">
          <g v-for="marker in abMarkers" :key="marker.label" :transform="`translate(${marker.x}, ${marker.y})`">
            <circle class="ab-marker-dot" r="6.2" />
            <text class="ab-marker-label" x="0" y="-10">{{ marker.label }}</text>
          </g>
        </g>

        <g
          v-for="node in eventNodes"
          :key="node.id"
          :transform="`translate(${node.x}, ${node.y})`"
          :class="['event-marker', { active: node.id === selectedEventId }]"
          @click="emit('event-select', node.id)"
        >
          <line class="event-stem" x1="0" y1="0" x2="0" y2="72" />
          <circle class="event-ring" r="7" />
          <circle class="event-node" r="3.2" />
        </g>
      </svg>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
  MeasureStatus,
  OtdrAbSelection,
  OtdrReadMode,
  OtdrZoomLevel,
  ParameterForm,
  TracePoint
} from './smartOtdrTypes'

type RenderedPoint = TracePoint & {
  index: number
  key: string
  rawX: number
  rawY: number
}

interface Props {
  measureStatus: MeasureStatus
  parameterForm: ParameterForm
  progressPercent: number
  remainingSeconds: number
  traceData: TracePoint[]
  eventCount?: number
  selectedEventId: number | null
  zoomLevel?: OtdrZoomLevel
  readMode?: OtdrReadMode
  abSelection?: OtdrAbSelection
}

const props = withDefaults(defineProps<Props>(), {
  eventCount: 4,
  zoomLevel: 1,
  readMode: 'none',
  abSelection: () => ({ startIndex: 2, endIndex: 8 })
})
const emit = defineEmits<{
  (e: 'event-select', eventId: number | null): void
  (e: 'point-select', pointIndex: number): void
}>()

const { t } = useI18n()
const hoverPointKey = ref<string | null>(null)

const idleTrace: TracePoint[] = [
  { x: 8, y: 58 },
  { x: 18, y: 62 },
  { x: 34, y: 74 },
  { x: 56, y: 92 },
  { x: 78, y: 108 },
  { x: 110, y: 118 },
  { x: 148, y: 126 },
  { x: 182, y: 132 },
  { x: 220, y: 138 },
  { x: 258, y: 144 },
  { x: 298, y: 149 },
  { x: 338, y: 154 }
]

const runningBaseTrace: TracePoint[] = [
  { x: 6, y: 42 },
  { x: 12, y: 30 },
  { x: 18, y: 44 },
  { x: 28, y: 80 },
  { x: 40, y: 114 },
  { x: 88, y: 122 },
  { x: 136, y: 128 },
  { x: 184, y: 134 },
  { x: 208, y: 136 },
  { x: 216, y: 84 },
  { x: 228, y: 128 },
  { x: 252, y: 134 },
  { x: 276, y: 140 },
  { x: 300, y: 146 },
  { x: 322, y: 136 },
  { x: 336, y: 148 },
  { x: 348, y: 154 }
]

const gridX = [0, 40, 80, 120, 160, 200, 240, 280, 320, 360]
const gridY = [20, 52, 84, 116, 148, 180, 212]
const yAxisTicks = [
  { y: 32, label: '24' },
  { y: 70, label: '18' },
  { y: 108, label: '12' },
  { y: 146, label: '6' },
  { y: 184, label: '0' }
]

const renderTrace = computed(() => {
  if (props.measureStatus === 'running') {
    const total = runningBaseTrace.length
    const count = Math.max(4, Math.round((props.progressPercent / 100) * total))
    return runningBaseTrace.slice(0, count)
  }

  if (props.measureStatus === 'done' && props.traceData.length) {
    return props.traceData
  }

  return idleTrace
})

const zoomedTrace = computed(() => {
  const source = renderTrace.value
  if (props.zoomLevel === 1) return source
  if (props.zoomLevel === 2) return source.slice(0, Math.max(8, Math.ceil(source.length * 0.7)))
  return source.slice(0, Math.max(6, Math.ceil(source.length * 0.45)))
})

const normalizedTrace = computed<RenderedPoint[]>(() => {
  const points = zoomedTrace.value
  if (!points.length) return []

  const minX = points[0].x
  const maxX = points[points.length - 1].x
  const xRange = Math.max(maxX - minX, 1)
  const rawYValues = points.map(point => point.y)
  const rawYMin = Math.min(...rawYValues)
  const rawYMax = Math.max(...rawYValues)
  const rawYCenter = (rawYMin + rawYMax) / 2
  const rawYSpan = Math.max((rawYMax - rawYMin) * 1.16, 8)
  const rawYTop = rawYCenter - rawYSpan / 2
  const plotTop = 50
  const plotHeight = 152

  return points.map((point, index) => ({
    ...point,
    index,
    key: `${point.x}-${point.y}-${index}`,
    rawX: point.x,
    rawY: point.y,
    x: Number((10 + ((point.x - minX) / xRange) * 338).toFixed(2)),
    y: Number((plotTop + ((point.y - rawYTop) / rawYSpan) * plotHeight).toFixed(2))
  }))
})

const visibleDistanceMax = computed(() => {
  const lastPoint = zoomedTrace.value[zoomedTrace.value.length - 1]
  return lastPoint ? (lastPoint.x / 36).toFixed(1) : '10.0'
})

const xAxisTicks = computed(() => {
  const max = Number(visibleDistanceMax.value)
  return [0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, index) => ({
    x: 24 + index * 62,
    label: index === 0 ? '0' : `${(max * ratio).toFixed(max > 4 ? 0 : 1)}km`
  }))
})

const polylinePoints = computed(() => normalizedTrace.value.map(point => `${point.x},${point.y}`).join(' '))

const fillPoints = computed(() => {
  const points = normalizedTrace.value
  if (!points.length) return ''

  const first = points[0]
  const last = points[points.length - 1]
  const linePoints = points.map(point => `${point.x},${point.y}`).join(' ')
  return `${first.x},210 ${linePoints} ${last.x},210`
})

const eventNodes = computed(() => {
  if (props.measureStatus !== 'done') return []

  const points = normalizedTrace.value
  const eventCount = Math.min(props.eventCount, points.length > 2 ? points.length - 1 : 0)
  if (!eventCount) return []

  const highlightedIndexes = points
    .filter((point, index) => point.highlight && index > 0)
    .map(point => point.index)
  const scoredIndexes = points
    .slice(1, -1)
    .map(point => {
      const previous = points[point.index - 1]
      const next = points[point.index + 1]
      const localBaseline = (previous.rawY + next.rawY) / 2
      const directionChanged = Math.sign(point.rawY - previous.rawY) !== Math.sign(next.rawY - point.rawY)
      const prominence = Math.abs(point.rawY - localBaseline)
        + Math.abs(point.rawY - previous.rawY) * 0.28
        + Math.abs(next.rawY - point.rawY) * 0.28
        + (directionChanged ? 8 : 0)
      return { index: point.index, prominence }
    })
    .sort((left, right) => right.prominence - left.prominence)
    .map(item => item.index)

  const candidateIndexes = [...highlightedIndexes, ...scoredIndexes, points.length - 1]
  const selectedIndexes: number[] = []
  for (const pointIndex of candidateIndexes) {
    if (selectedIndexes.some(index => Math.abs(index - pointIndex) < 2)) continue
    selectedIndexes.push(pointIndex)
    if (selectedIndexes.length >= eventCount) break
  }

  return selectedIndexes
    .sort((left, right) => left - right)
    .map((pointIndex, index) => {
    const point = points[pointIndex]
    return {
      id: index + 1,
      x: point.x,
      y: point.y,
      rawX: point.rawX,
      rawY: point.rawY
    }
  })
})

const activeEventNode = computed(() => {
  if (!props.selectedEventId) return null
  return eventNodes.value.find(node => node.id === props.selectedEventId) || null
})

const hoverNodes = computed(() => {
  return normalizedTrace.value.map(point => ({
    key: point.key,
    index: point.index,
    x: point.x,
    y: point.y,
    highlight: Boolean(point.highlight),
    distance: `${(point.rawX / 36).toFixed(1)}km`,
    value: `${Math.max(0, ((210 - point.rawY) / 7.5)).toFixed(1)}dB`
  }))
})

const hoverPoint = computed(() => {
  if (!hoverPointKey.value) return null
  return hoverNodes.value.find(point => point.key === hoverPointKey.value) || null
})

const displayTooltipNode = computed(() => {
  if (hoverPoint.value) return hoverPoint.value
  if (props.readMode === 'point-a' && pointAMarker.value) return pointAMarker.value
  if (props.readMode === 'point-b' && pointBMarker.value) return pointBMarker.value
  if (!activeEventNode.value) return null
  return {
    key: `event-${activeEventNode.value.id}`,
    x: activeEventNode.value.x,
    y: activeEventNode.value.y,
    distance: `${(activeEventNode.value.rawX / 36).toFixed(1)}km`,
    value: `${Math.max(0, ((210 - activeEventNode.value.rawY) / 7.5)).toFixed(1)}dB`
  }
})

const abPoints = computed(() => {
  if (props.readMode === 'none' || props.measureStatus !== 'done') return null
  const points = normalizedTrace.value
  if (points.length < 2) return null

  const startIndex = Math.min(props.abSelection.startIndex, Math.max(0, points.length - 2))
  const endIndex = Math.max(startIndex + 1, Math.min(props.abSelection.endIndex, points.length - 1))
  return {
    start: points[startIndex],
    end: points[endIndex]
  }
})

const abSummary = computed(() => {
  if (props.readMode !== 'ab' || !abPoints.value) return null
  const distance = Math.abs(abPoints.value.end.rawX - abPoints.value.start.rawX) / 36
  const loss = Math.abs(abPoints.value.end.rawY - abPoints.value.start.rawY) / 7.5

  return {
    distance: `${distance.toFixed(2)}km`,
    loss: `${loss.toFixed(2)}dB`
  }
})

const abWindow = computed(() => {
  if (props.readMode !== 'ab' || !abPoints.value) return null
  const startX = Math.min(abPoints.value.start.x, abPoints.value.end.x)
  const endX = Math.max(abPoints.value.start.x, abPoints.value.end.x)
  return {
    x: startX,
    width: Math.max(endX - startX, 14)
  }
})

const pointAMarker = computed(() => {
  if (!abPoints.value) return null
  return {
    key: 'point-a',
    label: 'A',
    index: props.abSelection.startIndex,
    x: abPoints.value.start.x,
    y: abPoints.value.start.y,
    distance: `${(abPoints.value.start.rawX / 36).toFixed(1)}km`,
    value: `${Math.max(0, ((210 - abPoints.value.start.rawY) / 7.5)).toFixed(1)}dB`
  }
})

const pointBMarker = computed(() => {
  if (!abPoints.value) return null
  return {
    key: 'point-b',
    label: 'B',
    index: props.abSelection.endIndex,
    x: abPoints.value.end.x,
    y: abPoints.value.end.y,
    distance: `${(abPoints.value.end.rawX / 36).toFixed(1)}km`,
    value: `${Math.max(0, ((210 - abPoints.value.end.rawY) / 7.5)).toFixed(1)}dB`
  }
})

const abMarkers = computed(() => {
  if (!abPoints.value) return []
  if (props.readMode === 'point-a' && pointAMarker.value) return [pointAMarker.value]
  if (props.readMode === 'point-b' && pointBMarker.value) return [pointBMarker.value]
  if (props.readMode === 'ab' && pointAMarker.value && pointBMarker.value) return [pointAMarker.value, pointBMarker.value]
  return []
})

const measureTimeLabel = computed(() => {
  if (props.parameterForm.measurementMode === 'real-time') {
    return t('deviceDetail.smartOtdrMeasureRealtime')
  }

  if (props.parameterForm.measureTimeMode === 'custom') {
    return `${props.parameterForm.customMeasureSeconds || '--'}s`
  }

  return props.parameterForm.measureTimeMode
})

const summaryText = computed(() => {
  return `${props.parameterForm.wavelength} / ${props.parameterForm.range} / ${props.parameterForm.pulseWidth} / ${measureTimeLabel.value}`
})

</script>

<style scoped lang="scss">
.curve-card {
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border-radius: 22px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
  padding: 16px;
}

.card-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.card-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

.curve-stage {
  position: relative;
  min-height: 320px;
  overflow: hidden;
  border-radius: 20px;
  background: linear-gradient(180deg, #07111f 0%, #0d1a2c 100%);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.08);
}

.curve-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 14px;
  background: rgba(7, 17, 31, 0.82);
  color: rgba(255, 255, 255, 0.82);
  font-size: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.curve-toolbar span {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
  line-height: 1.2;
}

.ab-pill {
  position: absolute;
  top: 48px;
  right: 12px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.92);
  color: #fff;
  font-size: 11px;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.24);

  strong {
    font-weight: 700;
  }
}

.event-tooltip {
  position: absolute;
  z-index: 3;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18);

  strong {
    color: #2563eb;
    font-weight: 700;
  }
}

.curve-svg {
  width: 100%;
  height: 320px;
  display: block;
  background:
    radial-gradient(circle at top left, rgba(96, 165, 250, 0.08), transparent 36%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 100%);
}

.axis-label {
  fill: rgba(191, 219, 254, 0.6);
  font-size: 10px;

  &.left {
    text-anchor: start;
  }
}

.grid-layer line {
  stroke: rgba(88, 118, 171, 0.28);
  stroke-width: 1;
}

.ab-band {
  fill: rgba(96, 165, 250, 0.12);
  stroke: rgba(96, 165, 250, 0.28);
  stroke-width: 1;
}

.curve-fill {
  fill: rgba(248, 184, 78, 0.08);
  stroke: none;
}

.curve-line {
  fill: none;
  stroke: #f8b84e;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 7px rgba(248, 184, 78, 0.3));
}

.curve-point-group {
  cursor: pointer;
}

.curve-point-hit {
  fill: transparent;
}

.curve-point-ring {
  fill: #ffffff;
  stroke: #60a5fa;
  stroke-width: 2;
  opacity: 0;
  transition: opacity 120ms ease;
}

.curve-point-dot {
  fill: #2563eb;
  opacity: 0;
  transition: opacity 120ms ease;
}

.curve-point-group:hover .curve-point-ring,
.curve-point-group:hover .curve-point-dot {
  opacity: 1;
}

.ab-marker-dot {
  fill: #2563eb;
  stroke: #dbeafe;
  stroke-width: 2;
}

.ab-marker-label {
  fill: #dbeafe;
  font-size: 10px;
  font-weight: 700;
  text-anchor: middle;
}

.event-marker {
  cursor: pointer;

  .event-stem {
    stroke: rgba(96, 165, 250, 0.22);
    stroke-width: 1;
    stroke-dasharray: 3 3;
  }

  .event-ring {
    fill: rgba(103, 232, 249, 0.14);
    stroke: rgba(103, 232, 249, 0.35);
    stroke-width: 1.2;
  }

  .event-node {
    fill: #67e8f9;
    stroke: #082f49;
    stroke-width: 1.6;
  }

  &.active {
    .event-ring {
      fill: rgba(249, 115, 22, 0.2);
      stroke: rgba(249, 115, 22, 0.72);
      filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.4));
    }

    .event-node {
      fill: #f97316;
      stroke: #fff7ed;
    }

    .event-stem {
      stroke: rgba(249, 115, 22, 0.5);
    }
  }
}

@media (max-width: 768px) {
  .card-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .curve-stage {
    min-height: 300px;
  }

  .curve-svg {
    height: 300px;
  }
}
</style>
