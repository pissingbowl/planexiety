"use client";

import { OTIEAvatar } from './OTIEAvatar';

interface ChatMessageProps {
  role: 'user' | 'otie';
  content: string;
  anxietyState?: 'grounded' | 'alert' | 'elevated' | 'acute' | 'crisis';
}

export function ChatMessage({ role, content, anxietyState = 'grounded' }: ChatMessageProps) {
  if (role === 'otie') {
    return (
      <div className="message-wrapper message-otie-wrapper">
        <OTIEAvatar size="mini" anxietyState={anxietyState} />
        <div className="message-otie">
          {content.split('\n\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="message-wrapper message-user-wrapper">
      <div className="message-user">
        <p>{content}</p>
      </div>
    </div>
  );
}
