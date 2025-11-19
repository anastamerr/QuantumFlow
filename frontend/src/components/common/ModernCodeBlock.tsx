import {
  Box,
  HStack,
  VStack,
  Button,
  IconButton,
  Text,
  useColorModeValue,
  Tooltip,
  Badge,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Flex,
  Divider
} from '@chakra-ui/react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { CopyIcon, DownloadIcon, CheckIcon, ChevronDownIcon } from '@chakra-ui/icons'
import { useState, useMemo } from 'react'

interface ModernCodeBlockProps {
  code: string
  language: 'python' | 'json'
  filename?: string
  showLineNumbers?: boolean
  maxHeight?: string
}

const ModernCodeBlock = ({
  code,
  language,
  filename = 'circuit',
  showLineNumbers = true,
  maxHeight = '600px'
}: ModernCodeBlockProps) => {
  const [copied, setCopied] = useState(false)
  const toast = useToast()

  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const headerBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const textColor = useColorModeValue('gray.700', 'gray.300')
  const badgeBg = useColorModeValue('blue.100', 'blue.900')
  const badgeColor = useColorModeValue('blue.800', 'blue.200')
  const isDark = useColorModeValue(false, true)

  // Code statistics
  const stats = useMemo(() => {
    const lines = code.split('\n').length
    const chars = code.length
    const bytes = new Blob([code]).size
    return { lines, chars, bytes }
  }, [code])

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast({
        title: 'Copied to clipboard',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top'
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top'
      })
    }
  }

  // Download file
  const handleDownload = (format: 'py' | 'json' | 'txt') => {
    const extension = format === 'py' ? '.py' : format === 'json' ? '.json' : '.txt'
    const mimeType = format === 'json' ? 'application/json' : 'text/plain'

    const blob = new Blob([code], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: `Downloaded as ${filename}${extension}`,
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top'
    })
  }

  // Language display name
  const languageDisplay = language === 'python' ? 'Python' : 'JSON'

  return (
    <VStack
      spacing={0}
      align="stretch"
      borderRadius="lg"
      overflow="hidden"
      borderWidth={1}
      borderColor={borderColor}
      bg={bgColor}
      boxShadow="sm"
      transition="all 0.2s"
      _hover={{
        boxShadow: 'md'
      }}
    >
      {/* Header */}
      <Flex
        bg={headerBg}
        px={4}
        py={3}
        borderBottomWidth={1}
        borderColor={borderColor}
        justify="space-between"
        align="center"
      >
        <HStack spacing={3}>
          <Badge
            colorScheme="blue"
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="md"
            bg={badgeBg}
            color={badgeColor}
            fontWeight="semibold"
          >
            {languageDisplay}
          </Badge>
          <Text fontSize="sm" color={textColor} fontWeight="medium">
            {stats.lines} lines
          </Text>
          <Divider orientation="vertical" h="16px" />
          <Text fontSize="sm" color={textColor}>
            {formatBytes(stats.bytes)}
          </Text>
        </HStack>

        <HStack spacing={2}>
          <Tooltip label={copied ? 'Copied!' : 'Copy code'} placement="top">
            <IconButton
              aria-label="Copy code"
              icon={copied ? <CheckIcon /> : <CopyIcon />}
              size="sm"
              variant="ghost"
              colorScheme={copied ? 'green' : 'blue'}
              onClick={handleCopy}
              transition="all 0.2s"
            />
          </Tooltip>

          <Menu>
            <Tooltip label="Download code" placement="top">
              <MenuButton
                as={IconButton}
                aria-label="Download options"
                icon={<DownloadIcon />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
              />
            </Tooltip>
            <MenuList>
              {language === 'python' && (
                <MenuItem onClick={() => handleDownload('py')}>
                  Download as .py
                </MenuItem>
              )}
              {language === 'json' && (
                <MenuItem onClick={() => handleDownload('json')}>
                  Download as .json
                </MenuItem>
              )}
              <MenuItem onClick={() => handleDownload('txt')}>
                Download as .txt
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      {/* Code Content */}
      <Box
        maxH={maxHeight}
        overflowY="auto"
        overflowX="auto"
        sx={{
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px'
          },
          '&::-webkit-scrollbar-track': {
            bg: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            bg: isDark ? 'gray.700' : 'gray.300',
            borderRadius: '4px',
            '&:hover': {
              bg: isDark ? 'gray.600' : 'gray.400'
            }
          }
        }}
      >
        <SyntaxHighlighter
          language={language}
          style={isDark ? vscDarkPlus : vs}
          showLineNumbers={showLineNumbers}
          wrapLines
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.875rem',
            lineHeight: '1.5'
          }}
          lineNumberStyle={{
            minWidth: '3em',
            paddingRight: '1em',
            textAlign: 'right',
            userSelect: 'none',
            opacity: 0.5
          }}
        >
          {code}
        </SyntaxHighlighter>
      </Box>
    </VStack>
  )
}

export default ModernCodeBlock