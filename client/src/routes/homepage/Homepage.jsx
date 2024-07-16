import { Link } from 'react-router-dom'
import './homepage.css'
import { TypeAnimation } from 'react-type-animation'
import { useState } from 'react'

const Homepage = () => {
  const [typingStatus, setTypingStatus] = useState('human1')

  return (
    <div className='homepage'>
      <img src='/orbital.png' alt='' className='orbital' />
      <div className="left">
        <h1>Gen AI Chatbot</h1>
        <h2>Supercharge your creativity and productivity</h2>
        <h3>
          Leverage customizable Gen AI backends, incorporating advanced 
          technologies like Retrieval-Augmented Generation (RAG), DSPy, 
          and finetuning, to gain deeper insights and effectively address 
          your business challenges.
        </h3>
        <Link to='/dashboard'>Get Started</Link>
      </div>
      <div className="right">
        <div className="imgContainer">
          <div className="bgContainer">
            <div className="bg"></div>
          </div>
          <img src='/bot.png' alt='' className='bot' />
          <div className="chat">
            <img
              src={
                typingStatus === 'human1'
                  ? '/human1.jpeg'
                  : typingStatus === 'human2'
                    ? '/human2.jpeg'
                    : 'bot.png'
              }
              alt=''
            />
            <TypeAnimation
              sequence={[
                // Same substring at the start will only be typed out once, initially
                'Alice: Write a SQL query to give me the average number of sales for the past quarter.',
                2000,
                () => {
                  setTypingStatus('bot')
                },
                'Bot: SELECT * FROM ...',
                2000,
                () => {
                  setTypingStatus('human2')
                },
                'Bob: What is the best way to deploy our application to the cloud?',
                2000,
                () => {
                  setTypingStatus('bot')
                },
                'Bot: Begin by wrapping your code into a container using...',
                2000,
                () => {
                  setTypingStatus('human1')
                },
              ]}
              wrapper="span"
              repeat={Infinity}
              cursor={true}
              omitDeletionAnimation={true}
            />
          </div>
        </div>
      </div>
      <div className="terms">
        <img src='/bot.png' alt='' className='logo' />
        <div className="links">
          <Link to='/'>Terms of Service</Link>
          <span>|</span>
          <Link to='/'>Privacy Policy</Link>
        </div>
      </div>
    </div>
  )
}

export default Homepage