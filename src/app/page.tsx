import { Nav } from "@/components/sections/Nav";
import { Hero } from "@/components/sections/Hero";
import { MarqueeBand } from "@/components/sections/MarqueeBand";
import { Problem } from "@/components/sections/Problem";
import { Statement } from "@/components/sections/Statement";
import { Pillars } from "@/components/sections/Pillars";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Outbound } from "@/components/sections/Outbound";
import { Moat } from "@/components/sections/Moat";
import { SocialProof } from "@/components/sections/SocialProof";
import { Pricing } from "@/components/sections/Pricing";
import { ClosingCTA } from "@/components/sections/ClosingCTA";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <MarqueeBand />
        <Problem />
        <Statement />
        <Pillars />
        <HowItWorks />
        <Outbound />
        <Moat />
        <SocialProof />
        <Pricing />
        <ClosingCTA />
      </main>
      <Footer />
    </>
  );
}
