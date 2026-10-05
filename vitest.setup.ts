import { vi } from "vitest";

// jsdom não implementa HTMLImageElement.decode() nem URL.createObjectURL/
// revokeObjectURL — sem isso, testes que esperam um <img> carregar, ou que
// capturam convites via blob: URL (ConviteDoDia), nunca resolveriam. Guard por
// `typeof window` porque o ambiente default do projeto é "node"; só os testes
// com `// @vitest-environment jsdom` têm window.
if (typeof window !== "undefined") {
  HTMLImageElement.prototype.decode = vi.fn().mockResolvedValue(undefined);

  let proximaBlobUrl = 0;
  URL.createObjectURL = vi.fn(() => `blob:mock-${proximaBlobUrl++}`);
  URL.revokeObjectURL = vi.fn();
}
