import type { Metadata } from "next";
import { Noto_Sans_Thai, Playfair_Display } from "next/font/google";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({ variable: "--font-thai", subsets: ["thai", "latin"] });
const playfair = Playfair_Display({ variable: "--font-display", subsets: ["latin"] });
export const metadata: Metadata = { title: "TDFB Personality Quest", description: "ค้นพบรูปแบบการคิด แรงขับภายใน และวิธีเติบโตในแบบของคุณ" };
export default function RootLayout({ children }: LayoutProps<"/">) { return <html lang="th" className={`${notoSansThai.variable} ${playfair.variable}`}><body>{children}</body></html>; }
