/* eslint-disable react-native/no-inline-styles */
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
  DeviceEventEmitter,
  BackHandler,
} from 'react-native';
import {useSelector} from 'react-redux';
import {RootState} from '../../store/store';
import * as Helper from '../../utils/helper';
import FastImage from 'react-native-fast-image';
import Carousel, {ICarouselInstance} from 'react-native-reanimated-carousel';
import {useSharedValue} from 'react-native-reanimated';
import {SvgXml} from 'react-native-svg';
import {
  Left,
  left_circle,
  pause_circle,
  play_circle,
  right_circle,
} from '../../assets/svg';
import WebSocketComponent from '../../utils/websocket';

interface RouteParams {
  collectionName: string;
  imageCollection?: string[];
  collectionId: string;
}

interface StreamImageProps {
  route: {
    params: RouteParams;
  };
  navigation: {
    goBack: () => void;
  };
}

const StreamImagePage = (streamImageProps: StreamImageProps) => {
  const [isLoading, setLoading] = useState(true);
  const {collections} = useSelector((state: RootState) => state?.collections);
  const {collectionName, imageCollection, collectionId} =
    streamImageProps.route.params;

  const [collectionData, setCollectionData] = useState<string[]>([]);
  const [attributeData, setAttributeData] = useState<any[]>([]);
  const [customizationData, setCustomizationData] = useState<any[]>([]);

  const [carouselTime, setCarouselTime] = useState(15);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isView, setIsView] = useState<boolean>(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [focusedElement, setFocusedElement] = useState<string>('PAUSE');

  const SCREEN_WIDTH = useWindowDimensions().width;
  const SCREEN_HEIGHT = useWindowDimensions().height;
  const SCROLL_OFFSET_VALUE = useSharedValue<number>(0);

  const carouselRef = React.useRef<ICarouselInstance>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Focus elements enum for better type safety
  const FOCUS_ELEMENTS = {
    BACK: 'BACK',
    PREVIOUS: 'PREVIOUS',
    PAUSE: 'PAUSE',
    NEXT: 'NEXT',
  } as const;

  const preloadImages = useCallback(async (images: string[]): Promise<void> => {
    try {
      const prefetchPromises = images.map(imageUri => Image.prefetch(imageUri));
      await Promise.all(prefetchPromises);
    } catch (error) {
      console.error('Error preloading images:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const showControlsWithTimeout = useCallback((durationMs: number = 5000) => {
    setControlsVisible(true);

    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }

    hideControlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, durationMs);
  }, []);

  // Navigation/control handlers (declare before effects so they can be used in deps)
  const handlePreviousImage = useCallback(() => {
    carouselRef.current?.scrollTo({count: -1, animated: true});
    showControlsWithTimeout();
  }, [showControlsWithTimeout]);

  const handleNextImage = useCallback(() => {
    carouselRef.current?.scrollTo({count: 1, animated: true});
    showControlsWithTimeout();
  }, [showControlsWithTimeout]);

  const handleBackPress = useCallback(() => {
    streamImageProps.navigation.goBack();
  }, [streamImageProps.navigation]);

  const handlePlayPause = useCallback(() => {
    setIsAutoPlay(prev => !prev);
    showControlsWithTimeout();
  }, [showControlsWithTimeout]);

  useEffect(() => {
    if (imageCollection && imageCollection?.length > 0) {
      const matched =
        collections && collections.length > 0
          ? collections.find(
              (collection: any) => collection?.collectionId === collectionId,
            )
          : null;
      setCollectionData(imageCollection);
      preloadImages(imageCollection);

      if (matched) {
        matched?.customization &&
          matched?.customization.forEach((item: any) => {
            if (item?.split(':')[0] === 'timer') {
              const timerValue = Number(item?.split(':')[1]);
              if (!isNaN(timerValue)) {
                setCarouselTime(timerValue);
              }
            }
          });
        const attributes = matched?.collectionsChild?.map(
          (item: any) => item?.attribute,
        );
        const customizations = matched?.collectionsChild?.map((item: any) => {
          if (item?.customization.split(':')[0] === 'timer') {
            const timerValue = Number(item?.customization.split(':')[1]);
            if (!isNaN(timerValue)) {
              setCarouselTime(timerValue);
            }
          }
          return item?.customization;
        });
        setAttributeData(attributes);
        setCustomizationData(customizations);
      } else {
        setLoading(false);
      }
    } else {
      const matched =
        collections && collections.length > 0
          ? collections.find(
              (collection: any) => collection?.collectionId === collectionId,
            )
          : null;
      if (matched) {
        matched?.customization &&
          matched?.customization.forEach((item: any) => {
            if (item?.split(':')[0] === 'timer') {
              const timerValue = Number(item?.split(':')[1]);
              if (!isNaN(timerValue)) {
                setCarouselTime(timerValue);
              }
            }
          });
        const images = matched?.collectionsChild?.map(
          (item: any) => item?.link,
        );

        const attributes = matched?.collectionsChild?.map(
          (item: any) => item?.attribute,
        );
        const customizations = matched?.collectionsChild?.map((item: any) => {
          return item?.customization;
        });
        setCollectionData(images);
        if (images.length === 1) {
          setIsAutoPlay(false);
        }
        setAttributeData(attributes);
        setCustomizationData(customizations);
        preloadImages(images);
      } else {
        setLoading(false);
      }
    }
  }, [collections, collectionName, imageCollection, collectionId, preloadImages]);

  // Show carousel after initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsView(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Auto-hide controls shortly after streaming starts
  useEffect(() => {
    if (isView && collectionData && collectionData.length > 0) {
      // Show briefly, then hide after 2 seconds for a clean fullscreen experience
      showControlsWithTimeout(2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isView, collectionData?.length]);

  // Handle key events for TV/Android TV navigation
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'onKeyDown',
      keyEvent => {
        showControlsWithTimeout();
        switch (keyEvent.keyCode) {
          case 23: // KEYCODE_DPAD_CENTER (OK/Select button)
            if (focusedElement === FOCUS_ELEMENTS.BACK) {
              handleBackPress();
            } else if (focusedElement === FOCUS_ELEMENTS.PREVIOUS) {
              handlePreviousImage();
            } else if (focusedElement === FOCUS_ELEMENTS.PAUSE) {
              setIsAutoPlay(prev => !prev);
            } else if (focusedElement === FOCUS_ELEMENTS.NEXT) {
              handleNextImage();
            }
            break;
          case 19: // KEYCODE_DPAD_UP
            setFocusedElement(FOCUS_ELEMENTS.BACK);
            break;
          case 20: // KEYCODE_DPAD_DOWN
            setFocusedElement(FOCUS_ELEMENTS.PREVIOUS);
            break;
          case 21: // KEYCODE_DPAD_LEFT
            if (focusedElement === FOCUS_ELEMENTS.BACK) {
              // Do nothing, already at leftmost
            } else if (focusedElement === FOCUS_ELEMENTS.PAUSE) {
              setFocusedElement(FOCUS_ELEMENTS.PREVIOUS);
            } else if (focusedElement === FOCUS_ELEMENTS.NEXT) {
              setFocusedElement(FOCUS_ELEMENTS.PAUSE);
            }
            break;
          case 22: // KEYCODE_DPAD_RIGHT
            if (focusedElement === FOCUS_ELEMENTS.BACK) {
              // Do nothing, back button doesn't navigate right
            } else if (focusedElement === FOCUS_ELEMENTS.PREVIOUS) {
              setFocusedElement(FOCUS_ELEMENTS.PAUSE);
            } else if (focusedElement === FOCUS_ELEMENTS.PAUSE) {
              setFocusedElement(FOCUS_ELEMENTS.NEXT);
            }
            break;
          case 4: // KEYCODE_BACK
            handleBackPress();
            break;
        }
      },
    );

    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    focusedElement,
    showControlsWithTimeout,
    handleBackPress,
    handleNextImage,
    handlePreviousImage,
  ]);

  // Intercept hardware back press to navigate back from this screen
  useEffect(() => {
    const onBackPress = () => {
      handleBackPress();
      return true; // consume event
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [handleBackPress]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  // handlers moved above

  const renderItem = ({item, index}: {item: string; index: number}) => {
    const attribute = attributeData[index]
      ? JSON.parse(attributeData[index])
      : {};
    const customization = customizationData[index]
      ? JSON.parse(customizationData[index])
      : {};

    return (
      <View style={styles.itemContainer}>
        <View
          style={[
            styles.frameContainer,
            {
              backgroundColor: customization?.frameColor || 'transparent',
              padding: attribute?.frame ? parseInt(attribute?.frame, 10) : 0,
            },
          ]}>
          <View
            style={[
              styles.mountContainer,
              {
                backgroundColor: customization?.mountColor || 'transparent',
                padding: attribute?.mount ? parseInt(attribute?.mount, 10) : 0,
              },
            ]}>
            <View
              style={[
                styles.matteContainer,
                {
                  backgroundColor: customization?.matteColor || 'transparent',
                  padding: attribute?.matte ? parseInt(attribute?.matte, 10) : 0,
                },
              ]}>
              <FastImage
                source={{uri: item, priority: FastImage.priority.high}}
                style={styles.image}
                resizeMode={FastImage.resizeMode.contain}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderControls = () => (
    <>
      {/* Bottom Controls */}
      <View style={[styles.controls, {opacity: controlsVisible ? 1 : 0}]}>
        <TouchableOpacity
          focusable={true}
          hasTVPreferredFocus={focusedElement === FOCUS_ELEMENTS.PREVIOUS}
          onFocus={() => setFocusedElement(FOCUS_ELEMENTS.PREVIOUS)}
          onPress={handlePreviousImage}
          style={[
            styles.controlButton,
            focusedElement === FOCUS_ELEMENTS.PREVIOUS && styles.focusedButton,
          ]}
          accessibilityLabel="Previous image"
          accessibilityRole="button">
          <SvgXml
            xml={left_circle}
            width={Platform.OS === 'ios' ? 45 : 35}
            height={Platform.OS === 'ios' ? 45 : 35}
          />
        </TouchableOpacity>

        <TouchableOpacity
          focusable={true}
          hasTVPreferredFocus={focusedElement === FOCUS_ELEMENTS.PAUSE}
          onFocus={() => setFocusedElement(FOCUS_ELEMENTS.PAUSE)}
          onPress={handlePlayPause}
          style={[
            styles.controlButton,
            focusedElement === FOCUS_ELEMENTS.PAUSE && styles.focusedButton,
          ]}
          accessibilityLabel={isAutoPlay ? 'Pause slideshow' : 'Play slideshow'}
          accessibilityRole="button">
          <SvgXml
            xml={isAutoPlay ? pause_circle : play_circle}
            width={Platform.OS === 'ios' ? 50 : 35}
            height={Platform.OS === 'ios' ? 50 : 35}
          />
        </TouchableOpacity>

        <TouchableOpacity
          focusable={true}
          hasTVPreferredFocus={focusedElement === FOCUS_ELEMENTS.NEXT}
          onFocus={() => setFocusedElement(FOCUS_ELEMENTS.NEXT)}
          onPress={handleNextImage}
          style={[
            styles.controlButton,
            focusedElement === FOCUS_ELEMENTS.NEXT && styles.focusedButton,
          ]}
          accessibilityLabel="Next image"
          accessibilityRole="button">
          <SvgXml
            xml={right_circle}
            width={Platform.OS === 'ios' ? 45 : 35}
            height={Platform.OS === 'ios' ? 45 : 35}
          />
        </TouchableOpacity>
      </View>

      {/* Back Button */}
      <View style={[styles.backControls, {opacity: controlsVisible ? 1 : 0}]}>
        <TouchableOpacity
          focusable={true}
          hasTVPreferredFocus={focusedElement === FOCUS_ELEMENTS.BACK}
          onFocus={() => setFocusedElement(FOCUS_ELEMENTS.BACK)}
          onPress={handleBackPress}
          style={[
            styles.backButton,
            focusedElement === FOCUS_ELEMENTS.BACK && styles.focusedButton,
          ]}
          accessibilityLabel="Go back"
          accessibilityRole="button">
          <SvgXml
            xml={Left}
            width={Platform.OS === 'ios' ? 40 : 25}
            height={Platform.OS === 'ios' ? 40 : 25}
            stroke="#fff"
            fill="#fff"
          />
        </TouchableOpacity>
      </View>
    </>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="white" />
        </View>
      </View>
    );
  }

  if (!collectionData || collectionData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.backControls}>
          <TouchableOpacity
            focusable={true}
            hasTVPreferredFocus={focusedElement === FOCUS_ELEMENTS.BACK}
            onFocus={() => setFocusedElement(FOCUS_ELEMENTS.BACK)}
            onPress={handleBackPress}
            style={[styles.backButton, styles.focusedButton]}
            accessibilityLabel="Go back"
            accessibilityRole="button">
            <SvgXml
              xml={Left}
              width={Platform.OS === 'ios' ? 40 : 25}
              height={Platform.OS === 'ios' ? 40 : 25}
              stroke="#fff"
              fill="#fff"
            />
          </TouchableOpacity>
        </View>
        <View style={styles.loaderContainer}>
          <Text style={styles.errorText}>No images available</Text>
        </View>
        <WebSocketComponent />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderControls()}

      <View focusable={false} style={styles.carouselContainer}>
        {isView && (
          <Carousel
            loop={isAutoPlay}
            enabled={true}
            ref={carouselRef}
            defaultScrollOffsetValue={SCROLL_OFFSET_VALUE}
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            data={collectionData}
            autoPlayInterval={carouselTime * 1000}
            autoPlay={isAutoPlay && collectionData.length > 1}
            scrollAnimationDuration={5000}
            renderItem={renderItem}
          />
        )}
      </View>

      <WebSocketComponent />
    </View>
  );
};

export default StreamImagePage;

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
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  backControls: {
    position: 'absolute',
    top: 20,
    left: 10,
    zIndex: 999,
  },
  controlButton: {
    borderRadius: 25,
  },
  backButton: {
    padding: 2,
    borderRadius: 25,
  },
  focusedButton: {
    borderColor: 'white',
    borderWidth: 2,
    transform: [{scale: 1.1}],
  },
  carouselContainer: {
    flex: 1,
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
