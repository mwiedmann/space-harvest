import React from 'react'
import { startGame } from './game/game-init'

const App: React.FC = () => {
  React.useEffect(() => startGame(), [])
  return (
    <>
      <div className='grid-item'></div>
      <div
        className='grid-item'
        style={{ borderBottomStyle: 'solid', borderBottomWidth: 5, borderBottomColor: 'blue' }}
      >
        <h1>Space Harvest</h1>
      </div>
      <div className='grid-item'></div>
      <div
        className='grid-item'
        style={{ borderRightStyle: 'solid', borderRightWidth: 5, borderRightColor: 'blue' }}
      ></div>
      <div className='grid-item' id='game'></div>
      <div
        className='grid-item'
        style={{ borderLeftStyle: 'solid', borderLeftWidth: 5, borderLeftColor: 'blue' }}
      ></div>
      <div className='grid-item'></div>
      <div className='grid-item' style={{ borderTopStyle: 'solid', borderTopWidth: 5, borderTopColor: 'blue' }} />
      <div className='grid-item'></div>
    </>
  )
}

export default App
