import React from 'react';

type Status = 'connecting' | 'connected' | 'disconnected';

interface ConnectionStatusProps {
  status: Status;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status, showLabel = true, size = 'small' }) => {
  const statusConfig = {
    connecting: { 
      color: 'bg-yellow-500', 
      text: 'Connecting to Firebase...', 
      bgColor: 'bg-yellow-900/30',
      borderColor: 'border-yellow-500/50',
      textColor: 'text-yellow-300'
    },
    connected: { 
      color: 'bg-green-500', 
      text: 'Firebase Connected - Real-time sync active', 
      bgColor: 'bg-green-900/30',
      borderColor: 'border-green-500/50',
      textColor: 'text-green-300'
    },
    disconnected: { 
      color: 'bg-red-500', 
      text: 'Disconnected from Firebase - Changes will not be saved', 
      bgColor: 'bg-red-900/30',
      borderColor: 'border-red-500/50',
      textColor: 'text-red-300'
    },
  };

  const { color, text, bgColor, borderColor, textColor } = statusConfig[status];
  
  const sizeConfig = {
    small: { dot: 'w-3 h-3', text: 'text-xs', padding: 'px-2 py-1' },
    medium: { dot: 'w-4 h-4', text: 'text-sm', padding: 'px-3 py-2' },
    large: { dot: 'w-5 h-5', text: 'text-base', padding: 'px-4 py-2' }
  };
  
  const { dot, text: textSize, padding } = sizeConfig[size];

  if (!showLabel) {
    return (
      <div className="flex items-center gap-2" title={text}>
        <span className={`${dot} rounded-full ${color} ${status !== 'connected' ? 'animate-pulse' : ''}`} />
        <span className={`${textSize} text-gray-400 hidden sm:inline`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${padding} rounded-lg ${bgColor} border ${borderColor}`} title={text}>
      <span className={`${dot} rounded-full ${color} ${status !== 'connected' ? 'animate-pulse' : ''}`} />
      <span className={`${textSize} font-medium ${textColor}`}>
        {text}
      </span>
    </div>
  );
};

export default ConnectionStatus;
