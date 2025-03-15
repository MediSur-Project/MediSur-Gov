import React from "react"
import { Box, Center, Text, VStack } from "@chakra-ui/react"
import { FiSearch } from "react-icons/fi"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
}

export function EmptyState({
  icon = <FiSearch size={24} />,
  title,
  description,
}: EmptyStateProps) {
  return (
    <Center py={8}>
      <VStack gap={4} textAlign="center">
        <Box
          p={3}
          borderRadius="full"
          bg="bg.subtle"
          color="fg.muted"
        >
          {icon}
        </Box>
        <Text fontWeight="medium" fontSize="lg">
          {title}
        </Text>
        {description && (
          <Text color="fg.muted" fontSize="sm">
            {description}
          </Text>
        )}
      </VStack>
    </Center>
  )
} 