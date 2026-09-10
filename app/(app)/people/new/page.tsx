import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { PersonForm } from "@/components/people/person-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = { title: "Add person" }

export default function NewPersonPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/people">
          <ArrowLeftIcon /> People
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Add person</CardTitle>
          <CardDescription>
            Everything is optional. A description alone is enough; fill in the name, alias and links as
            intel comes in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PersonForm mode="create" />
        </CardContent>
      </Card>
    </div>
  )
}
