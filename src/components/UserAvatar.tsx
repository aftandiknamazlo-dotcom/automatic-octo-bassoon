import React from 'react';

interface UserAvatarProps {
  name: string;
  size?: number;
  gradient?: string[];
  className?: string;
  avatar?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  name, 
  size = 40, 
  gradient = ['#6c5ce7', '#a29bfe'], 
  className = '',
  avatar = '' 
}) => {
  const getInitials = (str: string) => {
    if (!str || str.length === 0) return '?';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <div 
      className={`user-avatar ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: avatar 
          ? '#0c0c14' 
          : `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 800,
        fontSize: size * 0.36,
        letterSpacing: '0.5px',
        flexShrink: 0,
        position: 'relative' as const,
        overflow: 'hidden',
        border: '2px solid rgba(255,255,255,0.08)',
        boxShadow: `0 4px 12px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1)`
      }}
    >
      {avatar ? (
        <img 
          src={avatar} 
          alt={name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)',
            pointerEvents: 'none'
          }} />
          <span style={{ position: 'relative', zIndex: 1 }}>{initials}</span>
        </>
      )}
    </div>
  );
};

export default UserAvatar;
