import {
  Container,
  Flex,
  Heading,
  Skeleton,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiSearch } from "react-icons/fi"
import { z } from "zod"

import { HospitalsService } from "@/client/hospital-services"
import AddHospital from "@/components/Hospitals/AddHospital"
import { HospitalActionsMenu } from "@/components/Common/HospitalActionsMenu"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination"
import { Table } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"

const hospitalsSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 5

function getHospitalsQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      HospitalsService.readHospitals({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["hospitals", { page }],
  }
}

export const Route = createFileRoute("/_layout/hospitals")({
  component: Hospitals,
  validateSearch: (search) => hospitalsSearchSchema.parse(search),
})

function HospitalsTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getHospitalsQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const setPage = (page: number) =>
    navigate({
      search: (prev: { [key: string]: string }) => ({ ...prev, page }),
    })

  const hospitals = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return (
      <VStack gap="4" align="stretch" py="4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Flex
            key={index}
            height="60px"
            borderWidth="1px"
            borderRadius="md"
            px={4}
            py={2}
          >
            <Flex flex="1" direction="column" justifyContent="center">
              <Skeleton height="14px" width="60%" mb={2} />
              <Skeleton height="10px" width="40%" />
            </Flex>
          </Flex>
        ))}
      </VStack>
    )
  }

  if (hospitals.length === 0) {
    return (
      <EmptyState
        icon={<FiSearch size={24} />}
        title="You don't have any hospitals yet"
        description="Add a new hospital to get started"
      />
    )
  }

  return (
    <>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.Column>Name</Table.Column>
            <Table.Column>Address</Table.Column>
            <Table.Column>Contact</Table.Column>
            <Table.Column>Email</Table.Column>
            <Table.Column>Actions</Table.Column>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {hospitals.map((hospital) => (
            <Table.Row key={hospital.id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Table.Cell maxW="sm" truncate>
                {hospital.name}
              </Table.Cell>
              <Table.Cell maxW="sm" truncate>
                {hospital.address}
              </Table.Cell>
              <Table.Cell maxW="sm" truncate>
                {hospital.contact_person} ({hospital.phone_number})
              </Table.Cell>
              <Table.Cell maxW="sm" truncate>
                {hospital.email}
              </Table.Cell>
              <Table.Cell>
                <HospitalActionsMenu hospital={hospital} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      {count > PER_PAGE && (
        <Flex justifyContent="flex-end" mt={4}>
          <PaginationRoot
            count={count}
            pageSize={PER_PAGE}
            onPageChange={({ page }) => setPage(page)}
          >
            <Flex>
              <PaginationPrevTrigger />
              <PaginationItems />
              <PaginationNextTrigger />
            </Flex>
          </PaginationRoot>
        </Flex>
      )}
    </>
  )
}

function Hospitals() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Hospitals Management
      </Heading>
      <AddHospital />
      <HospitalsTable />
    </Container>
  )
} 