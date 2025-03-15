import { Box, IconButton } from "@chakra-ui/react"
import React, { useState } from "react"
import { BsThreeDotsVertical } from "react-icons/bs"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"

// Temporary type definition until we have a proper one
interface Hospital {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  email: string
}

// These components will be implemented later
const EditHospitalModal = ({ isOpen, onClose, hospital, trigger }: any) => (
  <>{trigger}</>
)

const DeleteHospital = ({ isOpen, onClose, hospital, trigger }: any) => (
  <>{trigger}</>
)

interface HospitalActionsMenuProps {
  hospital: Hospital
  disabled?: boolean
}

const HospitalActionsMenu = ({ hospital, disabled = false }: HospitalActionsMenuProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  return (
    <>
      <MenuRoot>
        <MenuTrigger>
          <Box
            as="button"
            aria-label="Hospital actions"
            display="flex"
            alignItems="center"
            justifyContent="center"
            p="1"
            borderRadius="md"
            _hover={{ bg: "gray.100" }}
            opacity={disabled ? 0.4 : 1}
            pointerEvents={disabled ? "none" : "auto"}
          >
            <BsThreeDotsVertical />
          </Box>
        </MenuTrigger>
        <MenuContent>
          <Box 
            as="button" 
            w="100%" 
            textAlign="left" 
            px="3" 
            py="2" 
            _hover={{ bg: "gray.100" }}
            onClick={() => setIsEditOpen(true)}
          >
            Edit
          </Box>
          <Box 
            as="button" 
            w="100%" 
            textAlign="left" 
            px="3" 
            py="2" 
            _hover={{ bg: "gray.100" }}
            onClick={() => setIsDeleteOpen(true)}
          >
            Delete
          </Box>
        </MenuContent>
      </MenuRoot>

      {isEditOpen && (
        <EditHospitalModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          hospital={hospital}
          trigger={null}
        />
      )}
      
      {isDeleteOpen && (
        <DeleteHospital
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          hospital={hospital}
          trigger={null}
        />
      )}
    </>
  )
}

export default HospitalActionsMenu 