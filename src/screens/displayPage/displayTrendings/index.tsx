import { TVFocusGuideView ,Text ,Dimensions,FlatList} from "react-native";
import styles from './styles';
import React from "react";

import CollectionCard from '../../../components/CollectionCard'
import { screenWidth} from '../../../utils/helper';




const DisplayTrending=()=>{
    const data = [...Array(15).keys()];
    return (
<>    
 <TVFocusGuideView style={[styles.section,{paddingHorizontal: screenWidth*0.05}]}  >
<Text style={[styles.title, {}] }>Top Trending Images Of The Week </Text>
<FlatList
      data={data}
      numColumns={3} // Number of columns in the grid
      
      renderItem={({ item }) => <CollectionCard title={item.toString()} />}
      
    />
    </TVFocusGuideView>
    </>
   
    );

}


export default DisplayTrending;