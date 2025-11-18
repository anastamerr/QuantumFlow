import React, { useEffect, useState } from 'react'
import { Box } from '@chakra-ui/react'

interface QubitDiceProps {
  value: number | null
}

export default function QubitDice({ value }: QubitDiceProps) {
  const [display, setDisplay] = useState<number | null>(value)
  const [rolling, setRolling] = useState(false)

  useEffect(() => {
    if (value === null) return

    setRolling(true)
    let count = 0
    let delay = 60
    const maxCount = 10

    const tick = () => {
      if (count >= maxCount) {
        setDisplay(value)
        setRolling(false)
        return
      }
      setDisplay(Math.random() > 0.5 ? 1 : 0)
      count += 1
      delay = Math.floor(delay * 1.25)
      setTimeout(tick, delay)
    }

    tick()
  }, [value])

  if (value === null) return null

  return (
    <Box
      w="3rem"
      h="3rem"
      borderRadius="xl"
      borderWidth="2px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={rolling ? 'yellow.300' : 'white'}
      borderColor={rolling ? 'yellow.500' : 'gray.300'}
      boxShadow={
        rolling ? '0 0 12px rgba(250,204,21,0.6)' : '0 4px 0 #bdc3c7'
      }
      transform={rolling ? 'scale(1.1) rotate(6deg)' : 'scale(1)'}
      transition="all 0.15s ease-out"
      userSelect="none"
    >
      <Box
        as="span"
        fontWeight="black"
        fontSize="2xl"
        color={rolling ? 'yellow.900' : 'black'}
      >
        {display}
      </Box>
    </Box>
  )
}
