"use client";

interface OTIEAvatarProps {
  anxietyState?: 'grounded' | 'alert' | 'elevated' | 'acute' | 'crisis';
  size?: 'mini' | 'small' | 'medium' | 'large';
  className?: string;
}

const sizeStyles = {
  mini: { width: 40, height: 40 },
  small: { width: 60, height: 60 },
  medium: { width: 120, height: 120 },
  large: { width: 160, height: 160 },
};

export function OTIEAvatar({ 
  anxietyState = 'grounded', 
  size = 'medium',
  className = ''
}: OTIEAvatarProps) {
  const sizeClass = size === 'mini' ? 'otie-mini' : '';
  const dimensions = sizeStyles[size];
  
  return (
    <div 
      className={`otie-avatar ${sizeClass} ${className}`}
      data-anxiety={anxietyState}
      role="img"
      aria-label="OTIE, your flight companion"
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <div className="otie-avatar-glow" />
      <div className="otie-avatar-body">
        <div className="otie-eyes">
          <div className="otie-eye">
            <div className="otie-eye-pupil" />
          </div>
          <div className="otie-eye">
            <div className="otie-eye-pupil" />
          </div>
        </div>
      </div>
      {size !== 'mini' && (
        <div className="otie-tentacles">
          <div className="otie-tentacle" />
          <div className="otie-tentacle" />
          <div className="otie-tentacle" />
          <div className="otie-tentacle" />
          <div className="otie-tentacle" />
        </div>
      )}
    </div>
  );
}
