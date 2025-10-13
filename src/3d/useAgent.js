import { useState, useRef, useCallback } from 'react'

// Перечисление и таблица направлений
const DIRECTIONS = [
    { dx: 0, dy: 1 },   // 0 - вверх
    { dx: 1, dy: 0 },   // 1 - вправо
    { dx: 0, dy: -1 },  // 2 - вниз
    { dx: -1, dy: 0 },  // 3 - влево
]

const DIRECTION_COUNT = DIRECTIONS.length

// Очередь асинхронных команд
function useCommandQueue() {
    const queue = useRef(Promise.resolve())
    function enqueue(fn) {
        queue.current = queue.current.then(() => fn())
        return queue.current
    }
    return enqueue
}

export function useAgent({
    mapWidth = 10,
    mapHeight = 6,
    agentRadius = 0.5,
    steps = 20,
    duration = 300
} = {}) {
    // Позиция в центре, направление вправо
    const [agentState, setAgentState] = useState({ x: 1, y: 1, direction: 1 })
    const agentStateRef = useRef(agentState)
    agentStateRef.current = agentState

    const enqueue = useCommandQueue()

    // Анимированное перемещение
    const animateMove = useCallback(async (to) => {
        const from = { ...agentStateRef.current }
        let dDir = ((to.direction - from.direction + DIRECTION_COUNT) % DIRECTION_COUNT)
        if (dDir > 2) dDir -= DIRECTION_COUNT // Короткая дуга
        const dx = to.x - from.x
        const dy = to.y - from.y
        for (let step = 1; step <= steps; ++step) {
            await new Promise(res => setTimeout(res, duration / steps))
            const t = step / steps
            const x = from.x + dx * t
            const y = from.y + dy * t
            let newDir = (from.direction + dDir * t + DIRECTION_COUNT) % DIRECTION_COUNT
            setAgentState({ x, y, direction: t < 1 ? newDir : to.direction })
        }
        setAgentState(to)
    }, [steps, duration])

    // Управляющие функции
    const moveForward = useCallback(() => enqueue(async () => {
        const { x, y, direction } = agentStateRef.current
        const { dx, dy } = DIRECTIONS[direction]
        let newX = x + dx
        let newY = y + dy
        newX = Math.max(-mapWidth/2, Math.min(mapWidth/2, newX))
        newY = Math.max(-mapHeight/2, Math.min(mapHeight/2, newY))
        if (newX !== x || newY !== y)
          await animateMove({ x: newX, y: newY, direction })
    }), [animateMove, mapWidth, mapHeight, enqueue])

    const moveBackward = useCallback(() => enqueue(async () => {
        const { x, y, direction } = agentStateRef.current
        const { dx, dy } = DIRECTIONS[direction]
        let newX = x - dx
        let newY = y - dy
        newX = Math.max(-mapWidth/2, Math.min(mapWidth/2, newX))
        newY = Math.max(-mapHeight/2, Math.min(mapHeight/2, newY))
        if (newX !== x || newY !== y)
          await animateMove({ x: newX, y: newY, direction })
    }), [animateMove, mapWidth, mapHeight, enqueue])

    const turnLeft = useCallback(() => enqueue(async () => {
        const { x, y, direction } = agentStateRef.current
        const newDir = (direction + DIRECTION_COUNT - 1) % DIRECTION_COUNT
        await animateMove({ x, y, direction: newDir })
    }), [animateMove, enqueue])

    const turnRight = useCallback(() => enqueue(async () => {
        const { x, y, direction } = agentStateRef.current
        const newDir = (direction + 1) % DIRECTION_COUNT
        await animateMove({ x, y, direction: newDir })
    }), [animateMove, enqueue])

    const getPos = useCallback(() => agentStateRef.current, [])

    return {
        agentState,
        agentControls: {
            moveForward,
            moveBackward,
            turnLeft,
            turnRight,
            getPos,
        }
    }
}
