import React from 'react';
import { Button, Text, View} from 'native-base';
import { StatusBar, StyleSheet, ScrollView ,  ImageBackground , Ima} from "react-native";
import { DataTable,} from 'react-native-paper';
import moment from 'moment';
const image = { uri: "https://www.10wallpaper.com/wallpaper/1920x1080/1908/2019_Purple_Abstract_4K_HD_Design_1920x1080.jpg" };
function DetalleTransaccion(){
    return(
        <View style={styles.container}>
              <ImageBackground source={image} style={styles.image}>

           <Text style={styles.title}>Detalle</Text>

            <View style={styles.card}>
            <Text style={styles.text}>+ 600</Text>
            <Text style={styles.text2}>enviaste dinero a tal persona</Text>
        <DataTable.Row>
      <DataTable.Cell>Descripcion : </DataTable.Cell>
      <DataTable.Cell numeric>transferencia</DataTable.Cell>
  
       </DataTable.Row>
       <DataTable.Row>
      <DataTable.Cell>Fecha :</DataTable.Cell>
      <DataTable.Cell numeric>{moment().format("MMM Do YY")}</DataTable.Cell>
  
       </DataTable.Row>
       <DataTable.Row>
      <DataTable.Cell>Hora : </DataTable.Cell>
      <DataTable.Cell numeric>15:29</DataTable.Cell>
  
       </DataTable.Row>
       <DataTable.Row>
      <DataTable.Cell>Referencia :</DataTable.Cell>
      <DataTable.Cell numeric>1539559</DataTable.Cell>
  
       </DataTable.Row>
       <DataTable.Row>
      <DataTable.Cell> Moneda : </DataTable.Cell>
      <DataTable.Cell numeric>ARS</DataTable.Cell>
  
       </DataTable.Row>
       <DataTable.Row>
      <DataTable.Cell>Mensaje : </DataTable.Cell>
      <DataTable.Cell numeric>Alquiler</DataTable.Cell>
  
       </DataTable.Row>
       <DataTable.Row>
      <DataTable.Cell>Frozen yogurt</DataTable.Cell>
      <DataTable.Cell numeric>159</DataTable.Cell>
  
       </DataTable.Row>
       <DataTable.Row>
      <DataTable.Cell>Frozen yogurt</DataTable.Cell>
      <DataTable.Cell numeric>159</DataTable.Cell>
  
       </DataTable.Row>
            </View>


              </ImageBackground>
           </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: StatusBar.currentHeight || 0,
      },
    image: {
        flex: 1,
        resizeMode: "cover",
    },
    title:{
        marginTop:20,
        marginBottom:50,
      color:'white',
      textAlign: 'center',
      fontSize:50,
      fontWeight: 'bold',
      fontFamily: "Times New Roman"
      },
card:{
    backgroundColor: 'white',
    borderRadius: 5,
    margin: 5,
    padding: 10,
},
text:{
    fontSize:50,
    fontWeight: 'bold',
    textAlign: 'center',
},
text2:{

    textAlign: 'center',
}
  });
export default DetalleTransaccion;