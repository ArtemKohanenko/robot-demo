import { useState, useRef, useCallback } from 'react'
import { canEnterLogical, isAdjacentToPickup, isAdjacentToDropoff } from './Map'

const DIRECTIONS = [
    { dx: 0, dy: 1 },   // 0 - вверх
    { dx: 1, dy: 0 },   // 1 - вправо
    { dx: 0, dy: -1 },  // 2 - вниз
    { dx: -1, dy: 0 },  // 3 - влево
]

const DIRECTION_COUNT = DIRECTIONS.length

export function useAgent({
    mapWidth,
    mapHeight,
    agentRadius = 0.5,
    steps = 20,
    duration = 300
} = {}) {
    const [agentState, setAgentState] = useState(() => ({
        // Логические координаты: целочисленные индексы клеток сетки (i, j)
        // По умолчанию стартуем в левом нижнем углу карты
        x: 0,
        y: mapHeight - 1,
        direction: 1,
        scaleY: 1
    }))
    const [hasCargo, setHasCargo] = useState(false)
    const agentStateRef = useRef(agentState)
    agentStateRef.current = agentState

    const animateMove = useCallback(async (to) => {
        const from = { ...agentStateRef.current }
        let dDir = ((to.direction - from.direction + DIRECTION_COUNT) % DIRECTION_COUNT)
        if (dDir > 2) dDir -= DIRECTION_COUNT
        const dx = to.x - from.x
        const dy = to.y - from.y
        for (let step = 1; step <= steps; ++step) {
            await new Promise(res => setTimeout(res, duration / steps))
            const t = step / steps
            const x = from.x + dx * t
            const y = from.y + dy * t
            let newDir = (from.direction + dDir * t + DIRECTION_COUNT) % DIRECTION_COUNT
            setAgentState({ x, y, direction: t < 1 ? newDir : to.direction, scaleY: 1 })
        }
        setAgentState({ ...to, scaleY: to.scaleY ?? 1 })
    }, [steps, duration])

    const animateSquash = useCallback(async ({ minScaleY = 0.6 } = {}) => {
        const from = { ...agentStateRef.current }
        const frames = Math.max(4, Math.floor(steps / 2))
        const half = Math.floor(frames / 2)
        // Сжать
        for (let i = 1; i <= half; i++) {
            await new Promise(res => setTimeout(res, (duration) / frames))
            const t = i / half
            const scaleY = 1 - (1 - minScaleY) * t
            setAgentState({ ...from, scaleY })
        }
        // Вернуть
        for (let i = 1; i <= frames - half; i++) {
            await new Promise(res => setTimeout(res, (duration) / frames))
            const t = i / (frames - half)
            const scaleY = minScaleY + (1 - minScaleY) * t
            setAgentState({ ...from, scaleY })
        }
        setAgentState({ ...from, scaleY: 1 })
    }, [steps, duration])

    const moveForward = useCallback(async () => {
        const { x, y, direction } = agentStateRef.current
        const { dx, dy } = DIRECTIONS[direction]
        const newX = x + dx
        const newY = y + dy
        if (canEnterLogical(newX, newY, mapWidth, mapHeight)) {
            await animateMove({ x: newX, y: newY, direction })
        }
    }, [animateMove, mapWidth, mapHeight])

    const pickUp = useCallback(async () => {
        // Если груз уже загружен — ничего не делаем
        if (hasCargo) return;
        const { x, y } = agentStateRef.current
        // Агент может анимироваться и иметь нецелые координаты — округлим до ближайшей клетки
        const i = Math.round(x)
        const j = Math.round(y)
        const nearPickup = isAdjacentToPickup(i, j, mapWidth, mapHeight)
        if (nearPickup) {
            await animateSquash({ minScaleY: 0.55 })
            setHasCargo(true)
        }
    }, [hasCargo, animateSquash, mapWidth, mapHeight])

    const dropOff = useCallback(async () => {
        // Сбрасываем груз только если он есть
        if (!hasCargo) return;
        const { x, y } = agentStateRef.current
        const i = Math.round(x)
        const j = Math.round(y)
        const nearDrop = isAdjacentToDropoff(i, j, mapWidth, mapHeight)
        if (nearDrop) {
            await animateSquash({ minScaleY: 0.55 })
            setHasCargo(false)
        }
    }, [hasCargo, animateSquash, mapWidth, mapHeight])

    const moveBackward = useCallback(async () => {
        const { x, y, direction } = agentStateRef.current
        const { dx, dy } = DIRECTIONS[direction]
        const newX = x - dx
        const newY = y - dy
        if (canEnterLogical(newX, newY, mapWidth, mapHeight)) {
            await animateMove({ x: newX, y: newY, direction })
        }
    }, [animateMove, mapWidth, mapHeight])

    const turnLeft = useCallback(async () => {
        const { x, y, direction } = agentStateRef.current
        const newDir = (direction + DIRECTION_COUNT - 1) % DIRECTION_COUNT
        await animateMove({ x, y, direction: newDir })
    }, [animateMove])

    const turnRight = useCallback(async () => {
        const { x, y, direction } = agentStateRef.current
        const newDir = (direction + 1) % DIRECTION_COUNT
        await animateMove({ x, y, direction: newDir })
    }, [animateMove])

    const getPos = useCallback(() => agentStateRef.current, [])

    return {
        agentState,
        agentControls: {
            moveForward,
            moveBackward,
            turnLeft,
            turnRight,
            pickUp,
            dropOff,
            getPos,
        }
    }
}
