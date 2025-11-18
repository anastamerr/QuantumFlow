import { useRef, useState } from "react";
import {
  Box,
  Flex,
  Heading,
  IconButton,
  HStack,
  VStack,
  useBreakpointValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Tooltip,
  Badge,
  Text,
  Avatar,
  AvatarBadge,
  Button,
  Spacer,
  useColorModeValue,
  useColorMode,
} from "@chakra-ui/react";
import {
  MoonIcon,
  SunIcon,
  HamburgerIcon,
  ViewIcon,
  EditIcon,
  RepeatIcon,
  DownloadIcon,
  StarIcon,
  DeleteIcon,
  QuestionIcon,
  SettingsIcon,
  InfoIcon,
} from "@chakra-ui/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  setActivePanel,
  selectActivePanel,
  toggleTutorial,
  toggleSidebar,
  selectShowSidebar,
} from "../../store/slices/uiSlice";
import {
  clearCircuit,
  selectCircuitName,
  selectGates,
  selectQubits,
} from "../../store/slices/circuitSlice";

const Header = () => {
  const dispatch = useDispatch();
  const activePanel = useSelector(selectActivePanel);
  const circuitName = useSelector(selectCircuitName);
  const gates = useSelector(selectGates);
  const qubits = useSelector(selectQubits);
  const showSidebar = useSelector(selectShowSidebar);
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Responsive breakpoints
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const isDesktop = useBreakpointValue({ base: false, lg: true });

  // Calculate circuit stats
  const gateCount = gates?.length || 0;
  const qubitCount = qubits?.length || 0;

  const navItems = [
    {
      label: "Circuit Designer",
      icon: ViewIcon,
      panel: "circuit",
      colorScheme: "blue",
      description: "Design quantum circuits",
    },
    {
      label: "Lessons",
      icon: InfoIcon,
      panel: "lessons",
      colorScheme: "green",
      description: "Learn quantum computing",
    },
    {
      label: "Quantum Code",
      icon: EditIcon,
      panel: "code",
      colorScheme: "blue",
      description: "View generated code",
    },
    {
      label: "Simulator",
      icon: RepeatIcon,
      panel: "simulation",
      colorScheme: "blue",
      description: "Run simulations",
    },
    {
      label: "Time Machine",
      icon: RepeatIcon,
      panel: "timemachine",
      colorScheme: "purple",
      description: "Visualize quantum evolution",
    },
    {
      label: "Algorithms",
      icon: StarIcon,
      panel: "algorithms",
      colorScheme: "purple",
      description: "Browse algorithm library",
    },
    {
      label: "Export",
      icon: DownloadIcon,
      panel: "export",
      colorScheme: "blue",
      description: "Export your circuits",
    },
  ];

  const actionItems = [
    {
      label: "Clear Circuit",
      icon: DeleteIcon,
      onClick: onOpen,
      colorScheme: "red",
    },
    {
      label: "Tutorial",
      icon: QuestionIcon,
      onClick: () => dispatch(toggleTutorial()),
      colorScheme: "teal",
    },
  ];

  const cancelRef = useRef<HTMLButtonElement>(null);

  const handlePanelChange = (
    panel:
      | "circuit"
      | "lessons"
      | "timemachine"
      | "code"
      | "simulation"
      | "export"
      | "algorithms"
  ) => {
    dispatch(setActivePanel(panel));
    setMobileMenuOpen(false);
  };

  const handleClearCircuit = () => {
    dispatch(clearCircuit());
    onClose();
  };

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  // Header background based on color mode
  const headerBg = useColorModeValue("white", "gray.900");
  const headerBorder = useColorModeValue("gray.200", "gray.700");
  const headerShadow = useColorModeValue("sm", "sm");

  // Desktop Navigation Component
  const DesktopNavigation = () => (
    <HStack spacing={1}>
      {navItems.map((item) => (
        <Tooltip
          key={item.panel}
          label={`${item.label} - ${item.description}`}
          placement="bottom"
          hasArrow
        >
          <Button
            size="sm"
            variant={activePanel === item.panel ? "solid" : "ghost"}
            onClick={() => handlePanelChange(item.panel)}
            colorScheme={item.colorScheme}
            leftIcon={<item.icon />}
            fontWeight="medium"
            _hover={{
              transform: "translateY(-1px)",
              boxShadow: "md",
            }}
            _active={{
              transform: "translateY(0)",
            }}
            transition="all 0.2s"
          >
            {item.label}
          </Button>
        </Tooltip>
      ))}
    </HStack>
  );

  // Desktop Action Buttons Component
  const DesktopActions = () => (
    <HStack spacing={1}>
      <Tooltip label="Clear Circuit">
        <Button
          size="sm"
          variant="outline"
          onClick={onOpen}
          colorScheme="red"
          leftIcon={<DeleteIcon />}
          fontWeight="medium"
          _hover={{
            transform: "translateY(-1px)",
            boxShadow: "md",
          }}
          _active={{
            transform: "translateY(0)",
          }}
          transition="all 0.2s"
        >
          Clear
        </Button>
      </Tooltip>

      <Tooltip label="Toggle Tutorial">
        <Button
          size="sm"
          variant="outline"
          onClick={() => dispatch(toggleTutorial())}
          colorScheme="teal"
          leftIcon={<QuestionIcon />}
          fontWeight="medium"
          _hover={{
            transform: "translateY(-1px)",
            boxShadow: "md",
          }}
          _active={{
            transform: "translateY(0)",
          }}
          transition="all 0.2s"
        >
          Tutorial
        </Button>
      </Tooltip>
    </HStack>
  );

  // Mobile Menu Component
  const MobileMenu = () => (
    <Menu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
      <MenuButton
        as={IconButton}
        aria-label="Navigation menu"
        icon={<HamburgerIcon />}
        variant="outline"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        size="sm"
      />
      <MenuList
        bg={headerBg}
        borderColor={headerBorder}
        borderWidth="1px"
        shadow="lg"
        minW="280px"
      >
        <VStack align="stretch" spacing={1} p={2}>
          <Box px={3} py={2}>
            <Text
              fontSize="xs"
              color="gray.500"
              textTransform="uppercase"
              fontWeight="semibold"
            >
              Navigation
            </Text>
          </Box>
          {navItems.map((item) => (
            <MenuItem
              key={item.panel}
              icon={<item.icon />}
              onClick={() => handlePanelChange(item.panel as any)}
              bg={activePanel === item.panel ? "blue.50" : "transparent"}
              _hover={{
                bg: activePanel === item.panel ? "blue.100" : "gray.50",
              }}
              _focus={{
                bg: activePanel === item.panel ? "blue.100" : "gray.50",
              }}
              borderRadius="md"
              fontWeight={activePanel === item.panel ? "semibold" : "normal"}
              color={activePanel === item.panel ? "blue.600" : "inherit"}
            >
              <Flex justify="space-between" align="center" w="full">
                <Text>{item.label}</Text>
                {activePanel === item.panel && (
                  <Badge colorScheme="blue" size="sm">
                    Active
                  </Badge>
                )}
              </Flex>
            </MenuItem>
          ))}
          <MenuDivider />
          <Box px={3} py={2}>
            <Text
              fontSize="xs"
              color="gray.500"
              textTransform="uppercase"
              fontWeight="semibold"
            >
              Actions
            </Text>
          </Box>
          {actionItems.map((item) => (
            <MenuItem
              key={item.label}
              icon={<item.icon />}
              onClick={item.onClick}
              _hover={{ bg: "gray.50" }}
              borderRadius="md"
              color={item.colorScheme === "red" ? "red.500" : "inherit"}
            >
              {item.label}
            </MenuItem>
          ))}
        </VStack>
      </MenuList>
    </Menu>
  );

  // Circuit Stats Component
  const CircuitStats = () => (
    <VStack spacing={1} fontSize="sm" opacity={0.8} align="stretch">
      {qubitCount > 0 && (
        <Badge colorScheme="purple" variant="subtle" textAlign="center">
          {qubitCount} qubits
        </Badge>
      )}
      {gateCount > 0 && (
        <Badge colorScheme="blue" variant="subtle" textAlign="center">
          {gateCount} gates
        </Badge>
      )}
    </VStack>
  );

  return (
    <Box
      as="header"
      bg={headerBg}
      borderBottom="1px"
      borderColor={headerBorder}
      px={4}
      py={3}
      shadow={headerShadow}
      position="sticky"
      top={0}
      zIndex={1000}
    >
      <Flex align="center" maxW="8xl" mx="auto" gap={4}>
        {/* Logo and Brand */}
        <HStack spacing={3} flexShrink={0}>
          <Avatar
            size="sm"
            name="QuantumFlow"
            bg="blue.500"
            color="white"
            fontWeight="bold"
          />
          <VStack align="start" spacing={0}>
            <Heading size="md" fontWeight="bold" color="blue.600">
              QuantumFlow
            </Heading>
            {isDesktop && circuitName && (
              <Text fontSize="xs" color="gray.500" noOfLines={1} maxW="150px">
                {circuitName}
              </Text>
            )}
          </VStack>
        </HStack>

        {/* Desktop Navigation */}
        {isDesktop && <DesktopNavigation />}

        <Spacer />

        {/* Circuit Stats (Desktop) */}
        {isDesktop && (gateCount > 0 || qubitCount > 0) && <CircuitStats />}

        {/* Desktop Action Buttons */}
        {isDesktop && <DesktopActions />}

        {/* Right side buttons for both mobile and desktop */}
        <HStack spacing={2}>
          {/* Sidebar Toggle (Mobile only) */}
          {!isDesktop && (
            <Tooltip label="Toggle Drawer">
              <IconButton
                aria-label="Toggle drawer"
                icon={<SettingsIcon />}
                size="sm"
                onClick={handleToggleSidebar}
                variant="ghost"
                colorScheme="gray"
              />
            </Tooltip>
          )}

          {/* Color Mode Toggle */}
          <Tooltip
            label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}
          >
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
              size="sm"
              onClick={toggleColorMode}
              variant="ghost"
              colorScheme="gray"
            />
          </Tooltip>

          {/* Mobile Menu */}
          {isMobile && <MobileMenu />}
        </HStack>
      </Flex>

      {/* Mobile Circuit Stats */}
      {isMobile && (gateCount > 0 || qubitCount > 0) && (
        <Box mt={2} pt={2} borderTop="1px" borderColor={headerBorder}>
          <CircuitStats />
        </Box>
      )}

      {/* Clear Circuit Dialog */}
      <AlertDialog
        isOpen={isOpen}
        onClose={onClose}
        leastDestructiveRef={cancelRef}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Clear Circuit</AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to clear the current circuit? This action
              cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleClearCircuit} ml={3}>
                Clear
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default Header;
