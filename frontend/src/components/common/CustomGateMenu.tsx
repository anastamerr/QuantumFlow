import React from "react";
import {
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
} from "@chakra-ui/react";
import { HamburgerIcon, EditIcon, DeleteIcon } from "@chakra-ui/icons";
import {
  deleteCustomGate,
  CustomGateDefinition,
} from "../../utils/customGateManager";

interface CustomGateMenuProps {
  gate: CustomGateDefinition;
  onEdit: (gate: CustomGateDefinition) => void;
  onDelete: () => void;
}

export default function CustomGateMenu({
  gate,
  onEdit,
  onDelete,
}: CustomGateMenuProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const toast = useToast();

  const handleDelete = () => {
    try {
      deleteCustomGate(gate.id);
      toast({
        title: "Custom gate deleted",
        description: `"${gate.name}" has been removed.`,
        status: "success",
        duration: 3000,
      });
      onClose();
      onDelete();
    } catch (error) {
      toast({
        title: "Error deleting gate",
        description: "Could not delete the custom gate.",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleEdit = () => {
    onEdit(gate);
  };

  return (
    <>
      <Menu>
        <MenuButton
          as={IconButton}
          aria-label="Custom gate options"
          icon={<HamburgerIcon />}
          size="xs"
          variant="ghost"
          onClick={(e) => e.stopPropagation()}
        />
        <MenuList>
          <MenuItem icon={<EditIcon />} onClick={handleEdit}>
            View/Edit Details
          </MenuItem>
          <MenuItem icon={<DeleteIcon />} onClick={onOpen} color="red.500">
            Delete Gate
          </MenuItem>
        </MenuList>
      </Menu>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Custom Gate
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete "{gate.name}"? This action cannot
              be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
