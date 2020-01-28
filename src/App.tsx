import React from 'react'
import { startGame } from './game/game-init'

const App: React.FC = () => {
  React.useEffect(() => startGame(), [])
  return null
}

export default App
