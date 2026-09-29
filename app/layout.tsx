import type { Metadata } from "next";
import { Sarabun, Playfair_Display } from "next/font/google";
import "./globals.css";

// Sarabun, chosen on measurement rather than taste. The complaint was "ผอมๆ แบนๆ อ่านยาก" -- thin,
// flat, hard to read -- and the request was a looped face (มีหัว). Of the six looped Thai families
// measured in the running app (npm run type:overflow, at 390/768/900/1280), two survive every
// viewport without new overflow: Sarabun and Noto Sans Thai Looped. That script did not measure
// 430px, and that is where Sarabun's extra width showed: the welcome title ran 5px past a 430px
// phone. The title now sizes itself from its own column (globals.css, "THE WELCOME TITLE"). Against the Noto Sans Thai this replaces, Sarabun
// sets 7% taller and inks 22% heavier at the same size while running only 5% wider -- which answers
// both "flat" and "thin". Noto Sans Thai Looped is the same skeleton with loops added, and moves
// only 4% and 14%: it fixes the loops and half of the rest. IBM Plex Sans Thai Looped scrolled the
// page sideways at 390px; Niramit overflowed the hero at 1280px.
//
// Not a variable font, so the weights are listed. The CSS asks for 400/500/600/700; the five places
// that asked for 650 now ask for 600, because Sarabun has no 650 and would otherwise have rounded
// them up to 700 without saying so.
const sarabun = Sarabun({ variable: "--font-thai", subsets: ["thai", "latin"], weight: ["400", "500", "600", "700"] });
const playfair = Playfair_Display({ variable: "--font-display", subsets: ["latin"] });
export const metadata: Metadata = { title: "TDFB Personality Quest", description: "ค้นพบรูปแบบการคิด แรงขับภายใน และวิธีเติบโตในแบบของคุณ" };
export default function RootLayout({ children }: LayoutProps<"/">) { return <html lang="th" className={`${sarabun.variable} ${playfair.variable}`}><body>{children}</body></html>; }
