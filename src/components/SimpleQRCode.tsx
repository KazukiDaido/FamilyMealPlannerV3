import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface SimpleQRCodeProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

// 簡単なQRコード風のパターンを生成
const generateQRPattern = (value: string, size: number) => {
  const pattern = [];
  const hash = value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // シンプルなパターンを生成（実際のQRコードではありませんが、視覚的にQRコード風）
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const shouldFill = ((i + j + hash) % 3 === 0) || 
                        ((i * j + hash) % 5 === 0) || 
                        (i === 0 || i === size - 1 || j === 0 || j === size - 1) ||
                        (i === size - 7 && j === size - 7) || // コーナーマーカー風
                        (i === 6 && j === 6) ||
                        (i === size - 7 && j === 6) ||
                        (i === 6 && j === size - 7);
      
      if (shouldFill) {
        pattern.push({ x: j, y: i });
      }
    }
  }
  
  return pattern;
};

const SimpleQRCode: React.FC<SimpleQRCodeProps> = ({
  value,
  size = 200,
  color = '#000000',
  backgroundColor = '#FFFFFF'
}) => {
  const pattern = generateQRPattern(value, 25); // 25x25のグリッド
  const cellSize = size / 25;
  
  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor }]}>
      <Svg width={size} height={size}>
        {pattern.map((cell, index) => (
          <Rect
            key={index}
            x={cell.x * cellSize}
            y={cell.y * cellSize}
            width={cellSize}
            height={cellSize}
            fill={color}
          />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default SimpleQRCode;
