"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  getRandomAnimal,
  evaluateHint,
  checkAnimalGuess,
  validateApiKey,
  generateAnimalHint,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Confetti } from "@/components/confetti";
import { TreeNode } from "@/components/tree-node";
import { AnimalIcon } from "@/components/animal-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Predefined animal list for client-side use
const CLIENT_ANIMAL_LIST = [
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
];

type HintNode = {
  hint: string;
  options: [string, string];
  correctOption: string | null;
  children: HintNode[];
};

interface AnimalGameProps {
  initialAnimal?: string;
  initialError?: string;
}

export default function AnimalGame({
  initialAnimal = "",
  initialError = "",
}: AnimalGameProps) {
  const [secretAnimal, setSecretAnimal] = useState<string>(initialAnimal);
  const [loading, setLoading] = useState<boolean>(
    !initialAnimal || initialError === "API_KEY_MISSING"
  );
  const [hintInput, setHintInput] = useState<string>("");
  const [guessInput, setGuessInput] = useState<string>("");
  const [gameState, setGameState] = useState<"hint" | "guess">("hint");
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [hintTree, setHintTree] = useState<HintNode>({
    hint: "Root",
    options: ["", ""],
    correctOption: null,
    children: [],
  });
  const [currentNode, setCurrentNode] = useState<HintNode | null>(null);
  const [processingHint, setProcessingHint] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);

  // State for animal location hint
  const [animalLocationHint, setAnimalLocationHint] = useState<string>("");
  const [loadingHint, setLoadingHint] = useState<boolean>(false);

  // API key related states
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyDialog, setShowApiKeyDialog] = useState<boolean>(
    initialError === "API_KEY_MISSING"
  );
  const [apiKeyError, setApiKeyError] = useState<string>("");
  const [validatingApiKey, setValidatingApiKey] = useState<boolean>(false);

  // Hint count
  const [hintCount, setHintCount] = useState<number>(0);

  // Fetch animal habitat hint when animal is set
  useEffect(() => {
    if (secretAnimal) {
      fetchAnimalHint(secretAnimal);
    }
  }, [secretAnimal]);

  // Function to fetch animal hint
  const fetchAnimalHint = async (animal: string) => {
    setLoadingHint(true);
    try {
      // Get API key from localStorage if available
      const storedApiKey = localStorage.getItem("geminiApiKey");

      let hint = await generateAnimalHint(animal, storedApiKey || undefined);

      // Additional check: make sure the hint doesn't contain the animal name
      if (hint.includes(animal)) {
        // Replace with generic hint if it contains the animal name
        hint = "An animal with a distinctive habitat";
      }

      setAnimalLocationHint(hint);
    } catch (error) {
      console.error("Error fetching animal hint:", error);
      setAnimalLocationHint("No hint available for this animal");
    } finally {
      setLoadingHint(false);
    }
  };

  useEffect(() => {
    // Check for API key in localStorage first
    const storedApiKey = localStorage.getItem("geminiApiKey");

    // If we have an initial animal and no API key error, we can use it directly
    if (initialAnimal && initialError !== "API_KEY_MISSING") {
      console.log("Using initial animal from server:", initialAnimal);
      setSecretAnimal(initialAnimal);
      setLoading(false);
      setCurrentNode(hintTree);
      return;
    }

    const initGame = async () => {
      try {
        // If we have a stored API key, use it
        const result = await getRandomAnimal(storedApiKey || undefined);

        if (result.error === "API_KEY_MISSING") {
          // Show API key dialog if key is missing
          setShowApiKeyDialog(true);
          setLoading(false);
        } else {
          console.log("Game initialized with animal:", result.animal);
          setSecretAnimal(result.animal);
          setLoading(false);
          setCurrentNode(hintTree);
        }
      } catch (error) {
        console.error("Error initializing game:", error);
        // Use a random animal if there's an error
        const randomAnimal = getRandomClientAnimal();
        console.log(
          "Using client-side random animal due to error:",
          randomAnimal
        );
        setSecretAnimal(randomAnimal);
        setLoading(false);
        setCurrentNode(hintTree);
      }
    };

    // Only run this if we don't have an initial animal or if there's an API key error
    if (!initialAnimal || initialError === "API_KEY_MISSING") {
      initGame();
    }
  }, [initialAnimal, initialError, hintTree]);

  // Helper function to get a random animal on the client side
  function getRandomClientAnimal(): string {
    const randomIndex = Math.floor(Math.random() * CLIENT_ANIMAL_LIST.length);
    return CLIENT_ANIMAL_LIST[randomIndex];
  }

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      setApiKeyError("Please enter an API key");
      return;
    }

    setValidatingApiKey(true);
    setApiKeyError("");

    try {
      const isValid = await validateApiKey(apiKey);

      if (isValid) {
        // Store API key in localStorage
        localStorage.setItem("geminiApiKey", apiKey);

        // Close dialog and initialize game
        setShowApiKeyDialog(false);
        setLoading(true);

        const result = await getRandomAnimal(apiKey);
        setSecretAnimal(result.animal);
        setCurrentNode(hintTree);
      } else {
        setApiKeyError("Invalid API key. Please check and try again.");
      }
    } catch (error) {
      console.error("Error validating API key:", error);
      setApiKeyError("An error occurred while validating the API key.");
    } finally {
      setValidatingApiKey(false);
      setLoading(false);
    }
  };

  const handleHintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hintInput.includes(", ") && !hintInput.includes(",")) {
      alert("Please include two options like 'option1, option2'");
      return;
    }

    setProcessingHint(true);

    try {
      // Split the hint into two options
      const options = hintInput.includes(", ")
        ? hintInput.split(", ")
        : hintInput.split(",");

      if (options.length !== 2) {
        alert("Please include exactly two options");
        setProcessingHint(false);
        return;
      }

      // Create a new node
      const newNode: HintNode = {
        hint: hintInput,
        options: [options[0].trim(), options[1].trim()],
        correctOption: null,
        children: [],
      };

      // Get API key from localStorage if available
      const storedApiKey = localStorage.getItem("geminiApiKey");

      // Evaluate which option is correct
      const correctOption = await evaluateHint(
        secretAnimal,
        hintInput,
        storedApiKey || undefined
      );
      newNode.correctOption = correctOption;

      // Update the tree
      if (currentNode) {
        currentNode.children.push(newNode);
        setCurrentNode(newNode);
        setHintTree({ ...hintTree }); // Force re-render
      }

      // Increment hint count
      setHintCount((prevCount) => prevCount + 1);

      setHintInput("");
    } catch (error) {
      console.error("Error processing hint:", error);
    } finally {
      setProcessingHint(false);
    }
  };

  const handleGuessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guessInput.trim()) {
      alert("Please enter an animal name");
      return;
    }

    setLoading(true);

    try {
      // Get API key from localStorage if available
      const storedApiKey = localStorage.getItem("geminiApiKey");

      const isCorrect = await checkAnimalGuess(
        secretAnimal,
        guessInput,
        storedApiKey || undefined
      );

      if (isCorrect) {
        setResult("correct");
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      } else {
        setResult("incorrect");
        // Add shake animation for incorrect answers
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    } catch (error) {
      console.error("Error checking guess:", error);
    } finally {
      setLoading(false);
    }
  };

  const switchToGuess = () => {
    setGameState("guess");
  };

  const switchToHint = () => {
    setGameState("hint");
    setResult(null);
  };

  const resetGame = async () => {
    setLoading(true);
    setHintInput("");
    setGuessInput("");
    setGameState("hint");
    setResult(null);
    setShowAnswer(false);
    setHintCount(0);
    setAnimalLocationHint(""); // Reset hint
    setHintTree({
      hint: "Root",
      options: ["", ""],
      correctOption: null,
      children: [],
    });

    try {
      // Get API key from localStorage if available
      const storedApiKey = localStorage.getItem("geminiApiKey");

      // Try to get a new animal from the server
      const result = await getRandomAnimal(storedApiKey || undefined);

      if (result.error === "API_KEY_MISSING") {
        setShowApiKeyDialog(true);
        // Use a client-side random animal if API key is missing
        const randomAnimal = getRandomClientAnimal();
        console.log(
          "Using client-side random animal due to missing API key:",
          randomAnimal
        );
        setSecretAnimal(randomAnimal);
      } else {
        console.log("New game with animal:", result.animal);
        setSecretAnimal(result.animal);
      }
    } catch (error) {
      console.error("Error resetting game:", error);
      // Use a random animal if there's an error
      const randomAnimal = getRandomClientAnimal();
      console.log(
        "Using client-side random animal due to error:",
        randomAnimal
      );
      setSecretAnimal(randomAnimal);
    } finally {
      setLoading(false);
      setCurrentNode(hintTree);
    }
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
    // Hide the answer after 3 seconds
    setTimeout(() => {
      setShowAnswer(false);
    }, 3000);
  };

  if (loading && !secretAnimal && !showApiKeyDialog) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <div className="text-4xl font-bold game-title mb-6">
          Animal Guessing Game
        </div>
        <div className="text-xl text-center mb-8 text-purple-700">
          Preparing the game...
        </div>
        <div className="flex space-x-6">
          <AnimalIcon className="animate-pulse">🐱</AnimalIcon>
          <AnimalIcon className="animate-pulse delay-100">🐶</AnimalIcon>
          <AnimalIcon className="animate-pulse delay-200">🐰</AnimalIcon>
          <AnimalIcon className="animate-pulse delay-300">🐼</AnimalIcon>
        </div>
        <div className="mt-8 flex space-x-2">
          <span className="loading-dot"></span>
          <span className="loading-dot"></span>
          <span className="loading-dot"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {showConfetti && <Confetti />}

      {/* API Key Dialog */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="dialog-content sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center text-purple-700 flex items-center justify-center">
              <span role="img" aria-label="key" className="mr-2">
                🔑
              </span>
              Gemini API Key Required
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              To play this game, you need a Google Gemini API key.
              <a
                href="https://ai.google.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline ml-1 font-medium"
              >
                Get one here
              </a>
              .
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleApiKeySubmit} className="space-y-6 py-6">
            <div className="space-y-3">
              <Input
                id="apiKey"
                placeholder="Enter your Gemini API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={validatingApiKey}
                className="input-animal text-base"
              />
              {apiKeyError && (
                <p className="text-sm text-red-500 text-center font-medium">
                  {apiKeyError}
                </p>
              )}
            </div>

            <DialogFooter className="flex justify-center">
              <Button
                type="submit"
                disabled={validatingApiKey || !apiKey.trim()}
                className="btn-animal"
              >
                {validatingApiKey ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2">🔄</span> Validating...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="mr-2">🔑</span> Submit
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Game title and secret animal hint */}
      <div className="text-center slide-in">
        <h1 className="text-5xl font-bold mb-4 game-title">
          Animal Guessing Game
        </h1>
        <div className="flex justify-center space-x-4 mb-6">
          <AnimalIcon className="float">🐱</AnimalIcon>
          <AnimalIcon className="float" style={{ animationDelay: "0.5s" }}>
            🐶
          </AnimalIcon>
          <AnimalIcon className="float" style={{ animationDelay: "1s" }}>
            🐰
          </AnimalIcon>
          <AnimalIcon className="float" style={{ animationDelay: "1.5s" }}>
            🐼
          </AnimalIcon>
        </div>
        <div className="secret-badge">
          <p className="text-base text-yellow-800 font-medium">
            <span role="img" aria-label="secret" className="mr-2">
              🤫
            </span>
            Secret Animal: {secretAnimal ? "???" : "Loading..."}
          </p>
          {/* Display habitat hint */}
          {animalLocationHint && (
            <p className="text-sm text-blue-700 mt-2 font-medium bg-blue-50 px-3 py-1 rounded-full inline-block border border-blue-200">
              <span role="img" aria-label="hint" className="mr-1">
                💡
              </span>
              Hint: {loadingHint ? "Loading..." : animalLocationHint}
            </p>
          )}
        </div>
        {hintCount > 0 && (
          <div className="mt-3 text-base text-purple-600 font-medium bg-purple-50 px-4 py-2 rounded-full inline-block border border-purple-200">
            <span role="img" aria-label="hint count" className="mr-2">
              🔍
            </span>
            Hints used: {hintCount}
          </div>
        )}
      </div>

      {/* Section title and description */}
      <Card className="card-animal slide-in" style={{ animationDelay: "0.1s" }}>
        <CardContent className="p-8">
          <h2 className="text-2xl font-semibold mb-3 text-center text-purple-700">
            {gameState === "hint" ? (
              <span className="flex items-center justify-center">
                <span role="img" aria-label="hint" className="mr-3 text-3xl">
                  💡
                </span>
                Enter a Hint
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <span role="img" aria-label="guess" className="mr-3 text-3xl">
                  🎯
                </span>
                Guess the Animal!
              </span>
            )}
          </h2>
          <p className="text-gray-600 text-center text-lg">
            {gameState === "hint"
              ? "Enter a hint with two options. For example: 'Lives in water, Lives on land'"
              : "Do you know what animal it is? Enter your guess."}
          </p>
        </CardContent>
      </Card>

      {/* Hint history */}
      {hintTree.children.length > 0 && (
        <Card className="card-hint slide-in" style={{ animationDelay: "0.2s" }}>
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold mb-6 text-center text-blue-700 flex items-center justify-center">
              <span role="img" aria-label="history" className="mr-3 text-3xl">
                📝
              </span>
              Hint History
            </h2>
            <div className="overflow-auto max-h-96 px-2">
              <TreeNode node={hintTree} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input form */}
      <Card
        className={`card-input slide-in ${isShaking ? "shake" : ""}`}
        style={{ animationDelay: "0.3s" }}
      >
        <CardContent className="p-8">
          {gameState === "hint" ? (
            <form onSubmit={handleHintSubmit} className="space-y-6">
              <Input
                value={hintInput}
                onChange={(e) => setHintInput(e.target.value)}
                placeholder="Enter two options like 'option1, option2'"
                disabled={processingHint}
                className="input-animal text-lg"
              />
              <div className="flex flex-wrap items-center gap-4 justify-center">
                <Button
                  type="submit"
                  disabled={processingHint || !hintInput}
                  className="btn-hint"
                >
                  {processingHint ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2">🔄</span>{" "}
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <span className="mr-2">📤</span> Submit
                    </span>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={switchToGuess}
                  className="btn-animal"
                >
                  <span className="flex items-center">
                    <span className="mr-2">🎯</span> Guess the Animal
                  </span>
                </Button>

                <div className="flex items-center ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleShowAnswer}
                    className="btn-answer"
                  >
                    <span className="flex items-center">
                      <span className="mr-2">👀</span> Show Answer
                    </span>
                  </Button>
                  {showAnswer && (
                    <div className="ml-3 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-bold answer-reveal border-2 border-blue-300 text-lg">
                      {secretAnimal}
                    </div>
                  )}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleGuessSubmit} className="space-y-6">
              <Input
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="Enter animal name"
                disabled={loading}
                className="input-animal text-lg"
              />
              <div className="flex flex-wrap items-center gap-4 justify-center">
                <Button
                  type="submit"
                  disabled={loading || !guessInput}
                  className="btn-animal"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2">🔄</span> Checking...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <span className="mr-2">🎯</span> Submit Guess
                    </span>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={switchToHint}
                  className="btn-hint"
                >
                  <span className="flex items-center">
                    <span className="mr-2">💡</span> Back to Hints
                  </span>
                </Button>

                <div className="flex items-center ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleShowAnswer}
                    className="btn-answer"
                  >
                    <span className="flex items-center">
                      <span className="mr-2">👀</span> Show Answer
                    </span>
                  </Button>
                  {showAnswer && (
                    <div className="ml-3 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-bold answer-reveal border-2 border-blue-300 text-lg">
                      {secretAnimal}
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}

          {result && (
            <div
              className={`mt-6 p-6 rounded-2xl ${
                result === "correct"
                  ? "bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300"
                  : "bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300"
              } slide-in`}
            >
              {result === "correct" ? (
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-green-700 mb-4 pulse">
                    <span role="img" aria-label="correct" className="mr-3">
                      🎉
                    </span>
                    Correct!
                  </h3>
                  <p className="text-xl mb-4">
                    Amazing! The answer was "{secretAnimal}"!
                  </p>
                  <div className="flex justify-center mt-6 space-x-4">
                    <AnimalIcon className="animate-bounce">🎊</AnimalIcon>
                    <AnimalIcon className="animate-bounce delay-100">
                      🎉
                    </AnimalIcon>
                    <AnimalIcon className="animate-bounce delay-200">
                      🎊
                    </AnimalIcon>
                  </div>
                  <Button onClick={resetGame} className="mt-6 btn-animal">
                    <span className="flex items-center">
                      <span className="mr-2">🔄</span> Play Again
                    </span>
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-red-700 mb-3">
                    <span role="img" aria-label="incorrect" className="mr-2">
                      ❌
                    </span>
                    Incorrect
                  </h3>
                  <p className="text-lg">Sorry! Try thinking a bit more.</p>
                  <Button
                    onClick={switchToHint}
                    variant="outline"
                    className="mt-4 btn-hint"
                  >
                    <span className="flex items-center">
                      <span className="mr-2">💡</span> Back to Hints
                    </span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
