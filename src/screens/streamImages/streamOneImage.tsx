import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
  Image,
  Platform,
} from 'react-native';
import * as Helper from '../../utils/helper';
import FastImage from 'react-native-fast-image';
import Carousel, {ICarouselInstance} from 'react-native-reanimated-carousel';
import {useSharedValue} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import KeyEvent, {KeyEventProps} from 'react-native-keyevent';
import {useFocusEffect} from '@react-navigation/native';

interface RouteParams {
  imageUrl: string;
  attribute?: {
    frame?: string;
    mount?: string;
    matte?: string;
  };
  customization?: {
    frameColor?: string;
    mountColor?: string;
    matteColor?: string;
  };
}

interface StreamOneProps {
  route: {
    params: RouteParams;
  };
  navigation: {
    goBack: () => void;
  };
}

const StreamOneImage = (streamImageProps: StreamOneProps) => {
  const [isLoading, setLoading] = useState(true);
  const {imageUrl, attribute, customization} = streamImageProps.route.params;
  const [collectionData, setCollectionData] = useState<string[]>([]);

  const SCREEN_WIDTH = useWindowDimensions().width;
  const SCREEN_HEIGHT = useWindowDimensions().height;
  const SCROLL_OFFSET_VALUE = useSharedValue<number>(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const carouselRef = useRef<ICarouselInstance>(null);

  const [focused, setFocused] = useState('BACK_BUTTON');

  useEffect(() => {
    const initializeImage = async () => {
      if (imageUrl) {
        setCollectionData([imageUrl]);
        await preloadImages([imageUrl]);
      } else {
        setLoading(false);
      }
    };

    initializeImage();
  }, [imageUrl]);

  const preloadImages = async (images: string[]): Promise<void> => {
    try {
      const prefetchPromises = images.map(imageUri => Image.prefetch(imageUri));
      await Promise.all(prefetchPromises);
    } catch (error) {
      console.error('Error preloading images:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({item}: {item: string}) => {
    const frameWidth = attribute?.frame ? parseInt(attribute.frame, 10) : 0;
    const mountWidth = attribute?.mount ? parseInt(attribute.mount, 10) : 0;
    const matteWidth = attribute?.matte ? parseInt(attribute.matte, 10) : 0;

    return (
      <View style={styles.itemContainer}>
        <View
          style={[
            styles.frameContainer,
            {
              backgroundColor: customization?.frameColor || 'transparent',
              padding: frameWidth,
            },
          ]}>
          <View
            style={[
              styles.mountContainer,
              {
                backgroundColor: customization?.mountColor || 'transparent',
                padding: mountWidth,
              },
            ]}>
            <View
              style={[
                styles.matteContainer,
                {
                  backgroundColor: customization?.matteColor || 'transparent',
                  padding: matteWidth,
                },
              ]}>
              <FastImage
                source={{uri: item}}
                style={styles.image}
                resizeMode={FastImage.resizeMode.contain}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  useFocusEffect(
    useCallback(() => {
      setFocused('BACK_BUTTON');
      if (Platform.OS === 'android') {
        const keyHandler = (keyEvent: KeyEventProps) => {
          switch (keyEvent.keyCode) {
            case 23: // KEYCODE_DPAD_CENTER (OK/Select button)
              if (focused === 'BACK_BUTTON') {
                streamImageProps.navigation.goBack();
              }
              break;
            case 19: // KEYCODE_DPAD_UP
            case 20: // KEYCODE_DPAD_DOWN
            case 21: // KEYCODE_DPAD_LEFT
            case 22: // KEYCODE_DPAD_RIGHT
              setFocused('BACK_BUTTON');
              break;
            case 4: // KEYCODE_BACK
              break;
            default:
              break;
          }
        };

        KeyEvent.removeKeyDownListener();

        KeyEvent.onKeyDownListener(keyHandler);

        return () => {
          KeyEvent.removeKeyDownListener();
        };
      }
    }, [focused, streamImageProps.navigation]),
  );

  const handleBackPress = () => {
    streamImageProps.navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.backControls}>
        <TouchableOpacity
          hasTVPreferredFocus={focused === 'BACK_BUTTON'}
          focusable={true}
          onFocus={() => setFocused('BACK_BUTTON')}
          onPress={handleBackPress}
          style={[
            styles.backButton,
            focused === 'BACK_BUTTON' && styles.focusedButton,
          ]}
          accessibilityLabel="Go back"
          accessibilityRole="button">
          <Ionicons name="chevron-back" size={25} color="white" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="white" />
        </View>
      ) : collectionData.length > 0 ? (
        <Carousel
          loop
          enabled
          ref={carouselRef}
          defaultScrollOffsetValue={SCROLL_OFFSET_VALUE}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          data={collectionData}
          autoPlay={isAutoPlay}
          scrollAnimationDuration={4000}
          renderItem={renderItem}
        />
      ) : (
        <View style={styles.loaderContainer}>
          <Text style={styles.errorText}>No image data available</Text>
        </View>
      )}
    </View>
  );
};

export default StreamOneImage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Helper.Colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
  },
  backControls: {
    position: 'absolute',
    top: 20,
    left: 10,
    zIndex: 999,
  },
  backButton: {
    padding: 2,
    borderRadius: 25,
  },
  focusedButton: {
    borderColor: 'white',
    borderWidth: 1,
    transform: [{scale: 1.1}],
  },
  itemContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameContainer: {
    height: '100%',
    width: '100%',
  },
  mountContainer: {
    height: '100%',
    width: '100%',
  },
  matteContainer: {
    height: '100%',
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
