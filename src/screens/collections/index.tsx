import {StyleSheet, Text, View, Alert} from 'react-native';
import React from 'react';
import {screenWidth, screenHeight} from '../../utils/helper';
import * as Helper from '../../utils/helper';
import {collectionByIdItem} from '../../models';
import ListView from '../../components/ListView';
import ListItem from '../../components/ListItem';
import CurveBtn from '../../components/CurveBtn';

type Props = {
  route: any;
  navigation: any;
};

const CollectionScreen: React.FC<Props> = (props: Props) => {
  const {collectionId, data} = props?.route?.params;

  const renderItem = (itemData: any, pos: number) => {
    const obj = {
      ...itemData,
      thumblink: itemData?.image?.thumblink,
      name: itemData?.collection?.name,
    };
    return <ListItem item={obj} index={pos} navigation={props?.navigation} />;
  };

  const DataList =
    data?.collectionsChild && data?.collectionsChild?.length > 0
      ? data?.collectionsChild
      : [];
  const obj1 = {
    data,
  };
  const collectionName = data?.name ? data?.name : '';
  return (
    <View style={styles.container}>
      <CurveBtn
        style={styles.btnBack}
        btnName={Helper.Strings.back}
        btnOnPress={() => props?.navigation.goBack()}
      />
      <View style={styles.collectionHeader}>
        <Text style={styles.collectionsHeaderTxt}>
          {Helper.capitalizeFirstLetter(collectionName)}
        </Text>
        <View style={styles.headerOptions}>
          <CurveBtn
            style={styles.btnBack}
            btnName={Helper.Strings.playAll}
            btnOnPress={() => props?.navigation.navigate('PreviewScreen', obj1)}
          />
          <CurveBtn
            style={styles.btnBack}
            btnName={Helper.Strings.shuffle}
            btnOnPress={() => Alert.alert(Helper.Strings.devProgressMes)}
          />
        </View>
      </View>

      <ListView
        listData={DataList}
        isHorizontal={false}
        renderItem={(item: collectionByIdItem, index: number) =>
          renderItem(item, index)
        }
        numOfColumns={3}
        parentListStyle={styles.listStyle}
        containerListStyle={styles.listContainerStyle}
      />
    </View>
  );
};

export default CollectionScreen;

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    height: screenHeight,
    backgroundColor: Helper.Colors.black_bg,
  },
  listStyle: {
    width: '100%',
    paddingStart: '1.3%',
  },
  listContainerStyle: {
    paddingBottom: '20%',
    flexGrow: 1,
  },
  btnBack: {
    width: 100,
    marginHorizontal: '2%',
    marginBottom: '1%',
  },
  headerOptions: {
    flexDirection: 'row',
  },
  collectionHeader: {
    marginVertical: '1%',
  },
  collectionsHeaderTxt: {
    fontSize: 28,
    marginHorizontal: '3%',
  },
});
