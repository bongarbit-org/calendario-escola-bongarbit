import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calendário — Escola Bongarbit",
  description: "As aulas e encontros da Escola de Luteria Bongarbit, de setembro em diante.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
