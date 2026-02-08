import React, { useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import * as Helper from '../../utils/helper';
import FastImage from 'react-native-fast-image';
import { useSharedValue } from 'react-native-reanimated';

const HorizontalTransaction = () => {
  const SCREEN_WIDTH = useWindowDimensions().width;
  const SCROLL_OFFSET_VALUE = useSharedValue<number>(0);

  const images: any = [
    'https://d2g5sv52edmk97.cloudfront.net/tv/background/1.jpg',
    'https://d2g5sv52edmk97.cloudfront.net/tv/background/2.jpg',
    'https://d2g5sv52edmk97.cloudfront.net/tv/background/3.jpg',
    'https://d2g5sv52edmk97.cloudfront.net/tv/background/4.jpg',
  ];

  useEffect(() => {
    FastImage.preload(images.map((uri: String) => ({ uri })));
  }, []);

  // Function to render each item in the carousel
  const renderItem = ({ item }: { item: string }) => {
    return (
      <View
        style={{
          flex: 1,
          borderWidth: 1,
          justifyContent: 'center',
        }}>
        <FastImage
          source={{ uri: item, priority: FastImage.priority.high }}
          style={{
            width: '100%',
            height: '100%',
          }}
          resizeMode={FastImage.resizeMode.cover}
        />
      </View>
    );
  };

  return (
    <Carousel
      loop
      enabled
      defaultScrollOffsetValue={SCROLL_OFFSET_VALUE}
      width={SCREEN_WIDTH}
      height={Helper.screenHeight}
      data={images}
      autoPlay
      style={{
        width: '100%',
        height: Helper.screenHeight,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      autoPlayInterval={500000} // 500 seconds (8+ minutes) per slide
      scrollAnimationDuration={1000} // 1 second slide transition
      renderItem={renderItem}
    />
  );
};

export default HorizontalTransaction;
