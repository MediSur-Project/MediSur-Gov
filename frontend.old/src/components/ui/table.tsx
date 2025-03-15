import React from 'react'
import { Box, BoxProps } from '@chakra-ui/react'

interface TableProps extends BoxProps {
  children: React.ReactNode
}

function TableRoot({ children, ...props }: TableProps) {
  return (
    <Box overflowX="auto" w="full" {...props}>
      <Box as="table" w="full" borderCollapse="collapse">
        {children}
      </Box>
    </Box>
  )
}

interface TableHeaderProps extends BoxProps {
  children: React.ReactNode
}

function TableHeader({ children, ...props }: TableHeaderProps) {
  return (
    <Box as="thead" {...props}>
      {children}
    </Box>
  )
}

interface TableBodyProps extends BoxProps {
  children: React.ReactNode
}

function TableBody({ children, ...props }: TableBodyProps) {
  return (
    <Box as="tbody" {...props}>
      {children}
    </Box>
  )
}

interface TableRowProps extends BoxProps {
  children: React.ReactNode
}

function TableRow({ children, ...props }: TableRowProps) {
  return (
    <Box 
      as="tr"
      borderBottomWidth="1px"
      borderColor="gray.100"
      _hover={{ bg: 'gray.50' }}
      {...props}
    >
      {children}
    </Box>
  )
}

interface TableColumnProps extends BoxProps {
  children: React.ReactNode
}

function TableColumn({ children, ...props }: TableColumnProps) {
  return (
    <Box
      as="th"
      py={3}
      px={4}
      textAlign="left"
      fontWeight="medium"
      fontSize="sm"
      color="gray.600"
      textTransform="uppercase"
      {...props}
    >
      {children}
    </Box>
  )
}

interface TableCellProps extends BoxProps {
  children: React.ReactNode
  truncate?: boolean
  maxW?: string
}

function TableCell({ children, truncate, maxW, ...props }: TableCellProps) {
  return (
    <Box
      as="td"
      py={3}
      px={4}
      fontSize="sm"
      {...props}
    >
      {truncate ? (
        <Box
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          maxW={maxW}
        >
          {children}
        </Box>
      ) : children}
    </Box>
  )
}

export const Table = Object.assign(TableRoot, {
  Header: TableHeader,
  Body: TableBody,
  Row: TableRow,
  Column: TableColumn,
  Cell: TableCell,
}) 