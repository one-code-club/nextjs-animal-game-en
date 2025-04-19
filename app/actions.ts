"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

// Function to generate a random animal using Gemini API
export async function getRandomAnimal(apiKey?: string): Promise<{ animal: string; error?: string }> {
  // Remove the revalidatePath call that was causing the error
  // revalidatePath("/") - この行を削除

  // Add a timestamp to ensure we're not getting cached results
  const timestamp = Date.now()
  console.log(`Generating random animal at ${timestamp}`)

  // Use provided API key or environment variable
  const key = apiKey || process.env.GEMINI_API_KEY

  if (!key) {
    return { animal: "", error: "API_KEY_MISSING" }
  }

  try {
    // Initialize the Gemini API with the key
    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Add timestamp to prompt to prevent caching
    const prompt = `
      Generate a random common animal name in Japanese. 
      Choose a well-known animal that most people would recognize.
      Use general category names (like "クジラ" instead of "マッコウクジラ").
      Return only the animal name in Japanese, nothing else.
      Examples of valid responses: ネコ, イヌ, ウサギ, キリン, ゾウ, ライオン, トラ, クマ, サル, ウマ, etc.
      Do not return the same animal name repeatedly.
      Do not include any explanations or additional text.
      Current timestamp: ${timestamp} (ignore this, it's just to prevent caching)
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    console.log("Generated animal:", text)

    // Ensure we have a valid animal name
    if (!text || text.length < 2) {
      // If we get an empty response, use a list of common animals
      return getRandomFallbackAnimal()
    }

    return { animal: text, error: undefined }
  } catch (error) {
    console.error("Error generating random animal:", error)
    // Return a random animal if API fails
    return getRandomFallbackAnimal()
  }
}

// Helper function to get a random fallback animal
function getRandomFallbackAnimal(): { animal: string; error?: string } {
  const fallbackAnimals = [
    "ネコ",
    "イヌ",
    "ウサギ",
    "キリン",
    "ゾウ",
    "ライオン",
    "トラ",
    "クマ",
    "サル",
    "ウマ",
    "パンダ",
    "コアラ",
    "カンガルー",
    "ペンギン",
    "クジラ",
    "イルカ",
    "カメ",
    "ワニ",
    "カバ",
    "シマウマ",
    "キツネ",
    "タヌキ",
  ]

  // Use crypto for better randomness if available
  let randomIndex: number
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const randomArray = new Uint32Array(1)
    crypto.getRandomValues(randomArray)
    randomIndex = randomArray[0] % fallbackAnimals.length
  } else {
    // Fallback to Math.random with timestamp seed
    const seed = Date.now()
    randomIndex = Math.floor((Math.random() * seed) % fallbackAnimals.length)
  }

  const randomAnimal = fallbackAnimals[randomIndex]
  console.log("Using fallback animal:", randomAnimal)
  return { animal: randomAnimal, error: "API_ERROR" }
}

export async function evaluateHint(animal: string, hint: string, apiKey?: string): Promise<string> {
  // Use provided API key or environment variable
  const key = apiKey || process.env.GEMINI_API_KEY

  if (!key) {
    // If no API key, just return the first option as fallback
    const options = hint.includes("、") ? hint.split("、") : hint.split(",")
    return options[0].trim()
  }

  try {
    // Initialize the Gemini API with the key
    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
      The secret animal is "${animal}".
      The user provided this hint with two options: "${hint}"
      Which of the two options correctly applies to the animal?
      Answer with ONLY the correct option text, nothing else.
      Be accurate and consider the characteristics of the animal.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    console.log(`Evaluating hint for ${animal}: "${hint}" -> "${text}"`)

    // If we can't determine, return the first option as fallback
    if (!text) {
      const options = hint.includes("、") ? hint.split("、") : hint.split(",")
      return options[0].trim()
    }

    return text
  } catch (error) {
    console.error("Error evaluating hint:", error)
    // Return the first option as fallback if API fails
    const options = hint.includes("、") ? hint.split("、") : hint.split(",")
    return options[0].trim()
  }
}

export async function checkAnimalGuess(secretAnimal: string, userGuess: string, apiKey?: string): Promise<boolean> {
  // Use provided API key or environment variable
  const key = apiKey || process.env.GEMINI_API_KEY

  if (!key) {
    // If no API key, just do a simple string comparison
    return secretAnimal.toLowerCase() === userGuess.toLowerCase()
  }

  try {
    // Initialize the Gemini API with the key
    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
      The secret animal is "${secretAnimal}".
      The user guessed "${userGuess}".
      Are these referring to the same animal? Consider synonyms and different ways to refer to the same animal in Japanese.
      For example, "イヌ" and "犬" would be considered the same.
      Answer with only "yes" or "no".
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim().toLowerCase()

    console.log(`Checking guess: ${secretAnimal} vs ${userGuess} -> ${text}`)

    return text === "yes"
  } catch (error) {
    console.error("Error checking animal guess:", error)
    // Default to simple string comparison if API fails
    return secretAnimal.toLowerCase() === userGuess.toLowerCase()
  }
}

// Function to validate API key
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Simple test prompt to check if the API key works
    const result = await model.generateContent("Hello")
    await result.response

    return true
  } catch (error) {
    console.error("API key validation failed:", error)
    return false
  }
}
