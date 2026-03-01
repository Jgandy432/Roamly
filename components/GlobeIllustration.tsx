import React from 'react';
import Svg, { Circle, Ellipse, Path, Line, Rect, G, Polygon } from 'react-native-svg';

interface GlobeIllustrationProps {
  size?: number;
}

export default function GlobeIllustration({ size = 260 }: GlobeIllustrationProps) {

  return (
    <Svg width={size} height={size} viewBox="0 0 260 260" fill="none">
      <Circle cx="130" cy="140" r="90" fill="#FFF5F5" stroke="#FFD6D6" strokeWidth="2" />

      <Ellipse cx="130" cy="140" rx="90" ry="30" stroke="#FFD6D6" strokeWidth="1.5" strokeDasharray="4 3" />
      <Ellipse cx="130" cy="110" rx="75" ry="20" stroke="#FFD6D6" strokeWidth="1.5" strokeDasharray="4 3" />
      <Ellipse cx="130" cy="170" rx="75" ry="20" stroke="#FFD6D6" strokeWidth="1.5" strokeDasharray="4 3" />

      <Path d="M130 50 Q170 95 130 140 Q90 185 130 230" stroke="#FFD6D6" strokeWidth="1.5" strokeDasharray="4 3" />
      <Path d="M130 50 Q90 95 130 140 Q170 185 130 230" stroke="#FFD6D6" strokeWidth="1.5" strokeDasharray="4 3" />
      <Line x1="130" y1="50" x2="130" y2="230" stroke="#FFD6D6" strokeWidth="1.5" strokeDasharray="4 3" />

      <Path d="M100 115 Q108 100 120 108 Q130 112 125 125 Q118 132 108 128 Q98 124 100 115Z" fill="#FF5C5C" opacity="0.7" />
      <Path d="M135 125 Q148 115 158 122 Q168 130 162 145 Q154 155 142 150 Q132 142 135 125Z" fill="#FF5C5C" opacity="0.6" />
      <Path d="M105 148 Q115 140 128 148 Q135 158 125 165 Q113 168 106 160Z" fill="#FFBA00" opacity="0.7" />
      <Path d="M145 105 Q152 98 160 104 Q166 112 158 118 Q150 122 144 115Z" fill="#FFBA00" opacity="0.6" />

      <Circle cx="152" cy="108" r="10" fill="#FF5C5C" />
      <Circle cx="152" cy="108" r="5" fill="white" />
      <Line x1="152" y1="118" x2="152" y2="130" stroke="#FF5C5C" strokeWidth="2.5" strokeLinecap="round" />

      <G transform="translate(75, 75) rotate(-30)">
        <Polygon points="0,-7 20,0 0,7" fill="#FF5C5C" />
        <Rect x="-12" y="-2" width="12" height="4" rx="2" fill="#FF5C5C" />
        <Polygon points="-6,-2 0,-7 4,-2" fill="#FF5C5C" opacity="0.6" />
        <Polygon points="-6,2 0,7 4,2" fill="#FF5C5C" opacity="0.6" />
      </G>

      <Path d="M88 82 Q110 60 152 108" stroke="#FF5C5C" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.5" />

      <Rect x="28" y="58" width="68" height="38" rx="12" fill="white" stroke="#f0f0f0" strokeWidth="2" />
      <Circle cx="44" cy="75" r="7" fill="#FFD6D6" />
      <Circle cx="58" cy="75" r="7" fill="#FF5C5C" opacity="0.5" />
      <Circle cx="72" cy="75" r="7" fill="#FFBA00" opacity="0.6" />
      <Rect x="38" y="86" width="48" height="4" rx="2" fill="#f0f0f0" />
    </Svg>
  );
}
