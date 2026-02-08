import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  FlatList,
  Platform,
} from 'react-native';
import {useSelector} from 'react-redux';
import {RootState} from '../../store/store';
import * as Helper from '../../utils/helper';
import FastImage from 'react-native-fast-image';
import WebSocketComponent from '../../utils/websocket';
import {SvgXml} from 'react-native-svg';
import {file_medical, pause_without_outline} from '../../assets/svg';
import KeyEvent, {KeyEventProps} from 'react-native-keyevent';
import {useFocusEffect} from '@react-navigation/native';

interface StreamProps {
  route: any;
  navigation: any;
}

const StreamButton = ({
  focused,
  onFocus,
  onPress,
}: {
  focused: boolean;
  onFocus: () => void;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity
      hasTVPreferredFocus={focused}
      focusable={true}
      onFocus={onFocus}
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        streamButtonStyle.button,
        focused && streamButtonStyle.enabledButton,
      ]}
      accessible={true}
      accessibilityLabel="Play All Button"
      accessibilityHint="Play all images on TV">
      <Text style={streamButtonStyle.buttonText}>Play All On TV</Text>
      <SvgXml
        xml={pause_without_outline}
        width={Platform.OS !== 'ios' ? 10 : 18}
        height={Platform.OS !== 'ios' ? 10 : 18}
        stroke={'#fff'}
        fill={'#fff'}
      />
    </TouchableOpacity>
  );
};

