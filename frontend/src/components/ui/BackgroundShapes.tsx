/**
 * BackgroundShapes Component
 * Subtle floating ambient orbs for depth and premium feel
 * Fixed position, no layout impact (-z-10)
 */

export default function BackgroundShapes() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="floating-shape floating-shape-1" />
      <div className="floating-shape floating-shape-2" />
      <div className="floating-shape floating-shape-3" />
    </div>
  );
}
