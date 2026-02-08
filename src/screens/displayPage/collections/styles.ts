import {StyleSheet}  from 'react-native';

const styles = StyleSheet.create({
  
    collectionsSection:{ backgroundColor:'black' },
    collectionsTitle:{  
  
       marginTop:20,
       marginBottom:20,
       marginLeft:10,
       fontFamily: 'Inter',
      fontSize: 25,
      fontWeight: '800',
      color:'white',
      textAlign: 'left',
  
    },
    collections:{  },
    collectionTile:{
      marginRight: 25,
      flexDirection:'column',
      height:250,
      width:244,
      paddingVertical:56,
      borderRadius:15,
      justifyContent:'center',
      alignItems:'center'
    },
  
    collectionImage:{
      height:154,
      width:214,
      color:'black',
      borderRadius:15
  
    },
  
    collectionTileDetails:{
  
      flexDirection:'row',
      justifyContent:'space-between',
      paddingHorizontal:5,
      alignItems:'center',
      height:81,
    
      
    },
    collectionTileTitle:{
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: '700',
      lineHeight: 19.36,
      letterSpacing: -0.408,
      textAlign: 'left', color:'white',
    },
    collectionTileDescription:{
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'left', color:'white',
      
  
    },
    circleContainer: {
      width: 35,
      height: 35,
      borderRadius: 50,
      backgroundColor: 'white',
      justifyContent: 'center',
      alignItems: 'center',
    },
    playButton: {
      width: 25,
      height: 25,
      borderRadius: 30,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
  
    },
    focusedCard: {
        borderRadius:15,
    backgroundColor: '#3C3C3C',
        transform: [{ scale: 1.01 }], 
        // Scale transformation when focused
      },
  
  });
  
  

  export default styles;