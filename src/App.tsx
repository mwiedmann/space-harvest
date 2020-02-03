import React from 'react'
import { startGame } from './game/game-init'

const App: React.FC = () => {
  React.useEffect(() => startGame(), [])
  return (
    <>
      <div className='grid-item'></div>
      <div className='grid-item'>
        <h1>Space Harvest</h1>
      </div>
      <div className='grid-item'></div>
      <div className='grid-item'></div>
      <div className='grid-item' id='game'></div>
      <div className='grid-item'></div>
    </>
  )
}

export default App
