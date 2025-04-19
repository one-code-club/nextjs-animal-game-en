import { getRandomAnimal } from "@/app/actions"
import AnimalGame from "@/components/animal-game"

// This ensures the page is dynamic and not statically optimized
export const dynamic = "force-dynamic"
// Set cache-control headers to prevent caching
export const fetchCache = "force-no-store"
export const revalidate = 0

export default async function Home() {
  // Pre-fetch a random animal on the server side
  // This will be different on each page load
  const { animal, error } = await getRandomAnimal()

  console.log("Server-side generated animal:", animal)

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 bg-gradient-to-b from-purple-50 to-white">
      <div className="w-full max-w-3xl">
        <AnimalGame initialAnimal={animal} initialError={error} />
      </div>
    </main>
  )
}
