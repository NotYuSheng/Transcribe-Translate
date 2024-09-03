import React from 'react';

const MediaPlayer = ({ fileUrl }) => {
  // Determine the media type (audio or video)
  const isVideo = fileUrl.match(/\.mp4$|\.mkv$|\.avi$|\.mov$/i);

  return (
    <div>
      {isVideo ? (
        <video controls width="600">
          <source src={fileUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <audio controls>
          <source src={fileUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
};

export default MediaPlayer;