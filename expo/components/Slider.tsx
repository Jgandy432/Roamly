import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';
import { Colors } from '@/constants/colors';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  onValueChange: (value: number) => void;
}

export default function Slider({ value, min, max, onValueChange }: SliderProps) {
  const widthRef = useRef<number>(200);
  const fraction = (value - min) / (max - min);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const x = e.nativeEvent.locationX;
        const newVal = Math.round(min + (x / widthRef.current) * (max - min));
        onValueChange(Math.max(min, Math.min(max, newVal)));
      },
      onPanResponderMove: (e) => {
        const x = e.nativeEvent.locationX;
        const newVal = Math.round(min + (x / widthRef.current) * (max - min));
        onValueChange(Math.max(min, Math.min(max, newVal)));
      },
    })
  ).current;

  return (
    <View style={styles.container} onLayout={onLayout} {...panResponder.panHandlers}>
      <View style={styles.track}>
        <View style={[styles.filled, { width: `${fraction * 100}%` }]} />
      </View>
      <View style={[styles.thumb, { left: `${fraction * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  filled: {
    height: 4,
    backgroundColor: Colors.orange,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.orange,
    marginLeft: -10,
    top: 8,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});
