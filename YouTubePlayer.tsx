import React, { useEffect } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  playerRef: React.MutableRefObject<any>;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId, playerRef }) => {
  useEffect(() => {
    
    function initializePlayer() {
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
            playerRef.current.destroy();
        }
        playerRef.current = new (window as any).YT.Player('youtube-player', {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            'playsinline': 1
          },
        });
    }

    if (!(window as any).YT || !(window as any).YT.Player) {
        (window as any).onYouTubeIframeAPIReady = initializePlayer;
    } else {
        initializePlayer();
    }

    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
            playerRef.current.destroy();
        } catch(e) {
            console.error("Error destroying YouTube player", e);
        }
      }
    };
  }, [videoId, playerRef]);

  return <div id="youtube-player" className="w-full h-full rounded-lg overflow-hidden bg-black"></div>;
};