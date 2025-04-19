type HintNode = {
  hint: string
  options: [string, string]
  correctOption: string | null
  children: HintNode[]
}

interface TreeNodeProps {
  node: HintNode
  level?: number
}

export function TreeNode({ node, level = 0 }: TreeNodeProps) {
  // Skip rendering the root node
  if (level === 0 && node.hint === "ルート") {
    return (
      <div className="pl-4">
        {node.children.map((child, index) => (
          <TreeNode key={index} node={child} level={level + 1} />
        ))}
      </div>
    )
  }

  return (
    <div className={`mb-8 ${level > 0 ? "ml-10 relative" : ""}`}>
      {level > 0 && (
        <div className="absolute left-0 top-0 h-full w-0 border-l-2 border-dashed border-blue-300 -ml-5"></div>
      )}

      <div className="mb-4 font-medium text-purple-700 bg-purple-50 p-3 rounded-lg inline-block shadow-sm border border-purple-200 transition-all duration-300 hover:shadow-md hover:bg-purple-100">
        <span role="img" aria-label="question" className="mr-2 text-xl">
          ❓
        </span>
        {node.hint}
      </div>

      <div className="flex space-x-6 mb-6">
        {node.options.map((option, index) => {
          // Determine if this option is the correct one
          const isCorrectOption = node.correctOption && option === node.correctOption

          return (
            <div
              key={index}
              className={`flex-1 ${
                isCorrectOption ? "tree-node-correct" : "tree-node-incorrect"
              } transition-all duration-300`}
            >
              <div className="text-center">
                <div className="text-lg">{option}</div>
                {isCorrectOption && (
                  <div className="mt-2 text-sm text-blue-600 font-bold flex items-center justify-center">
                    <span role="img" aria-label="correct" className="mr-1">
                      ✅
                    </span>
                    正解!
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {node.children.map((child, index) => (
        <TreeNode key={index} node={child} level={level + 1} />
      ))}
    </div>
  )
}
