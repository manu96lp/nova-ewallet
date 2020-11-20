import React from 'react';
import { StyleSheet } from 'react-native';

import {BarChart} from "react-native-chart-kit";
import { Dimensions,  ImageBackground } from 'react-native';
import { Button, Text, View} from 'native-base';
const image = { uri: "https://www.10wallpaper.com/wallpaper/1920x1080/1908/2019_Purple_Abstract_4K_HD_Design_1920x1080.jpg" };

function Estadisticas(){
    return(
        <View style={styles.container}>
      
           <ImageBackground source={image} style={styles.image}>
             <View style={styles.title}>
               <Text style={styles.title}>Estadisticas</Text>
             </View>
<View style={styles.container}>
  <View style={styles.b}>
  <Button  label='Mensual'style={styles.button}>
      <Text style={styles.text}>Mensual</Text>
  </Button>
  <Button  label='Semanal' style={styles.button}>
      <Text style={styles.text}>Semanal</Text>
  </Button>
  <Button  label='Diario' style={styles.button}>
      <Text style={styles.text}>Diario</Text>
  </Button>
  </View>
  <BarChart 
          data={{
            labels: ["January", "February", "March", "April", "May", "June"],
            datasets: [
              {
                data: [
                  Math.random() * 100,
                  Math.random() * 100,
                  Math.random() * 100,
                  Math.random() * 100,
                  Math.random() * 100,
                  Math.random() * 100
                ]
              }
            ]
          }}
          width={Dimensions.get("window").width} // from react-native
          height={220}
          yAxisLabel="$"
          yAxisSuffix="k"
          yAxisInterval={1} // optional, defaults to 1
          chartConfig={{
        
            backgroundColor: "white",
            backgroundGradientFrom: "black",
            backgroundGradientTo: "#EAED34",
            decimalPlaces: 2, // optional, defaults to 2dp
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 500, ${opacity})`,
            style: {
    
              borderRadius: 16
            },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#ffa726"
            }
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
        />
       </View>
    </ImageBackground>
  
</View>
    )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
   flexDirection:'column',
   justifyContent: 'flex-start',
  },
  image: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center"
  },
  title:{
color:'white',
textAlign: 'center',
fontSize:50,
fontWeight: 'bold',
fontFamily: "Times New Roman"
},
b:{
marginBottom:90,
marginTop:110,
  flexDirection: 'row',
  justifyContent: 'center',

},

text:{
color :'black'
},

    button: {
    width:120,
      backgroundColor: "white",
     flexDirection: 'column',
      justifyContent: 'center',
      display:'flex',
      margin: 10,

    },

 
});
export default Estadisticas;