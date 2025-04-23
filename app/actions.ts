"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

// List of animals in English
const ANIMAL_LIST = [
  "Cat",
  "Dog",
  "Rabbit",
  "Giraffe",
  "Elephant",
  "Lion",
  "Tiger",
  "Bear",
  "Monkey",
  "Horse",
  "Panda",
  "Koala",
  "Kangaroo",
  "Penguin",
  "Whale",
  "Dolphin",
  "Turtle",
  "Crocodile",
  "Hippo",
  "Zebra",
  "Fox",
  "Raccoon",
  "Squirrel",
  "Hamster",
  "Mouse",
  "Frog",
  "Snake",
  "Lizard",
  "Chicken",
  "Duck",
  "Pigeon",
  "Eagle",
  "Owl",
  "Crow",
  "Sparrow",
  "Shark",
  "Octopus",
  "Squid",
  "Shrimp",
  "Crab",
  "Jellyfish",
  "Sheep",
  "Goat",
  "Cow",
  "Pig",
];

// Function to generate a random animal from the list
export async function getRandomAnimal(
  apiKey?: string
): Promise<{ animal: string; error?: string }> {
  // Add a timestamp to ensure we're not getting cached results
  const timestamp = Date.now();
  console.log(`Selecting random animal at ${timestamp}`);

  // Get a random animal from the list
  const randomAnimal = getRandomAnimalFromList();
  console.log("Selected animal:", randomAnimal);

  return { animal: randomAnimal, error: undefined };
}

// Helper function to get a random animal from the list
function getRandomAnimalFromList(): string {
  // Use crypto for better randomness if available
  let randomIndex: number;
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    randomIndex = randomArray[0] % ANIMAL_LIST.length;
  } else {
    // Fallback to Math.random with timestamp seed
    const seed = Date.now();
    randomIndex = Math.floor((Math.random() * seed) % ANIMAL_LIST.length);
  }

  return ANIMAL_LIST[randomIndex];
}

// Function to generate a hint about the animal's habitat
export async function generateAnimalHint(
  animal: string,
  apiKey?: string
): Promise<string> {
  // Default hints for fallback (when API is not available)
  const defaultHints: Record<string, string> = {
    Cat: "A small animal often seen inside or outside homes",
    Dog: "A loyal animal that often lives with humans",
    Rabbit: "A small animal with long ears that lives in grasslands or forests",
    Giraffe: "An animal with a long neck that lives in African savannas",
    Elephant:
      "A large animal that lives in forests and grasslands of Africa and Asia",
    Lion: "A large predator that lives in African savannas",
    Tiger: "A striped predator that lives in Asian forests",
    Bear: "A large animal that lives in forests and mountains",
    Monkey:
      "An animal that lives in forests and mountains and is good at climbing trees",
    Horse: "An animal that lives in grasslands and is often kept by humans",
    Panda: "A black and white animal that lives in bamboo forests in China",
    Koala: "An animal that lives in eucalyptus trees in Australia",
    Kangaroo: "A jumping animal that lives in Australian grasslands",
    Penguin:
      "A bird that is good at swimming and lives in Antarctica and cold seas",
    Whale: "A large mammal that lives in the ocean",
    Dolphin: "An animal that lives in seas and rivers and is fast at swimming",
    Turtle: "An animal with a shell that lives on land or in water",
    Crocodile: "A reptile that lives in tropical rivers and wetlands",
    Hippo: "A large animal that lives in African rivers and lakes",
    Zebra: "A striped animal that lives in African grasslands",
    Fox: "A clever animal that lives in forests and grasslands",
    Raccoon:
      "A nocturnal animal that lives in forests and near human settlements",
  };

  // Return default hint if no API key is provided
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    return defaultHints[animal] || "No hint available for this animal";
  }

  try {
    // Generate hint using Gemini API
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Give me a simple one-sentence hint about the animal "${animal}".
      Focus specifically on where this animal lives or what kind of environment it inhabits.
      
      Important: 
      - Do NOT include the word "${animal}" or the name of the animal in your response.
      - Use phrases like "This animal" or "It" instead.
      - Format your response as "An animal that lives in..." and keep it under 30 characters.
      - No additional explanations needed.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Check if the response contains the animal name, if so use the default hint
    if (text.includes(animal)) {
      text = defaultHints[animal] || "No hint available for this animal";
    }

    // Use default hint if no valid response
    if (!text) {
      return defaultHints[animal] || "No hint available for this animal";
    }

    return text;
  } catch (error) {
    console.error("Error generating animal hint:", error);
    // Return default hint if error occurs
    return defaultHints[animal] || "No hint available for this animal";
  }
}

export async function evaluateHint(
  animal: string,
  hint: string,
  apiKey?: string
): Promise<string> {
  // Use provided API key or environment variable
  const key = apiKey || process.env.GEMINI_API_KEY;

  if (!key) {
    // If no API key, just return the first option as fallback
    const options = hint.includes(", ") ? hint.split(", ") : hint.split(",");
    return options[0].trim();
  }

  try {
    // Initialize the Gemini API with the key
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      The secret animal is "${animal}".
      The user provided this hint with two options: "${hint}"
      Which of the two options correctly applies to the animal?
      Answer with ONLY the correct option text, nothing else.
      Be accurate and consider the characteristics of the animal.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    console.log(`Evaluating hint for ${animal}: "${hint}" -> "${text}"`);

    // If we can't determine, return the first option as fallback
    if (!text) {
      const options = hint.includes(", ") ? hint.split(", ") : hint.split(",");
      return options[0].trim();
    }

    return text;
  } catch (error) {
    console.error("Error evaluating hint:", error);
    // Return the first option as fallback if API fails
    const options = hint.includes(", ") ? hint.split(", ") : hint.split(",");
    return options[0].trim();
  }
}

export async function checkAnimalGuess(
  secretAnimal: string,
  userGuess: string,
  apiKey?: string
): Promise<boolean> {
  // Use provided API key or environment variable
  const key = apiKey || process.env.GEMINI_API_KEY;

  if (!key) {
    // If no API key, just do a simple string comparison
    return secretAnimal.toLowerCase() === userGuess.toLowerCase();
  }

  try {
    // Initialize the Gemini API with the key
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      The secret animal is "${secretAnimal}".
      The user guessed "${userGuess}".
      Are these referring to the same animal? Consider synonyms and different ways to refer to the same animal in English.
      For example, "Kitty" and "Cat" would be considered the same.
      Answer with only "yes" or "no".
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim().toLowerCase();

    console.log(`Checking guess: ${secretAnimal} vs ${userGuess} -> ${text}`);

    return text === "yes";
  } catch (error) {
    console.error("Error checking animal guess:", error);
    // Default to simple string comparison if API fails
    return secretAnimal.toLowerCase() === userGuess.toLowerCase();
  }
}

// Function to validate API key
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Simple test prompt to check if the API key works
    const result = await model.generateContent("Hello");
    await result.response;

    return true;
  } catch (error) {
    console.error("API key validation failed:", error);
    return false;
  }
}
