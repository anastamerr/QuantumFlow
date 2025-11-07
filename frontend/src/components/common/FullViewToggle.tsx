import { IconButton, Tooltip } from '@chakra-ui/react'
import { useSelector, useDispatch } from 'react-redux'
import { selectIsFullView, toggleFullView } from '../../store/slices/uiSlice'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'

const FullViewToggle = () => {
  const dispatch = useDispatch()
  const isFullView = useSelector(selectIsFullView)

  const handleToggle = () => {
    dispatch(toggleFullView())
  }

  return (
    <Tooltip 
      label={isFullView ? 'Exit Full View' : 'Enter Full View'} 
      placement="top"
    >
      <IconButton
        icon={isFullView ? <ViewOffIcon /> : <ViewIcon />}
        onClick={handleToggle}
        size="sm"
        variant="ghost"
        colorScheme={isFullView ? 'blue' : 'gray'}
        aria-label={isFullView ? 'Exit Full View' : 'Enter Full View'}
      />
    </Tooltip>
  )
}

export default FullViewToggle