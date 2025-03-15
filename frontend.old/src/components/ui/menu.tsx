"use client"

import { Box } from "@chakra-ui/react"
import * as React from "react"

// Simple menu components that just render their children
// The actual styling and behavior would be implemented by the parent components

export const MenuRoot = ({ children }: { children: React.ReactNode }) => {
  return <Box position="relative">{children}</Box>
}

export function MenuTrigger({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
    </div>
  );
}

export const MenuContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box
      position="absolute"
      right="0"
      top="100%"
      zIndex="dropdown"
      mt="1"
      bg="white"
      borderRadius="md"
      boxShadow="md"
      minW="200px"
      py="1"
    >
      {children}
    </Box>
  )
}

export const MenuItem = ({
  children,
  ...props
}: {
  children: React.ReactNode
  [key: string]: any
}) => {
  return (
    <Box
      as="button"
      display="flex"
      alignItems="center"
      width="100%"
      px="3"
      py="2"
      textAlign="left"
      _hover={{ bg: "gray.100" }}
      transition="background 0.2s"
      {...props}
    >
      {children}
    </Box>
  )
}

export const Menu = ({ children }: { children: React.ReactNode }) => {
  return (
    <MenuRoot>
      <MenuTrigger>{children}</MenuTrigger>
      <MenuContent>
        {children}
      </MenuContent>
    </MenuRoot>
  )
}
