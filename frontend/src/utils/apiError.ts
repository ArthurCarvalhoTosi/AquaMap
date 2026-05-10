import axios from "axios";

/**
 * Extrai texto legível de respostas da API (ASP.NET ProblemDetails, validação,
 * `{ message }`, erros de rede).
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data;

    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;

      if (typeof d.message === "string" && d.message.trim()) {
        return d.message.trim();
      }

      // ASP.NET Core ValidationProblemDetails — mensagens por campo
      const rawErrors = d.errors;
      if (rawErrors && typeof rawErrors === "object" && !Array.isArray(rawErrors)) {
        const lines: string[] = [];
        for (const msgs of Object.values(rawErrors)) {
          if (Array.isArray(msgs)) {
            for (const m of msgs) {
              if (typeof m === "string" && m.trim()) lines.push(m.trim());
            }
          } else if (typeof msgs === "string" && msgs.trim()) {
            lines.push(msgs.trim());
          }
        }
        if (lines.length > 0) return [...new Set(lines)].join("\n");
      }

      if (typeof d.detail === "string" && d.detail.trim()) {
        return d.detail.trim();
      }

      if (typeof d.title === "string" && d.title.trim()) {
        const title = d.title.trim();
        if (title !== "One or more validation errors occurred.") return title;
      }
    }

    if (!err.response) {
      return err.message === "Network Error"
        ? "Não foi possível conectar ao servidor. Verifique sua conexão."
        : fallback;
    }

    if (status === 403) {
      return "Você não tem permissão para esta ação.";
    }
  }

  return fallback;
}
