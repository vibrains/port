/**
 * ASCII Logo Component
 * Displays "Near&Dear" and "TimeKit" branding
 */

interface AsciiLogoProps {
  size?: 'small' | 'medium' | 'large';
  showSubtitle?: boolean;
  className?: string;
}

export function AsciiLogo({
  size = 'medium',
  showSubtitle = true,
  className = '',
}: AsciiLogoProps) {
  // Large version for login page
  if (size === 'large') {
    return (
      <div className={`text-center ${className}`}>
        <h1 className="text-4xl font-bold tracking-tight">Near&Dear</h1>
        {showSubtitle && <p className="text-muted-foreground mt-2 text-lg">TimeKit</p>}
      </div>
    );
  }

  // Medium version for headers
  if (size === 'medium') {
    return (
      <div className={`${className}`}>
        <span className="text-xl font-bold">Near&Dear</span>
        {showSubtitle && <span className="text-muted-foreground ml-2 text-sm">TimeKit</span>}
      </div>
    );
  }

  // Small version for compact spaces
  return (
    <div className={`${className}`}>
      <span className="font-semibold">Near&Dear</span>
    </div>
  );
}