const StreamPage = (streamProps: StreamProps) => {
  const [isLoading, setLoading] = useState(true);
  const {collections} = useSelector((state: RootState) => state.collections);
  const {collectionName, collectionId} = streamProps!.route!.params;
  const [collectionData, setCollectionData] = useState<any>();

  // Focus management states
  const [focused, setFocused] = useState('PLAY_ALL');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGridFocused, setIsGridFocused] = useState(false);

  // Refs for navigation
  const flatListRef = useRef<FlatList>(null);
  const itemRefs = useRef<{[key: number]: any | null}>({});

  const numColumns = 4;
  const totalItems = collectionData?.collectionsChild?.length || 0;

  // Calculate grid position
  const getGridPosition = (index: number) => {
    const row = Math.floor(index / numColumns);
    const col = index % numColumns;
    return {row, col};
  };

  // Navigate to specific image
  const navigateToImage = (index: number) => {
    if (collectionData?.collectionsChild?.[index]) {
      const item = collectionData.collectionsChild[index];

      const imageUrl = item?.link;
      const attribute = JSON.parse(item?.attribute);
      const customization = JSON.parse(item?.customization);

      streamProps?.navigation.navigate('StreamOneImage', {
        imageUrl: imageUrl,
        attribute: attribute,
        customization: customization,
      });
    }
  };

  // Handle Play All button press
  const handlePlayAll = () => {
    streamProps.navigation.navigate('StreamImagePage', {
      collectionName: collectionName,
      collectionId: collectionId,
    });
  };

  const renderItem = ({index, item}: {index: number; item: any}) => {
    const imageUrl = item?.thumblink;
    const attribute = JSON.parse(item?.attribute);
    const customization = JSON.parse(item?.customization);
    const isSelected = isGridFocused && selectedImageIndex === index;

    return (
      <TouchableOpacity
        ref={ref => {
          itemRefs.current[index] = ref;
        }}
        hasTVPreferredFocus={isSelected}
        focusable={true}
        onFocus={() => {
          setSelectedImageIndex(index);
          setIsGridFocused(true);
          setFocused(`IMAGE_${index}`);
        }}
        onPress={() => {
          streamProps?.navigation.navigate('StreamOneImage', {
            imageUrl: item?.link,
            attribute: attribute,
            customization: customization,
          });
        }}
        style={[
          isSelected && {
            borderWidth: 2,
            borderColor: '#fff',
            borderRadius: 12,
          },
        ]}>
        <FastImage
          key={index}
          source={{
            uri: imageUrl,
            priority: FastImage.priority.high,
          }}
          style={{
            width: Platform.OS !== 'ios' ? 200 : 400,
            height: Platform.OS !== 'ios' ? 200 : 325,
            borderRadius: 10,
          }}
        />
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    setLoading(true);
    const matched =
      collections && collections.length > 0
        ? collections.find(
            (collection: any) => collection.collectionId === collectionId,
          )
        : null;
    if (matched) {
      setCollectionData(matched);
    }

    setLoading(false);
  }, [collections]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        const keyHandler = (keyEvent: KeyEventProps) => {
          switch (keyEvent.keyCode) {
            case 23: // KEYCODE_DPAD_CENTER (OK/Select button)
              if (focused === 'PLAY_ALL') {
                handlePlayAll();
              } else if (isGridFocused && totalItems > 0) {
                navigateToImage(selectedImageIndex);
              }
              break;
            case 19: // KEYCODE_DPAD_UP
              if (isGridFocused) {
                const currentPos = getGridPosition(selectedImageIndex);
                if (currentPos.row > 0) {
                  // Move up in grid
                  const newIndex = selectedImageIndex - numColumns;
                  if (newIndex >= 0) {
                    setSelectedImageIndex(newIndex);
                    setFocused(`IMAGE_${newIndex}`);
                  }
                } else {
                  // Move to Play All button from first row
                  setFocused('PLAY_ALL');
                  setIsGridFocused(false);
                }
              }
              break;
            case 20: // KEYCODE_DPAD_DOWN
              if (focused === 'PLAY_ALL' && totalItems > 0) {
                // Move from Play All to first image
                setSelectedImageIndex(0);
                setIsGridFocused(true);
                setFocused('IMAGE_0');
              } else if (isGridFocused) {
                // Move down in grid
                const currentPos = getGridPosition(selectedImageIndex);
                const maxRows = Math.ceil(totalItems / numColumns);
                if (currentPos.row < maxRows - 1) {
                  const newIndex = selectedImageIndex + numColumns;
                  if (newIndex < totalItems) {
                    setSelectedImageIndex(newIndex);
                    setFocused(`IMAGE_${newIndex}`);
                  }
                }
              }
              break;
            case 21: // KEYCODE_DPAD_LEFT
              if (isGridFocused) {
                const currentPos = getGridPosition(selectedImageIndex);
                if (currentPos.col > 0) {
                  const newIndex = selectedImageIndex - 1;
                  setSelectedImageIndex(newIndex);
                  setFocused(`IMAGE_${newIndex}`);
                }
              }
              break;
            case 22: // KEYCODE_DPAD_RIGHT
              if (isGridFocused) {
                const currentPos = getGridPosition(selectedImageIndex);
                if (
                  currentPos.col < numColumns - 1 &&
                  selectedImageIndex + 1 < totalItems
                ) {
                  const newIndex = selectedImageIndex + 1;
                  setSelectedImageIndex(newIndex);
                  setFocused(`IMAGE_${newIndex}`);
                }
              }
              break;
          }
        };

        KeyEvent.removeKeyDownListener();

        KeyEvent.onKeyDownListener(keyHandler);
        return () => {
          KeyEvent.removeKeyDownListener();
        };
      }
    }, [
      focused,
      collections,
      selectedImageIndex,
      isGridFocused,
      totalItems,
      collectionData,
    ]),
  );

  useEffect(() => {
    if (!isLoading && collectionData?.count > 0) {
      // Set initial focus to Play All button
      setFocused('PLAY_ALL');
      setIsGridFocused(false);
      setSelectedImageIndex(0);
    }
  }, [isLoading, collectionData]);

  return (
    <>
      <View style={styles.container}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            padding: 10,
            paddingBottom: 15,
          }}>
          <Image
            source={require('../../assets/pixleMelogo.png')}
            style={{width: 120, height: 40}}
          />
        </View>
        {isLoading ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <ActivityIndicator size="large" color="white" />
          </View>
        ) : (
          <>
            {collectionData?.count > 0 ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  width: '100%',
                  paddingHorizontal: Platform.OS !== 'ios' ? 20 : 60,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 25,
                  }}>
                  <View>
                    <Text
                      style={{
                        color: Helper.Colors.foreground,
                        fontSize: Platform.OS !== 'ios' ? 18 : 30,
                        fontWeight: '400',
                      }}>
                      {Helper?.capitalizeFirstLetter(
                        collectionData?.name || 'No name',
                      )}
                    </Text>
                    <Text
                      style={{
                        fontSize: Platform.OS !== 'ios' ? 12 : 18,
                        color: Helper.Colors.foreground,
                      }}>
                      {collectionData?.count || 0} Image
                      {collectionData?.count > 1 && 's'}
                    </Text>
                  </View>

                  <StreamButton
                    focused={focused === 'PLAY_ALL'}
                    onFocus={() => {
                      setFocused('PLAY_ALL');
                    }}
                    onPress={() => {
                      streamProps.navigation.navigate('StreamImagePage', {
                        collectionName: collectionName,
                        collectionId: collectionId,
                      });
                    }}
                  />
                </View>
                <FlatList
                  ref={flatListRef}
                  numColumns={numColumns}
                  contentContainerStyle={{rowGap: 40}}
                  columnWrapperStyle={{
                    columnGap:
                      Helper.screenWidth / (Platform.OS !== 'ios' ? 28 : 35),
                  }}
                  data={collectionData?.collectionsChild}
                  renderItem={renderItem}
                  keyExtractor={(item, index) => `image_${index}`}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  removeClippedSubviews={false}
                  initialNumToRender={12}
                  maxToRenderPerBatch={8}
                />
              </View>
            ) : (
              <View style={styles.innercontainer}>
                <SvgXml
                  xml={file_medical}
                  width={60}
                  height={60}
                  strokeOpacity={0}
                />
                <Text style={styles.description}>
                  You have no Images! Add Images to this collection from Pixlme
                  app to start streaming them on TV
                </Text>
              </View>
            )}
          </>
        )}
      </View>
      <WebSocketComponent />
    </>
  );
};

export default StreamPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Helper.Colors.background,
  },
  innercontainer: {
    color: Helper.Colors.foreground,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingTop: '3%',
  },
  description: {
    color: Helper.Colors.foreground,
    fontSize: 14,
    maxWidth: '40%',
    textAlign: 'center',
    marginTop: 20,
  },
});

const streamButtonStyle = StyleSheet.create({
  button: {
    flexDirection: 'row',
    gap: 5,
    backgroundColor: Helper.Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: Platform.OS !== 'ios' ? 12 : 18,
    color: Helper.Colors.foreground,
  },
  enabledButton: {
    borderWidth: 1,
    transform: [{scale: 1.1}],
    borderColor: '#fff',
  },
});
