/**
 * Divider - Horizontal line with centered "or" text
 */

interface DividerProps {
  text?: string;
}

export function Divider({ text = 'or' }: DividerProps) {
  return (
    <div className="relative flex items-center my-6">
      <div className="flex-grow border-t border-gray-200" />
      <span className="flex-shrink px-4 text-sm text-gray-400">{text}</span>
      <div className="flex-grow border-t border-gray-200" />
    </div>
  );
}

export default Divider;
