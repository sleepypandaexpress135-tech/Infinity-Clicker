
import { GameState, Tier } from '../types';

export const getNewsHeadline = (state: GameState): string => {
  const headlines: string[] = [];

  // --- Tier Based News ---
  if (state.currentTier === Tier.QUANTUM) {
    headlines.push("News: Electron discovered in two places at once, refuses to apologize.");
    headlines.push("Local physicist claims they found the 'God Particle', turns out it was just a crumb.");
    headlines.push("Schrödinger's Cat demands royalties for unauthorized use of likeness.");
    headlines.push("Quantum fluctuation creates brief moment of awkward silence.");
    headlines.push("Study: 90% of vacuum energy is just wasted potential.");
    headlines.push("News: Subatomic particles go on strike, demand 'observable' working conditions.");
  }

  if (state.currentTier === Tier.MACROCOSM) {
    headlines.push("News: Gravity still working, sources confirm.");
    headlines.push("Planet formation ahead of schedule, inhabitants confused.");
    headlines.push("Evolutionary biologist puzzled by sudden appearance of digital watches.");
    headlines.push("Tectonic plates agree to disagree.");
    headlines.push("Primordial soup rated 'too salty' by food critics.");
    headlines.push("News: Local asteroid belt designated as 'hazardous parking zone'.");
  }
  
  if (state.currentTier === Tier.COSMIC) {
    headlines.push("News: Local star goes supernova, property values plummet.");
    headlines.push("Black hole merger creates traffic jam in Sector 7.");
    headlines.push("Galaxy rotation curve still confusing astronomers.");
    headlines.push("Dark Matter: Is it just shy?");
    headlines.push("Interstellar highway bypass approved, Earth scheduled for demolition.");
    headlines.push("News: Dyson Sphere construction delayed due to lack of permits.");
  }

  if (state.currentTier === Tier.MULTIVERSAL) {
     headlines.push("News: Other version of you doing much better, report says.");
     headlines.push("Timeline bifurcation causing headaches for local historians.");
     headlines.push("News: 5th Dimension currently closed for renovations.");
  }

  // --- Resource Thresholds ---
  if (state.resources < 100) {
      headlines.push("News: Universe budget cuts imminent.");
      headlines.push("Starter atoms now 50% off at participating retailers.");
      headlines.push("Tip: Clicking things makes numbers go up.");
  } else if (state.resources > 10000 && state.resources < 100000) {
      headlines.push("News: Entropy levels rising, cleaning crews dispatched.");
      headlines.push("Investment tip: Buy low, expand forever.");
      headlines.push("News: Scientists astonished by how much stuff there is.");
  } else if (state.resources > 1000000) {
      headlines.push("News: Local entity achieves 'Millionaire' status, still can't find keys.");
      headlines.push("Too much matter? Scientists suggest shoving it under the rug.");
      headlines.push("News: Economic inflation affecting Planck lengths.");
  }

  // --- Building Specifics ---
  const buildings = state.buildings;
  
  const cursorCount = buildings.find(b => b.id === 'b_cursor')?.count || 0;
  if (cursorCount > 10) {
      headlines.push(`News: "Stop poking me!" yells fabric of reality.`);
      headlines.push("News: Quantum ripples causing mild tremors in tea cups.");
  }
  
  const droneCount = buildings.find(b => b.id === 'b_drone')?.count || 0;
  if (droneCount > 5) {
      headlines.push("News: Matter Weavers knit nice sweaters, also universe fabric.");
      headlines.push("Fabric of space-time reportedly 'itchy'.");
  }

  // --- Random Nonsense ---
  headlines.push("News: 404 - Universe Not Found.");
  headlines.push("Quote: 'It works on my machine.' - The Architect.");
  headlines.push("News: Color 'Blurple' invented.");
  headlines.push("News: Mathematics discovers new integer between 5 and 6.");
  headlines.push("News: Entropy isn't what it used to be.");
  headlines.push("Ad: Tired of existing? Try the Void!");
  headlines.push("News: Local man yells at cloud, cloud yells back.");
  headlines.push("News: Simulation lag spike detected. Did you blink?");

  // Fallback
  if (headlines.length === 0) return "News: Nothing is happening. Suspiciously so.";

  return headlines[Math.floor(Math.random() * headlines.length)];
};
