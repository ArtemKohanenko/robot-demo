import { useState, useRef, useCallback } from 'react'

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
        x: -mapWidth / 2 + agentRadius,
        y: -mapHeight / 2 + agentRadius,
        direction: 1
    }))
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
            setAgentState({ x, y, direction: t < 1 ? newDir : to.direction })
        }
        setAgentState(to)
    }, [steps, duration])

    const moveForward = useCallback(async () => {
        const { x, y, direction } = agentStateRef.current
        const { dx, dy } = DIRECTIONS[direction]
        let newX = x + dx
        let newY = y + dy
        newX = Math.max(-mapWidth/2 + agentRadius, Math.min(mapWidth/2 - agentRadius, newX))
        newY = Math.max(-mapHeight/2 + agentRadius, Math.min(mapHeight/2 - agentRadius, newY))
        if (newX !== x || newY !== y)
            await animateMove({ x: newX, y: newY, direction })
    }, [animateMove, mapWidth, mapHeight])

    const moveBackward = useCallback(async () => {
        const { x, y, direction } = agentStateRef.current
        const { dx, dy } = DIRECTIONS[direction]
        let newX = x - dx
        let newY = y - dy
        newX = Math.max(-mapWidth/2 + agentRadius, Math.min(mapWidth/2 - agentRadius, newX))
        newY = Math.max(-mapHeight/2 + agentRadius, Math.min(mapHeight/2 - agentRadius, newY))
        if (newX !== x || newY !== y)
            await animateMove({ x: newX, y: newY, direction })
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
            getPos,
        }
    }
}
