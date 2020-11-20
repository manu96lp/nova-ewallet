import React, { useState } from 'react';
import { Button, Text, View } from 'native-base';
import { StatusBar, StyleSheet, ScrollView, ImageBackground } from "react-native";
import { ListItem, Left, Right, Icon } from 'native-base';
import moment from 'moment';
const image = { uri: "https://www.10wallpaper.com/wallpaper/1920x1080/1908/2019_Purple_Abstract_4K_HD_Design_1920x1080.jpg" };
function Transacciones({ navigation }) {
  const [people, setPeople] = useState([
    { name: 'holi', email: '123@live', date: '11-2-3', amount: 3945, key: '1' },
    { name: 'aye', email: '123@live', date: '11-2-3', amount: 3945, key: '2' },
    { name: 'brian', email: '123@live', date: '11-2-3', amount: 3945, key: '3' },
    { name: 'abi', email: '123@live', date: '11-2-3', amount: 3945, key: '4' },
    { name: 'sonia', email: '123@live', date: '11-2-6', amount: 3945, key: '5' },
    { name: 'sonia', email: '123@live', date: '11-2-6', amount: 3945, key: '6' },
  ])
  return (
    <View style={styles.container}>

      <ImageBackground source={image} style={styles.image}>
        <View style={styles.title}>
          <Text style={styles.title}>Transacciones</Text>
        </View>
        <ScrollView>
          {people.map(item => (
            <View style={styles.item} key={item.key}>
              <ListItem>
                <Left >
                  <View style={styles.left}>
                    <Text style={styles.name}> {item.name}</Text>
                    <Text style={styles.email}> {item.email}</Text>
                    <Text style={styles.date}> {moment().format("MMM Do YY")}</Text>

                  </View>
                </Left>


                <Right>

                  <View style={styles.right}>

                    <Text style={styles.amount}> + $ {item.amount}</Text>
                    <Icon name="arrow-forward" onPress={() => navigation.navigate('DetalleTransaccion')} />

                  </View>
                </Right>
              </ListItem>
            </View>
          ))}
        </ScrollView>
      </ImageBackground>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
  image: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center"
  },
  title: {
    marginTop: 20,
    marginBottom: 20,
    color: 'white',
    textAlign: 'center',
    fontSize: 50,
    fontWeight: 'bold',
    /* fontFamily: "Times New Roman" */
  },
  item: {
    backgroundColor: 'white',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  left: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'stretch',

  },
  right: {
    width: 110,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center'



  },
  name: {

    fontSize: 32,
  },
  amount: {
    fontSize: 20,
  }
});
export default Transacciones;