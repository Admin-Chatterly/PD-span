import Link from "next/link"
import { PlusIcon } from "lucide-react"
import { PeopleTable } from "@/components/people/people-table"
import { PeopleToolbar } from "@/components/people/people-toolbar"
import { QuickAddForm } from "@/components/people/quick-add-form"
import { SetupHelp } from "@/components/setup-help"
import { Button } from "@/components/ui/button"
import { PERSON_STATUSES } from "@/lib/constants"
import { listPeople, PEOPLE_SORTS, type PeopleSort } from "@/lib/data/people"
import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "People" }

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "")
}

export default async function PeoplePage(props: PageProps<"/people">) {
  const searchParams = await props.searchParams
  const q = first(searchParams.q)
  const statusParam = first(searchParams.status)
  const status = (PERSON_STATUSES as readonly string[]).includes(statusParam) ? statusParam : ""
  const sortParam = first(searchParams.sort)
  const sort: PeopleSort = (PEOPLE_SORTS as readonly string[]).includes(sortParam)
    ? (sortParam as PeopleSort)
    : "updated"

  const supabase = await createClient()
  const result = await listPeople(supabase, { q, status: status || undefined, sort })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">People</h1>
          {result.ok ? (
            <p className="text-sm text-muted-foreground">
              {result.total} on file{q || status ? ", filtered" : ""}
            </p>
          ) : null}
        </div>
        <Button asChild>
          <Link href="/people/new">
            <PlusIcon /> Add person
          </Link>
        </Button>
      </div>

      <QuickAddForm />
      <PeopleToolbar q={q} status={status} sort={sort} />

      {result.ok ? (
        <PeopleTable people={result.people} filtered={Boolean(q || status)} />
      ) : (
        <SetupHelp error={result.error} />
      )}
    </div>
  )
}
