"use client";

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
}

export function ToolCard({ icon, title, description, onClick }: ToolCardProps) {
  return (
    <div className="tool-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="tool-card-icon">
        {icon}
      </div>
      <div className="tool-card-content">
        <h3 className="tool-card-title">{title}</h3>
        <p className="tool-card-description">{description}</p>
      </div>
      <div className="tool-card-arrow">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  );
}
