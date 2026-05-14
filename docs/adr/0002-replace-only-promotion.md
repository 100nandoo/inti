# Replace-only promotion in the text workspace

Inti will no longer support appending a **Transform Result** into **Working Text**. Promotion now means only one thing: explicitly replacing the current **Working Text** with the latest result. We chose this because append adds state and UI complexity to the workspace, makes the next action less obvious, and conflicts with the direction toward a smaller, more opinionated tool.
