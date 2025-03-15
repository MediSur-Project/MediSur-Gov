import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"
import { useEffect } from "react"

import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"

import { type HospitalResponse, HospitalsService } from "@/client/hospital-services"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
} from "../ui/dialog"
import { Field } from "../ui/field"

interface EditHospitalModalProps {
  isOpen: boolean
  onClose: () => void
  hospital: HospitalResponse
}

interface HospitalFormData {
  name: string;
  address: string;
  phone_number: string;
  email: string;
  contact_person: string;
}

export default function EditHospitalModal({
  isOpen,
  onClose,
  hospital,
}: EditHospitalModalProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<HospitalFormData>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: hospital.name,
      address: hospital.address,
      phone_number: hospital.phone_number,
      email: hospital.email,
      contact_person: hospital.contact_person,
    },
  })

  // Reset form when hospital changes
  useEffect(() => {
    if (isOpen) {
      reset({
        name: hospital.name,
        address: hospital.address,
        phone_number: hospital.phone_number,
        email: hospital.email,
        contact_person: hospital.contact_person,
      })
    }
  }, [hospital, isOpen, reset])

  const mutation = useMutation({
    mutationFn: (data: HospitalFormData) =>
      HospitalsService.updateHospitalApi({
        hospitalId: hospital.id,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("Hospital updated successfully.")
      onClose()
    },
    onError: (err: any) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitals"] })
    },
  })

  const onSubmit: SubmitHandler<HospitalFormData> = (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => open === false && onClose()}
    >
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Hospital</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Edit hospital details.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.name}
                errorText={errors.name?.message}
                label="Name"
              >
                <Input
                  id="name"
                  {...register("name", {
                    required: "Hospital name is required.",
                  })}
                  placeholder="Hospital name"
                  type="text"
                />
              </Field>

              <Field
                required
                invalid={!!errors.address}
                errorText={errors.address?.message}
                label="Address"
              >
                <Input
                  id="address"
                  {...register("address", {
                    required: "Address is required.",
                  })}
                  placeholder="Hospital address"
                  type="text"
                />
              </Field>

              <Field
                required
                invalid={!!errors.phone_number}
                errorText={errors.phone_number?.message}
                label="Phone Number"
              >
                <Input
                  id="phone_number"
                  {...register("phone_number", {
                    required: "Phone number is required.",
                  })}
                  placeholder="Phone number"
                  type="text"
                />
              </Field>

              <Field
                required
                invalid={!!errors.email}
                errorText={errors.email?.message}
                label="Email"
              >
                <Input
                  id="email"
                  {...register("email", {
                    required: "Email is required.",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Please enter a valid email address",
                    },
                  })}
                  placeholder="Email address"
                  type="email"
                />
              </Field>

              <Field
                required
                invalid={!!errors.contact_person}
                errorText={errors.contact_person?.message}
                label="Contact Person"
              >
                <Input
                  id="contact_person"
                  {...register("contact_person", {
                    required: "Contact person is required.",
                  })}
                  placeholder="Contact person name"
                  type="text"
                />
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorPalette="gray"
                disabled={isSubmitting}
                onClick={onClose}
              >
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              type="submit"
              disabled={!isValid}
              loading={isSubmitting}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
} 