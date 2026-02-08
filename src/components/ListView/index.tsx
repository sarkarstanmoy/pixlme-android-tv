import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import React, {useEffect, useRef, useCallback} from 'react';
import ListEmptyView from '../ListEmptyView';
import {screenWidth} from '../../utils/helper';
import * as Helper from '../../utils/helper';
import FastImageView from '../FastImageView';
import {SvgXml} from 'react-native-svg';
import {pause} from '../../assets/svg';
import {useNavigation} from '@react-navigation/native';

interface ListViewProps {
  listData: any;
  globalFocus: string;
  setGlobalFocus: (key: string) => void;
  focusedIndex?: number;
  setFocusedIndex?: (index: number) => void;
  isLoading?: boolean;
}

const ListView = ({
  listData,
  globalFocus,
  setGlobalFocus: _setGlobalFocus,
  focusedIndex = 0,
  setFocusedIndex,
  isLoading = false,
}: ListViewProps) => {
  const navigation: any = useNavigation();
  const hasData = Array.isArray(listData) && listData.length > 0;
  const scrollViewRef = useRef<ScrollView>(null);

  // Calculate item width including gap for scroll calculations
  const itemWidth = Helper.screenWidth * 0.21 + 10 + 15;

  const scrollToItem = useCallback(
    (index: number) => {
      if (scrollViewRef.current) {
        const scrollX = index * itemWidth;
        scrollViewRef.current.scrollTo({
          x: scrollX,
          animated: true,
        });
      }
    },
    [itemWidth],
  );

  // Handle scrolling when focusedIndex changes
  useEffect(() => {
    if (globalFocus === 'COLLECTIONS' && hasData) {
      scrollToItem(focusedIndex);
    }
  }, [focusedIndex, globalFocus, hasData, scrollToItem]);

  // Reset focus when component gains focus
  useEffect(() => {
    if (globalFocus === 'COLLECTIONS' && hasData && setFocusedIndex) {
      setFocusedIndex(0);
      scrollToItem(0);
    }
  }, [globalFocus, hasData, setFocusedIndex, scrollToItem]);

  const handleItemPress = useCallback(() => {
    const currentItem = listData[focusedIndex];
    const streamProps = {
      collectionName: currentItem?.name,
      collectionId: currentItem?.collectionId,
    };
    navigation.navigate('StreamPage', streamProps);
  }, [listData, focusedIndex, navigation]);

  if (!hasData) {
    if (isLoading) {
      return (
        <View style={[{paddingHorizontal: screenWidth * 0.04}]}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading collections...</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={[{paddingHorizontal: screenWidth * 0.04}]}>
        <ListEmptyView />
      </View>
    );
  }

  return (
    <View style={[{paddingHorizontal: screenWidth * 0.04}]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.containerListStyle}
        scrollEnabled={false}>
        {listData.map((item: any, index: number) => {
          const artWorkName = item?.name
            ? item?.name
            : `${Helper.Strings.artWorkName}  #${index}`;
          const artistName = item?.artistName
            ? item?.artistName
            : `${item?.count} image${item?.count > 1 ? 's' : ''}`;
          let itemImgUrl = item?.thumblink
            ? item?.thumblink
            : item?.collectionsChild?.[0]?.thumblink
            ? item?.collectionsChild?.[0]?.thumblink
            : '';

          const isFocused =
            globalFocus === 'COLLECTIONS' && focusedIndex === index;

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={1}
              style={[
                styles.item,
                styles.activeItem,
                isFocused && styles.focusedItem,
              ]}
              onPress={() => {
                if (setFocusedIndex) {
                  setFocusedIndex(index);
                }
                handleItemPress();
              }}
              focusable={true}
              hasTVPreferredFocus={isFocused}
              onFocus={() => {
                if (setFocusedIndex) {
                  setFocusedIndex(index);
                }
              }}>
              <View>
                {itemImgUrl !== '' ? (
                  <FastImageView
                    url={itemImgUrl}
                    style={styles.imageContainer}
                  />
                ) : (
                  <View style={styles.imageContainer} />
                )}
                <View style={styles.textContainer}>
                  <View>
                    <Text style={styles.txtArtWorkName}>
                      {Helper?.capitalizeFirstLetter(artWorkName)}
                    </Text>
                    <Text style={styles.txtArtistName}>{artistName}</Text>
                  </View>
                  <TouchableOpacity>
                    <SvgXml
                      xml={pause}
                      width={Platform.OS !== 'ios' ? 20 : 30}
                      height={Platform.OS !== 'ios' ? 20 : 30}
                      stroke={'#fff'}
                      fill={'#fff'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default ListView;

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Helper.Colors.foreground,
  },
  item: {
    borderRadius: 10,
    padding: 10,
  },
  activeItem: {
    backgroundColor: 'rgba(69, 69, 69, 0.5)',
  },
  itemSelected: {
    borderColor: 'gray',
    borderWidth: 1,
  },
  imageContainer: {
    width: Helper.screenWidth * 0.22,
    height: Platform.OS !== 'ios' ? 140 : 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Helper.Colors.btn_bg,
    borderRadius: 10,
    marginBottom: 10,
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  txtArtWorkName: {
    fontSize: Platform.OS !== 'ios' ? 14 : 20,
    color: Helper.Colors.foreground,
  },
  txtArtistName: {
    fontSize: Platform.OS !== 'ios' ? 12.5 : 16,
    color: Helper.Colors.foreground,
  },
  playIcon: {
    marginLeft: 10,
  },
  containerListStyle: {
    gap: 15,
  },
  focusedItem: {
    borderWidth: 1,
    borderColor: 'white',
  },
});
