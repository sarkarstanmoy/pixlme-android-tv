import React, { useState } from 'react';
import {  FlatList, ScrollView, Text,  View,TVFocusGuideView } from 'react-native';
import styles from './styles'
import { screenWidth} from '../../../utils/helper';
import CollectionCard from '../../../components/CollectionCard'

const DisplayCollections=() => {


    const [focused ,setFocused]=useState(false);
  return(  
      <View style={[styles.collectionsSection,{paddingHorizontal: screenWidth*0.05}]}>
<TVFocusGuideView  autoFocus trapFocusLeft trapFocusRight >
         
      <Text style={[styles.collectionsTitle, {}] }>Your Collections </Text>
     
     <View style={styles.collections}>
     <ScrollView horizontal  showsVerticalScrollIndicator={false}
    showsHorizontalScrollIndicator={false}>
      <FlatList
        horizontal
        data={['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5']}
        renderItem={({ item }) => <CollectionCard title={item} />}
        keyExtractor={(item) => item}
      />
    </ScrollView>

     </View>
     </TVFocusGuideView>
  </View> 
     
);
}


export default DisplayCollections;