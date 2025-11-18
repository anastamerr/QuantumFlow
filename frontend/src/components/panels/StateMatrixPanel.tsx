import React from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  Card,
  CardHeader,
  CardBody,
  Text,
  Code,
} from '@chakra-ui/react';
import { StateItem } from '../../utils/localMeasurement';

interface StateMatrixPanelProps {
  data: StateItem[] | null | undefined;
}

const StateMatrixPanel: React.FC<StateMatrixPanelProps> = ({ data }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');

  if (!data || data.length === 0) {
    return (
      <Card bg={cardBg} borderRadius="lg" boxShadow="sm">
        <CardBody>
          <Text color={secondaryTextColor} textAlign="center" py={4}>
            No state matrix available. Run a simulation to see the quantum state matrix.
          </Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card bg={cardBg} borderRadius="lg" boxShadow="sm">
      <CardHeader>
        <Heading size="md">State Matrix</Heading>
        <Text fontSize="sm" color={secondaryTextColor} mt={1}>
          Basis states, amplitudes, and probabilities of the quantum state
        </Text>
      </CardHeader>
      <CardBody>
        <Box overflowX="auto" maxH="calc(100vh - 300px)">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr bg={headerBg}>
                <Th borderColor={borderColor} color={textColor} fontWeight="bold">
                  State
                </Th>
                <Th borderColor={borderColor} color={textColor} fontWeight="bold">
                  Amplitude
                </Th>
                <Th borderColor={borderColor} color={textColor} fontWeight="bold" isNumeric>
                  Probability
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.map((row, idx) => (
                <Tr key={idx} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                  <Td borderColor={borderColor}>
                    <Code fontSize="sm" bg={useColorModeValue('blue.50', 'blue.900')} px={2} py={1} borderRadius="md">
                      {row.state}
                    </Code>
                  </Td>
                  <Td borderColor={borderColor}>
                    <Code fontSize="sm" bg={useColorModeValue('purple.50', 'purple.900')} px={2} py={1} borderRadius="md">
                      {typeof row.amplitude === 'number' 
                        ? row.amplitude.toFixed(6) 
                        : row.amplitude}
                    </Code>
                  </Td>
                  <Td borderColor={borderColor} isNumeric>
                    <Text fontWeight="medium" color={useColorModeValue('green.600', 'green.400')}>
                      {(row.probability * 100).toFixed(4)}%
                    </Text>
                    <Text fontSize="xs" color={secondaryTextColor}>
                      {row.probability.toFixed(6)}
                    </Text>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </CardBody>
    </Card>
  );
};

export default StateMatrixPanel;

