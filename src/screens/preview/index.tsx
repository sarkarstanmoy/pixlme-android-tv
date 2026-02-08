import {StyleSheet, Text, View, ActivityIndicator, Image} from 'react-native';
import React, {useState, useEffect} from 'react';
import {screenWidth, screenHeight} from '../../utils/helper';
import * as Helper from '../../utils/helper';
import CurveBtn from '../../components/CurveBtn';
import {FlatListSlider} from 'react-native-flatlist-slider';
import AppIntroSlider from 'react-native-app-intro-slider';
import FastImageView from '../../components/FastImageView';

type Props = {
  route: any;
  navigation: any;
};

interface previewProps {
  loading: boolean;
  listData: any;
}

const PreviewScreen: React.FC<Props> = (props: Props) => {
  const {data} = props?.route?.params;
  const initListData: previewProps = {
    loading: true,
    listData: [],
  };
  const [previewData, setPreviewData] = useState(initListData);

  useEffect(() => {
    async function loadData() {
      const array: any[] = await generateArray(data);

      let stateObj = {
        loading: false,
        listData: array,
      };
      setPreviewData(stateObj);
    }
    loadData();
  }, [data]);

  const generateArray = async (listArray: any) => {
    const collectionChildData =
      listArray?.collectionsChild && listArray?.collectionsChild?.length > 0
        ? listArray?.collectionsChild
        : [];
    let array: any[] = [];
    await Promise.all(
      collectionChildData?.map((item: any) => {
        const obj = {
          image: item?.image?.link ? item?.image?.link : '',
          desc: item?.image?.description ? item?.image?.description : '',
        };
        array.push(obj);
      }),
    );

    return array;
  };

  const renderItem = ({item}: any) => {
    return (
      <View style={{height: screenHeight}}>
        <FastImageView
          url={item.image}
          style={{
            width: screenWidth,
            height: screenHeight,
          }}
        />
      </View>
    );
  };

  const renderBtn = (btnName: string) => {
    return (
      <View style={styles.buttonCircle}>
        <Text style={styles.title}>{btnName}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CurveBtn
        style={styles.btnBack}
        btnName={Helper.Strings.back}
        btnOnPress={() => props?.navigation.goBack()}
      />
      {previewData?.loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={Helper.Colors.item_blank_bg} />
        </View>
      ) : (
        <AppIntroSlider
          data={previewData?.listData}
          renderPrevButton={() => renderBtn('Previous')}
          renderNextButton={() => renderBtn('Next')}
          //renderDoneButton={() => renderBtn('Replay')}
          renderItem={renderItem}
          showPrevButton
          keyExtractor={item => item.image}
          style={{width: screenWidth, height: screenHeight}}
          doneLabel={''}
        />
      )}
    </View>
  );
};

export default PreviewScreen;

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    height: screenHeight,
    backgroundColor: Helper.Colors.black_bg,
  },
  btnBack: {
    width: 100,
    marginHorizontal: '2%',
    marginBottom: '1%',
  },
  loaderContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonCircle: {
    backgroundColor: Helper.Colors.btn_bg,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  title: {},
  sliderContainer: {
    width: screenWidth,
    height: screenHeight,
  },
});
