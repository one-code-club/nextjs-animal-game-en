"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

// 定義済みの動物リスト
const ANIMAL_LIST = [
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
  "リス",
  "ハムスター",
  "ネズミ",
  "カエル",
  "ヘビ",
  "トカゲ",
  "ニワトリ",
  "アヒル",
  "ハト",
  "ワシ",
  "フクロウ",
  "カラス",
  "スズメ",
  "サメ",
  "タコ",
  "イカ",
  "エビ",
  "カニ",
  "クラゲ",
  "ヒツジ",
  "ヤギ",
  "ウシ",
  "ブタ",
]

// Function to generate a random animal from the list
export async function getRandomAnimal(apiKey?: string): Promise<{ animal: string; error?: string }> {
  // Add a timestamp to ensure we're not getting cached results
  const timestamp = Date.now()
  console.log(`Selecting random animal at ${timestamp}`)

  // Get a random animal from the list
  const randomAnimal = getRandomAnimalFromList()
  console.log("Selected animal:", randomAnimal)

  return { animal: randomAnimal, error: undefined }
}

// Helper function to get a random animal from the list
function getRandomAnimalFromList(): string {
  // Use crypto for better randomness if available
  let randomIndex: number
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const randomArray = new Uint32Array(1)
    crypto.getRandomValues(randomArray)
    randomIndex = randomArray[0] % ANIMAL_LIST.length
  } else {
    // Fallback to Math.random with timestamp seed
    const seed = Date.now()
    randomIndex = Math.floor((Math.random() * seed) % ANIMAL_LIST.length)
  }

  return ANIMAL_LIST[randomIndex]
}

// 新しい関数: 動物の生息地に関するヒントを生成する
export async function generateAnimalHint(animal: string, apiKey?: string): Promise<string> {
  // デフォルトのヒント（APIが使えない場合のフォールバック）
  const defaultHints: Record<string, string> = {
    ネコ: "家の中や外で見かけることが多い動物です",
    イヌ: "人間と一緒に暮らすことが多い動物です",
    ウサギ: "草原や森に住んでいる小さな動物です",
    キリン: "アフリカのサバンナに住んでいる首の長い動物です",
    ゾウ: "アフリカやアジアの森林や草原に住む大きな動物です",
    ライオン: "アフリカのサバンナに住む猛獣です",
    トラ: "アジアの森林に住む縞模様の猛獣です",
    クマ: "森林や山地に住む大きな動物です",
    サル: "森林や山地に住み、木に登るのが得意な動物です",
    ウマ: "草原で暮らし、人間に飼われることが多い動物です",
    パンダ: "中国の竹林に住む白黒の動物です",
    コアラ: "オーストラリアのユーカリの木に住む動物です",
    カンガルー: "オーストラリアの草原に住む跳ねる動物です",
    ペンギン: "南極や寒い海に住む泳ぐのが得意な鳥です",
    クジラ: "海の中で暮らす大きな哺乳類です",
    イルカ: "海や川に住み、泳ぐのが速い動物です",
    カメ: "陸や海に住み、甲羅を持つ動物です",
    ワニ: "熱帯の川や湿地に住む爬虫類です",
    カバ: "アフリカの川や湖に住む大きな動物です",
    シマウマ: "アフリカの草原に住む縞模様の動物です",
    キツネ: "森林や草原に住む賢い動物です",
    タヌキ: "森林や人里近くに住む夜行性の動物です",
  }

  // APIキーがない場合はデフォルトのヒントを返す
  const key = apiKey || process.env.GEMINI_API_KEY
  if (!key) {
    return defaultHints[animal] || "この動物についてのヒントはありません"
  }

  try {
    // Gemini APIを使ってヒントを生成
    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
      "${animal}"という動物についての簡単なヒントを1文で教えてください。
      特に、この動物がどこに住んでいるか、どんな環境で生活しているかについて触れてください。
      回答は「〜に住んでいる動物です」という形式で、30文字以内でお願いします。
      余計な説明は不要です。
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    // 有効な応答がない場合はデフォルトのヒントを使用
    if (!text) {
      return defaultHints[animal] || "この動物についてのヒントはありません"
    }

    return text
  } catch (error) {
    console.error("Error generating animal hint:", error)
    // エラーが発生した場合はデフォルトのヒントを返す
    return defaultHints[animal] || "この動物についてのヒントはありません"
  }
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
