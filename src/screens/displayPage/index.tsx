import React, {useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TVFocusGuideView,
} from 'react-native';
import DisplayCollections from '../displayPage/collections';
import DisplayTrending from '../displayPage/displayTrendings';

import {screenHeight} from '../../utils/helper';
type Props = {
  route: any;
  navigation: any;
};

const DisplayPage = (props: Props) => {
  const {name, message} = props?.route?.params;

  return (
    <ScrollView>
      <TVFocusGuideView autoFocus>
        <View style={styles.container}>
          <View style={[styles.section1, {height: screenHeight * 0.65}]}>
            <Text>Section 1</Text>
          </View>

          <DisplayCollections />
          <DisplayCollections />
          <DisplayTrending />
        </View>
      </TVFocusGuideView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  section1: {
    backgroundColor: 'lightgrey',
    justifyContent: 'center',
    alignItems: 'center',
    height: 150,
  },
  section3: {
    backgroundColor: 'black',
  },
  horizontalListItem: {
    backgroundColor: 'lightgreen',
    padding: 20,
    marginRight: 15,
    height: 215,
    width: 214,
    borderRadius: 5,
  },
  gridViewItem: {
    backgroundColor: 'lightyellow',
    padding: 20,
    margin: 5,
    borderRadius: 5,
  },
});

export default DisplayPage;
