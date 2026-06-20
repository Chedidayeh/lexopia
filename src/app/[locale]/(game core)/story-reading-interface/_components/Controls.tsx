"use client";

import { CirclePause, CirclePlay, Pause, Play } from "lucide-react";
import { useState, useEffect } from "react";

interface TTSControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
}

const Controls = ({ isPlaying, onPlayPause }: TTSControlsProps) => {
  return (
    <button
      onClick={onPlayPause}
      className="w-11 h-11 text-white bg-accent rounded-full flex items-center justify-center shadow-warm hover:scale-110 transition-smooth"
      aria-label={isPlaying ? "Pause reading" : "Play reading"}
    >
      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
    </button>
  );
};

export default Controls;
