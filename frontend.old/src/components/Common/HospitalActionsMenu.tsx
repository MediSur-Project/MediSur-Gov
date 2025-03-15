import React, { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { FiEdit, FiTrash } from "react-icons/fi"

import { type HospitalResponse, HospitalsService } from "@/client/hospital-services"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@/components/ui/menu"
import EditHospitalModal from "@/components/Hospitals/EditHospitalModal"
import {
  DialogContent,
  DialogActionTrigger,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button, Text } from "@chakra-ui/react"

interface HospitalActionsMenuProps {
  hospital: HospitalResponse
  disabled?: boolean
}

export function HospitalActionsMenu({
  hospital,
  disabled = false,
}: HospitalActionsMenuProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  
  const deleteHospitalMutation = useMutation({
    mutationFn: () => HospitalsService.deleteHospitalApi({ hospitalId: hospital.id }),
    onSuccess: () => {
      showSuccessToast("Hospital deleted successfully.")
      setIsDeleteDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ["hospitals"] })
    },
    onError: (err: any) => {
      handleError(err)
    }
  })

  return (
    <React.Fragment>
      <Menu>
        <MenuTrigger aria-label="Actions" variant="ghost">
          Actions
        </MenuTrigger>
        <MenuContent>
          <MenuItem
            onClick={() => setIsEditModalOpen(true)}
            disabled={disabled}
            leadingIcon={<FiEdit />}
          >
            Edit hospital
          </MenuItem>
          <MenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={disabled}
            leadingIcon={<FiTrash />}
            _hover={{ color: "red.400" }}
          >
            Delete hospital
          </MenuItem>
        </MenuContent>
      </Menu>

      <EditHospitalModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        hospital={hospital}
      />

      <DialogRoot 
        open={isDeleteDialogOpen}
        onOpenChange={({ open }) => setIsDeleteDialogOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Hospital</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text>
              Are you sure you want to delete this hospital? This action cannot be undone.
            </Text>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="subtle" colorPalette="gray">
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button 
              colorPalette="red" 
              variant="solid" 
              loading={deleteHospitalMutation.isPending}
              onClick={() => deleteHospitalMutation.mutate()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </React.Fragment>
  )
} 