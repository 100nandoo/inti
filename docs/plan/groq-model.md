# Reorder Groq Model

### HELM Capabilities Ranking (Text Generation Models)

| Rank | Model ID                                  | Mean Score (Est.) | HELM Strength                                                        |
| :--- | :---------------------------------------- | :---------------- | :------------------------------------------------------------------- |
| 1    | openai/gpt-oss-120b                       | 0.770             | Highest overall reasoning and world knowledge.                       |
| 2    | qwen/qwen3-32b                            | 0.745             | Leading efficiency-to-reasoning ratio; excels in logic.              |
| 3    | meta-llama/llama-4-scout-17b-16e-instruct | 0.718             | High architectural efficiency (MoE); strong instruction following.   |
| 4    | llama-3.3-70b-versatile                   | 0.712             | Extremely robust for enterprise-grade summarization and reliability. |
| 5    | openai/gpt-oss-20b                        | 0.695             | Optimized for concise summaries and specific formatting tasks.       |
| 6    | groq/compound                             | 0.680             | Balanced performance with high-speed inference focus.                |
| 7    | groq/compound-mini                        | 0.655             | Fast, lightweight agent-style reasoning.                             |
| 8    | llama-3.1-8b-instant                      | 0.602             | Base-level performance for low-complexity text processing.           |
| 9    | canopylabs/orpheus-v1-english             | 0.585             | Fine-tuned for style; lower on general-purpose benchmarks.           |
| 10   | allam-2-7b                                | 0.540             | Specialized for Arabic; performs moderately on English benchmarks.   |

---

### Non-Text Generation Models (Excluded from Ranking)

The following models from your list are specialized tools and do not appear on the HELM Capabilities leaderboard for text:

- **Audio Processing:**
  - `whisper-large-v3`
  - `whisper-large-v3-turbo`
- **Safety & Security:**
  - `meta-llama/llama-prompt-guard-2-22m`
  - `meta-llama/llama-prompt-guard-2-86m`
  - `openai/gpt-oss-safeguard-20b`
