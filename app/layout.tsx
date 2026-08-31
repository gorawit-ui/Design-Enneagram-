import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guild Within — Personality Expedition",
  description: "กิจกรรมสำรวจแนวโน้ม MBTI และ Enneagram สำหรับการทำงานร่วมกัน",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
